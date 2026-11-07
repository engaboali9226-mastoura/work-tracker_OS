import assert from "node:assert/strict";
import test from "node:test";
import {createNoorAdminPgSessionRegistryR271} from "../src/noor-admin-pg-session-registry-r271.js";

const authSessionId="22222222-2222-4222-8222-222222222222";
const authUserId="11111111-1111-4111-8111-111111111111";
test("R271 PostgreSQL registry calls only private function with bound UUID values",async()=>{
  let called=0;
  const registry=createNoorAdminPgSessionRegistryR271({query:async(sql,params)=>{
    called++;
    assert.match(sql,/noor_admin_internal\.noor_admin_auth_session_active_r271/);
    assert.deepEqual(params,[authSessionId,authUserId]);
    return {rows:[{active:true}]};
  }});
  assert.equal(await registry.isActive({authSessionId,authUserId}),true);
  assert.equal(called,1);
});
test("R271 PostgreSQL adapter fails closed on missing function or database outage",async()=>{
  const registry=createNoorAdminPgSessionRegistryR271({query:async()=>{throw Error("database unavailable");}});
  assert.equal(await registry.isActive({authSessionId,authUserId}),false);
  assert.equal(await registry.isActive({authSessionId:"invalid",authUserId}),false);
});
