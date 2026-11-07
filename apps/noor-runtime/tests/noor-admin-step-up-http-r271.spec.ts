import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleNoorAdminStepUpR271} from "../src/noor-admin-step-up-http-r271.js";

const factor="33333333-3333-4333-8333-333333333333";
async function serve(run:(origin:string)=>Promise<void>){
  const events:string[]=[];let origin="";
  const server=createServer((request,response)=>{
    void handleNoorAdminStepUpR271(
      request,response,request.headers.cookie==="noor_session=valid"?"trusted-session":null,
      {expectedOrigin:origin,operation:{verify:async input=>{
        events.push(input.platformSessionId+":"+input.factorId+":"+input.code);return true;
      }}},
    );
  });
  server.listen(0,"127.0.0.1");
  await once(server,"listening");
  const addr=server.address();
  if(!addr || typeof addr==="string")throw Error("NO_LISTENER");
  origin="http://127.0.0.1:"+addr.port;
  try{await run(origin);}finally{server.close();await once(server,"close");}
  return events;
}
function post(origin:string,body:unknown,opts:{cookie?:boolean;origin?:string;path?:string}={}){
  return fetch(origin+(opts.path??"/api/noor/admin/step-up"),{
    method:"POST",
    headers:{Origin:opts.origin??origin,"Content-Type":"application/json",
      ...(opts.cookie?{Cookie:"noor_session=valid"}:{})},
    body:JSON.stringify(body),
  });
}
test("R271 TOTP step-up HTTP accepts only a trusted same-origin Noor session",async()=>{
  const events=await serve(async origin=>{
    const input={factorId:factor,code:"123456"};
    assert.equal((await post(origin,input)).status,401);
    assert.equal((await post(origin,input,{cookie:true,origin:"https://other.invalid"})).status,403);
    const allowed=await post(origin,input,{cookie:true});
    assert.equal(allowed.status,204);
    assert.equal(allowed.headers.get("cache-control"),"no-store");
  });
  assert.deepEqual(events,["trusted-session:"+factor+":123456"]);
});
test("R271 TOTP step-up refuses client-supplied identity, JWT and extra claims",async()=>{
  const events=await serve(async origin=>{
    for(const body of [
      {factorId:factor,code:"123456",accessToken:"client-assertion"},
      {factorId:factor,code:"123456",reauthenticated:true},
      {factorId:factor,code:"123456",authUserId:"user"},
      {factorId:"not-a-uuid",code:"123456"},
      {factorId:factor,code:"12345"},
    ])assert.equal((await post(origin,body,{cookie:true})).status,400);
    assert.equal((await post(origin,{factorId:factor,code:"123456"},{
      cookie:true,path:"/api/noor/admin/step-up?auth=1",
    })).status,404);
  });
  assert.deepEqual(events,[]);
});
