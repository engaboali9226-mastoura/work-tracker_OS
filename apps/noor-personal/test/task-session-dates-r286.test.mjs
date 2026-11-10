import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";
const root=path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist");
const api=await import(pathToFileURL(path.join(root,"index.js")).href);
const sessions=await import(pathToFileURL(path.join(root,"domain/task-sessions.js")).href);
const {PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,parsePersonalCommand}=api;
const date="2026-11-05",next="2026-11-06",now="2026-11-05T10:00:00.000Z";
const day={id:"d1",userId:"owner",boundary:{key:"d1",localDate:date,startAt:"2026-11-04T21:00:00.000Z",endAt:"2026-11-05T21:00:00.000Z",timeZone:"Asia/Riyadh"},state:"Open",version:1,createdAt:now,updatedAt:now};
const base={id:"book",userId:"owner",kind:"Task",revisionId:"r1",title:"قراءة",category:"التعلم",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:date,importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{},measurement:{target:20,unit:"صفحة"}};
const exec={id:"e1",userId:"owner",personalDayId:"d1",definitionId:"book",definitionRevisionId:"r1",kind:"Task",title:"قراءة",materializationKey:"book:d1",scheduleOccurrenceKey:date,status:"Planned",eligibility:{definitionRevisionId:"r1",importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{}},version:1,createdAt:now,updatedAt:now};
const entry=(id,n,day)=>({id,title:"جلسة "+n,objective:"قراءة",target:10,rangeStart:n===1?1:11,rangeEnd:n===1?10:20,...(day?{scheduledDate:day}:{})});
const plan=(d1=date,d2=next)=>({distribution:"custom",sessions:[entry("s1",1,d1),entry("s2",2,d2)]});
function fixture(def=base){
 const store=new InMemoryFoundationStore({personalDays:[day],definitions:[def],dailyExecution:[exec]});
 const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 return {store,service,get:()=>store.snapshot().definitions.find(d=>d.id==="book")};
}
async function configure(f,p=plan()){
 await f.service.execute("owner",{type:"configure-task-sessions",definitionId:"book",expectedRevisionId:f.get().revisionId,plan:p});
}
const progress=(id,amount=1)=>({type:"record-task-session-progress",executionId:"e1",taskSessionId:id,entryId:"event-"+id,amount,note:""});
test("R286 strict civil date validation, leap days and owner schedule eligibility",()=>{
 assert.equal(sessions.validSessionDateR286("2028-02-29"),true);
 assert.equal(sessions.validSessionDateR286("2026-02-29"),false);
 assert.equal(sessions.validSessionDateR286("2026-11-05"),true);
 for(const x of ["2026-2-9","2026-13-02","2026-11-32","2026-11-05T10:00:00Z","nonsense"])assert.equal(sessions.validSessionDateR286(x),false);
 const valid=sessions.prepareTaskSessionPlan(undefined,plan(),[],base.measurement,now);
 assert.equal(sessions.sessionScheduledOnDateR286(valid,date),true);
 assert.equal(sessions.sessionScheduledOnDateR286(valid,next),true);
 assert.equal(sessions.sessionScheduledOnDateR286(valid,"2026-11-07"),false);
 assert.throws(()=>sessions.assertTaskSessionDatesMatchParentR286(valid,{kind:"Weekdays",weekdays:[4]},date,null),/OUTSIDE_TASK_SCHEDULE/);
 assert.doesNotThrow(()=>sessions.assertTaskSessionDatesMatchParentR286(valid,{kind:"Daily"},date,null));
});
test("R286 server rejects attempts to tick tomorrow's session today without recording an event",async()=>{
 const f=fixture();await configure(f);
 assert.equal(f.get().sessionPlan.sessions[1].scheduledDate,next);
 await assert.rejects(()=>f.service.execute("owner",progress("s2")),/TASK_SESSION_NOT_SCHEDULED_TODAY/);
 assert.equal(f.get().activityLog?.length??0,0);
 await f.service.execute("owner",progress("s1",4));
 assert.equal(f.get().activityLog.length,1);
 assert.equal(f.get().activityLog[0].localDate,date);
 assert.ok(Math.abs(sessions.sessionDayCredit(f.get().activityLog,date)-0.2)<1e-9);
 await f.service.execute("owner",progress("s1",4));
 assert.equal(f.get().activityLog.length,1,"repeated checkbox/network request must be idempotent");
});
test("R286 invalid or off-recurrence session dates fail closed on initial create/configure",async()=>{
 const f=fixture();
 const invalid=plan(date,"2026-02-30");
 assert.equal(parsePersonalCommand({type:"configure-task-sessions",definitionId:"book",expectedRevisionId:"r1",plan:invalid}),null);
 assert.equal(f.get().sessionPlan,undefined);
 const offRange=plan("2026-11-04",next);
 await assert.rejects(()=>configure(f,offRange),/TASK_SESSION_DATE_OUTSIDE_TASK_SCHEDULE/);
 assert.equal(f.get().sessionPlan,undefined);
 const weekday=fixture({...base,schedule:{kind:"Weekdays",weekdays:[4]}});
 await assert.rejects(()=>configure(weekday,plan(date,next)),/TASK_SESSION_DATE_OUTSIDE_TASK_SCHEDULE/);
 assert.equal(weekday.get().sessionPlan,undefined);
});
test("R286 re-planning cannot move a dated session after actual progress",async()=>{
 const f=fixture();await configure(f);await f.service.execute("owner",progress("s1",3));
 const changed={distribution:"custom",sessions:[entry("s1",1,next),entry("s2",2,next)]};
 await assert.rejects(()=>configure(f,changed),/TASK_SESSION_HISTORY_PROTECTED/);
 assert.equal(f.get().sessionPlan.sessions[0].scheduledDate,date);
 assert.equal(f.get().activityLog.length,1);
});
test("R286 legacy undated session command still works, no new date required",async()=>{
 const f=fixture();await configure(f,{distribution:"custom",sessions:[entry("s1",1,null),entry("s2",2,null)]});
 assert.equal(f.get().sessionPlan.sessions[0].scheduledDate,undefined);
 await f.service.execute("owner",progress("s1",1));
 assert.equal(f.get().activityLog.length,1);
});
