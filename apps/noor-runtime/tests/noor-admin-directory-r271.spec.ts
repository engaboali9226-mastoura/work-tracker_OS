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


test("R271 paginates complete account directory without truncation",async()=>{
  const pages:number[]=[];
  const client={auth:{admin:{listUsers:async({page}:{page:number})=>{
    pages.push(page);
    return {error:null,data:{users:page===1?
      Array.from({length:100},(_,i)=>({id:String(i),email:`u${i}@example.org`}))
      :[{id:"100",email:"u100@example.org"}]}};
  }}}} as unknown as SupabaseClient;
  const accounts=await new NoorAdminDirectoryR271(client).listAccounts();
  assert.equal(accounts.length,101);
  assert.deepEqual(pages,[1,2]);
});

test("R271 rejects unbounded or repeated account pages",async()=>{
  const client={auth:{admin:{listUsers:async()=>({error:null,data:{users:
    Array.from({length:100},(_,i)=>({id:String(i),email:`u${i}@example.org`}))
  }})}}} as unknown as SupabaseClient;
  await assert.rejects(()=>new NoorAdminDirectoryR271(client).listAccounts(),
    /NOOR_ADMIN_DIRECTORY_DUPLICATE/);
});


test("R271 interprets Supabase unbanned sentinel and future bans",async()=>{
  const client={auth:{admin:{listUsers:async()=>({error:null,data:{users:[
    {id:"active",email:"a@example.org",banned_until:"none"},
    {id:"banned",email:"b@example.org",banned_until:"2099-01-01T00:00:00Z"},
    {id:"invalid",email:"c@example.org",banned_until:"invalid"},
  ]}})}}} as unknown as SupabaseClient;
  const accounts=await new NoorAdminDirectoryR271(client).listAccounts();
  assert.deepEqual(accounts.map(a=>a.enabled),[true,false,false]);
});
