import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminStepUpR271} from "../src/noor-admin-step-up-r271.js";
import {authorizeNoorAdminSensitiveActionR271} from "../src/noor-admin-sensitive-authority-r271.js";
import type {AdminAuthorityR271} from "../src/noor-admin-policy-r271.js";

const authUserId="11111111-1111-4111-8111-111111111111";
const authSessionId="22222222-2222-4222-8222-222222222222";
const platformSessionId="noor-session";
const authority:AdminAuthorityR271={
  sessionActive:true,accountActive:true,verifiedAdminGrant:true,
  assuranceLevel:"aal2",reauthenticated:true,role:"super_admin",
};
test("R271 sensitive admin operation consumes trusted step-up once",()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  const input={action:"accounts:delete" as const,authority,authUserId,authSessionId,platformSessionId};
  assert.equal(authorizeNoorAdminSensitiveActionR271(input,proofs),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:100000}),true);
  assert.equal(authorizeNoorAdminSensitiveActionR271(input,proofs),true);
  assert.equal(authorizeNoorAdminSensitiveActionR271(input,proofs),false);
});
test("R271 client-asserted reauthentication and mismatched session cannot authorize",()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  const input={action:"entitlements:manage" as const,authority,authUserId,authSessionId,platformSessionId};
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:100000}),true);
  assert.equal(authorizeNoorAdminSensitiveActionR271({...input,authSessionId:"33333333-3333-4333-8333-333333333333"},proofs),false);
  assert.equal(authorizeNoorAdminSensitiveActionR271(input,proofs),false);
  assert.equal(authorizeNoorAdminSensitiveActionR271({...input,authority:{...authority,role:"admin"}},proofs),false);
});
