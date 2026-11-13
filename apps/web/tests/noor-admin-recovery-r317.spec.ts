import test from "node:test";
import assert from "node:assert/strict";
import {adminRecoveryRedirectR317,createNoorAdminRecoveryR317} from "../src/noor-admin-recovery-r317.js";
import type {NoorAccountSelfServiceR312} from "../src/noor-account-self-service-r312.js";

const config={supabaseUrl:"https://noor-example.supabase.co",supabasePublishableKey:"sb_publishable_example"};
test("R317 password recovery URL is exact-origin HTTPS and admin-scoped",()=>{
 assert.equal(adminRecoveryRedirectR317("https://noor-personal.onrender.com"),
  "https://noor-personal.onrender.com/admin/security?auth=recovery");
 assert.equal(adminRecoveryRedirectR317("http://localhost:5173"),
  "http://localhost:5173/admin/security?auth=recovery");
 for(const x of ["http://evil.example","https://noor.example/evil","https://user:pass@noor.example",
  "https://noor.example?next=https://evil.example","not-a-url"]){
  assert.throws(()=>adminRecoveryRedirectR317(x));
 }
});
test("R317 uses existing Supabase-backed account recovery, not identity creation",async()=>{
 let sent:{email:string;redirect:string}|undefined;let updated="";
 const service={
  async requestPasswordReset(email:string,redirect:string){sent={email,redirect};return "sent";},
  async completePasswordRecovery(password:string){updated=password;return "updated";},
  async registerPendingAccount(){throw Error("R317_MUST_NOT_CREATE_IDENTITY");},
  async requestEmailChange(){throw Error("R317_MUST_NOT_CHANGE_EMAIL");},
 } as NoorAccountSelfServiceR312;
 const setup=createNoorAdminRecoveryR317(config,service);
 assert.equal(await setup.send("admin@example.com","https://noor-personal.onrender.com"),"sent");
 assert.deepEqual(sent,{email:"admin@example.com",redirect:"https://noor-personal.onrender.com/admin/security?auth=recovery"});
 assert.equal(await setup.complete("correct horse battery staple"),"updated");
 assert.equal(updated,"correct horse battery staple");
 assert.equal(await setup.send("admin@example.com","http://attacker.example"),"unavailable");
});
test("R317 recovery never authorizes an administrator on invalid or absent recovery links",async()=>{
 const service={
  async requestPasswordReset(){return "invalid";},
  async completePasswordRecovery(){return "invalid";},
 } as unknown as NoorAccountSelfServiceR312;
 const setup=createNoorAdminRecoveryR317(config,service);
 assert.equal(await setup.send("none@example.com","https://noor-personal.onrender.com"),"unavailable");
 assert.equal(await setup.complete("password not verified"),"invalid");
});
