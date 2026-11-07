import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleNoorLogoutR269} from "../src/noor-session-logout-r269.js";

async function withServer(
 callback:(origin:string)=>Promise<void>,
 revoke:(input:{sessionId:string})=>Promise<void>,
){
 let origin="";
 const server=createServer((req,res)=>{
  const sessionId=req.headers.cookie?.includes("noor_session=test-r269")?"test-r269":null;
  void handleNoorLogoutR269(req,res,sessionId,{
   expectedOrigin:origin,secureCookie:true,revokeSession:{execute:revoke},
  }).catch(()=>{if(!res.headersSent){res.writeHead(500);res.end();}});
 });
 server.listen(0,"127.0.0.1");
 await once(server,"listening");
 const address=server.address();
 if(!address||typeof address==="string")throw Error("LOOPBACK_UNAVAILABLE");
 origin="http://127.0.0.1:"+address.port;
 try{await callback(origin);}finally{server.close();await once(server,"close");}
}
test("R269 logout revokes HTTP-only server session and clears the exact cookie",async()=>{
 const revoked:string[]=[];
 await withServer(async origin=>{
  const response=await fetch(origin+"/api/noor/session/logout",{
   method:"POST",headers:{Origin:origin,Cookie:"noor_session=test-r269"},
  });
  assert.equal(response.status,204);
  assert.deepEqual(revoked,["test-r269"]);
  const cookie=response.headers.get("set-cookie")??"";
  assert.match(cookie,/noor_session=;/);
  assert.match(cookie,/HttpOnly/);
  assert.match(cookie,/SameSite=Strict/);
  assert.match(cookie,/Max-Age=0/);
  assert.match(cookie,/Secure/);
 },async({sessionId})=>{revoked.push(sessionId);});
});
test("R269 logout rejects cross-origin requests without revoking or clearing cookies",async()=>{
 let calls=0;
 await withServer(async origin=>{
  const response=await fetch(origin+"/api/noor/session/logout",{
   method:"POST",headers:{Origin:"https://attacker.example",Cookie:"noor_session=test-r269"},
  });
  assert.equal(response.status,403);
  assert.equal(calls,0);
  assert.equal(response.headers.get("set-cookie"),null);
 },async()=>{calls++;});
});
test("R269 provider revocation failures cannot claim logout success",async()=>{
 await withServer(async origin=>{
  const response=await fetch(origin+"/api/noor/session/logout",{
   method:"POST",headers:{Origin:origin,Cookie:"noor_session=test-r269"},
  });
  assert.equal(response.status,503);
  assert.equal(response.headers.get("set-cookie"),null);
 },async()=>{throw Error("repository unavailable");});
});
