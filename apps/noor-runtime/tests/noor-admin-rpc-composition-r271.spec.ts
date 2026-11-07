import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminDatabaseR271} from "../src/noor-admin-store-r271.js";
import {createNoorAdminSecureCompositionR271} from "../src/noor-admin-secure-composition-r271.js";

const user="11111111-1111-4111-8111-111111111111";
const authSession="22222222-2222-4222-8222-222222222222";
const factor="33333333-3333-4333-8333-333333333333";
const time=1794060000000;
function clientWithRpc(active:boolean,error:unknown=null){
  const calls:string[]=[];
  const client={
    from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({
      data:{auth_user_id:user,role:"super_admin",enabled:true},error:null,
    })})})})}),
    rpc:async(name:string,params:unknown)=>{
      assert.equal(name,"noor_admin_auth_session_active_r271");
      assert.deepEqual(params,{p_auth_session_id:authSession,p_auth_user_id:user});
      calls.push(name);
      return {data:active,error};
    },
    auth:{
      getUser:async()=>({error:null,data:{user:{id:user}}}),
      getClaims:async()=>({error:null,data:{claims:{
        sub:user,aal:"aal2",session_id:authSession,
        iat:Math.floor(time/1000)-10,exp:Math.floor(time/1000)+120,
      }}}),
    },
  } as unknown as SupabaseClient<NoorAdminDatabaseR271>;
  return {client,calls};
}
const session={execute:async()=>({accountId:{toString:()=>"account-one"}})};

test("R271 service-role RPC option verifies live Auth session and grants MFA step-up",async()=>{
  const {client,calls}=clientWithRpc(true);
  const composition=createNoorAdminSecureCompositionR271({
    client,session,now:()=>time,useServiceRoleSessionRpc:true,
    totpProvider:{verify:async()=> "server-verified-jwt"},
  });
  assert.equal(await composition.resolveActor("noor-session"),null);
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"noor-session",accessToken:"signed-jwt",
  }),"authenticated");
  assert.equal((await composition.resolveActor("noor-session"))?.actorAccountId,"account-one");
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),false);
  assert.equal(await composition.stepUp?.verify({
    platformSessionId:"noor-session",factorId:factor,code:"123456",
  }),true);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),true);
  assert.equal(await composition.authorizeSensitiveAction("noor-session","accounts:delete"),false);
  assert.ok(calls.length>=3);
  composition.shutdown();
  assert.equal(await composition.resolveActor("noor-session"),null);
});

test("R271 missing or denied RPC never authenticates an administrator",async()=>{
  for(const [active,error] of [[false,null],[true,{message:"permission denied"}]] as const){
    const {client}=clientWithRpc(active,error);
    const composition=createNoorAdminSecureCompositionR271({
      client,session,now:()=>time,useServiceRoleSessionRpc:true,
    });
    assert.equal(await composition.authentication.authenticate({
      platformSessionId:"noor-session",accessToken:"signed-jwt",
    }),"denied");
    assert.equal(await composition.resolveActor("noor-session"),null);
  }
});

test("R271 registry source selection requires exactly one trusted backend",()=>{
  const {client}=clientWithRpc(true);
  assert.throws(()=>createNoorAdminSecureCompositionR271({
    client,session,useServiceRoleSessionRpc:true,
    sessionRegistry:{isActive:async()=>true},
  }),/NOOR_ADMIN_REGISTRY_DUPLICATE_SOURCE/);
  assert.throws(()=>createNoorAdminSecureCompositionR271({
    client,session,useServiceRoleSessionRpc:true,
    postgresSessionClient:{query:async()=>({rows:[{active:true}]})},
  }),/NOOR_ADMIN_REGISTRY_DUPLICATE_SOURCE/);
});
