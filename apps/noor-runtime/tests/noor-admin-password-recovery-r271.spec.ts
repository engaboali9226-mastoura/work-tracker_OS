import assert from "node:assert/strict";
import test from "node:test";
import {requestNoorAdminPasswordRecoveryR271} from "../src/noor-admin-password-recovery-r271.js";

const authority={
  sessionActive:true,accountActive:true,verifiedAdminGrant:true,
  assuranceLevel:"aal2" as const,reauthenticated:true,role:"super_admin" as const,
};
const input={
  actorAccountId:"actor",targetAuthUserId:"auth-target",
  authority,
};
test("R271 password recovery denies weak assurance before sending or auditing",async()=>{
  let calls=0;
  const dependencies={
    provider:{sendRecoveryEmailForUserId:async()=>{calls++;return true;}},
    audit:{record:async()=>{calls++;}},
  };
  for(const denied of [
    {...authority,role:"admin" as const},
    {...authority,reauthenticated:false},
    {...authority,assuranceLevel:"aal1" as const},
  ]){
    assert.equal(await requestNoorAdminPasswordRecoveryR271(
      {...input,authority:denied},dependencies),"denied");
  }
  assert.equal(calls,0);
});
test("R271 recovery requests mailbox delivery and records target identity",async()=>{
  const events:string[]=[];
  const result=await requestNoorAdminPasswordRecoveryR271(input,{
    provider:{sendRecoveryEmailForUserId:async email=>{events.push("auth:"+email);return true;}},
    audit:{record:async event=>{events.push("audit:"+event.targetAuthUserId+":"+event.outcome);}},
  });
  assert.equal(result,"requested");
  assert.deepEqual(events,["auth:auth-target","audit:auth-target:requested"]);
});
test("R271 recovery fails closed when audit cannot be written",async()=>{
  const result=await requestNoorAdminPasswordRecoveryR271(input,{
    provider:{sendRecoveryEmailForUserId:async()=>true},
    audit:{record:async()=>{throw Error("offline");}},
  });
  assert.equal(result,"unavailable");
});
