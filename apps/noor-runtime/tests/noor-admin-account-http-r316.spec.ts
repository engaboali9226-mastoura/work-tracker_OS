import {test} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {once} from "node:events";
import {makeNoorAdminAccountsHttpHandlerR316} from "../src/noor-admin-account-http-r316.js";

test("admin HTTP endpoint rejects foreign/missing origin, cookie auth and missing bearer before lifecycle",async()=>{
 let called=0;
 const handler=makeNoorAdminAccountsHttpHandlerR316({
  expectedOrigin:"https://noor.example",
  operation:{async execute(){called++;return {status:200,body:{ok:true}};}},
 });
 const server=createServer((req,res)=>void handler(req,res));
 server.listen(0,"127.0.0.1");await once(server,"listening");
 const address=server.address();if(!address||typeof address==="string")throw Error("listen");
 const url="http://127.0.0.1:"+address.port+"/api/noor/admin/accounts/list";
 async function request(extra:Record<string,string>){
  return fetch(url,{method:"POST",headers:{
   "Content-Type":"application/json","Authorization":"Bearer protected-example-token",
   ...extra,
  },body:JSON.stringify({page:1})});
 }
 try{
  assert.equal((await request({Origin:"https://evil.example"})).status,403);
  assert.equal((await request({Origin:"https://noor.example",Cookie:"secret=value"})).status,403);
  assert.equal((await fetch(url,{method:"POST",body:"{}"})).status,403);
  assert.equal(called,0);
  const allowed=await request({Origin:"https://noor.example"});
  assert.equal(allowed.status,200);
  assert.deepEqual(await allowed.json(),{ok:true});
  assert.equal(called,1);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
