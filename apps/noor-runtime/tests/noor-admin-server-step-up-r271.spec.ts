import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminDatabaseR271} from "../src/noor-admin-store-r271.js";
import {createNoorAdminSecureCompositionR271} from "../src/noor-admin-secure-composition-r271.js";

const user="11111111-1111-4111-8111-111111111111";
const authSession="22222222-2222-4222-8222-222222222222";
const factor="33333333-3333-4333-8333-333333333333";
const time=1794060000000;
function setup(provider:{verify(input:Readonly<{accessToken:string;factorId:string;code:string}>):Promise<string|null>}|undefined){
  const client={
    from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({
      data:{auth_user_id:user,role:"super_admin",enabled:true},error:null,
    })})})})}),
    auth:{
      getUser:async()=>({error:null,data:{user:{id:user}}}),
      getClaims:async()=>({error:null,data:{claims:{
        sub:user,aal:"aal2",session_id:authSession,
        iat:Math.floor(time/1000)-20,exp:Math.floor(time/1000)+120,
      }}}),
    },
  } as unknown as SupabaseClient<NoorAdminDatabaseR271>;
  return createNoorAdminSecureCompositionR271({
    client,session:{execute:async()=>({accountId:{toString:()=>"account-one"}})},
    now:()=>time,sessionRegistry:{isActive:async()=>true},
    ...(provider?{totpProvider:provider}:{}),
  });
}
test("R271 production composition keeps step-up off without server TOTP adapter",async()=>{
  const composition=setup(undefined);
  assert.equal(composition.stepUp,null);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),false);
});
test("R271 fresh server-verified MFA authorizes exactly one sensitive operation",async()=>{
  let calls=0;
  const composition=setup({verify:async input=>{
    calls++;
    assert.equal(input.accessToken,"initial-token");
    assert.equal(input.factorId,factor);
    return "fresh-token";
  }});
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"noor-session",accessToken:"initial-token",
  }),"authenticated");
  assert.ok(composition.stepUp);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),false);
  assert.equal(await composition.stepUp?.verify({
    platformSessionId:"noor-session",factorId:factor,code:"123456",
  }),true);
  assert.equal(calls,1);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),true);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),false);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:list"),false);
});
test("R271 revoke destroys unconsumed MFA proof and Auth session binding",async()=>{
  const composition=setup({verify:async()=> "fresh-token"});
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"noor-session",accessToken:"initial-token",
  }),"authenticated");
  assert.equal(await composition.stepUp?.verify({
    platformSessionId:"noor-session",factorId:factor,code:"123456",
  }),true);
  composition.revokeSession("noor-session");
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),false);
  assert.equal(await composition.resolveActor("noor-session"),null);
});

test("R271 denies challenge completion after in-flight session revoke",async()=>{
  let start!:()=>void;let finish!:()=>void;
  const started=new Promise<void>(resolve=>{start=resolve;});
  const wait=new Promise<void>(resolve=>{finish=resolve;});
  const composition=setup({verify:async()=>{start();await wait;return "fresh-token";}});
  await composition.authentication.authenticate({platformSessionId:"noor-session",accessToken:"initial-token"});
  const pending=composition.stepUp?.verify({platformSessionId:"noor-session",factorId:factor,code:"123456"});
  assert.ok(pending);
  await started;
  composition.revokeSession("noor-session");
  finish();
  assert.equal(await pending,false);
});
