import assert from "node:assert/strict";
import test from "node:test";
import {createRouteAccessHttpServer} from "../src/route-access-http-server.js";

test("R271 password recovery route defaults to 404 without trusted server opt-in",async()=>{
  const server=createRouteAccessHttpServer({
    execute:async()=>({kind:"authentication-required"} as never),
  });
  await server.listen({host:"127.0.0.1",port:0});
  const address=server.address();
  if(!address || typeof address==="string")throw Error("LOOPBACK_UNAVAILABLE");
  try{
    const origin="http://127.0.0.1:"+address.port;
    const response=await fetch(origin+"/api/noor/admin/password-recovery",{
      method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},
      body:JSON.stringify({targetAuthUserId:"11111111-1111-4111-8111-111111111111"}),
    });
    assert.equal(response.status,404);
    assert.equal(response.headers.get("cache-control"),"no-store");
  }finally{await server.close();}
});
test("R271 recovery endpoint rejects missing session before invoking admin dependencies",async()=>{
  let calls=0;
  const origin="http://127.0.0.1";
  const server=createRouteAccessHttpServer({
    execute:async()=>({kind:"authentication-required"} as never),
  },{
    adminRecoveryR271:{
      expectedOrigin:origin,
      resolveAuthority:async()=>{calls++;return null;},
      resolveActorAccountId:async()=>{calls++;return null;},
      provider:{sendRecoveryEmailForUserId:async()=>{calls++;return true;}},
      audit:{record:async()=>{calls++;}},
    },
  });
  await server.listen({host:"127.0.0.1",port:0});
  const address=server.address();
  if(!address || typeof address==="string")throw Error("LOOPBACK_UNAVAILABLE");
  try{
    const response=await fetch("http://127.0.0.1:"+address.port+"/api/noor/admin/password-recovery",{
      method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},
      body:JSON.stringify({targetAuthUserId:"11111111-1111-4111-8111-111111111111"}),
    });
    assert.equal(response.status,401);
    assert.equal(calls,0);
  }finally{await server.close();}
});
