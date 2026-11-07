import assert from "node:assert/strict";
import test from "node:test";
import {createNoorAdminVerifiedActorResolverR271} from "../src/noor-admin-authority-r271.js";

test("R271 actor ID and authority derive from the same verified platform session",async()=>{
  const calls:string[]=[];
  const resolve=createNoorAdminVerifiedActorResolverR271({
    session:{execute:async ({sessionId})=>{
      calls.push("session:"+sessionId);
      return {accountId:{toString:()=>"account-one"}};
    }},
    store:{findActiveByAccountId:async id=>{
      calls.push("store:"+id);
      return {enabled:true,role:"super_admin" as const,authUserId:"auth-one"};
    }},
    assurance:{verify:async (sessionId,authUserId)=>{
      calls.push("assurance:"+sessionId+":"+authUserId);
      return {aal:"aal2" as const,reauthenticated:false};
    }},
  });
  assert.deepEqual(await resolve("session-one"),{
    actorAccountId:"account-one",
    authority:{sessionActive:true,accountActive:true,verifiedAdminGrant:true,
      role:"super_admin",assuranceLevel:"aal2",reauthenticated:false},
  });
  assert.deepEqual(calls,["session:session-one","store:account-one","assurance:session-one:auth-one"]);
});
test("R271 revoked platform session never produces a privileged actor",async()=>{
  const resolve=createNoorAdminVerifiedActorResolverR271({
    session:{execute:async()=>{throw Error("revoked");}},
    store:{findActiveByAccountId:async()=>{throw Error("must not query");}},
    assurance:{verify:async()=>{throw Error("must not query");}},
  });
  assert.equal(await resolve("revoked"),null);
});
