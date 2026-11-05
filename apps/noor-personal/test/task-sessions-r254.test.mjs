import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";
const root=path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist");
const api=await import(pathToFileURL(path.join(root,"index.js")).href);
const session=await import(pathToFileURL(path.join(root,"domain/task-sessions.js")).href);
const {PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,parsePersonalCommand,buildPersonalWorkspace,SupabasePostgresPersonalFoundationPersistence}=api;
const now="2026-11-05T10:00:00.000Z";
const date="2026-11-05";
const day={id:"day-1",userId:"owner",boundary:{key:"day-1",localDate:date,startAt:"2026-11-05T00:00:00.000Z",endAt:"2026-11-06T00:00:00.000Z",timeZone:"Asia/Riyadh"},state:"Open",version:1,createdAt:now,updatedAt:now};
const base={id:"book",userId:"owner",kind:"Task",revisionId:"r1",title:"قراءة كتاب",category:"التعلم",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:date,importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{},measurement:{target:30,unit:"صفحة"}};
const execution={id:"execution-1",userId:"owner",personalDayId:"day-1",definitionId:"book",definitionRevisionId:"r1",kind:"Task",title:"قراءة كتاب",materializationKey:"book:day-1",scheduleOccurrenceKey:date,status:"Planned",eligibility:{definitionRevisionId:"r1",importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{}},version:1,createdAt:now,updatedAt:now};
function item(id,i,target,start,end){return {id,title:"الجلسة "+i,objective:"وحدة "+i,target,rangeStart:start,rangeEnd:end};}
const plan={distribution:"custom",sessions:[item("s1",1,10,1,10),item("s2",2,20,11,30)]};
function fixture(definition=base,days=[day],instances=[execution]){
 const store=new InMemoryFoundationStore({personalDays:days,definitions:[definition],dailyExecution:instances});
 const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 return {store,service,get:()=>store.snapshot().definitions.find(d=>d.id==="book")};
}
function configure(f,p=plan,revision=f.get().revisionId){return f.service.execute("owner",{type:"configure-task-sessions",definitionId:"book",expectedRevisionId:revision,plan:p});}
function note(f,taskSessionId,text,expectedRevision){return f.service.execute("owner",{type:"edit-task-session-note",definitionId:"book",taskSessionId,expectedRevision,note:text});}
function progress(f,taskSessionId,entryId,amount,description=""){return f.service.execute("owner",{type:"record-task-session-progress",executionId:"execution-1",taskSessionId,entryId,amount,note:description});}
test("legacy tasks without sessions have unchanged parser and read model",async()=>{
 const f=fixture();assert.equal(f.get().sessionPlan,undefined);
 await f.service.execute("owner",{type:"record-activity",executionId:"execution-1",entryId:"old",amount:5,note:"سجل سابق",endReason:null});
 assert.equal(f.get().activityLog[0].amount,5);assert.equal(f.get().sessionPlan,undefined);
 assert.ok(parsePersonalCommand({type:"create-definition",kind:"Habit",title:"عادة",category:"العبادات",startDate:date,endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Supporting"}));
});
test("equal distribution rounds precisely, custom ranges may differ",()=>{
 assert.deepEqual(session.equalSessionTargets(30,2),[15,15]);
 assert.deepEqual(session.equalSessionTargets(1,3),[0.333334,0.333333,0.333333]);
 assert.equal(session.equalSessionTargets(1,3).reduce((n,v)=>n+v,0),1);
 const planned=session.prepareTaskSessionPlan(undefined,plan,[],{target:30,unit:"صفحة"},now);
 assert.deepEqual(planned.sessions.map(s=>s.target),[10,20]);
 assert.deepEqual(planned.sessions.map(s=>s.order),[1,2]);
});
test("range overlaps, duplicate IDs and total target beyond original reject without writing",async()=>{
 const f=fixture();
 const bads=[
  {...plan,sessions:[item("s1",1,10,1,10),item("s2",2,20,10,29)]},
  {...plan,sessions:[item("s1",1,10,1,10),item("s1",2,20,11,30)]},
  {...plan,sessions:[item("s1",1,11,1,11),item("s2",2,20,12,31)]},
 ];
 for(const bad of bads){await assert.rejects(()=>configure(f,bad));assert.equal(f.get().sessionPlan,undefined);}
});
test("session note is independently persisted and never increments quantity or marks completion",async()=>{
 const f=fixture();await configure(f);const before=f.get().sessionPlan.sessions[0];
 await note(f,"s1","هذه فكرة تستحق التأمل",before.revision);
 assert.equal(f.get().sessionPlan.sessions[0].note,"هذه فكرة تستحق التأمل");
 assert.equal(f.get().activityLog?.length??0,0);
 assert.equal(session.sessionStatus(f.get().sessionPlan.sessions[0],[]),"Planned");
 await assert.rejects(()=>note(f,"s1","تعديل متعارض",before.revision));
});
test("partial progress idempotent by ID, cannot exceed session or parent target, and session completion independent",async()=>{
 const f=fixture();await configure(f);
 await progress(f,"s1","event1",4,"جلسة الصباح");
 await progress(f,"s1","event1",4,"جلسة الصباح");
 assert.equal(f.get().activityLog.length,1);
 assert.equal(session.sessionProgress(f.get().activityLog,"s1"),4);
 assert.equal(session.taskCumulativeProgress(f.get().activityLog),4);
 assert.equal(session.sessionStatus(f.get().sessionPlan.sessions[0],f.get().activityLog),"InProgress");
 await assert.rejects(()=>progress(f,"s1","event1",5));
 await assert.rejects(()=>progress(f,"s1","event-over",7));
 await progress(f,"s1","event2",6);
 assert.equal(session.sessionStatus(f.get().sessionPlan.sessions[0],f.get().activityLog),"Completed");
 assert.equal(f.get().state,"Active");
 await assert.rejects(()=>f.service.execute("owner",{type:"set-execution-completed",executionId:"execution-1",completed:true}));
});
test("replanning future sessions preserves historical notes/progress and stable identity",async()=>{
 const f=fixture();await configure(f);await progress(f,"s1","progress-1",3);await note(f,"s1","تلخيص ثابت",0);
 const revision=f.get().revisionId;
 await configure(f,{distribution:"custom",sessions:[item("s1",1,10,1,10),item("s3",2,8,11,18),item("s2",3,12,19,30)]},revision);
 assert.equal(f.get().sessionPlan.sessions[0].note,"تلخيص ثابت");
 assert.equal(f.get().sessionPlan.sessions[0].id,"s1");
 assert.equal(session.sessionProgress(f.get().activityLog,"s1"),3);
 assert.equal(f.get().sessionPlan.sessions[2].target,12);
 await assert.rejects(()=>configure(f,{distribution:"custom",sessions:[item("s1",1,9,1,9),item("s3",2,9,10,18),item("s2",3,12,19,30)]}));
 await assert.rejects(()=>configure(f,{distribution:"custom",sessions:[item("s2",1,30,1,30)]}));
});
test("owner isolation denies cross-account session mutation",async()=>{
 const f=fixture();await configure(f);
 const before=f.get();
 await assert.rejects(()=>f.service.execute("attacker",{type:"edit-task-session-note",definitionId:"book",taskSessionId:"s1",expectedRevision:0,note:"tamper"}));
 await assert.rejects(()=>f.service.execute("attacker",{type:"configure-task-sessions",definitionId:"book",expectedRevisionId:before.revisionId,plan:null}));
 assert.deepEqual(f.get(),before);
});
test("day's weighted credit remains one parent weight; next day does not reset cumulative progress",async()=>{
 const f=fixture();await configure(f);await progress(f,"s1","event1",5);
 const state=f.store.snapshot();
 assert.equal(session.sessionDayCredit(state.definitions[0].activityLog,date),0.5);
 const nextDay={...day,id:"day-2",boundary:{...day.boundary,key:"day-2",localDate:"2026-11-06"},state:"Open"};
 const nextExec={...execution,id:"execution-2",personalDayId:"day-2",scheduleOccurrenceKey:"2026-11-06",status:"Planned"};
 const snapshot={listDefinitions:()=>state.definitions,listPersonalDays:()=>[day,nextDay],listDailyExecutionForUser:()=>[execution,nextExec]};
 const workspace=buildPersonalWorkspace("owner",snapshot);
 assert.equal(workspace.insights.periods.week.completionRate,25);
 assert.equal(session.taskCumulativeProgress(state.definitions[0].activityLog),5);
});
test("roundtrips session notes and progress through a fresh managed Foundation adapter",async()=>{
 const f=fixture();await configure(f);await progress(f,"s1","evt",2);await note(f,"s1","ملخص مسترجع",0);
 const state=f.store.snapshot();let row={user_id:"owner",schema_version:1,revision:1,state:{locations:[],prayerPolicies:[],personalDays:state.personalDays,islamicContexts:[],definitions:state.definitions,dailyExecution:state.dailyExecution,outbox:[]}};
 const client={from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[structuredClone(row)],error:null})})})})};
 const adapter=new SupabasePostgresPersonalFoundationPersistence(client);
 await adapter.initialize();
 const scope=await adapter.openOperation("owner");
 const definitions=scope.snapshot.listDefinitions("owner");
 assert.equal(definitions[0].sessionPlan.sessions[0].note,"ملخص مسترجع");
 assert.equal(session.sessionProgress(definitions[0].activityLog,"s1"),2);
 assert.throws(()=>scope.snapshot.listDefinitions("other"));
});
