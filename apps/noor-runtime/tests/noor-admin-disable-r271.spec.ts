import assert from "node:assert/strict";
import test from "node:test";
import {disableAdminAccountR271} from "../src/noor-admin-disable-r271.js";

const authority={
  sessionActive:true,accountActive:true,verifiedAdminGrant:true,
  assuranceLevel:"aal2" as const,reauthenticated:true,role:"super_admin" as const,
};

test("R271 never touches store for unverified disable authority",async()=>{
  let calls=0;
  const store={
    getAccount:async()=>{calls++;return {accountId:"target",enabled:true,isSuperAdmin:false};},
    countActiveSuperAdmins:async()=>{calls++;return 2;},
    disableAndAuditAtomically:async()=>{calls++;return true;},
  };
  for(const denied of [null,{...authority,role:"admin" as const},{...authority,assuranceLevel:"aal1" as const}]){
    assert.equal(await disableAdminAccountR271({
      actorAccountId:"actor",targetAccountId:"target",authority:denied,
    },{store}),"denied");
  }
  assert.equal(calls,0);
});

test("R271 disables only after verified authority and atomic store approval",async()=>{
  let calls=0;
  const result=await disableAdminAccountR271({
    actorAccountId:"actor",targetAccountId:"target",authority,
  },{store:{
    getAccount:async()=>({accountId:"target",enabled:true,isSuperAdmin:false}),
    countActiveSuperAdmins:async()=>2,
    disableAndAuditAtomically:async()=>{calls++;return true;},
  }});
  assert.equal(result,"disabled");
  assert.equal(calls,1);
});
