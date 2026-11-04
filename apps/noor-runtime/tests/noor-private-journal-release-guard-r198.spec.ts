import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { JOURNAL_DB_GUARD_SQL_R198, parseJournalServerKeyRingR198, verifyJournalStagingPrerequisitesR198, verifyRestrictedJournalPostgresRoleR198 } from "../src/noor-private-journal-release-guard-r198.js";
import type { PgPoolR188 } from "../src/noor-private-journal-postgres-r188.js";
const activeVersion = "NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION";
const keyPairs = "NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64";
const synthetic = () => randomBytes(32).toString("base64");
function env() { return {[activeVersion]:"2",[keyPairs]:`1=${synthetic()},2=${synthetic()}`}; }
function role() { return {roleName:"noor_journal_runtime",isSuperuser:false,canBypassRls:false,rlsEnabled:true,rlsForced:true,isTableOwner:false,canSelect:true,canInsert:true,canDelete:true,canUpdate:false,canTruncate:false}; }
function fixture(proof:Record<string,unknown>=role(),opts?:{connectError?:boolean;queryError?:boolean}){
  const events:string[]=[];
  const pool:PgPoolR188 = {async connect(){events.push("connect");if(opts?.connectError)throw Error("not-connected");return {
    async query<T>(sql:string):Promise<{rows:readonly T[];rowCount:number}>{events.push(sql === JOURNAL_DB_GUARD_SQL_R198?"probe":sql);if(opts?.queryError)throw Error("invalid-query");return sql === JOURNAL_DB_GUARD_SQL_R198?{rows:[proof] as T[],rowCount:1}:{rows:[],rowCount:0};},
    release(){events.push("release");},
  };}};
  return {pool,events};
}
test("R198 accepts two versioned server keys and keeps exact original bytes",()=>{
  const e=env();const k=parseJournalServerKeyRingR198(e);
  assert.equal(k.activeVersion,2);
  assert.equal(k.keys.size,2);
  assert.equal(k.keys.get(1)?.toString("base64"),e[keyPairs]!.split(",")[0]!.slice(2));
});
test("R198 key parser rejects missing, malformed, duplicate, extra-long and missing-active inputs without echoing secrets",()=>{
  const e=env();const a=e[keyPairs]!.split(",")[0]!;
  const bad=[{}, {[activeVersion]:"0",[keyPairs]:e[keyPairs]}, {[activeVersion]:"01",[keyPairs]:e[keyPairs]},
    {[activeVersion]:"4",[keyPairs]:e[keyPairs]}, {[activeVersion]:"2",[keyPairs]:a+","+a},
    {[activeVersion]:"2",[keyPairs]:"2=hi"}, {[activeVersion]:"2",[keyPairs]:" 2="+synthetic()},
    {[activeVersion]:"2",[keyPairs]:"2="+synthetic()+",2="+synthetic()},
    {[activeVersion]:"2",[keyPairs]:"2="+synthetic()+"x"},
  ];for(const b of bad)assert.throws(()=>parseJournalServerKeyRingR198(b),e=>e instanceof Error && e.message==="R198_JOURNAL_SERVER_CONFIGURATION_REJECTED");
});
test("R198 trusted DB role inspection runs in READ ONLY and always rolls back",async()=>{
  const f=fixture();await verifyRestrictedJournalPostgresRoleR198(f.pool,"noor_journal_runtime");
  assert.deepEqual(f.events,["connect","BEGIN READ ONLY","probe","ROLLBACK","release"]);
});
test("R198 refuses superuser, bypassRLS, ownership, missing forced RLS and extra UPDATE/TRUNCATE grants",async()=>{
  for(const changes of [{isSuperuser:true},{canBypassRls:true},{isTableOwner:true},{rlsForced:false},{rlsEnabled:false},{canUpdate:true},{canTruncate:true},{canDelete:false},{canSelect:false},{roleName:"postgres"}]){
    const f=fixture({...role(),...changes});
    await assert.rejects(verifyRestrictedJournalPostgresRoleR198(f.pool,"noor_journal_runtime"));
    assert.deepEqual(f.events.slice(-2),["ROLLBACK","release"]);
  }
});
test("R198 rejects missing DB connection and catalog errors without publishing sensitive values",async()=>{
  for(const opts of [{connectError:true},{queryError:true}]){
    const f=fixture(role(),opts);
    await assert.rejects(verifyRestrictedJournalPostgresRoleR198(f.pool,"noor_journal_runtime"),/R198_JOURNAL_SERVER_CONFIGURATION_REJECTED/);
  }
});
test("R198 staging prerequisite gate requires keys AND DB role before returning a ring",async()=>{
  const f=fixture();const k=await verifyJournalStagingPrerequisitesR198({environment:env(),pool:f.pool,expectedDbRole:"noor_journal_runtime"});
  assert.equal(k.activeVersion,2);assert.equal(f.events.includes("probe"),true);
  const g=fixture({...role(),canBypassRls:true});
  await assert.rejects(verifyJournalStagingPrerequisitesR198({environment:env(),pool:g.pool,expectedDbRole:"noor_journal_runtime"}));
});
test("R198 canary SQL is read-only PostgreSQL catalog inspection",()=>{
  assert.match(JOURNAL_DB_GUARD_SQL_R198,/pg_catalog\.pg_roles/);
  assert.match(JOURNAL_DB_GUARD_SQL_R198,/relforcerowsecurity/);
  assert.doesNotMatch(JOURNAL_DB_GUARD_SQL_R198,/\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|GRANT|REVOKE|CREATE|TRUNCATE)\s+(?:INTO|TABLE|FROM|ROLE|ON|SCHEMA)\b/iu);
});
