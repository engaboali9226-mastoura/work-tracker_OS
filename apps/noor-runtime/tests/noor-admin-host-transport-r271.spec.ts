import assert from "node:assert/strict";
import test from "node:test";
import {createPrivilegedTransportRuntime} from "../src/privileged-transport-runtime.js";
import type {PrivilegedTransportExecutor} from "../src/privileged-transport-runtime.js";
import type {NoorAdminSessionAuthenticationR271} from "../src/noor-admin-session-authentication-r271.js";
import type {RouteAccessHttpServerOptions} from "../src/route-access-http-server.js";

const origin="https://noor.example.test";
const operation={authenticate:async()=> "denied" as const} as NoorAdminSessionAuthenticationR271;
function runtime(executor:PrivilegedTransportExecutor){
  let options:RouteAccessHttpServerOptions|undefined;
  let shutdowns=0;
  const app=createPrivilegedTransportRuntime({
    host:{start:async()=>executor,shutdown:async()=>{shutdowns++;}},
    httpConfiguration:{host:"127.0.0.1",port:8787,publicOrigin:origin,secureCookie:true},
    createHttpServer:(_executor,value)=>{
      options=value;
      return {listen:async()=>{},close:async()=>{},address:()=>null};
    },
  });
  return {app,options:()=>options,shutdowns:()=>shutdowns};
}
const base:PrivilegedTransportExecutor={
  execute:async ({request})=>({kind:"authentication-required",appKey:request.appKey,pathname:request.pathname}),
  sessionEstablishment:{execute:async()=>{throw Error("not called");}},
};
test("R271 host-to-transport passes trusted admin operation with canonical origin",async()=>{
  const value=runtime({...base,adminAuthenticationOperationR271:operation});
  await value.app.start();
  assert.equal(value.options()?.adminAuthenticationR271?.operation,operation);
  assert.equal(value.options()?.adminAuthenticationR271?.expectedOrigin,origin);
  await value.app.shutdown();
});
test("R271 admin authentication remains unmounted without host injection",async()=>{
  const value=runtime(base);
  await value.app.start();
  assert.equal(value.options()?.adminAuthenticationR271,undefined);
  await value.app.shutdown();
});
test("R271 rejects ambiguous host and HTTP admin authentication sources",async()=>{
  const value=runtime({...base,adminAuthenticationOperationR271:operation,
    adminAuthenticationR271:{expectedOrigin:origin,operation}});
  await assert.rejects(value.app.start());
  assert.equal(value.options(),undefined);
  assert.equal(value.shutdowns(),1);
});
