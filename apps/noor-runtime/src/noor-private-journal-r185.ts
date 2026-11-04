/** NOOR R185: isolated lab-only private journal runtime adapter.
 * Not wired to production routing or database. No client credentials or owner IDs accepted.
 */
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";

export type JournalKindR185 = "feelings" | "ideas" | "developer" | "wellbeing";
export type JournalNoteR185 = Readonly<{
  kind: JournalKindR185;
  title: string;
  body: string;
  precedingEvent: string;
  helpful: string;
  category: string;
  mood: number | null;
  shareApproved: boolean;
  /** NOOR personal day supplied by the authenticated dialog, validated before encryption. */
  localDate?: string;
}>;
export type JournalRowR185 = Readonly<{
  ownerUserId: string;
  id: string;
  createdAt: string;
  keyVersion: number;
  nonce: string;
  tag: string;
  ciphertext: string;
}>;

/** Production implementation MUST use the existing NOOR trusted session/permission/user-resolution components. */
export type JournalTrustR185 = Readonly<{
  /** Trusted service path: session -> NOOR authorization -> server-owned UserId. */
  resolveAuthorizedUser(sessionId: string): Promise<Readonly<{status: 200; userId: string} | {status: 401 | 403 | 503}>>;
  /** R197: trusted Personal Day from NOOR server, required by the route assembly. */
  resolveAuthorizedPersonalDay?: (sessionId: string) => Promise<Readonly<
    | {status: 200; userId: string; localDate: string}
    | {status: 401 | 403 | 409 | 503}
  >>;
}> | Readonly<{
  /** Legacy isolated-test adapter retained for the R185 regression suite only. */
  resolveSession(sessionId: string): Promise<Readonly<{ accountId: string }> | null>;
  authorizePersonal(accountId: string): Promise<boolean>;
  resolveUserId(accountId: string): Promise<string | null>;
}>;
/** Interface only: an encrypted persistent database adapter has NOT been implemented. */
export interface JournalEncryptedStoreR185 {
  insert(row: JournalRowR185): Promise<boolean>;
  list(ownerUserId: string): Promise<readonly JournalRowR185[]>;
  remove(ownerUserId: string, entryId: string): Promise<boolean>;
}
export type JournalResultR185 = Readonly<{
  status: 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 503;
  body?: unknown;
}>;

const KINDS = new Set<JournalKindR185>(["feelings", "ideas", "developer", "wellbeing"]);
const NOTE_KEYS = ["body", "category", "helpful", "kind", "mood", "precedingEvent", "shareApproved", "title"];
const MAX_ENTRIES = 250;
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseJournalNoteR185(raw: unknown): JournalNoteR185 | null {
  if (!isObject(raw)) return null;
  const keys=Object.keys(raw).sort().join("|");
  if (keys !== NOTE_KEYS.join("|") && keys !== [...NOTE_KEYS,"localDate"].sort().join("|")) return null;
  if ("localDate" in raw && (typeof raw.localDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(raw.localDate) ||
      !Number.isFinite(Date.parse(raw.localDate+"T00:00:00Z")) ||
      new Date(raw.localDate+"T00:00:00Z").toISOString().slice(0,10)!==raw.localDate)) return null;
  if (typeof raw.kind !== "string" || !KINDS.has(raw.kind as JournalKindR185)) return null;
  const limits = [["title", 150], ["body", 12000], ["precedingEvent", 2000], ["helpful", 2000], ["category", 50]] as const;
  for (const [name, limit] of limits) {
    if (typeof raw[name] !== "string" || raw[name].length > limit) return null;
  }
  if (!(raw.title as string).trim() || !(raw.body as string).trim()) return null;
  if (typeof raw.shareApproved !== "boolean" || (raw.mood !== null && (!Number.isInteger(raw.mood) || (raw.mood as number) < 1 || (raw.mood as number) > 5))) return null;
  if (raw.kind !== "developer" && raw.shareApproved) return null;
  return Object.freeze({
    kind: raw.kind as JournalKindR185,
    title: (raw.title as string).trim(),
    body: (raw.body as string).trim(),
    precedingEvent: raw.precedingEvent as string,
    helpful: raw.helpful as string,
    category: raw.category as string,
    mood: raw.mood as number | null,
    shareApproved: raw.shareApproved as boolean,
    ...(typeof raw.localDate==="string" ? {localDate:raw.localDate} : {}),
  });
}
/** R188: versioned key ring; all keys are server-supplied and never serialized. */
export type JournalKeyRingR188 = Readonly<{
  activeVersion: number;
  keys: ReadonlyMap<number, Buffer>;
}>;
function journalAad(owner: string, id: string, version: number): Buffer {
  // Preserve the precise AAD used by already-created version-one records.
  return Buffer.from(`NOOR_PRIVATE_JOURNAL_R185:v1:${owner}:${id}${version===1?"":`:key-version:${version}`}`, "utf8");
}
function seal(owner: string, id: string, note: JournalNoteR185, key: Buffer, version=1): Pick<JournalRowR185, "nonce" | "tag" | "ciphertext"> {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(journalAad(owner,id,version));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(note), "utf8"), cipher.final()]);
  return {nonce: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64")};
}
function unseal(owner: string, row: JournalRowR185, keys: ReadonlyMap<number,Buffer>): JournalNoteR185 {
  if (row.ownerUserId !== owner || !Number.isSafeInteger(row.keyVersion) || row.keyVersion<1) throw Error("JOURNAL_RECORD_UNTRUSTED");
  const key=keys.get(row.keyVersion);
  if (!key) throw Error("JOURNAL_KEY_VERSION_UNAVAILABLE");
  const iv = Buffer.from(row.nonce, "base64");
  const tag = Buffer.from(row.tag, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw Error("JOURNAL_RECORD_INVALID");
  const cipher = createDecipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(journalAad(owner,row.id,row.keyVersion));
  cipher.setAuthTag(tag);
  const decoded = JSON.parse(Buffer.concat([cipher.update(Buffer.from(row.ciphertext, "base64")), cipher.final()]).toString("utf8"));
  const note = parseJournalNoteR185(decoded);
  if (!note) throw Error("JOURNAL_RECORD_INVALID");
  return note;
}

/** Verify the session -> NOOR authorization -> internal UserId on every operation.
 * No account IDs, user IDs, encryption keys or cipher material come from request data.
 */
export class NoorPrivateJournalOperationR185 {
  constructor(private readonly dependencies: Readonly<{
    trust: JournalTrustR185;
    store: JournalEncryptedStoreR185;
    encryptionKey?: Buffer;
    keyRing?: JournalKeyRingR188;
  }>) {
    const legacy=dependencies.encryptionKey!==undefined;
    if (legacy === (dependencies.keyRing!==undefined)) throw Error("JOURNAL_KEY_CONFIG_INVALID");
    if (legacy) {
      if (!Buffer.isBuffer(dependencies.encryptionKey) || dependencies.encryptionKey.length!==32) throw Error("JOURNAL_KEY_INVALID");
      this.activeVersion=1;
      this.keyVersions.set(1,Buffer.from(dependencies.encryptionKey));
    } else {
      const ring=dependencies.keyRing!;
      if (!Number.isSafeInteger(ring.activeVersion) || ring.activeVersion<1 || ring.activeVersion>65535 || !(ring.keys instanceof Map) || ring.keys.size<1 || ring.keys.size>32) throw Error("JOURNAL_KEYRING_INVALID");
      for (const [version,key] of ring.keys) {
        if (!Number.isSafeInteger(version) || version<1 || version>65535 || !Buffer.isBuffer(key) || key.length!==32) throw Error("JOURNAL_KEYRING_INVALID");
        this.keyVersions.set(version,Buffer.from(key));
      }
      if (!this.keyVersions.has(ring.activeVersion)) throw Error("JOURNAL_ACTIVE_KEY_MISSING");
      this.activeVersion=ring.activeVersion;
    }
  }
  private readonly keyVersions=new Map<number,Buffer>();
  private readonly activeVersion:number;
  private async subject(sessionId: unknown): Promise<{ status: 401 | 403 | 503 } | { status: 200; userId: string }> {
    if (typeof sessionId !== "string" || sessionId.length < 1 || sessionId.length > 256) return {status: 401};
    try {
      if ("resolveAuthorizedUser" in this.dependencies.trust) {
        const result = await this.dependencies.trust.resolveAuthorizedUser(sessionId);
        if (!result || ![200, 401, 403, 503].includes(result.status)) return {status: 503};
        if (result.status !== 200) return {status: result.status};
        if (typeof result.userId !== "string" || !/^[A-Za-z0-9_-]{3,128}$/u.test(result.userId)) return {status: 503};
        return {status: 200, userId: result.userId};
      }
      const session = await this.dependencies.trust.resolveSession(sessionId);
      if (!session || !session.accountId) return {status: 401};
      const permitted = await this.dependencies.trust.authorizePersonal(session.accountId);
      if (!permitted) return {status: 403};
      const id = await this.dependencies.trust.resolveUserId(session.accountId);
      if (!id || !/^[A-Za-z0-9_-]{3,128}$/u.test(id)) return {status: 503};
      return {status: 200, userId: id};
    } catch { return {status: 503}; }
  }
  async create(sessionId: unknown, raw: unknown): Promise<JournalResultR185> {
    const subject = await this.subject(sessionId);
    if (subject.status !== 200) return {status: subject.status};
    const note = parseJournalNoteR185(raw);
    if (!note) return {status: 400};
    // The release-capable route must provide R197's server-side day authority.
    // Legacy isolated R185 tests without the optional policy retain their old contract;
    // R196's real route assembler explicitly REQUIRES this policy.
    if ("resolveAuthorizedUser" in this.dependencies.trust &&
        typeof this.dependencies.trust.resolveAuthorizedPersonalDay === "function") {
      if (note.localDate === undefined) return {status: 400};
      try {
        const day = await this.dependencies.trust.resolveAuthorizedPersonalDay(sessionId as string);
        if (day.status !== 200) return {status: day.status};
        if (day.userId !== subject.userId || day.localDate !== note.localDate) return {status: 409};
      } catch { return {status: 503}; }
    }
    try {
      const existing = await this.dependencies.store.list(subject.userId);
      if (existing.length >= MAX_ENTRIES) return {status: 409};
      const id = randomUUID();
      const row: JournalRowR185 = {
        ownerUserId: subject.userId, id, createdAt: new Date().toISOString(), keyVersion: this.activeVersion,
        ...seal(subject.userId, id, note, this.keyVersions.get(this.activeVersion)!, this.activeVersion),
      };
      const ok = await this.dependencies.store.insert(row);
      return ok ? {status: 201, body: {id}} : {status: 409};
    } catch { return {status: 503}; }
  }
  async list(sessionId: unknown): Promise<JournalResultR185> {
    const subject = await this.subject(sessionId);
    if (subject.status !== 200) return {status: subject.status};
    try {
      const rows = await this.dependencies.store.list(subject.userId);
      if (rows.length > MAX_ENTRIES) return {status: 503};
      const entries = rows.map(row => ({id: row.id, createdAt: row.createdAt, ...unseal(subject.userId, row, this.keyVersions)}));
      return {status: 200, body: {entries}};
    } catch { return {status: 503}; }
  }
  async remove(sessionId: unknown, id: unknown): Promise<JournalResultR185> {
    const subject = await this.subject(sessionId);
    if (subject.status !== 200) return {status: subject.status};
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/iu.test(id)) return {status: 400};
    try {
      const removed = await this.dependencies.store.remove(subject.userId, id);
      return removed ? {status: 204} : {status: 404};
    } catch { return {status: 503}; }
  }
  async exportApproved(sessionId: unknown): Promise<JournalResultR185> {
    const result = await this.list(sessionId);
    if (result.status !== 200) return result;
    const records = (result.body as {entries: (JournalNoteR185 & {id:string; createdAt:string})[]}).entries;
    return {status: 200, body: {entries: records.filter(x => x.kind === "developer" && x.shareApproved).map(x => ({title:x.title, body:x.body, category:x.category, createdAt:x.createdAt}))}};
  }
}
