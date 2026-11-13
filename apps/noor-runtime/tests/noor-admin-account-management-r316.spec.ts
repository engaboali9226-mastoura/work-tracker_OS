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
function fakeClient(opts:{role?:boolean;io?:boolean}={}){
 const calls:string[]=[];
 const link={account_id:"noor-account-test",subject:userId,user_id:userId};
 const builder=(table:string)=>{
  let kind="select";
  const b={
   select(_fields:string){kind="select";return b;},
   eq(_key:string,_val:unknown){return b;},is(_key:string,_val:unknown){return b;},
   limit(_n:number){return b;},range(_a:number,_b:number){return b;},
   order(_x:string,_v:unknown){return b;},
   update(_v:unknown){kind="update";calls.push(table+":update");return b;},
   insert(_v:unknown){kind="insert";calls.push(table+":insert");return Promise.resolve({error:null,data:null});},
   delete(){kind="delete";calls.push(table+":delete");return b;},
   then(ok:(v:unknown)=>unknown,bad?:(e:unknown)=>unknown){
    const data=kind!=="select"?null:table==="noor_admin_accounts_r271"?
      (opts.role?[{auth_user_id:actorId,enabled:true,role:"super_admin"}]:[]):
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
    getUserById:async(_id:string)=>({error:null,data:{user:{id:userId,email:"guest@example.com",created_at:"2026-11-13T00:00:00Z",user_metadata:{name:"Test"}}}}),
   },
  },
  from:(name:string)=>{calls.push(name+":read");return builder(name);},
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
