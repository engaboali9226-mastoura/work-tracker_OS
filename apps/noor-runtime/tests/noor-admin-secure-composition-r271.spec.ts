import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminDatabaseR271} from "../src/noor-admin-store-r271.js";
import {createNoorAdminSecureCompositionR271} from "../src/noor-admin-secure-composition-r271.js";

const authId="11111111-1111-4111-8111-111111111111";
const authSession="22222222-2222-4222-8222-222222222222";
const now=1794060000000;
test("R271 secure composition does not grant authority without MFA proof exchange",async()=>{
  const client={
    from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({
      data:{auth_user_id:authId,role:"super_admin",enabled:true},error:null,
    })})})})}),
    auth:{
      getUser:async()=>({error:null,data:{user:{id:authId}}}),
      getClaims:async()=>({error:null,data:{claims:{
        sub:authId,aal:"aal2",session_id:authSession,
        iat:Math.floor(now/1000)-20,exp:Math.floor(now/1000)+120,
      }}}),
    },
  } as unknown as SupabaseClient<NoorAdminDatabaseR271>;
  const composition=createNoorAdminSecureCompositionR271({
    client,session:{execute:async()=>({accountId:{toString:()=>"account-one"}})},
    now:()=>now,
    sessionRegistry:{isActive:async()=>true},
  });
  assert.equal(await composition.resolveAuthority("noor-session"),null);
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"noor-session",accessToken:"signed-proof",
  }),"authenticated");
  const actor=await composition.resolveActor("noor-session");
  assert.equal(actor?.actorAccountId,"account-one");
  assert.equal(actor?.authority.assuranceLevel,"aal2");
  assert.equal(actor?.authority.reauthenticated,false);
  composition.revokeSession("noor-session");
  assert.equal(await composition.resolveAuthority("noor-session"),null);
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"noor-session",accessToken:"signed-proof",
  }),"authenticated");
  composition.shutdown();
  assert.equal(await composition.resolveAuthority("noor-session"),null);
});
