import assert from "node:assert/strict";
import test from "node:test";
import {createNoorAdminAuthorityResolverR271} from "../src/noor-admin-authority-r271.js";

test("R271 rejects ordinary users, disabled administrators and weak assurance",async()=>{
  for (const state of ["ordinary","disabled","weak","revoked"] as const) {
    let assuranceChecks=0;
    const resolve=createNoorAdminAuthorityResolverR271({
      session:{execute:async()=>{
        if(state==="revoked") throw Error("revoked");
        return {accountId:{toString:()=>"account-1"}};
      }},
      store:{findActiveByAccountId:async()=>{
        if(state==="ordinary") return null;
        return {enabled:state!=="disabled",role:"super_admin",authUserId:"verified-auth-id"};
      }},
      assurance:{verify:async()=>{assuranceChecks++;return {aal:state==="weak"?"aal1":"aal2",reauthenticated:false};}},
    });
    const authority=await resolve("session");
    if(state==="weak") assert.equal(authority?.assuranceLevel,"aal1");
    else assert.equal(authority,null);
    if(state==="ordinary"||state==="disabled"||state==="revoked") assert.equal(assuranceChecks,0);
  }
});

test("R271 accepts server-verified admin only with MFA assurance",async()=>{
  const resolve=createNoorAdminAuthorityResolverR271({
    session:{execute:async()=>({accountId:{toString:()=>"account-1"}})},
    store:{findActiveByAccountId:async()=>({enabled:true,role:"super_admin",authUserId:"auth-id"})},
    assurance:{verify:async()=>({aal:"aal2",reauthenticated:true})},
  });
  assert.deepEqual(await resolve("session"),{
    sessionActive:true,accountActive:true,verifiedAdminGrant:true,
    assuranceLevel:"aal2",reauthenticated:true,
  });
});
