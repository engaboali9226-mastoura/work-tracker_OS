import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorSupabaseAssuranceVerifierR271} from "../src/noor-admin-supabase-assurance-r271.js";

const id="11111111-1111-4111-8111-111111111111";
const now=1794060000000;
function fixture(overrides:Record<string,unknown>={},token:string|null="signed-token"){
  let userCalls=0;
  let claimsCalls=0;
  const client={auth:{
    getUser:async(access:string)=>{userCalls++;assert.equal(access,"signed-token");
      return {error:null,data:{user:{id}}};},
    getClaims:async(access:string)=>{claimsCalls++;assert.equal(access,"signed-token");
      return {error:null,data:{claims:{sub:id,aal:"aal2",session_id:"supabase-session",iat:1794059900,exp:1794061000,...overrides}}};},
  }} as unknown as SupabaseClient;
  const verifier=new NoorSupabaseAssuranceVerifierR271(client,{
    getAccessTokenForSession:async session=>{assert.equal(session,"noor-session");return token;},
  },()=>now);
  return {verifier,calls:()=>[userCalls,claimsCalls]};
}
test("R271 requires signed AAL2 evidence and never fabricates recent reauthentication",async()=>{
  const {verifier}=fixture();
  assert.deepEqual(await verifier.verify("noor-session",id),{aal:"aal2",reauthenticated:false});
});
test("R271 refuses absent server-bound access token without contacting Auth",async()=>{
  const {verifier,calls}=fixture({},null);
  assert.equal(await verifier.verify("noor-session",id),null);
  assert.deepEqual(calls(),[0,0]);
});
test("R271 refuses weak MFA, identity mismatch, and expired signed claims",async()=>{
  for(const claims of [{aal:"aal1"},{sub:"22222222-2222-4222-8222-222222222222"},{exp:1794050000},{session_id:""}]){
    const {verifier}=fixture(claims);
    assert.equal(await verifier.verify("noor-session",id),null);
  }
});
