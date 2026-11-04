import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { assembleLabPrivateJournalR196 } from "../src/noor-private-journal-assembly-r196.js";
import { createPrivilegedTransportRuntime } from "../src/privileged-transport-runtime.js";
import type { PrivilegedTransportHost, RouteAccessHttpServerFactory } from "../src/privileged-transport-runtime.js";
import type { NoorLabPrivateJournalDependenciesR196 } from "../src/noor-private-journal-assembly-r196.js";
import type { RouteAccessHttpServerOptions } from "../src/route-access-http-server.js";
import type { PersonalControlOperation } from "../src/personal-control-operation.js";

const origin = "http://127.0.0.1:19496";
const trust = {
  async resolveAuthorizedJournalUser(sessionId: string | null) {
    return sessionId === "good-session"
      ? { kind: "ok" as const, userId: "user_196" }
      : { kind: "error" as const, status: 401 as const };
  },
  async resolveAuthorizedJournalPersonalDay(sessionId: string | null) {
    return sessionId === "good-session"
      ? { kind: "ok" as const, userId: "user_196", localDate: "2026-11-04" }
      : { kind: "error" as const, status: 401 as const };
  },
} satisfies Pick<PersonalControlOperation, "resolveAuthorizedJournalUser" | "resolveAuthorizedJournalPersonalDay">;
function deps(): NoorLabPrivateJournalDependenciesR196 {
  return {
    acknowledgement: "R196_ISOLATED_LOOPBACK_ONLY",
    pool: { async connect() { throw Error("SYNTHETIC_PG_OFFLINE"); } },
    keyRing: { activeVersion: 1, keys: new Map([[1, randomBytes(32)]]) },
  };
}

test("R196 fails closed on missing explicit scope, origin, owner resolver, pool or key", () => {
  const d = deps();
  assert.throws(() => assembleLabPrivateJournalR196(trust, { ...d, acknowledgement: "WRONG" as never }, origin));
  for (const bad of ["https://public.example.com", "http://127.0.0.1:8787", "http://localhost:19496", "http://127.0.0.1:19496/path", "http://127.0.0.1:1"]) {
    assert.throws(() => assembleLabPrivateJournalR196(trust, d, bad));
  }
  assert.throws(() => assembleLabPrivateJournalR196({} as never, d, origin));
  assert.throws(() => assembleLabPrivateJournalR196(trust, {...d, pool:{} as never}, origin));
  assert.throws(() => assembleLabPrivateJournalR196(trust, {...d, keyRing:{activeVersion:1,keys:new Map([[1,randomBytes(16)]])}}, origin));
  assert.throws(() => assembleLabPrivateJournalR196(trust, {...d, keyRing:{activeVersion:2,keys:new Map([[1,randomBytes(32)]])}}, origin));
});

test("R196 operates through verified session and encrypted PostgreSQL adapter", async () => {
  let dbCalls=0;
  const d={...deps(),pool:{async connect(){dbCalls++;throw Error("ISOLATED_DB_UNAVAILABLE");}}};
  const result=assembleLabPrivateJournalR196(trust,d,origin);
  assert.equal(result.expectedOrigin,origin);
  assert.deepEqual(await result.operation.list(null),{status:401});
  assert.deepEqual(await result.operation.list("wrong-session"),{status:401});
  assert.equal(dbCalls,0);
  assert.deepEqual(await result.operation.list("good-session"),{status:503});
  assert.equal(dbCalls,1);
});

function createFixture(config?:NoorLabPrivateJournalDependenciesR196, opts?: {missingIdentity?:boolean;host?:string;port?:number;publicOrigin?:string}) {
  let captured:RouteAccessHttpServerOptions|undefined;
  const events:string[]=[];
  const host:PrivilegedTransportHost={
    async start(){events.push("start");return {
      async execute(){return {kind:"authentication-required" as const,appKey:"noor-personal",pathname:"/personal"};},
      sessionEstablishment:{async execute(){throw Error("NOT_CALLED");}},
      ...(opts?.missingIdentity?{}:{personalControl:{...trust,readWorkspace:async()=>({status:401 as const}),executeCommand:async()=>({status:401 as const})}}),
    };},
    async shutdown(){events.push("shutdown");},
  };
  const factory:RouteAccessHttpServerFactory=(_executor,options)=>{
    captured=options;events.push("create");return {
      async listen(){events.push("listen");},async close(){events.push("close");},address(){return null;},
    };
  };
  const runtime=createPrivilegedTransportRuntime({
    host,
    httpConfiguration:{host:opts?.host??"127.0.0.1",port:opts?.port??19496,publicOrigin:opts?.publicOrigin??origin,secureCookie:false},
    createHttpServer:factory,
    ...(config?{labPrivateJournalR196:config}:{}),
  });
  return {runtime,events,options:()=>captured};
}

test("R196 runtime defaults closed and never assembles a private journal route",async()=>{
  const a=createFixture();await a.runtime.start();
  assert.equal(a.options()?.labPrivateJournalR193,undefined);
  await a.runtime.shutdown();
});

test("R196 explicit synthetic runtime passes the assembly to the existing sanctioned router",async()=>{
  const a=createFixture(deps());await a.runtime.start();
  assert.equal(a.options()?.labPrivateJournalR193?.expectedOrigin,origin);
  assert.ok(a.options()?.labPrivateJournalR193?.operation);
  await a.runtime.shutdown();
});

test("R196 runtime rejects production-looking host, privileged port, wrong origin and missing real identity",async()=>{
  for(const options of [
    {host:"0.0.0.0"},{port:8787,publicOrigin:"http://127.0.0.1:8787"},
    {publicOrigin:"https://real-noor.example.com"},{missingIdentity:true},
  ]){
    const f=createFixture(deps(),options);
    await assert.rejects(f.runtime.start());
    assert.equal(f.options(),undefined);
    assert.deepEqual(f.events,["start","shutdown"]);
  }
});
