/** NOOR R188 — lab-only PostgreSQL adapter contract for already encrypted R185 rows.
 * Database connection is injected by a trusted server; no credentials/DB access here.
 * The SQL migration draft is NOT executed by this module or the release script.
 * Every statement runs in an isolated, owner-bound transaction. This store has no
 * authority to decide a user identity; its owner comes from verified NOOR runtime.
 */
import type { JournalEncryptedStoreR185, JournalRowR185 } from "./noor-private-journal-r185.js";

export type PgResultR188<T> = Readonly<{ rows: readonly T[]; rowCount: number | null }>;
export interface PgScopedClientR188 {
  query<T=Record<string,unknown>>(sql:string, params?:readonly unknown[]): Promise<PgResultR188<T>>;
  release():void;
}
export interface PgPoolR188 { connect():Promise<PgScopedClientR188>; }

const TABLE="noor_private.journal_entries_r188";
const USER_PATTERN=/^[A-Za-z0-9_-]{3,128}$/u;
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
function ownerOk(owner:string):boolean {return typeof owner==="string"&&USER_PATTERN.test(owner);}
function validateCipher(row:JournalRowR185):boolean {
  if(!ownerOk(row.ownerUserId)||!UUID_PATTERN.test(row.id)||!Number.isSafeInteger(row.keyVersion)||row.keyVersion<1||row.keyVersion>65535) return false;
  if(!Number.isFinite(Date.parse(row.createdAt)))return false;
  if(!/^[A-Za-z0-9+/]+={0,2}$/u.test(row.nonce)||Buffer.from(row.nonce,"base64").length!==12)return false;
  if(!/^[A-Za-z0-9+/]+={0,2}$/u.test(row.tag)||Buffer.from(row.tag,"base64").length!==16)return false;
  if(!/^[A-Za-z0-9+/]+={0,2}$/u.test(row.ciphertext)||row.ciphertext.length>100000)return false;
  return true;
}

/** PostgreSQL 'SET LOCAL' has the same transaction scope as BEGIN/COMMIT;
 * using a separate pooled connection to set owner would be an isolation defect.
 */
export class NoorPrivateJournalPostgresStoreR188 implements JournalEncryptedStoreR185 {
  constructor(private readonly pool: PgPoolR188) {}
  private async withOwner<T>(owner:string, run:(client:PgScopedClientR188)=>Promise<T>):Promise<T> {
    if(!ownerOk(owner))throw Error("INVALID_INTERNAL_USER_ID");
    const client=await this.pool.connect();
    let begun=false;
    try {
      await client.query("BEGIN");begun=true;
      const config=await client.query<{value:string}>("SELECT set_config('noor.current_user_id', $1, true) AS value",[owner]);
      if(config.rows.length!==1||config.rows[0]?.value!==owner)throw Error("OWNER_TRANSACTION_CONTEXT_FAILED");
      const result=await run(client);
      await client.query("COMMIT");begun=false;
      return result;
    } catch(error){
      if(begun){try{await client.query("ROLLBACK");}catch{/* fail closed */}}
      throw error;
    } finally{client.release();}
  }
  public async insert(row:JournalRowR185):Promise<boolean> {
    if(!validateCipher(row))throw Error("INVALID_ENCRYPTED_JOURNAL_ROW");
    return this.withOwner(row.ownerUserId,async client=>{
      const result=await client.query<{id:string}>(
        `INSERT INTO ${TABLE} (owner_user_id,id,created_at,key_version,nonce,tag,ciphertext)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (owner_user_id,id) DO NOTHING RETURNING id`,
        [row.ownerUserId,row.id,row.createdAt,row.keyVersion,row.nonce,row.tag,row.ciphertext]);
      if(result.rows.length>1)throw Error("UNEXPECTED_INSERT_ROWS");
      if(result.rows.length===1&&result.rows[0]?.id!==row.id)throw Error("UNTRUSTED_INSERT_RESULT");
      return result.rows.length===1;
    });
  }
  public async list(ownerUserId:string):Promise<readonly JournalRowR185[]> {
    return this.withOwner(ownerUserId,async client=>{
      const result=await client.query<JournalRowR185>(
        `SELECT owner_user_id AS "ownerUserId", id,
         to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
         key_version AS "keyVersion", nonce, tag, ciphertext
         FROM ${TABLE} WHERE owner_user_id=$1 ORDER BY created_at,id LIMIT 251`,[ownerUserId]);
      if(result.rows.length>250)throw Error("JOURNAL_ROW_LIMIT_EXCEEDED");
      for(const row of result.rows){if(row.ownerUserId!==ownerUserId||!validateCipher(row))throw Error("FOREIGN_OR_INVALID_ENCRYPTED_ROW");}
      return result.rows.map(row=>Object.freeze({...row}));
    });
  }
  public async remove(ownerUserId:string, entryId:string):Promise<boolean> {
    if(typeof entryId!=="string"||!UUID_PATTERN.test(entryId))throw Error("INVALID_JOURNAL_ENTRY_ID");
    return this.withOwner(ownerUserId,async client=>{
      const result=await client.query<{id:string}>(
        `DELETE FROM ${TABLE} WHERE owner_user_id=$1 AND id=$2 RETURNING id`,[ownerUserId,entryId]);
      if(result.rows.length>1||(result.rows.length===1&&result.rows[0]?.id!==entryId))throw Error("UNTRUSTED_DELETE_RESULT");
      return result.rows.length===1;
    });
  }
}
