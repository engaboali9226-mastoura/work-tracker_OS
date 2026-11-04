import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { PersonalControlOperation } from '../src/personal-control-operation.js';
import { JOURNAL_DB_GUARD_SQL_R198 } from '../src/noor-private-journal-release-guard-r198.js';
import { R208_POLICY_INVENTORY_SQL } from '../src/noor-private-journal-policy-audit-r208.js';
import type { PgPoolR188, PgResultR188 } from '../src/noor-private-journal-postgres-r188.js';
import {
  prepareR220CStagingBackendReviewOnly,
  R220C_DATABASE_CONNECTION_SQL,
  R220C_STAGING_ISSUER,
  R220C_STAGING_PROJECT_REF,
} from '../src/noor-private-journal-staging-connection-r220c.js';
import type { R220CStagingReviewInput } from '../src/noor-private-journal-staging-connection-r220c.js';

const ROLE='noor_journal_r220c';
const OWNER="(owner_user_id = NULLIF(current_setting('noor.current_user_id'::text, true), ''::text))";
const properties=()=>({roleName:ROLE,loginRoleName:ROLE,canLogin:true,superuser:false,bypassRls:false,inheritsPrivileges:false,tlsEnabled:true});
const guard=()=>({roleName:ROLE,isSuperuser:false,canBypassRls:false,rlsEnabled:true,rlsForced:true,
  isTableOwner:false,canSelect:true,canInsert:true,canDelete:true,canUpdate:false,canTruncate:false});
const policy=()=>['SELECT','INSERT','DELETE'].map(cmd=>({
  schemaname:'noor_private',tablename:'journal_entries_r188',policyname:'journal_owner_'+cmd.toLowerCase(),
  permissive:'PERMISSIVE',roles:[ROLE],cmd,qual:cmd==='INSERT'?null:OWNER,withCheck:cmd==='INSERT'?OWNER:null,
}));
type TestOptions={
  login?:Record<string,unknown>;
  role?:Record<string,unknown>;
  policies?:ReturnType<typeof policy>;
  fail?:'connect'|'query'|'rollback'|'release';
};
function setup(opts:TestOptions={}){
  const events:string[]=[];
  const pool:PgPoolR188={
    async connect(){
      events.push('connect');
      if(opts.fail==='connect')throw Error('STAGING_OFFLINE_CONNECT_FAIL');
      return {
        async query<T>(sql:string):Promise<PgResultR188<T>>{
          events.push(sql===R220C_DATABASE_CONNECTION_SQL?'LOGIN_PROOF':
            sql===JOURNAL_DB_GUARD_SQL_R198?'R198_ROLE':
            sql===R208_POLICY_INVENTORY_SQL?'R208_POLICIES':sql);
          if(opts.fail==='query' && sql===R220C_DATABASE_CONNECTION_SQL)throw Error('SYNTHETIC_QUERY_FAILED');
          if(opts.fail==='rollback' && sql==='ROLLBACK')throw Error('SYNTHETIC_ROLLBACK_FAILED');
          if(sql==='BEGIN READ ONLY'||sql==='ROLLBACK')return {rows:[],rowCount:0};
          if(sql===R220C_DATABASE_CONNECTION_SQL)return {rows:[opts.login??properties()] as T[],rowCount:1};
          if(sql===JOURNAL_DB_GUARD_SQL_R198)return {rows:[opts.role??guard()] as T[],rowCount:1};
          if(sql===R208_POLICY_INVENTORY_SQL)return {rows:(opts.policies??policy()) as T[],rowCount:3};
          throw Error('UNEXPECTED_SQL');
        },
        release(){events.push('release');if(opts.fail==='release')throw Error('SYNTHETIC_RELEASE_FAILED');},
      };
    },
  };
  const control=new PersonalControlOperation({
    isRuntimeRunning:()=>false,
    resolveSession:{async execute(){throw Error('STAGING_OFFLINE_NO_SESSIONS');}},
    authorize:{async execute(){throw Error('STAGING_OFFLINE_NO_ENTITLEMENT');}},
    accountUserResolver:{async resolve(){throw Error('STAGING_OFFLINE_NO_LINKAGE');}},
    foundation:{async openOperation(){throw Error('STAGING_OFFLINE_NO_PERSONAL_DAY');}},
    clock:{now:()=> '2026-11-04T12:00:00.000Z'},
    idGenerator:{next:()=> 'UNUSED'},
  } as never);
  const input:R220CStagingReviewInput={
    acknowledgement:'R220C_REVIEW_ONLY_NO_ROUTE_REGISTRATION',
    stagingProjectRef:R220C_STAGING_PROJECT_REF,
    expectedIssuer:R220C_STAGING_ISSUER,
    expectedOrigin:'http://127.0.0.1:19620',
    expectedDbRole:ROLE,
    pool,
    keyEnvironment:{
      NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION:'2',
      NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64:'1='+randomBytes(32).toString('base64')+',2='+randomBytes(32).toString('base64'),
    },
    personalControl:control,
  };
  return {input,events};
}
const denied=/R220C_STAGING_CONNECTION_PROOF_DENIED/u;

test('R220C positive synthetic readiness verifies TLS, real restricted LOGIN, R198, R208, keys and no HTTP route',async()=>{
  const f=setup();const result=await prepareR220CStagingBackendReviewOnly(f.input);
  assert.equal(result.kind,'R220C_STAGING_REVIEW_ONLY_NO_RELEASE');
  assert.equal(result.httpRouteRegistered,false);
  assert.equal(result.productionAuthorized,false);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(f.events.filter(e=>e==='LOGIN_PROOF').length,1);
  assert.equal(f.events.filter(e=>e==='R198_ROLE').length,2);
  assert.equal(f.events.filter(e=>e==='R208_POLICIES').length,1);
  assert.deepEqual(await result.operation.list(null),{status:401});
  assert.deepEqual(await result.operation.list('fake-session'),{status:503});
});

test('R220C rejects wrong project, issuer, acknowledgement or old NOLOGIN canary role without querying DB',async()=>{
  for (const key of ['stagingProjectRef','expectedIssuer','acknowledgement','expectedDbRole'] as const) {
    const f=setup();const bad={...f.input,[key]:key==='expectedDbRole'?'noor_journal_r219':'INVALID'};
    await assert.rejects(prepareR220CStagingBackendReviewOnly(bad as never),denied);
    assert.deepEqual(f.events,[]);
  }
});

test('R220C rejects non-LOGIN, SET ROLE impersonation, superuser, BYPASSRLS and inherited privileges',async()=>{
  for(const diff of [{canLogin:false},{roleName:'postgres'},{loginRoleName:'postgres'},
                     {superuser:true},{bypassRls:true},{inheritsPrivileges:true}]){
    const f=setup({login:{...properties(),...diff}});
    await assert.rejects(prepareR220CStagingBackendReviewOnly(f.input),denied);
    assert.equal(f.events.includes('R198_ROLE'),false);
    assert.deepEqual(f.events.slice(-2),['ROLLBACK','release']);
  }
});

test('R220C refuses missing TLS before reading journal policy inventory',async()=>{
  const f=setup({login:{...properties(),tlsEnabled:false}});
  await assert.rejects(prepareR220CStagingBackendReviewOnly(f.input),denied);
  assert.equal(f.events.includes('R208_POLICIES'),false);
});

test('R220C fails closed on connection, query, rollback or client release faults',async()=>{
  for(const fail of ['connect','query','rollback','release'] as const){
    const f=setup({fail});
    await assert.rejects(prepareR220CStagingBackendReviewOnly(f.input),denied);
    assert.equal(f.events.includes('R198_ROLE'),false);
  }
});

test('R220C rejects public RLS policy even after login and TLS checks pass',async()=>{
  const p=policy();p[1]={...p[1]!,roles:['public']};
  const f=setup({policies:p});
  await assert.rejects(prepareR220CStagingBackendReviewOnly(f.input),denied);
  assert.equal(f.events.includes('R208_POLICIES'),true);
});

test('R220C rejects public Origin and unavailable keyring',async()=>{
  const f=setup();
  await assert.rejects(prepareR220CStagingBackendReviewOnly({...f.input,expectedOrigin:'https://public.example.com'}),denied);
  assert.deepEqual(f.events,[]);
  const g=setup();
  await assert.rejects(prepareR220CStagingBackendReviewOnly({...g.input,keyEnvironment:{}}),denied);
});
