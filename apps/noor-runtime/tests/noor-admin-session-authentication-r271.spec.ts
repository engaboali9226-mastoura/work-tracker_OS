import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorAdminSessionAuthenticationR271} from "../src/noor-admin-session-authentication-r271.js";
import {NoorAdminSessionTokenBindingR271} from "../src/noor-admin-session-token-binding-r271.js";

const authId="11111111-1111-4111-8111-111111111111";
const sessionId="22222222-2222-4222-8222-222222222222";
const now=1794060000000;
function fixture(options:{authId?:string;aal?:string;platformAccount?:string;adminAccount?:string;expires?:number;revoked?:boolean}={}){
  const events:string[]=[];
  const bindings=new NoorAdminSessionTokenBindingR271(()=>now);
  const auth={
    getUser:async()=>{events.push("get-user");return {error:null,data:{user:{id:options.authId??authId}}};},
    getClaims:async()=>{events.push("get-claims");return {error:null,data:{claims:{
      sub:options.authId??authId,aal:options.aal??"aal2",session_id:sessionId,
      iat:Math.floor(now/1000)-20,exp:options.expires??Math.floor(now/1000)+120,
    }}};},
  } as unknown as Pick<SupabaseClient["auth"],"getUser"|"getClaims">;
  const operation=new NoorAdminSessionAuthenticationR271({
    platformSession:{execute:async()=>{
      events.push("platform");
      if(options.revoked)throw Error("revoked");
      return {accountId:{toString:()=>options.platformAccount??"account-one"}};
    }},
    adminStore:{findActiveByAccountId:async accountId=>{
      events.push("admin:"+accountId);
      return accountId===(options.adminAccount??"account-one")
        ? {enabled:true,role:"super_admin" as const,authUserId:authId}:null;
    }},
    auth,bindings,now:()=>now,
  });
  return {operation,bindings,events};
}
test("R271 binds only matching verified AAL2 Supabase identity to live Noor session",async()=>{
  const f=fixture();
  assert.equal(await f.operation.authenticate({platformSessionId:"noor-session",accessToken:"signed-token"}),"authenticated");
  assert.equal(await f.bindings.getAccessTokenForSession("noor-session"),"signed-token");
  assert.deepEqual(f.events,["platform","admin:account-one","get-user","get-claims"]);
});
test("R271 refuses identity mismatch, weak MFA, expired proof and revoked platform session",async()=>{
  for(const options of [
    {authId:"33333333-3333-4333-8333-333333333333"},
    {aal:"aal1"},
    {expires:Math.floor(now/1000)-1},
    {platformAccount:"account-two"},
    {revoked:true},
  ]){
    const f=fixture(options);
    assert.notEqual(await f.operation.authenticate({platformSessionId:"noor-session",accessToken:"signed-token"}),"authenticated");
    assert.equal(await f.bindings.getAccessTokenForSession("noor-session"),null);
  }
});
test("R271 never authenticates empty session or access token",async()=>{
  const f=fixture();
  assert.equal(await f.operation.authenticate({platformSessionId:"",accessToken:"signed-token"}),"denied");
  assert.equal(await f.operation.authenticate({platformSessionId:"noor-session",accessToken:""}),"denied");
  assert.deepEqual(f.events,[]);
});

test("R271 admin renewal requires existing live binding and cannot resurrect revoked session",async()=>{
  const f=fixture();
  const input={platformSessionId:"noor-session",accessToken:"signed-token"};
  assert.equal(await f.operation.renew(input),"denied");
  assert.equal(await f.operation.authenticate(input),"authenticated");
  assert.equal(await f.operation.renew(input),"authenticated");
  f.operation.revokeSession("noor-session");
  assert.equal(await f.bindings.getAccessTokenForSession("noor-session"),null);
  assert.equal(await f.operation.renew(input),"denied");
});
test("R271 renewal refuses another signed Supabase Auth session",async()=>{
  const f=fixture();
  const input={platformSessionId:"noor-session",accessToken:"signed-token"};
  assert.equal(await f.operation.authenticate(input),"authenticated");
  const mismatch=fixture({authId:"33333333-3333-4333-8333-333333333333"});
  assert.equal(await mismatch.operation.renew(input),"denied");
});
