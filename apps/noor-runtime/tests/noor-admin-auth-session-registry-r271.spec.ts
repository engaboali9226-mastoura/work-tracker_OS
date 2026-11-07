import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminAuthSessionRegistrySqlR271} from "../src/noor-admin-auth-session-registry-r271.js";

const authSessionId="22222222-2222-4222-8222-222222222222";
const authUserId="11111111-1111-4111-8111-111111111111";
const input={authSessionId,authUserId};
test("R271 private session function uses parameterized SQL and verifies both identities",async()=>{
  let calls=0;
  const registry=new NoorAdminAuthSessionRegistrySqlR271({execute:async(sql,params)=>{
    calls++;
    assert.match(sql,/noor_admin_internal\.noor_admin_auth_session_active_r271/);
    assert.doesNotMatch(sql,/from auth\.sessions/);
    assert.match(sql,/\$1::uuid/);
    assert.match(sql,/\$2::uuid/);
    assert.deepEqual(params,[authSessionId,authUserId]);
    return [{active:true}];
  }});
  assert.equal(await registry.isActive(input),true);
  assert.equal(calls,1);
});
test("R271 missing, expired, revoked, malformed or unavailable session denies",async()=>{
  for(const rows of [[],[{active:false}],[{active:true},{active:true}]]){
    const registry=new NoorAdminAuthSessionRegistrySqlR271({execute:async()=>rows});
    assert.equal(await registry.isActive(input),false);
  }
  const unavailable=new NoorAdminAuthSessionRegistrySqlR271({execute:async()=>{throw Error("db down");}});
  assert.equal(await unavailable.isActive(input),false);
  assert.equal(await unavailable.isActive({...input,authSessionId:"invalid"}),false);
});
