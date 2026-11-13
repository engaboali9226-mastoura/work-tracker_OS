import {test} from "node:test";
import assert from "node:assert/strict";
import {createNoorAdminAccountManagementR316} from "../src/noor-admin-account-management-r316.js";

const actorId="8cb0aeb6-8e09-4b81-a4ce-6ecc355db309";
const sessionId="7d2b802a-6f0d-4862-925b-3b66cbe9e67e";
const userId="4ab92205-052e-4db1-a948-2cdca241de2f";
const requestId="619a1a90-14a3-4ccd-bcab-51cbc36c2ff8";
const issuer="https://example.supabase.co/auth/v1";
function fakeToken(aal="aal2"){const body={iss:issuer,aud:"authenticated",sub:actorId,aal,
 session_id:sessionId,exp:Math.floor(Date.now()/1000)+600};
 return "e30."+Buffer.from(JSON.stringify(body)).toString("base64url")+".signature";
}
function fakeClient(opts:{role?:boolean;io?:boolean;session?:boolean;sessionError?:boolean;protectedTarget?:boolean;profileEmail?:string;editError?:boolean;pendingSignup?:boolean;emailConfirmed?:boolean}={}){
 const calls:string[]=[];
 const link={account_id:"noor-account-test",subject:userId,user_id:userId};
 const builder=(table:string)=>{
  let kind="select";let targetRoleLookup=false;
  const b={
   select(_fields:string){kind="select";return b;}, in(_field:string,_values:unknown[]){return b;},
   eq(key:string,val:unknown){if(table==="noor_admin_accounts_r271"&&key==="auth_user_id"&&val===userId)targetRoleLookup=true;return b;},is(_key:string,_val:unknown){return b;},
   limit(_n:number){return b;},range(_a:number,_b:number){return b;},
   order(_x:string,_v:unknown){return b;},
   update(_v:unknown){kind="update";calls.push(table+":update");return b;},
   insert(_v:unknown){kind="insert";calls.push(table+":insert");return Promise.resolve({error:null,data:null});},
   delete(){kind="delete";calls.push(table+":delete");return b;},
   then(ok:(v:unknown)=>unknown,bad?:(e:unknown)=>unknown){
    const data=kind!=="select"?null:table==="noor_admin_accounts_r271"?
      (targetRoleLookup&&opts.protectedTarget?[{auth_user_id:userId,enabled:true,role:"admin"}]:
       opts.role&&!targetRoleLookup?[{auth_user_id:actorId,enabled:true,role:"super_admin"}]:[]):
      table==="noor_authentication_account_linkages"?(opts.io?[link]:[]):
      table==="noor_entitlement_grants"?[]:null;
    return Promise.resolve({error:null,data}).then(ok,bad);
   },
  };return b;
 };
 const client={
  auth:{
   getUser:async(_token:string)=>({error:null,data:{user:{id:actorId}}}),
   admin:{
    createUser:async(_opts:unknown)=>{calls.push("auth:create");return {error:null,data:{user:{id:userId}}};},
    deleteUser:async(_id:string,_soft?:boolean)=>{calls.push("auth:delete");return {error:null,data:{}};},
    getUserById:async(_id:string)=>({error:null,data:{user:{id:userId,email:opts.profileEmail??"guest@example.com",
      email_confirmed_at:opts.emailConfirmed===false?null:"2026-11-13T00:00:00Z",
      created_at:"2026-11-13T00:00:00Z",
      user_metadata:{name:"Test",tag:"retained",noor_registration_request:opts.pendingSignup??false}}}}),
    listUsers:async()=>({error:null,data:{users:opts.pendingSignup?[{
      id:userId,email:"guest@example.com",created_at:"2026-11-13T00:00:00Z",
      email_confirmed_at:opts.emailConfirmed===false?null:"2026-11-13T00:00:00Z",
      user_metadata:{name:"Test",noor_registration_request:true},
    }]:[]}}),
    updateUserById:async(_id:string,_changes:unknown)=>{calls.push("auth:update");return {error:opts.editError?{message:"failed"}:null,data:{user:{id:userId}}};},
   },
  },
  from:(name:string)=>{calls.push(name+":read");return builder(name);},
  rpc:async(name:string,params:unknown)=>{
   calls.push("rpc:"+name);
   if(name==="noor_admin_set_application_access_r320"){
    assert.deepEqual(params,{
     p_actor_user_id:actorId,p_target_user_id:userId,p_account_id:"noor-account-test",
     p_expected_issuer:issuer,p_request_id:requestId,p_personal:false,p_work:true,
    });
    return {data:opts.editError?null:{updated:true},error:opts.editError?{message:"failed"}:null};
   }
   assert.equal(name,"noor_admin_session_guard_r319");
   assert.deepEqual(params,{p_user_id:actorId,p_session_id:sessionId});
   return {data:opts.session!==false,error:opts.sessionError?{message:"database unavailable"}:null};
  },
 };
 return {client,calls};
}
function service(c:unknown,enabled=true){
 return createNoorAdminAccountManagementR316({
  client:c as Parameters<typeof createNoorAdminAccountManagementR316>[0]["client"],
  expectedIssuer:issuer,expectedAudience:"authenticated",isRuntimeRunning:()=>true,enabled,
 });
}
test("disabled by default denies before consulting provider or database",async()=>{
 const {client,calls}=fakeClient({role:true});
 assert.equal((await service(client,false).execute("list",fakeToken(),{page:1})).status,404);
 assert.deepEqual(calls,[]);
});
test("no token, bad assurance and unverifiable token deny without reading role",async()=>{
 const {client,calls}=fakeClient({role:true});
 const s=service(client);
 assert.equal((await s.execute("list",null,{page:1})).status,401);
 assert.equal((await s.execute("list",fakeToken("aal1"),{page:1})).status,403);
 assert.equal((await s.execute("list","bad-token",{page:1})).status,401);
 assert.deepEqual(calls,[]);
});
test("verified MFA without server super_admin remains forbidden",async()=>{
 const {client,calls}=fakeClient({role:false});
 assert.equal((await service(client).execute("list",fakeToken(),{page:1})).status,403);
 assert.ok(!calls.some(s=>s.startsWith("noor_authentication_account_linkages")));
});
test("super_admin may list only linked accounts",async()=>{
 const {client}=fakeClient({role:true,io:true});
 const result=await service(client).execute("list",fakeToken(),{page:1});
 assert.equal(result.status,200);
 assert.equal((result.body as {accounts:unknown[]}).accounts.length,1);
});
test("creation inserts audit, provider identity, Noor linkage and entitlement",async()=>{
 const {client,calls}=fakeClient({role:true});
 const result=await service(client).execute("create",fakeToken(),{
  requestId,name:"New user",email:"guest@example.com",password:"example-secure-password-123",
  applications:["noor-personal","noor-work"],
 });
 assert.equal(result.status,201);
 for(const part of ["noor_admin_audit_r271:insert","auth:create","noor_authentication_account_linkages:insert","noor_entitlement_grants:insert"])
  assert.ok(calls.includes(part),part);
});
test("deletion requires email and exact confirmation before revoking anything",async()=>{
 const {client,calls}=fakeClient({role:true,io:true});
 const s=service(client);
 const invalid=await s.execute("delete",fakeToken(),{requestId,userId,confirmEmail:"guest@example.com",confirmation:"YES"});
 assert.equal(invalid.status,400);
 assert.ok(!calls.some(x=>x.includes(":update")||x==="auth:delete"));
});
test("confirmed delete revokes sessions and grants, then soft-deletes Auth",async()=>{
 const {client,calls}=fakeClient({role:true,io:true});
 const result=await service(client).execute("delete",fakeToken(),{
  requestId,userId,confirmEmail:"guest@example.com",confirmation:"DELETE",
 });
 assert.equal(result.status,200);
 const iSession=calls.indexOf("noor_sessions:update");
 const iGrants=calls.indexOf("noor_entitlement_grants:update");
 const iAuth=calls.indexOf("auth:delete");
 assert.ok(iSession>=0&&iSession<iGrants&&iGrants<iAuth);
});

test("R319 rejects a revoked Supabase Auth session even if JWT and role otherwise verify",async()=>{
 const {client,calls}=fakeClient({role:true,session:false,io:true});
 const result=await service(client).execute("list",fakeToken(),{page:1});
 assert.equal(result.status,403);
 assert.ok(calls.includes("rpc:noor_admin_session_guard_r319"));
 assert.ok(!calls.includes("noor_authentication_account_linkages:read"));
});
test("R319 fails closed on temporary database errors verifying an active AAL2 session",async()=>{
 const {client,calls}=fakeClient({role:true,sessionError:true,io:true});
 assert.equal((await service(client).execute("list",fakeToken(),{page:1})).status,503);
 assert.ok(!calls.includes("noor_authentication_account_linkages:read"));
});

test("R320 rename updates metadata without creating/deleting accounts",async()=>{
 const {client,calls}=fakeClient({role:true,io:true});
 const result=await service(client).execute("rename",fakeToken(),{
  requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",name:"New full name",
 });
 assert.equal(result.status,200);
 assert.equal((result.body as {name:string}).name,"New full name");
 assert.ok(calls.includes("auth:update"));
 assert.equal(calls.includes("auth:delete"),false);
 assert.equal(calls.includes("auth:create"),false);
});
test("R320 access enables exactly the requested app through audited atomic RPC",async()=>{
 const {client,calls}=fakeClient({role:true,io:true});
 const result=await service(client).execute("access",fakeToken(),{
  requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",
  applications:["noor-work"],
 });
 assert.equal(result.status,200);
 assert.ok(calls.includes("rpc:noor_admin_set_application_access_r320"));
 assert.equal(calls.includes("auth:update"),false);
});
test("R320 rejects editing protected administrators and mismatched accounts",async()=>{
 const protectedClient=fakeClient({role:true,io:true,protectedTarget:true});
 const p={requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",name:"Test updated"};
 assert.equal((await service(protectedClient.client).execute("rename",fakeToken(),p)).status,403);
 assert.equal(protectedClient.calls.includes("auth:update"),false);
 const {client}=fakeClient({role:true,io:true});
 assert.equal((await service(client).execute("rename",fakeToken(),{...p,accountId:"wrong"})).status,404);
 assert.equal((await service(client).execute("rename",fakeToken(),{...p,confirmEmail:"other@example.com"})).status,409);
});
test("R320 fails closed on malformed application lists, duplicate scope or stale tokens",async()=>{
 const {client,calls}=fakeClient({role:true,io:true});
 for(const applications of [["noor-work","noor-work"],["unknown"],[1],null]){
  assert.equal((await service(client).execute("access",fakeToken(),{
   requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",applications,
  })).status,400);
 }
 assert.ok(!calls.includes("rpc:noor_admin_set_application_access_r320"));
 assert.equal((await service(client).execute("rename",fakeToken("aal1"),{
  requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",name:"Safe name",
 })).status,403);
});
test("R320 marks provider-side rename failure and RPC access failure unavailable without changing admin status",async()=>{
 const {client}=fakeClient({role:true,io:true,editError:true});
 const rename=await service(client).execute("rename",fakeToken(),{
  requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",name:"New name",
 });
 assert.equal(rename.status,503);
 const access=await service(client).execute("access",fakeToken(),{
  requestId,userId,accountId:"noor-account-test",confirmEmail:"guest@example.com",applications:["noor-work"],
 });
 assert.equal(access.status,503);
});

test("R321 admin sees only self-registered confirmed candidates and can approve explicitly",async()=>{
 const {client,calls}=fakeClient({role:true,pendingSignup:true});
 const s=service(client);
 const pending=await s.execute("pending",fakeToken(),{page:1});
 assert.equal(pending.status,200);
 assert.equal((pending.body as {accounts:unknown[]}).accounts.length,1);
 const approved=await s.execute("approve",fakeToken(),{
  requestId,userId,confirmEmail:"guest@example.com",applications:["noor-personal"],
 });
 assert.equal(approved.status,201);
 assert.ok(calls.includes("noor_authentication_account_linkages:insert"));
 assert.ok(calls.includes("noor_entitlement_grants:insert"));
 assert.ok(calls.includes("noor_admin_audit_r271:insert"));
 assert.equal(calls.includes("auth:create"),false);
 assert.equal(calls.includes("auth:delete"),false);
});
test("R321 unconfirmed and unrequested identities never receive app approvals",async()=>{
 for(const opts of [
  {role:true,pendingSignup:false,emailConfirmed:true},
  {role:true,pendingSignup:true,emailConfirmed:false},
 ]){
  const {client,calls}=fakeClient(opts);
  const result=await service(client).execute("approve",fakeToken(),{
   requestId,userId,confirmEmail:"guest@example.com",applications:["noor-personal"],
  });
  assert.equal(result.status,403);
  assert.equal(calls.includes("noor_authentication_account_linkages:insert"),false);
 }
});
test("R321 pending approval requires AAL2, exact email, and supported app scopes",async()=>{
 const {client,calls}=fakeClient({role:true,pendingSignup:true});
 const s=service(client);
 const payload={requestId,userId,confirmEmail:"guest@example.com",applications:["noor-personal"]};
 assert.equal((await s.execute("approve",fakeToken("aal1"),payload)).status,403);
 assert.equal((await s.execute("approve",fakeToken(),{...payload,confirmEmail:"other@example.com"})).status,409);
 assert.equal((await s.execute("approve",fakeToken(),{...payload,applications:["other"]})).status,400);
 assert.ok(!calls.includes("noor_authentication_account_linkages:insert"));
});
