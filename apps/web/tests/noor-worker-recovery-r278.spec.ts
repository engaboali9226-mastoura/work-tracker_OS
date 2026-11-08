import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import test from "node:test";

const source=readFileSync(new URL("../public/noor-service-worker.js",import.meta.url),"utf8");

function makeWorker(fetchImpl: (_request:unknown,options:{signal:AbortSignal})=>Promise<Response>){
 const handlers=new Map<string,(event:any)=>void>();
 const timers=new Map<number,{callback:()=>void;delay:number}>();
 let nextTimer=0;
 const context={
  self:{location:{origin:"https://noor.example"},addEventListener:(event:string,cb:(event:any)=>void)=>handlers.set(event,cb),skipWaiting:()=>{}},
  URL,Response,AbortController,
  fetch:fetchImpl,
  setTimeout:(callback:()=>void,delay:number)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id;},
  clearTimeout:(id:number)=>timers.delete(id)
 };
 runInNewContext(source,context);
 const handler=handlers.get("fetch");
 assert.ok(handler);
 return {handler,timers};
}

test("R278: a stalled navigation has a 12-second abort and shows a stateless retry page",async()=>{
 const {handler,timers}=makeWorker((_request,{signal})=>new Promise((_resolve,reject)=>{
  signal.addEventListener("abort",()=>reject(new Error("synthetic timeout")),{once:true});
 }));
 let captured:Promise<Response>|undefined;
 handler({
  request:{url:"https://noor.example/",method:"GET",mode:"navigate",signal:new AbortController().signal},
  respondWith:(p:Promise<Response>)=>{captured=p}
 });
 assert.ok(captured);
 const timeout=[...timers.values()].find(item=>item.delay===12000);
 assert.ok(timeout);
 timeout.callback();
 const response=await captured;
 assert.equal(response.status,503);
 assert.equal(response.headers.get("cache-control"),"no-store");
 const html=await response.text();
 assert.match(html,/ستفتح تلقائيًا/u);
 assert.match(html,/window\.location\.reload\(\)/u);
 assert.match(html,/visibilitychange/u);
 assert.match(html,/credentials:"omit"/u);
 assert.doesNotMatch(source,/\bcaches\.(?:open|match|put)\b|indexedDB\.open|localStorage|sessionStorage/u);
});

test("R278: successful navigation is never replaced by the recovery page",async()=>{
 const {handler}=makeWorker(async()=>new Response("NOOR synthetic shell",{status:200}));
 let captured:Promise<Response>|undefined;
 handler({
  request:{url:"https://noor.example/",method:"GET",mode:"navigate",signal:new AbortController().signal},
  respondWith:(p:Promise<Response>)=>{captured=p}
 });
 assert.ok(captured);
 const response=await captured;
 assert.equal(response.status,200);
 assert.equal(await response.text(),"NOOR synthetic shell");
});

test("R278: never intercept API, health, readiness, cross-origin, or non-navigation requests",()=>{
 const {handler}=makeWorker(async()=>new Response("fixture"));
 for(const route of ["/api/noor/session","/api/noor/admin/accounts","/auth/callback","/healthz","/readyz"]){
  let intercepted=false;
  handler({request:{url:"https://noor.example"+route,method:"GET",mode:"navigate"},respondWith:()=>{intercepted=true}});
  assert.equal(intercepted,false,route);
 }
 let intercepted=false;
 handler({request:{url:"https://external.example/",method:"GET",mode:"navigate"},respondWith:()=>{intercepted=true}});
 handler({request:{url:"https://noor.example/",method:"GET",mode:"cors"},respondWith:()=>{intercepted=true}});
 assert.equal(intercepted,false);
});
