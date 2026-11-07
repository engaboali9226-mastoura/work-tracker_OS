import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createNoorAdminBrowserAuthR271} from "../src/noor-admin-browser-auth-r271.js";

const factor="33333333-3333-4333-8333-333333333333";
const challenge="22222222-2222-4222-8222-222222222222";

test("R271 browser admin login exchanges only a fresh verified AAL2 token",async()=>{
  const seen:string[]=[];
  const auth:{
    signInWithPassword:(input:{email:string;password:string})=>Promise<unknown>;
    mfa:{
      listFactors:()=>Promise<unknown>;
      challenge:(input:{factorId:string})=>Promise<unknown>;
      verify:(input:{factorId:string;challengeId:string;code:string})=>Promise<unknown>;
    };
  }={
    signInWithPassword:async input=>{
      assert.equal(input.email,"admin@example.test");
      assert.equal(input.password,"correct-value");
      return {data:{session:{access_token:"aal1-proof"}},error:null};
    },
    mfa:{
      listFactors:async()=>({data:{totp:[{id:factor,status:"verified",friendly_name:"TOTP"}]},error:null}),
      challenge:async input=>{
        assert.equal(input.factorId,factor);seen.push("challenge");return {data:{id:challenge},error:null};
      },
      verify:async input=>{
        assert.deepEqual(input,{factorId:factor,challengeId:challenge,code:"123456"});
        seen.push("verify");return {data:{access_token:"new-verified-aal2-proof"},error:null};
      },
    },
  };
  const exchange=async(path:string,body:unknown)=>{
    seen.push(path);
    if(path.endsWith("authenticate"))
      assert.deepEqual(body,{accessToken:"new-verified-aal2-proof"});
    else
      assert.deepEqual(body,{factorId:factor,code:"123456"});
  };
  const client=createNoorAdminBrowserAuthR271({auth} as unknown as SupabaseClient,exchange);
  const factors=await client.signIn("admin@example.test","correct-value");
  assert.deepEqual(factors,[{id:factor,label:"TOTP"}]);
  await client.authenticate(factor,"123456");
  await client.stepUp(factor,"123456");
  assert.deepEqual(seen,[
    "challenge","verify",
    "/api/noor/admin/authenticate",
    "/api/noor/admin/step-up",
  ]);
});

test("R271 browser refuses invalid factor and TOTP before making network exchange",async()=>{
  let calls=0;
  const client=createNoorAdminBrowserAuthR271({
    auth:{
      signInWithPassword:async()=>({data:{session:{access_token:"proof"}},error:null}),
      mfa:{listFactors:async()=>({data:{totp:[]},error:null})},
    },
  } as unknown as SupabaseClient,async()=>{calls++;});
  await client.signIn("admin@example.test","password");
  await assert.rejects(client.authenticate(factor,"12345"),/NOOR_ADMIN_MFA_INPUT_INVALID/);
  await assert.rejects(client.stepUp("forged", "123456"),/NOOR_ADMIN_STEP_UP_INPUT_INVALID/);
  assert.equal(calls,0);
});
