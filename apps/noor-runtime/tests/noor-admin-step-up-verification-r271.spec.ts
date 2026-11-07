import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminStepUpR271} from "../src/noor-admin-step-up-r271.js";
import {NoorAdminVerifiedStepUpIssuerR271} from "../src/noor-admin-step-up-verification-r271.js";

const input={
  platformSessionId:"noor-session",
  authUserId:"11111111-1111-4111-8111-111111111111",
  authSessionId:"22222222-2222-4222-8222-222222222222",
  challengeId:"challenge-1",
};
test("R271 step-up requires independently verified server-side challenge",async()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  const denied=new NoorAdminVerifiedStepUpIssuerR271({verify:async()=>null},proofs);
  assert.equal(await denied.issue(input),false);
  assert.equal(proofs.consume(input),false);
  const approved=new NoorAdminVerifiedStepUpIssuerR271({verify:async()=>({verifiedAtMs:100000})},proofs);
  assert.equal(await approved.issue(input),true);
  assert.equal(proofs.consume(input),true);
  assert.equal(proofs.consume(input),false);
});
test("R271 verifier failure and stale evidence fail closed",async()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  const rejected=new NoorAdminVerifiedStepUpIssuerR271({verify:async()=>{throw Error("unavailable");}},proofs);
  assert.equal(await rejected.issue(input),false);
  const stale=new NoorAdminVerifiedStepUpIssuerR271({verify:async()=>({verifiedAtMs:1})},proofs);
  assert.equal(await stale.issue(input),false);
  assert.equal(proofs.consume(input),false);
});

test("R271 same challenge cannot be redeemed twice, even after proof consumption",async()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  let verified=0;
  const issuer=new NoorAdminVerifiedStepUpIssuerR271({
    verify:async()=>{verified++;return {verifiedAtMs:100000};},
  },proofs);
  assert.equal(await issuer.issue(input),true);
  assert.equal(proofs.consume(input),true);
  assert.equal(await issuer.issue(input),false);
  assert.equal(verified,1);
  assert.equal(proofs.consume(input),false);
});
test("R271 concurrent redemption of the same challenge fails closed",async()=>{
  const proofs=new NoorAdminStepUpR271(()=>100000);
  let release!:()=>void;
  const pending=new Promise<void>(resolve=>{release=resolve;});
  const issuer=new NoorAdminVerifiedStepUpIssuerR271({
    verify:async()=>{await pending;return {verifiedAtMs:100000};},
  },proofs);
  const first=issuer.issue(input);
  assert.equal(await issuer.issue(input),false);
  release();
  assert.equal(await first,true);
  assert.equal(proofs.consume(input),true);
});
