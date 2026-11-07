import assert from "node:assert/strict";
import test from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorAdminDirectoryR271} from "../src/noor-admin-directory-r271.js";

test("R271 account directory exposes only bounded identity and status fields",async()=>{
  let options:unknown;
  const client={
    auth:{admin:{listUsers:async(input:unknown)=>{
      options=input;
      return {error:null,data:{users:[{
        id:"auth-1",email:"one@example.org",banned_until:null,
        user_metadata:{secret:"never expose"},identities:[{provider:"email"}],
      }]}};
    }}},
  } as unknown as SupabaseClient;
  const accounts=await new NoorAdminDirectoryR271(client).listAccounts();
  assert.deepEqual(options,{page:1,perPage:100});
  assert.deepEqual(accounts,[{id:"auth-1",email:"one@example.org",enabled:true}]);
  assert.equal(JSON.stringify(accounts).includes("secret"),false);
});

test("R271 directory fails closed when Supabase is unavailable",async()=>{
  const client={
    auth:{admin:{listUsers:async()=>({data:null,error:{message:"offline"}})}},
  } as unknown as SupabaseClient;
  await assert.rejects(()=>new NoorAdminDirectoryR271(client).listAccounts(),
    /NOOR_ADMIN_DIRECTORY_UNAVAILABLE/);
});


test("R271 refuses to report a potentially truncated account directory",async()=>{
  const client={auth:{admin:{listUsers:async()=>({error:null,data:{users:
    Array.from({length:100},(_,i)=>({id:String(i),email:`u${i}@example.org`}))
  }})}}} as unknown as SupabaseClient;
  await assert.rejects(()=>new NoorAdminDirectoryR271(client).listAccounts(),
    /NOOR_ADMIN_DIRECTORY_PAGINATION_REQUIRED/);
});
