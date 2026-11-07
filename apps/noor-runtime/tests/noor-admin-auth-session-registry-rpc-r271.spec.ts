import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminAuthSessionRegistryRpcR271} from "../src/noor-admin-auth-session-registry-rpc-r271.js";

const authSessionId="22222222-2222-4222-8222-222222222222";
const authUserId="11111111-1111-4111-8111-111111111111";
const input={authSessionId,authUserId};

test("R271 protected RPC checks only the expected Auth session and user",async()=>{
  let calls=0;
  const registry=new NoorAdminAuthSessionRegistryRpcR271({
    rpc:async(name,args)=>{
      calls++;
      assert.equal(name,"noor_admin_auth_session_active_r271");
      assert.deepEqual(args,{p_auth_session_id:authSessionId,p_auth_user_id:authUserId});
      return {data:true,error:null};
    },
  });
  assert.equal(await registry.isActive(input),true);
  assert.equal(calls,1);
});

test("R271 protected RPC never accepts a truthy nonboolean, revoked session, or error",async()=>{
  for(const data of [false,1,"true",null,[],{},undefined]){
    const registry=new NoorAdminAuthSessionRegistryRpcR271({
      rpc:async()=>({data,error:null}),
    });
    assert.equal(await registry.isActive(input),false);
  }
  const failed=new NoorAdminAuthSessionRegistryRpcR271({
    rpc:async()=>({data:true,error:{message:"permission denied"}}),
  });
  assert.equal(await failed.isActive(input),false);
  const offline=new NoorAdminAuthSessionRegistryRpcR271({
    rpc:async()=>{throw Error("backend offline");},
  });
  assert.equal(await offline.isActive(input),false);
});

test("R271 invalid or missing UUID never invokes service RPC",async()=>{
  let calls=0;
  const registry=new NoorAdminAuthSessionRegistryRpcR271({
    rpc:async()=>{calls++;return {data:true,error:null};},
  });
  assert.equal(await registry.isActive({...input,authSessionId:"not-a-uuid"}),false);
  assert.equal(await registry.isActive({...input,authUserId:""}),false);
  assert.equal(calls,0);
});
