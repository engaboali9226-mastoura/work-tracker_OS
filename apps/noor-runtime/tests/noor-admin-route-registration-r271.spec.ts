import assert from "node:assert/strict";
import test from "node:test";
import {createRouteAccessHttpServer} from "../src/route-access-http-server.js";

test("R271 admin route stays unavailable unless trusted dependencies are explicitly mounted",async()=>{
  const server=createRouteAccessHttpServer({
    execute:async()=>({kind:"authentication-required"} as never),
  });
  await server.listen({host:"127.0.0.1",port:0});
  const address=server.address();
  if(!address || typeof address==="string") throw Error("LOOPBACK_UNAVAILABLE");
  try{
    const origin="http://127.0.0.1:"+address.port;
    const response=await fetch(origin+"/api/noor/admin/accounts",{
      method:"POST",headers:{Origin:origin},
    });
    assert.equal(response.status,404);
    assert.equal(response.headers.get("cache-control"),"no-store");
  }finally{
    await server.close();
  }
});
