import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminSupabaseTotpProviderR271} from "../src/noor-admin-totp-provider-r271.js";

const factor="11111111-1111-4111-8111-111111111111";
const challenge="22222222-2222-4222-8222-222222222222";
test("server creates its own TOTP challenge and exchanges code under bound user access",async()=>{
  const paths:string[]=[];
  const request=async(url:URL|string|Request):Promise<Response>=>{
    paths.push(String(url));
    return Response.json(paths.length===1?{id:challenge}:{access_token:"verified-jwt"});
  };
  const provider=new NoorAdminSupabaseTotpProviderR271("https://sample.supabase.co",
    "sb_publishable_example",request as typeof fetch);
  assert.equal(await provider.verify({factorId:factor,code:"123456",accessToken:"bound-jwt"}),"verified-jwt");
  assert.equal(paths.length,2);
  assert.ok(paths[0]?.endsWith("/factors/"+factor+"/challenge"));
  assert.ok(paths[1]?.endsWith("/factors/"+factor+"/verify"));
});
test("invalid inputs and unauthorized challenge fail closed",async()=>{
  let count=0;
  const request=async():Promise<Response>=>{count++;return new Response(null,{status:403});};
  const provider=new NoorAdminSupabaseTotpProviderR271("https://sample.supabase.co",
    "sb_publishable_example",request as typeof fetch);
  assert.equal(await provider.verify({factorId:"bad",code:"123456",accessToken:"bound-jwt"}),null);
  assert.equal(count,0);
  assert.equal(await provider.verify({factorId:factor,code:"123456",accessToken:"bound-jwt"}),null);
  assert.equal(count,1);
});
