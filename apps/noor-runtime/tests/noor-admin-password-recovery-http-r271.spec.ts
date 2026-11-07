import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleNoorAdminPasswordRecoveryR271} from "../src/noor-admin-password-recovery-http-r271.js";

const target="11111111-1111-4111-8111-111111111111";
const authority={
  sessionActive:true,accountActive:true,verifiedAdminGrant:true,
  assuranceLevel:"aal2" as const,reauthenticated:true,role:"super_admin" as const,
};
async function serve(
  scenario:(origin:string)=>Promise<void>,
  permission:typeof authority|null=authority,
){
  let origin="";const events:string[]=[];
  const server=createServer((request,response)=>{
    void handleNoorAdminPasswordRecoveryR271(request,response,
      request.headers.cookie==="noor_session=valid"?"valid":null,{
        expectedOrigin:origin,
        resolveActor:async()=>{events.push("actor-resolved");return permission?{authority:permission,actorAccountId:"actor"}:null;},
        provider:{sendRecoveryEmailForUserId:async id=>{events.push("deliver:"+id);return true;}},
        createAudit:()=>({record:async event=>{events.push("audit:"+event.outcome);}}),
      });
  });
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const address=server.address();
  if(!address || typeof address==="string")throw Error("NO_LISTENER");
  origin="http://127.0.0.1:"+address.port;
  try{await scenario(origin);}finally{server.close();await once(server,"close");}
  return events;
}
function request(origin:string,body:unknown,options:{cookie?:boolean;requestOrigin?:string}={}){
  return fetch(origin+"/api/noor/admin/password-recovery",{
    method:"POST",
    headers:{"Content-Type":"application/json",Origin:options.requestOrigin??origin,
      ...(options.cookie?{Cookie:"noor_session=valid"}:{})},
    body:JSON.stringify(body),
  });
}
test("R271 password recovery HTTP denies anonymous requests without dependencies",async()=>{
  const events=await serve(async origin=>{
    assert.equal((await request(origin,{targetAuthUserId:target})).status,401);
  });
  assert.deepEqual(events,[]);
});
test("R271 password recovery HTTP requires recent MFA step-up",async()=>{
  const events=await serve(async origin=>{
    assert.equal((await request(origin,{targetAuthUserId:target},{cookie:true})).status,403);
  },{...authority,reauthenticated:false});
  assert.deepEqual(events,["actor-resolved"]);
});
test("R271 password recovery HTTP rejects forged origin and extra fields",async()=>{
  const events=await serve(async origin=>{
    assert.equal((await request(origin,{targetAuthUserId:target},{cookie:true,requestOrigin:"https://attacker.invalid"})).status,403);
    assert.equal((await request(origin,{targetAuthUserId:target,role:"super_admin"},{cookie:true})).status,400);
  });
  assert.deepEqual(events,["actor-resolved"]);
});
test("R271 password recovery HTTP authorizes and audits before delivery",async()=>{
  const events=await serve(async origin=>{
    const response=await request(origin,{targetAuthUserId:target},{cookie:true});
    assert.equal(response.status,202);
    assert.equal(response.headers.get("cache-control"),"no-store");
  });
  assert.deepEqual(events,["actor-resolved","audit:initiated","deliver:"+target,"audit:requested"]);
});

test("R271 recovery never sends email or audits when trusted actor is missing",async()=>{
  const events=await serve(async origin=>{
    assert.equal((await request(origin,{targetAuthUserId:target},{cookie:true})).status,403);
  },null);
  assert.deepEqual(events,["actor-resolved"]);
});
