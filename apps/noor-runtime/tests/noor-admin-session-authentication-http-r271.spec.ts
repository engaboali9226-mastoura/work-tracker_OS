import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleNoorAdminSessionAuthenticationR271} from "../src/noor-admin-session-authentication-http-r271.js";
import type {NoorAdminSessionAuthenticationR271} from "../src/noor-admin-session-authentication-r271.js";

async function serve(callback:(origin:string)=>Promise<void>){
  const events:string[]=[];let origin="";
  const server=createServer((request,response)=>{
    void handleNoorAdminSessionAuthenticationR271(
      request,response,request.headers.cookie==="noor_session=valid"?"valid":null,
      {expectedOrigin:origin,operation:{
        authenticate:async input=>{events.push(input.platformSessionId+":"+input.accessToken);return "authenticated";},
      } as NoorAdminSessionAuthenticationR271},
    );
  });
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const address=server.address();
  if(!address || typeof address==="string")throw Error("NO_LISTENER");
  origin="http://127.0.0.1:"+address.port;
  try{await callback(origin);}finally{server.close();await once(server,"close");}
  return events;
}
function exchange(origin:string,options:{cookie?:boolean;requestOrigin?:string;body?:unknown}={}){
  return fetch(origin+"/api/noor/admin/authenticate",{
    method:"POST",
    headers:{Origin:options.requestOrigin??origin,"Content-Type":"application/json",
      ...(options.cookie?{Cookie:"noor_session=valid"}:{})},
    body:JSON.stringify(options.body??{accessToken:"verified-proof"}),
  });
}
test("R271 MFA exchange rejects anonymous, cross-origin and unrecognized payload",async()=>{
  const events=await serve(async origin=>{
    assert.equal((await exchange(origin)).status,401);
    assert.equal((await exchange(origin,{cookie:true,requestOrigin:"https://attacker.invalid"})).status,403);
    assert.equal((await exchange(origin,{cookie:true,body:{accessToken:"token",role:"super_admin"}})).status,400);
  });
  assert.deepEqual(events,[]);
});
test("R271 MFA exchange passes only cookie session and access token to trusted operation",async()=>{
  const events=await serve(async origin=>{
    const response=await exchange(origin,{cookie:true});
    assert.equal(response.status,204);
    assert.equal(response.headers.get("cache-control"),"no-store");
  });
  assert.deepEqual(events,["valid:verified-proof"]);
});
