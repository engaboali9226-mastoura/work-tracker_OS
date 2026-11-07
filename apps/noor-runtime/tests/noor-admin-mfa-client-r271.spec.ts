import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorAdminMfaClientR271} from "../src/noor-admin-mfa-client-r271.js";
const id="22222222-2222-4222-8222-222222222222";
test("R271 TOTP enrollment and verification requires real Supabase challenge",async()=>{
  const calls:string[]=[];
  const client={auth:{mfa:{
    enroll:async()=>{calls.push("enroll");return {error:null,data:{id,type:"totp",totp:{qr_code:"svg-qr"}}};},
    challenge:async()=>{calls.push("challenge");return {error:null,data:{id:"challenge"}};},
    verify:async()=>{calls.push("verify");return {error:null,data:{access_token:"aal2-jwt"}};},
    listFactors:async()=>({error:null,data:{totp:[{id,status:"verified",friendly_name:"Primary"}]}}),
  }}} as unknown as Pick<SupabaseClient,"auth">;
  const mfa=new NoorAdminMfaClientR271(client);
  assert.deepEqual(await mfa.enrollTotp(),{factorId:id,qrCode:"svg-qr"}); // replace mock ID below
  assert.equal(await mfa.verifyTotp(id,"123456"),"aal2-jwt");
  assert.deepEqual(calls,["enroll","challenge","verify"]);
  assert.deepEqual(await mfa.verifiedFactors(),[{id,friendlyName:"Primary"}]);
});
test("R271 invalid TOTP inputs never reach provider",async()=>{
  const mfa=new NoorAdminMfaClientR271({auth:{mfa:{challenge:async()=>{throw Error("unexpected");}}}} as unknown as Pick<SupabaseClient,"auth">);
  await assert.rejects(mfa.verifyTotp("invalid","123456"),/NOOR_MFA_INVALID_INPUT/);
  await assert.rejects(mfa.verifyTotp(id,"12"),/NOOR_MFA_INVALID_INPUT/);
});
