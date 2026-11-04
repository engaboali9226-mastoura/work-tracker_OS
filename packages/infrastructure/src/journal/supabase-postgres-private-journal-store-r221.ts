/**
 * R221 — encrypted-row-only trusted NOOR server persistence adapter.
 *
 * This uses the already-configured server-only Supabase privileged client.
 * IMPORTANT: Supabase service_role bypasses PostgreSQL RLS. Isolation here
 * therefore depends on trusted PersonalControl authorization AND exact
 * owner-bound queries; it is NOT equivalent to the R220D restricted LOGIN.
 * No browser import, no plaintext note arguments, no direct anon access.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type NoorJournalEncryptedRowR221 = Readonly<{
  ownerUserId: string;
  id: string;
  createdAt: string;
  keyVersion: number;
  nonce: string;
  tag: string;
  ciphertext: string;
}>;

export interface NoorPrivateJournalDatabaseR221 {
  readonly public: {
    readonly Tables: {
      readonly noor_private_journal_entries_r221: {
        readonly Row: {
          readonly owner_user_id: string;
          readonly id: string;
          readonly created_at: string;
          readonly key_version: number;
          readonly nonce: string;
          readonly tag: string;
          readonly ciphertext: string;
        };
        readonly Insert: {
          readonly owner_user_id: string;
          readonly id: string;
          readonly created_at: string;
          readonly key_version: number;
          readonly nonce: string;
          readonly tag: string;
          readonly ciphertext: string;
        };
        readonly Update: never;
        readonly Relationships: [];
      };
    };
    readonly Views: Record<string, never>;
    readonly Functions: Record<string, never>;
  };
}

const TABLE = "noor_private_journal_entries_r221" as const;
const OWNER = /^[A-Za-z0-9_-]{3,128}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/u;
const LIMIT = 250;
function deny(): never { throw new Error("R221_PRIVATE_JOURNAL_PERSISTENCE_REJECTED"); }
function validOwner(owner: unknown): owner is string {
  return typeof owner === "string" && OWNER.test(owner);
}
function validCipher(row: NoorJournalEncryptedRowR221): boolean {
  return !!row && validOwner(row.ownerUserId) && typeof row.id === "string" && UUID.test(row.id) &&
    typeof row.createdAt === "string" && Number.isFinite(Date.parse(row.createdAt)) &&
    Number.isSafeInteger(row.keyVersion) && row.keyVersion >= 1 && row.keyVersion <= 65535 &&
    typeof row.nonce === "string" && BASE64.test(row.nonce) &&
    Buffer.from(row.nonce,"base64").length === 12 &&
    typeof row.tag === "string" && BASE64.test(row.tag) &&
    Buffer.from(row.tag,"base64").length === 16 &&
    typeof row.ciphertext === "string" && BASE64.test(row.ciphertext) &&
    row.ciphertext.length <= 100000;
}

export class SupabasePostgresPrivateJournalStoreR221 {
  public constructor(private readonly client: SupabaseClient<NoorPrivateJournalDatabaseR221>) {}

  /** Zero-row readiness check: validates schema and server key without reading notes. */
  public async assertAccessible(): Promise<void> {
    const response = await this.client.from(TABLE).select("id")
      .eq("owner_user_id","r221_readiness_no_real_user").limit(0);
    if (response.error || !response.data || response.data.length !== 0) deny();
  }

  public async insert(row: NoorJournalEncryptedRowR221): Promise<boolean> {
    if (!validCipher(row)) deny();
    const response = await this.client.from(TABLE).insert({
      owner_user_id: row.ownerUserId,
      id: row.id,
      created_at: row.createdAt,
      key_version: row.keyVersion,
      nonce: row.nonce,
      tag: row.tag,
      ciphertext: row.ciphertext,
    }).select("id");
    if (response.error) {
      if (response.error.code === "23505") return false;
      deny();
    }
    if (!response.data || response.data.length !== 1 || response.data[0]?.id !== row.id) deny();
    return true;
  }

  public async list(ownerUserId: string): Promise<readonly NoorJournalEncryptedRowR221[]> {
    if (!validOwner(ownerUserId)) deny();
    // All reads MUST have this owner equality before the request is sent.
    const response = await this.client.from(TABLE)
      .select("owner_user_id,id,created_at,key_version,nonce,tag,ciphertext")
      .eq("owner_user_id",ownerUserId)
      .order("created_at",{ascending:true})
      .order("id",{ascending:true})
      .limit(LIMIT+1);
    if (response.error || !response.data || response.data.length > LIMIT) deny();
    return response.data.map(row=>{
      const candidate: NoorJournalEncryptedRowR221 = {
        ownerUserId: row.owner_user_id,
        id: row.id,
        createdAt: row.created_at,
        keyVersion: row.key_version,
        nonce: row.nonce,
        tag: row.tag,
        ciphertext: row.ciphertext,
      };
      if (candidate.ownerUserId !== ownerUserId || !validCipher(candidate)) deny();
      return Object.freeze(candidate);
    });
  }

  public async remove(ownerUserId: string, entryId: string): Promise<boolean> {
    if (!validOwner(ownerUserId) || typeof entryId !== "string" || !UUID.test(entryId)) deny();
    // Both owner and entry ID are mandatory predicates; never delete by ID alone.
    const response = await this.client.from(TABLE)
      .delete()
      .eq("owner_user_id",ownerUserId)
      .eq("id",entryId)
      .select("id");
    if (response.error || !response.data || response.data.length > 1 ||
      (response.data.length === 1 && response.data[0]?.id !== entryId)) deny();
    return response.data.length === 1;
  }
}
