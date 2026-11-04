import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectR208StagingPolicy, R208_POLICY_INVENTORY_SQL, verifyR208PolicyInventory, type R208PolicyRow } from '../src/noor-private-journal-policy-audit-r208.js';
import { JOURNAL_DB_GUARD_SQL_R198 } from '../src/noor-private-journal-release-guard-r198.js';
import type { PgPoolR188, PgResultR188 } from '../src/noor-private-journal-postgres-r188.js';

const ROLE = 'noor_journal_runtime';
const OWNER = "(owner_user_id = NULLIF(current_setting('noor.current_user_id'::text, true), ''::text))";
const row = (cmd: string): R208PolicyRow => ({
  schemaname:'noor_private', tablename:'journal_entries_r188', policyname:`journal_owner_${cmd.toLowerCase()}`,
  permissive:'PERMISSIVE', roles:[ROLE], cmd,
  qual:cmd==='INSERT'?null:OWNER,
  withCheck:cmd==='INSERT'?OWNER:null,
});
const goodPolicies = (): R208PolicyRow[] => [row('SELECT'),row('INSERT'),row('DELETE')];
const goodRole = () => ({roleName:ROLE,isSuperuser:false,canBypassRls:false,rlsEnabled:true,
  rlsForced:true,isTableOwner:false,canSelect:true,canInsert:true,canDelete:true,canUpdate:false,canTruncate:false});

function fakePool(opts: {policies?: readonly R208PolicyRow[];role?:Record<string,unknown>;fail?:'catalog'|'begin'|'rollback'|'release'} = {}) {
  const calls:string[]=[];
  const pool:PgPoolR188={
    async connect(){
      calls.push('connect');
      return {
        async query<T>(sql:string):Promise<PgResultR188<T>> {
          calls.push(sql === JOURNAL_DB_GUARD_SQL_R198 ? 'role' : sql===R208_POLICY_INVENTORY_SQL ? 'policies':sql);
          if (sql==='BEGIN READ ONLY'&&opts.fail==='begin')throw Error('synthetic begin failure');
          if (sql===R208_POLICY_INVENTORY_SQL&&opts.fail==='catalog')throw Error('synthetic catalog failure');
          if (sql==='ROLLBACK'&&opts.fail==='rollback')throw Error('synthetic rollback failure');
          const values:unknown[] = sql===JOURNAL_DB_GUARD_SQL_R198 ? [opts.role??goodRole()] :
            sql===R208_POLICY_INVENTORY_SQL ? [...(opts.policies??goodPolicies())]:[];
          return {rows:values as T[],rowCount:values.length};
        },
        release(){calls.push('release');if(opts.fail==='release')throw Error('synthetic release failure');},
      };
    }
  };
  return {pool,calls};
}
const audit = (pool: PgPoolR188) => inspectR208StagingPolicy({acknowledgement:'R208_READ_ONLY_STAGING_INSPECTION',pool,expectedRole:ROLE});

test('R208 synthetic role and owner-policy audit uses READ ONLY, two catalogue reads and ROLLBACK',async()=>{
  const f=fakePool();await audit(f.pool);
  assert.deepEqual(f.calls,['connect','BEGIN READ ONLY','role','policies','ROLLBACK','release']);
});
test('R208 denies any broad, missing or unexpected policy; no best-effort fallback',()=>{
  const bad: R208PolicyRow[][]=[
    [],goodPolicies().slice(0,2),[...goodPolicies(),{...row('SELECT'),policyname:'extra_public'}],
    goodPolicies().map(p=>p.cmd==='SELECT'?{...p,roles:['public']}:p),
    goodPolicies().map(p=>p.cmd==='DELETE'?{...p,permissive:'RESTRICTIVE'}:p),
    goodPolicies().map(p=>p.cmd==='SELECT'?{...p,qual:`(${OWNER} OR TRUE)`}:p),
    goodPolicies().map(p=>p.cmd==='INSERT'?{...p,withCheck:'true'}:p),
    goodPolicies().map(p=>p.cmd==='DELETE'?{...p,qual:null}:p),
    goodPolicies().map(p=>p.cmd==='SELECT'?{...p,cmd:'ALL'}:p),
  ];
  for(const rows of bad)assert.throws(()=>verifyR208PolicyInventory(rows,ROLE),/R208_STAGING_POLICY_EVIDENCE_REJECTED/);
});
test('R208 role must be nonprivileged, not a table owner, and without UPDATE/TRUNCATE',async()=>{
  for(const change of [{canBypassRls:true},{isSuperuser:true},{rlsForced:false},{rlsEnabled:false},{isTableOwner:true},
    {canUpdate:true},{canTruncate:true},{canSelect:false},{roleName:'postgres'}]) {
    const f=fakePool({role:{...goodRole(),...change}});
    await assert.rejects(audit(f.pool),/R208_STAGING_POLICY_EVIDENCE_REJECTED/);
    assert.deepEqual(f.calls.slice(-2),['ROLLBACK','release']);
    assert.equal(f.calls.includes('policies'),false);
  }
});
test('R208 fails closed on missing explicit scope or cleanup errors',async()=>{
  const f=fakePool();
  await assert.rejects(inspectR208StagingPolicy({acknowledgement:'INVALID' as never,pool:f.pool,expectedRole:ROLE}));
  assert.deepEqual(f.calls,[]);
  for(const fail of ['begin','catalog','rollback','release'] as const) {
    const g=fakePool({fail});
    await assert.rejects(audit(g.pool),/R208_STAGING_POLICY_EVIDENCE_REJECTED/);
    assert.equal(g.calls.at(-1),'release');
  }
});
