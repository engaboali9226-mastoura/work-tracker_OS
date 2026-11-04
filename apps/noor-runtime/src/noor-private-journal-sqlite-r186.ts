/** NOOR R186 — lab-only encrypted journal persistence, using local SQLite.
 * This is a durable, owner-scoped test double, NOT a production Supabase adapter.
 * All journal text must have been AES-GCM-encrypted by R185 before reaching this store.
 */
import { DatabaseSync } from "node:sqlite";
import { lstatSync, existsSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import type { JournalEncryptedStoreR185, JournalRowR185 } from "./noor-private-journal-r185.js";

export class NoorPrivateJournalSqliteStoreR186 implements JournalEncryptedStoreR185 {
  private readonly db: DatabaseSync;
  public constructor(filePath: string) {
    if (typeof filePath !== "string" || !filePath.endsWith(".sqlite") || !filePath.startsWith("/")) throw Error("INVALID_TEST_DB_PATH");
    const absolute = resolve(filePath);
    const parent = realpathSync(dirname(absolute));
    const file = basename(absolute);
    if (!/^[A-Za-z0-9_.-]+\.sqlite$/u.test(file)) throw Error("UNTRUSTED_DB_FILENAME");
    const canonical = join(parent,file);
    if (existsSync(canonical) && lstatSync(canonical).isSymbolicLink()) throw Error("SYMLINK_DB_REJECTED");
    this.db = new DatabaseSync(canonical);
    this.db.exec(`
      PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS private_journals_r186 (
        owner_user_id TEXT NOT NULL,
        id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        key_version INTEGER NOT NULL,
        nonce TEXT NOT NULL,
        tag TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        PRIMARY KEY (owner_user_id, id)
      );
      CREATE INDEX IF NOT EXISTS private_journals_owner_time_r186
        ON private_journals_r186 (owner_user_id, created_at, id);
    `);
  }
  public async insert(row: JournalRowR185): Promise<boolean> {
    const result = this.db.prepare(`INSERT OR IGNORE INTO private_journals_r186
      (owner_user_id,id,created_at,key_version,nonce,tag,ciphertext)
      VALUES (?,?,?,?,?,?,?)`).run(row.ownerUserId,row.id,row.createdAt,row.keyVersion,row.nonce,row.tag,row.ciphertext);
    return result.changes === 1;
  }
  public async list(ownerUserId: string): Promise<readonly JournalRowR185[]> {
    return this.db.prepare(`SELECT owner_user_id AS ownerUserId, id, created_at AS createdAt,
      key_version AS keyVersion,nonce,tag,ciphertext
      FROM private_journals_r186 WHERE owner_user_id = ? ORDER BY created_at,id`).all(ownerUserId) as unknown as readonly JournalRowR185[];
  }
  public async remove(ownerUserId: string, entryId: string): Promise<boolean> {
    return this.db.prepare(`DELETE FROM private_journals_r186 WHERE owner_user_id = ? AND id = ?`).run(ownerUserId,entryId).changes === 1;
  }
  public close(): void {this.db.close();}
}
