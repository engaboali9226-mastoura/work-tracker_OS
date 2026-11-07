import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorSupabasePasswordRecoveryProviderR271} from "../src/noor-admin-supabase-password-recovery-r271.js";

const id="11111111-1111-4111-8111-111111111111";
test("R271 resolves password recovery destination from verified Auth user",async()=>{
  const calls:string[]=[];
  const client={auth:{
    admin:{getUserById:async(userId:string)=>{
      calls.push("lookup:"+userId);
      return {error:null,data:{user:{id,email:"owner@example.org",email_confirmed_at:"2026-01-01T00:00:00Z"}}};
    }},
    resetPasswordForEmail:async(email:string)=>{
      calls.push("deliver:"+email);return {error:null};
    },
  }} as unknown as SupabaseClient;
  assert.equal(await new NoorSupabasePasswordRecoveryProviderR271(client).sendRecoveryEmailForUserId(id),true);
  assert.deepEqual(calls,["lookup:"+id,"deliver:owner@example.org"]);
});
test("R271 never sends recovery when Auth identity mismatches or is unverified",async()=>{
  let deliveries=0;
  const client={auth:{
    admin:{getUserById:async()=>({error:null,data:{user:{
      id:"22222222-2222-4222-8222-222222222222",
      email:"attacker@example.org",email_confirmed_at:null,
    }}})},
    resetPasswordForEmail:async()=>{deliveries++;return {error:null};},
  }} as unknown as SupabaseClient;
  assert.equal(await new NoorSupabasePasswordRecoveryProviderR271(client).sendRecoveryEmailForUserId(id),false);
  assert.equal(await new NoorSupabasePasswordRecoveryProviderR271(client).sendRecoveryEmailForUserId("not-an-id"),false);
  assert.equal(deliveries,0);
});
