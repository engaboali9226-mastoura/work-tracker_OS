import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminDatabaseR271} from "../src/noor-admin-store-r271.js";
import {createNoorAdminSecureCompositionR271} from "../src/noor-admin-secure-composition-r271.js";

const id="11111111-1111-4111-8111-111111111111";
const sid="22222222-2222-4222-8222-222222222222";
const now=1794060000000;
const session={execute:async()=>({accountId:{toString:()=>"account-one"}})};
const client={
  from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({
    data:{auth_user_id:id,role:"super_admin",enabled:true},error:null,
  })})})})}),
  auth:{
    getUser:async()=>({error:null,data:{user:{id}}}),
    getClaims:async()=>({error:null,data:{claims:{
      sub:id,aal:"aal2",session_id:sid,
      iat:Math.floor(now/1000)-20,exp:Math.floor(now/1000)+120,
    }}}),
  },
} as unknown as SupabaseClient<NoorAdminDatabaseR271>;

test("R271 secure composition connects the private PostgreSQL session oracle",async()=>{
  let queries=0;
  const composition=createNoorAdminSecureCompositionR271({
    client,session,now:()=>now,
    postgresSessionClient:{query:async(sql,params)=>{
      queries++;
      assert.match(sql,/noor_admin_internal\.noor_admin_auth_session_active_r271/);
      assert.deepEqual(params,[sid,id]);
      return {rows:[{active:true}]};
    }},
  });
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"noor-session",accessToken:"signed-token",
  }),"authenticated");
  assert.equal((await composition.resolveActor("noor-session"))?.actorAccountId,"account-one");
  assert.ok(queries>=2);
  assert.equal(composition.stepUp,null);
});
test("R271 rejects ambiguous database registry sources",()=>{
  assert.throws(()=>createNoorAdminSecureCompositionR271({
    client,session,sessionRegistry:{isActive:async()=>true},
    postgresSessionClient:{query:async()=>({rows:[{active:true}]})},
  }),/NOOR_ADMIN_REGISTRY_DUPLICATE_SOURCE/);
});
