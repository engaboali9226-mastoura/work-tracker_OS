import assert from "node:assert/strict";
import test from "node:test";
import {createPrivilegedTransportRuntime} from "../src/privileged-transport-runtime.js";
import type {PrivilegedTransportExecutor} from "../src/privileged-transport-runtime.js";
import type {RouteAccessHttpServerOptions} from "../src/route-access-http-server.js";

const origin="https://noor.example.test";
function fixture(recoveryOrigin:string|null){
  let passed:RouteAccessHttpServerOptions|undefined;
  let shutdowns=0;
  const recovery=recoveryOrigin===null?undefined:{
    expectedOrigin:recoveryOrigin,
    resolveActor:async()=>null,
    provider:{sendRecoveryEmailForUserId:async()=>{throw Error("not called");}},
    createAudit:()=>({record:async()=>{throw Error("not called");}}),
  };
  const executor:PrivilegedTransportExecutor={
    execute:async ({request})=>({kind:"authentication-required",appKey:request.appKey,pathname:request.pathname}),
    sessionEstablishment:{execute:async()=>{throw Error("not called");}},
    ...(recovery?{adminRecoveryR271:recovery}:{}),
  };
  const runtime=createPrivilegedTransportRuntime({
    host:{start:async()=>executor,shutdown:async()=>{shutdowns++;}},
    httpConfiguration:{host:"127.0.0.1",port:8787,publicOrigin:origin,secureCookie:true},
    createHttpServer:(_executor,options)=>{
      passed=options;
      return {listen:async()=>{},close:async()=>{},address:()=>null};
    },
  });
  return {runtime,options:()=>passed,shutdowns:()=>shutdowns,recovery};
}
test("R271 privileged transport does not mount recovery without explicit host opt-in",async()=>{
  const f=fixture(null);
  await f.runtime.start();
  assert.equal(f.options()?.adminRecoveryR271,undefined);
  await f.runtime.shutdown();
});
test("R271 privileged transport passes only origin-matched recovery dependencies",async()=>{
  const f=fixture(origin);
  await f.runtime.start();
  assert.equal(f.options()?.adminRecoveryR271,f.recovery);
  await f.runtime.shutdown();
});
test("R271 privileged transport fails startup closed on recovery origin mismatch",async()=>{
  const f=fixture("https://attacker.invalid");
  await assert.rejects(f.runtime.start());
  assert.equal(f.options(),undefined);
  assert.equal(f.shutdowns(),1);
});
