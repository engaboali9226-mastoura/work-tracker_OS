import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminStepUpR271} from "../src/noor-admin-step-up-r271.js";

const user="11111111-1111-4111-8111-111111111111";
const authSession="22222222-2222-4222-8222-222222222222";
const platformSessionId="noor-session";
test("R271 step-up is session-bound, fresh and single-use",()=>{
  let now=100000;
  const proofs=new NoorAdminStepUpR271(()=>now);
  const input={platformSessionId,authUserId:user,authSessionId:authSession};
  assert.equal(proofs.consume(input),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:now}),true);
  assert.equal(proofs.consume({...input,authSessionId:"33333333-3333-4333-8333-333333333333"}),false);
  assert.equal(proofs.consume(input),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:now}),true);
  assert.equal(proofs.consume(input),true);
  assert.equal(proofs.consume(input),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:now}),true);
  now+=60001;
  assert.equal(proofs.consume(input),false);
});
test("R271 stale or future challenge and revoked proof cannot grant step-up",()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  const input={platformSessionId,authUserId:user,authSessionId:authSession};
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:39999}),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:100001}),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:100000}),true);
  proofs.revoke(platformSessionId);
  assert.equal(proofs.consume(input),false);
  assert.equal(proofs.recordVerifiedChallenge({...input,challengeVerifiedAtMs:100000}),true);
  proofs.revokeAll();
  assert.equal(proofs.consume(input),false);
});
