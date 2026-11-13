import assert from "node:assert/strict";
import test from "node:test";
import type { PublicSupabaseAccountClient } from "../src/public-supabase-authentication-client.js";
import { createNoorAccountSelfServiceR312, noorRecoveryRedirectR312 } from "../src/noor-account-self-service-r312.js";

test("password recovery redirect stays on the site's own origin", () => {
  assert.equal(noorRecoveryRedirectR312("https://noor-personal.onrender.com"),"https://noor-personal.onrender.com/?auth=recovery");
  assert.throws(()=>noorRecoveryRedirectR312("http://attacker.example"),/NOOR_UNSAFE/);
  assert.throws(()=>noorRecoveryRedirectR312("https://noor-personal.onrender.com.evil/path"),/NOOR_UNSAFE/);
});
test("public account flows carry only one-time provider auth and do not persist credentials", async()=>{
  let detectionFlags:boolean[]=[];
  let resetTo="";
  let signupTo="";
  let recoveryUser=true;
  const factory=(detectSessionInUrl:boolean)=>{
    detectionFlags.push(detectSessionInUrl);
    return {
      auth:{
        async resetPasswordForEmail(_email:string,opts:{redirectTo:string}){resetTo=opts.redirectTo;return {error:null};},
        async signUp(_values:{email:string;password:string;options:{emailRedirectTo:string}}){signupTo=_values.options.emailRedirectTo;return {error:null};},
        async signInWithPassword(_input:{email:string;password:string}){return {data:{user:{id:"verified"}},error:null};},
        async updateUser(_input:{email?:string;password?:string}){return {error:null};},
        async signOut(){return {error:null};},
        async getUser(){return {data:{user:recoveryUser?{id:"verified"}:null},error:null};},
      },
    } as unknown as PublicSupabaseAccountClient;
  };
  const service=createNoorAccountSelfServiceR312({supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"},factory);
  assert.equal(await service.requestPasswordReset("test@example.com","https://noor-personal.onrender.com/?auth=recovery"),"sent");
  assert.equal(resetTo,"https://noor-personal.onrender.com/?auth=recovery");
  assert.equal(await service.registerPendingAccount("new@example.com","secure-password","https://noor-personal.onrender.com/"),"sent");
  assert.equal(signupTo,"https://noor-personal.onrender.com/");
  assert.equal(await service.requestEmailChange("old@example.com","password","new@example.com"),"sent");
  assert.equal(await service.completePasswordRecovery("new-secure-password"),"updated");
  recoveryUser=false;
  assert.equal(await service.completePasswordRecovery("new-secure-password"),"invalid");
  assert.deepEqual(detectionFlags,[false,false,true,true]);
});
test("rejects invalid form values before calling provider",async()=>{
  const factory=()=>{throw Error("provider should not be called");};
  // Factory initialization happens once; a mock is intentionally supplied.
  let providerRequests=0;
  const service=createNoorAccountSelfServiceR312({supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"},()=>({
    auth:{
      async resetPasswordForEmail(){providerRequests++;return {error:null};},
      async signUp(){providerRequests++;return {error:null};},
    },
  } as unknown as PublicSupabaseAccountClient));
  assert.equal(await service.requestPasswordReset("bad", "https://example.com"),"invalid");
  assert.equal(await service.registerPendingAccount("a@example.com","short","https://example.com"),"invalid");
  assert.equal(await service.requestEmailChange("same@example.com","pass","same@example.com"),"invalid");
  assert.equal(await service.completePasswordRecovery("short"),"invalid");
  assert.equal(providerRequests,0);
  void factory;
});
