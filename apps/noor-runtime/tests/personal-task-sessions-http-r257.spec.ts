import assert from "node:assert/strict";
import test from "node:test";
import {UserId} from "@worktracker/core";
import {InMemoryFoundationStore,SequenceIdGenerator} from "@noor/personal";
import {PersonalControlOperation} from "../src/personal-control-operation.js";
import {
  createRouteAccessHttpServer,PERSONAL_COMMAND_HTTP_PATH,PERSONAL_WORKSPACE_HTTP_PATH,
} from "../src/route-access-http-server.js";
import type {RouteAccessEvidenceExecutor} from "../src/route-access-http-server.js";

// No live credentials, database, production listeners, or actual browser sessions.
const now="2026-11-06T12:00:00.000Z",date="2026-11-06";
const people={a:"noor-test-owner-a",b:"noor-test-owner-b"} as const;
const sessionUsers=new Map([["cookie-mac",people.a],["cookie-phone",people.a],["cookie-other",people.b]]);
const plan={distribution:"custom" as const,sessions:[
 {id:"chapter-one",title:"الفصل الأول",objective:"صفحات 1-10",target:10,rangeStart:1,rangeEnd:10},
 {id:"chapter-two",title:"الفصل الثاني",objective:"صفحات 11-20",target:10,rangeStart:11,rangeEnd:20},
]};
function storeFor(userId:string,code:string){
 const dayId="day-"+code;
 const day={id:dayId,userId,boundary:{
  key:"day-key-"+code,localDate:date,
  startAt:"2026-11-05T21:00:00.000Z",endAt:"2026-11-06T21:00:00.000Z",
  timeZone:"Asia/Riyadh",
 },state:"Open",version:1,createdAt:now,updatedAt:now} as const;
 const definition={id:"book-"+code,userId,kind:"Task",revisionId:"definition-rev-"+code,
  title:"قراءة كتاب تجريبي",category:"التعلم",state:"Active",
  schedule:{kind:"Daily"},effectiveFromDate:date,
  importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{},
  measurement:{target:20,unit:"صفحة"}} as const;
 const execution={id:"execution-"+code,userId,personalDayId:dayId,
  definitionId:definition.id,definitionRevisionId:definition.revisionId,
  kind:"Task",title:definition.title,materializationKey:"execution-key-"+code,
  scheduleOccurrenceKey:date,status:"Planned",
  eligibility:{definitionRevisionId:definition.revisionId,
    importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{}},
  version:1,createdAt:now,updatedAt:now} as const;
 return new InMemoryFoundationStore({
  personalDays:[day],definitions:[definition],dailyExecution:[execution],
 });
}
function lab(){
 const stores=new Map([[people.a,storeFor(people.a,"a")],[people.b,storeFor(people.b,"b")]]);
 const seen:{session:string;user:string}[]=[];
 const foundation={
  async openOperation(userId:string){
   const store=stores.get(userId);
   if(!store)throw new Error("unknown synthetic identity");
   const snapshot={
    listDefinitions:(who:string)=>store.snapshot().definitions.filter(d=>d.userId===who),
    listPersonalDays:(who:string)=>store.snapshot().personalDays.filter(d=>d.userId===who),
    listDailyExecutionForUser:(who:string)=>store.snapshot().dailyExecution.filter(d=>d.userId===who),
   };
   return {transaction:store,locations:store,snapshot,prayerPolicies:{}};
  },
 };
 const operation=new PersonalControlOperation({
  isRuntimeRunning:()=>true,
  resolveSession:{async execute({sessionId}) {
   const user=sessionUsers.get(sessionId);
   if(!user)throw new Error("synthetic invalid session");
   seen.push({session:sessionId,user});
   return {accountId:user as never};
  }},
  authorize:{async execute(){}},
  accountUserResolver:{async resolve(accountId){return new UserId(String(accountId));}},
  foundation:foundation as never,
  clock:{now:()=>now},
  idGenerator:new SequenceIdGenerator(),
 });
 const route:RouteAccessEvidenceExecutor={
  async execute(){return {kind:"authentication-required",appKey:"noor-personal",pathname:"/personal"};},
 };
 return {operation,stores,seen,route};
}
async function exercise(
 origin:string,path:string,session:string|null,body:unknown={}
):Promise<{status:number;data:any;headers:Headers;raw:string}>{
 const response=await fetch(origin+path,{
  method:"POST",
  headers:{"Content-Type":"application/json",...(session?{Cookie:"noor_session="+session}:{})},
  body:JSON.stringify(body),
 });
 const raw=await response.text();
 return {status:response.status,raw,data:raw?JSON.parse(raw):null,headers:response.headers};
}
test("R257 authenticated real localhost HTTP: two browser cookies, cross-device notes/progress, idempotency and IDOR guards",async()=>{
 const f=lab();
 const server=createRouteAccessHttpServer(f.route,{personalControl:f.operation});
 await server.listen({host:"127.0.0.1",port:0});
 const address=server.address();assert.ok(address&&typeof address!=="string");
 const origin="http://127.0.0.1:"+address.port;
 const command=(session:string,body:unknown)=>exercise(origin,PERSONAL_COMMAND_HTTP_PATH,session,body);
 const read=(session:string|null)=>exercise(origin,PERSONAL_WORKSPACE_HTTP_PATH,session);
 try{
  const noAuth=await read(null);
  assert.equal(noAuth.status,401);
  assert.equal(noAuth.raw,"");
  const injection=await command("cookie-mac",{type:"configure-task-sessions",
   definitionId:"book-a",expectedRevisionId:"definition-rev-a",plan,userId:people.b});
  assert.equal(injection.status,400);

  const initial=await read("cookie-phone");
  assert.equal(initial.status,200);
  assert.equal(initial.headers.get("cache-control"),"no-store");
  assert.equal(initial.data.definitions[0].sessionPlan,undefined);
  assert.deepEqual(initial.data.definitions.map((d:any)=>d.userId),[people.a]);

  const saved=await command("cookie-mac",{type:"configure-task-sessions",
   definitionId:"book-a",expectedRevisionId:"definition-rev-a",plan});
  assert.equal(saved.status,200);
  const macDefinition=saved.data.workspace.definitions[0];
  assert.equal(macDefinition.sessionPlan.sessions.length,2);
  assert.equal(macDefinition.sessionPlan.sessions[0].note,"");

  // The phone is a separate cookie but must read exactly the Mac's persisted owner state.
  const phone=await read("cookie-phone");
  assert.equal(phone.data.definitions[0].sessionPlan.sessions[1].target,10);
  const initialRevision=phone.data.definitions[0].revisionId;

  const note=await command("cookie-phone",{type:"edit-task-general-note",definitionId:"book-a",
   expectedRevisionId:initialRevision,note:"ملخص الكتاب"});
  assert.equal(note.status,200);
  assert.equal(note.data.workspace.definitions[0].taskGeneralNote,"ملخص الكتاب");

  const stale=await command("cookie-mac",{type:"edit-task-general-note",definitionId:"book-a",
   expectedRevisionId:initialRevision,note:"نسخة قديمة لا يجوز حفظها"});
  assert.equal(stale.status,409);
  assert.equal(stale.raw,"","conflicts do not leak account state or private notes");

  const sessionNote=await command("cookie-mac",{type:"edit-task-session-note",definitionId:"book-a",
   taskSessionId:"chapter-one",expectedRevision:0,note:"استنتاج من الفصل الأول"});
  assert.equal(sessionNote.status,200);
  // Invalid page fractions are validation conflicts, not infrastructure outages.
  const fractional=await command("cookie-phone",{type:"record-task-session-progress",
   executionId:"execution-a",taskSessionId:"chapter-one",entryId:"invalid-fraction",
   amount:0.5,note:""});
  assert.equal(fractional.status,409);
  assert.equal(fractional.raw,"");

  const progress={type:"record-task-session-progress",executionId:"execution-a",
   taskSessionId:"chapter-one",entryId:"r257-fixed-event",amount:4,note:"قرأت 4 صفحات"};
  assert.equal((await command("cookie-phone",progress)).status,200);
  assert.equal((await command("cookie-phone",progress)).status,200);
  const reusedId=await command("cookie-phone",{...progress,amount:7});
  assert.equal(reusedId.status,409);
  assert.equal(reusedId.raw,"");
  const after=await read("cookie-mac");
  const d=after.data.definitions[0];
  assert.equal(d.taskGeneralNote,"ملخص الكتاب");
  assert.equal(d.sessionPlan.sessions[0].note,"استنتاج من الفصل الأول");
  assert.equal(d.activityLog.length,1);
  assert.equal(d.activityLog[0].amount,4);
  assert.ok(Math.abs(d.activityLog[0].sessionDayCredit-0.2)<1e-10);

  const other=await read("cookie-other");
  assert.deepEqual(other.data.definitions.map((d:any)=>d.id),["book-b"]);
  assert.doesNotMatch(JSON.stringify(other.data),/ملخص الكتاب|استنتاج من الفصل الأول/);
  const guessed=await command("cookie-other",{type:"edit-task-session-note",definitionId:"book-a",
   taskSessionId:"chapter-one",expectedRevision:1,note:"cross-user attack"});
  assert.notEqual(guessed.status,200);
  assert.equal(guessed.raw,"");
  const afterAttack=await read("cookie-mac");
  assert.equal(afterAttack.data.definitions[0].sessionPlan.sessions[0].note,"استنتاج من الفصل الأول");
  assert.equal(f.stores.get(people.b)!.snapshot().definitions[0]!.sessionPlan,undefined);

  assert.ok(f.seen.some(c=>c.session==="cookie-mac"&&c.user===people.a));
  assert.ok(f.seen.some(c=>c.session==="cookie-phone"&&c.user===people.a));
  assert.ok(f.seen.some(c=>c.session==="cookie-other"&&c.user===people.b));
 }finally{await server.close();}
});
