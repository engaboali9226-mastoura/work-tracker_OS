import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { prepareNoorPrivateJournalBackendReviewR218 } from '../src/noor-private-journal-backend-review-r218.js';
import type { NoorR218ReviewConfiguration } from '../src/noor-private-journal-backend-review-r218.js';
import { PersonalControlOperation } from '../src/personal-control-operation.js';
import { JOURNAL_DB_GUARD_SQL_R198 } from '../src/noor-private-journal-release-guard-r198.js';
import { R208_POLICY_INVENTORY_SQL } from '../src/noor-private-journal-policy-audit-r208.js';
import type { PgPoolR188, PgResultR188 } from '../src/noor-private-journal-postgres-r188.js';

const ROLE = 'noor_journal_runtime';
const ORIGIN = 'http://127.0.0.1:19518';
const OWNER = "(owner_user_id = NULLIF(current_setting('noor.current_user_id'::text, true), ''::text))";
const KEYS = () => ({NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION:'2',
  NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64:'1='+randomBytes(32).toString('base64')+',2='+randomBytes(32).toString('base64')});
const role = () => ({roleName:ROLE,isSuperuser:false,canBypassRls:false,
  rlsEnabled:true,rlsForced:true,isTableOwner:false,canSelect:true,canInsert:true,
  canDelete:true,canUpdate:false,canTruncate:false});
const policies = () => ['SELECT','INSERT','DELETE'].map(cmd => ({
  schemaname:'noor_private',tablename:'journal_entries_r188',policyname:'journal_owner_'+cmd.toLowerCase(),
  permissive:'PERMISSIVE',roles:[ROLE],cmd,
  qual:cmd==='INSERT'?null:OWNER,withCheck:cmd==='INSERT'?OWNER:null,
}));

function fixture(opts: {role?:Record<string,unknown>; policies?:ReturnType<typeof policies>;fail?:'connect'|'catalog'|'release'} = {}) {
  const events:string[]=[];
  const pool:PgPoolR188 = {
    async connect() {
      events.push('connect');
      if (opts.fail==='connect') throw Error('SYNTHETIC_CONNECT_FAILURE');
      return {
        async query<T>(sql:string):Promise<PgResultR188<T>> {
          if (sql==='BEGIN READ ONLY'||sql==='ROLLBACK') {events.push(sql);return {rows:[],rowCount:0};}
          if (sql===JOURNAL_DB_GUARD_SQL_R198) {
            events.push('role');
            if(opts.fail==='catalog') throw Error('SYNTHETIC_CATALOG_FAILURE');
            return {rows:[opts.role??role()] as T[],rowCount:1};
          }
          if (sql===R208_POLICY_INVENTORY_SQL) {
            events.push('policies');
            return {rows:[...(opts.policies??policies())] as T[],rowCount:3};
          }
          throw Error('UNEXPECTED_DB_QUERY');
        },
        release(){events.push('release');if(opts.fail==='release')throw Error('SYNTHETIC_RELEASE_FAILURE');},
      };
    },
  };
  // Actual NOOR PersonalControlOperation class with synthetic offline ports.
  const control = new PersonalControlOperation({
    isRuntimeRunning: () => false,
    resolveSession: { async execute(){throw Error('UNAVAILABLE');} },
    authorize: { async execute(){throw Error('UNAVAILABLE');} },
    accountUserResolver: { async resolve(){throw Error('UNAVAILABLE');} },
    foundation: { async openOperation(){throw Error('UNAVAILABLE');} },
    clock: { now:()=> '2026-11-04T12:00:00.000Z' },
    idGenerator: { next:()=> 'UNUSED' },
  } as never);
  const config:NoorR218ReviewConfiguration={
    acknowledgement:'R218_REVIEW_ONLY_NO_ROUTE_REGISTRATION',expectedOrigin:ORIGIN,
    expectedDbRole:ROLE,pool,keyEnvironment:KEYS(),personalControl:control,
  };
  return {config,events};
}

const denied = /R218_STAGING_BACKEND_REVIEW_REJECTED/u;

test('R218 review validates keys, actual DB role and exactly three policies before assembling',async()=>{
  const f=fixture();
  const result=await prepareNoorPrivateJournalBackendReviewR218(f.config);
  assert.equal(result.kind,'R218_REVIEW_ONLY_NO_RELEASE');
  assert.equal(result.httpRouteRegistered,false);
  assert.equal(result.productionAuthorized,false);
  assert.deepEqual(f.events,[
    'connect','BEGIN READ ONLY','role','ROLLBACK','release',
    'connect','BEGIN READ ONLY','role','policies','ROLLBACK','release',
  ]);
  assert.deepEqual(await result.operation.list(null),{status:401});
  assert.deepEqual(await result.operation.list('fake-session'),{status:503});
  assert.equal(f.events.filter(x=>x==='connect').length,2,'unauthorized requests must not read DB');
});

test('R218 refuses incorrect acknowledgement, external origins and default production port before DB access',async()=>{
  for(const bad of ['https://noor.example.com','http://localhost:19518','http://0.0.0.0:19518',
    'http://127.0.0.1:8787','http://127.0.0.1:19518/path','http://127.0.0.1:80']){
    const f=fixture();
    await assert.rejects(prepareNoorPrivateJournalBackendReviewR218({...f.config,expectedOrigin:bad}),denied);
    assert.deepEqual(f.events,[]);
  }
  const f=fixture();
  await assert.rejects(prepareNoorPrivateJournalBackendReviewR218({...f.config,acknowledgement:'WRONG' as never}),denied);
  assert.deepEqual(f.events,[]);
});

test('R218 rejects a duck-typed fake identity provider even with matching methods',async()=>{
  const f=fixture();
  const forged={resolveAuthorizedJournalUser:async()=>({kind:'ok',userId:'attacker'}),
    resolveAuthorizedJournalPersonalDay:async()=>({kind:'ok',userId:'attacker',localDate:'2026-11-04'})};
  await assert.rejects(prepareNoorPrivateJournalBackendReviewR218({...f.config,personalControl:forged as never}),denied);
  assert.deepEqual(f.events,[]);
});

test('R218 rejects invalid keyring without touching PostgreSQL',async()=>{
  const f=fixture();
  await assert.rejects(prepareNoorPrivateJournalBackendReviewR218({...f.config,keyEnvironment:{}}),denied);
  assert.deepEqual(f.events,[]);
});

test('R218 refuses privileged role and never advances to policy inspection',async()=>{
  const f=fixture({role:{...role(),canBypassRls:true}});
  await assert.rejects(prepareNoorPrivateJournalBackendReviewR218(f.config),denied);
  assert.equal(f.events.includes('policies'),false);
  assert.equal(f.events.includes('ROLLBACK'),true);
});

test('R218 refuses broad public policies and does not assemble backend',async()=>{
  const changed=policies();changed[0]={...changed[0]!,roles:['public']};
  const f=fixture({policies:changed});
  await assert.rejects(prepareNoorPrivateJournalBackendReviewR218(f.config),denied);
  assert.equal(f.events.includes('policies'),true);
  assert.deepEqual(f.events.slice(-2),['ROLLBACK','release']);
});

test('R218 database errors and cleanup failures deny readiness without echoing secrets',async()=>{
  for(const fail of ['connect','catalog','release'] as const){
    const f=fixture({fail});
    await assert.rejects(prepareNoorPrivateJournalBackendReviewR218(f.config),denied);
  }
});

test('R218 does not expose route registration or production authorization',async()=>{
  const f=fixture();const v=await prepareNoorPrivateJournalBackendReviewR218(f.config);
  assert.deepEqual(Object.keys(v).sort(),['httpRouteRegistered','kind','operation','productionAuthorized']);
  assert.equal(Object.isFrozen(v),true);
});
