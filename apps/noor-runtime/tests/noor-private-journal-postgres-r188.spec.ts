import assert from "node:assert/strict";
import {randomBytes, randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";
import {NoorPrivateJournalOperationR185, type JournalRowR185} from "../src/noor-private-journal-r185.js";
import {NoorPrivateJournalPostgresStoreR188, type PgPoolR188, type PgScopedClientR188, type PgResultR188} from "../src/noor-private-journal-postgres-r188.js";

class SyntheticPgPoolR188 implements PgPoolR188 {
  readonly rows: JournalRowR185[]=[];
  readonly audit: {sql:string;values:readonly unknown[];owner:string}[]=[];
  private failAfterContext=false;
  public injectFailure(){this.failAfterContext=true;}
  public async connect():Promise<PgScopedClientR188>{
    let active=false; let owner=""; let released=false;
    return {
      query:async<T>(sql:string, params:readonly unknown[]=[]):Promise<PgResultR188<T>>=>{
        if(released)throw Error("RELEASED_CONNECTION");
        this.audit.push({sql,values:params,owner});
        const result=(rows:unknown[]):PgResultR188<T>=>({rows:rows as T[],rowCount:rows.length});
        if(sql==="BEGIN"){assert.equal(active,false);active=true;return result([]);}
        if(sql==="COMMIT"){assert.equal(active,true);active=false;return result([]);}
        if(sql==="ROLLBACK"){active=false;return result([]);}
        assert.equal(active,true);
        if(sql.includes("set_config('noor.current_user_id'")){
          owner=String(params[0]??""); return result([{value:owner}]);
        }
        assert.ok(owner.length>0,"no SQL without owner transaction context");
        if(this.failAfterContext){this.failAfterContext=false;throw Error("SYNTHETIC_DB_CONNECTION_ERROR");}
        if(sql.includes("INSERT INTO noor_private.journal_entries_r188")){
          assert.equal(params.length,7);
          assert.equal(params[0],owner,"RLS owner check");
          const id=String(params[1]);
          if(this.rows.some(x=>x.id===id&&x.ownerUserId===owner))return result([]);
          this.rows.push({ownerUserId:owner,id,createdAt:String(params[2]),keyVersion:Number(params[3]),nonce:String(params[4]),tag:String(params[5]),ciphertext:String(params[6])});
          return result([{id}]);
        }
        if(sql.includes("FROM noor_private.journal_entries_r188")){
          assert.equal(params[0],owner,"RLS owner check");
          return result(this.rows.filter(x=>x.ownerUserId===owner).slice(0,251).map(x=>({...x})));
        }
        if(sql.includes("DELETE FROM noor_private.journal_entries_r188")){
          assert.equal(params[0],owner,"RLS owner check");
          const idx=this.rows.findIndex(x=>x.ownerUserId===owner&&x.id===params[1]);
          if(idx===-1)return result([]);
          const [deleted]=this.rows.splice(idx,1);
          return result([{id:deleted!.id}]);
        }
        throw Error(`UNEXPECTED_SQL:${sql.slice(0,30)}`);
      },
      release:()=>{assert.equal(active,false,"transaction leaked");released=true;},
    };
  }
}
const note={kind:"feelings" as const,title:"Synthetic title",body:"R188_SYNTHETIC_PLAINTEXT_SENTINEL",precedingEvent:"synthetic event",helpful:"",category:"",mood:3,shareApproved:false};
const trust={resolveAuthorizedUser:async(session:string)=> session==="synthetic-owner-A"?{status:200 as const,userId:"internal-user-A"}:session==="synthetic-owner-B"?{status:200 as const,userId:"internal-user-B"}:{status:401 as const}};

// Tests in this suite use a simulated PostgreSQL driver. No real Postgres or Supabase is contacted.
test("R188 rotating encryption key ring, encrypted Postgres driver and strict per-user isolation",async t=>{
  const pool=new SyntheticPgPoolR188();
  const store=new NoorPrivateJournalPostgresStoreR188(pool);
  const k1=randomBytes(32),k2=randomBytes(32);
  const mk=(activeVersion:number, keys:ReadonlyMap<number,Buffer>)=>new NoorPrivateJournalOperationR185({trust,store,keyRing:{activeVersion,keys}});
  const v1=mk(1,new Map([[1,k1]]));
  let oldId="";
  await t.test("version-one encrypted record remains readable after key version two is active",async()=>{
    const created=await v1.create("synthetic-owner-A",note);
    assert.equal(created.status,201);oldId=(created.body as {id:string}).id;
    assert.equal(pool.rows[0]?.keyVersion,1);
    const v2=mk(2,new Map([[1,k1],[2,k2]]));
    const created2=await v2.create("synthetic-owner-A",{...note,title:"second record"});
    assert.equal(created2.status,201);
    assert.equal(pool.rows[1]?.keyVersion,2);
    const read=await v2.list("synthetic-owner-A");
    assert.equal(read.status,200);
    assert.deepEqual((read.body as {entries:{title:string}[]}).entries.map(x=>x.title).sort(),["Synthetic title","second record"]);
    assert.equal(pool.rows.some(x=>JSON.stringify(x).includes(note.body)),false,"db stores ciphertext only");
  });
  await t.test("retiring an old key too early fails closed, never erases or leaks records",async()=>{
    const noOld=mk(2,new Map([[2,k2]]));
    assert.equal((await noOld.list("synthetic-owner-A")).status,503);
    assert.equal(pool.rows.length,2);
    assert.throws(()=>mk(2,new Map([[1,k1]])),/JOURNAL_ACTIVE_KEY_MISSING/);
    assert.throws(()=>mk(2,new Map([[2,Buffer.alloc(16)]])),/JOURNAL_KEYRING_INVALID/);
  });
  await t.test("second authenticated user cannot list or delete first user's entries",async()=>{
    const v2=mk(2,new Map([[1,k1],[2,k2]]));
    assert.deepEqual((await v2.list("synthetic-owner-B")).body,{entries:[]});
    assert.equal((await v2.remove("synthetic-owner-B",oldId)).status,404);
    assert.equal((await v2.list("synthetic-owner-A")).status,200);
    assert.equal((await v2.list("missing-session")).status,401);
  });
  await t.test("per-operation transactions always set local owner and end cleanly",async()=>{
    const begin=pool.audit.filter(x=>x.sql==="BEGIN").length;
    const commit=pool.audit.filter(x=>x.sql==="COMMIT").length;
    const rollback=pool.audit.filter(x=>x.sql==="ROLLBACK").length;
    assert.equal(begin,commit+rollback);
    assert.ok(pool.audit.some(x=>x.sql.includes("set_config('noor.current_user_id'")));
    for(const [idx,row] of pool.audit.entries()) if(row.sql.includes("INSERT INTO")||row.sql.includes("DELETE FROM")||row.sql.includes("FROM noor_private.")) {
      const before=pool.audit.slice(0,idx).reverse().find(x=>x.sql.includes("set_config('noor.current_user_id'"));
      assert.equal(before?.values[0],row.values[0]);
    }
    pool.injectFailure();
    await assert.rejects(store.list("internal-user-A"),/SYNTHETIC_DB_CONNECTION_ERROR/);
    assert.equal(pool.audit.at(-1)?.sql,"ROLLBACK");
  });
  await t.test("foreign, corrupt and owner-spoofed rows fail closed",async()=>{
    assert.equal((await mk(2,new Map([[1,k1],[2,k2]])).create("synthetic-owner-A",{...note,userId:"internal-user-B"})).status,400);
    const original=pool.rows[0]!;
    pool.rows[0]={...original,ownerUserId:"internal-user-B"};
    // User B can see only its own encrypted row, but AAD makes decrypt fail.
    assert.equal((await mk(2,new Map([[1,k1],[2,k2]])).list("synthetic-owner-B")).status,503);
    pool.rows[0]=original;
    const bad={...original,tag:Buffer.alloc(16,3).toString("base64")};
    pool.rows[0]=bad;
    assert.equal((await mk(2,new Map([[1,k1],[2,k2]])).list("synthetic-owner-A")).status,503);
    pool.rows[0]=original;
  });
  await t.test("SQL draft remains private, forced RLS and unexecuted",()=>{
    const sql=readFileSync(new URL("../release-drafts/private-journal-postgres-r188.DRAFT.sql",import.meta.url),"utf8");
    assert.match(sql,/CREATE SCHEMA IF NOT EXISTS noor_private/u);
    assert.match(sql,/ENABLE ROW LEVEL SECURITY/u);
    assert.match(sql,/FORCE ROW LEVEL SECURITY/u);
    assert.match(sql,/REVOKE ALL ON SCHEMA noor_private FROM PUBLIC/u);
    assert.match(sql,/REVOKE ALL ON .* FROM authenticated/u);
    assert.match(sql,/current_setting\('noor\.current_user_id', true\)/u);
    assert.match(sql,/NOT AUTO-EXECUTED/u);
    assert.doesNotMatch(sql,/\bgrant\s+all\s+on\s+.*\s+to\s+(?:public|anon|authenticated)\b/iu);
  });
});
