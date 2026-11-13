import assert from "node:assert/strict";
import test from "node:test";
import type {PublicSupabaseAccountClient} from "../src/public-supabase-authentication-client.js";
import {createNoorAdminMfaSetupR315} from "../src/noor-admin-mfa-r315.js";

const config={supabaseUrl:"https://noor-example.supabase.co",supabasePublishableKey:"sb_publishable_example"};
const fixture=(hasVerifiedFactor:boolean)=>{
 let methods:string[]=[];let assured=false;let signed=false;
 const client={
  auth:{
   async signInWithPassword(){methods.push("signIn");signed=true;return {data:{user:{id:"owner"},session:{access_token:"token"}},error:null};},
   async signOut(){methods.push("signOut");signed=false;return {error:null};},
   async getSession(){methods.push("getSession");return {data:{session:{access_token:"token"}},error:null};},
   mfa:{
    async listFactors(){methods.push("listFactors");return {data:{totp:hasVerifiedFactor?[{id:"factor",status:"verified"}]:[],phone:[]},error:null};},
    async enroll(){methods.push("enroll");return {data:{id:"newfactor",totp:{qr_code:"data:image/svg+xml;utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"100\" height=\"100\"/></svg>",secret:"MFRGGZDFMZTWQ2LK"}},error:null};},
    async challengeAndVerify({factorId,code}:{factorId:string;code:string}){methods.push("verify:"+factorId);if(code==="123456")assured=true;return {error:assured?null:{message:"invalid"}};},
    async getAuthenticatorAssuranceLevel(){methods.push("getAal");return {data:{currentLevel:assured?"aal2":"aal1"},error:null};},
   },
  },
 } as unknown as PublicSupabaseAccountClient;
 const service=createNoorAdminMfaSetupR315(config,client);
 return {service,methods,isSigned:()=>signed};
};
test("R315 TOTP enrollment requires login then six-digit verification and returns only AAL2 success",async()=>{
 const f=fixture(false);
 assert.equal(await f.service.signIn("wrong-email","password"),"invalid");
 assert.deepEqual(f.methods,[]);
 assert.equal(await f.service.signIn("admin@example.com","password"),"enroll-needed");
 const enrolled=await f.service.enroll();
 assert.equal(enrolled?.factorId,"newfactor");
 assert.equal(enrolled?.secret,"MFRGGZDFMZTWQ2LK");
 assert.ok(enrolled?.qrSvg.startsWith("data:image/svg+xml;utf-8,"));
 assert.equal(await f.service.verify("123"),"invalid");
 assert.equal(await f.service.verify("123456"),"aal2");
 assert.deepEqual(Object.keys(f.service).sort(),["accessToken","enroll","signIn","signOut","verify"]);
 assert.equal(await f.service.accessToken(),"token");
 await f.service.signOut();
 assert.equal(f.isSigned(),false);
});
test("R315 verified existing factor challenges and does not enroll again",async()=>{
 const f=fixture(true);
 assert.equal(await f.service.signIn("admin@example.com","password"),"challenge-needed");
 assert.equal(await f.service.enroll(),null);
 assert.equal(await f.service.verify("000000"),"invalid");
 assert.equal(await f.service.verify("123456"),"aal2");
 assert.equal(f.methods.includes("enroll"),false);
});
test("R315 does not include privileged admin action surface",()=>{
 const f=fixture(false);
 const joined=Object.keys(f.service).join(":");
 for(const forbidden of ["createUser","deleteUser","listUsers","grantRole","admin","service_role"])assert.equal(joined.includes(forbidden),false);
});
