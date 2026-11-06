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
test("new task with opt-in session plan saves through the existing create-definition command",async()=>{
 const f=fixture();
 const command={type:"create-definition",kind:"Task",title:"دراسة علمية",category:"التعلم",startDate:date,endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Important",measurement:{target:30,unit:"صفحة"},sessionPlan:plan};
 assert.ok(parsePersonalCommand(command));
 await f.service.execute("owner",command);
 const created=f.store.snapshot().definitions.find(d=>d.title==="دراسة علمية");
 assert.ok(created);assert.equal(created.sessionPlan.sessions.length,2);
 assert.deepEqual(created.sessionPlan.sessions.map(s=>s.order),[1,2]);
 assert.equal(created.weight,1);
});
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
test("R256: a page session rejects fractional pages at the server, without corrupting cumulative progress",async()=>{
 const f=fixture();await configure(f);
 const before=structuredClone(f.get());
 await assert.rejects(()=>progress(f,"s1","fractional",0.5),/TASK_SESSION_PAGES_MUST_BE_WHOLE/);
 assert.deepEqual(f.get(),before,"a rejected half-page request must not write a partial event");
 await progress(f,"s1","whole-one",1);
 assert.equal(session.sessionProgress(f.get().activityLog,"s1"),1);
 assert.equal(f.get().activityLog.length,1);
});
test("R256: fractional page session targets without ranges and fractional page parent totals are invalid",async()=>{
 const f=fixture();
 const bad={distribution:"custom",sessions:[item("half",1,0.5,null,null)]};
 await assert.rejects(()=>configure(f,bad),/TASK_SESSION_PAGES_MUST_BE_WHOLE/);
 assert.equal(f.get().sessionPlan,undefined);
 const invalidParent=fixture({...base,measurement:{target:10.5,unit:"صفحات"}});
 await assert.rejects(()=>configure(invalidParent,{distribution:"custom",sessions:[item("s1",1,10,null,null)]}),/TASK_SESSION_PAGES_MUST_BE_WHOLE/);
 assert.equal(invalidParent.get().sessionPlan,undefined);
});
test("R256: fractional non-page targets remain supported for legitimate measurable units",async()=>{
 const f=fixture({...base,measurement:{target:1.5,unit:"ساعة"}});
 const fractional={distribution:"custom",sessions:[item("t1",1,1.5,null,null)]};
 await configure(f,fractional);
 await progress(f,"t1","partial-hours",0.5);
 assert.equal(session.sessionProgress(f.get().activityLog,"t1"),0.5);
 assert.ok(Math.abs(session.sessionDayCredit(f.get().activityLog,date)-1/3)<1e-12);
});
test("R256: previously cancelled, completed or skipped daily executions cannot record session progress",async()=>{
 for(const status of ["Completed","Cancelled","Skipped","Deferred","Suppressed"]){
  const f=fixture(base,[day],[{...execution,status}]);
  await configure(f);
  await assert.rejects(()=>progress(f,"s1","invalid-"+status,1),/DEFINITION_STATE_CONFLICT/);
  assert.equal(f.get().activityLog?.length??0,0);
 }
});
test("R254 review: quantified session credit is proportional to parent target, not session target",async()=>{
 const f=fixture();await configure(f);
 await progress(f,"s1","part-1",5);
 await progress(f,"s1","part-2",5);
 assert.ok(Math.abs(session.sessionDayCredit(f.get().activityLog,date)-1/3)<1e-12);
 assert.equal(f.get().activityLog.length,2);
 await f.service.execute("owner",{type:"complete-task-session",executionId:"execution-1",taskSessionId:"s1",entryId:"manual-duplicate"}); // already complete: idempotent no-op
 assert.equal(f.get().activityLog.length,2);
});
test("R254 review: manual unquantified session completion credits one session, not full parent weight",async()=>{
 const f=fixture({...base,measurement:undefined});
 const unquantified={distribution:"custom",sessions:[item("u1",1,null,null,null),item("u2",2,null,null,null)]};
 await configure(f,unquantified);
 const complete={type:"complete-task-session",executionId:"execution-1",taskSessionId:"u1",entryId:"complete-1"};
 await f.service.execute("owner",complete);
 await f.service.execute("owner",complete);
 const log=f.get().activityLog;
 assert.equal(log.length,1);
 assert.equal(session.sessionDayCredit(log,date),0.5);
 assert.equal(f.get().sessionPlan.sessions[0].completedAt,now);
 assert.equal(f.get().sessionPlan.sessions[1].completedAt,null);
});
test("R254: parent task can be cancelled without completing remaining sessions; achieved reason remains forbidden",async()=>{
 const f=fixture();await configure(f);
 await assert.rejects(()=>f.service.execute("owner",{type:"record-activity",executionId:"execution-1",entryId:"premature",amount:0,note:"",endReason:"achieved"}));
 await f.service.execute("owner",{type:"record-activity",executionId:"execution-1",entryId:"cancelled",amount:0,note:"",endReason:"cancelled"});
 assert.equal(f.get().state,"Stopped");
 assert.equal(f.get().activityLog.at(-1).endReason,"cancelled");
 assert.equal(f.get().sessionPlan.sessions.length,2);
});
test("R254 review: completed session without a new event does not grant another day's weight",async()=>{
 const f=fixture();await configure(f);await progress(f,"s1","part1",10);
 const activity=f.get().activityLog;
 assert.equal(session.sessionDayCredit(activity,"2026-11-06"),0);
});
test("R254 review: reject historical parent completion without recorded session work",async()=>{
 const oldDay={...day,id:"old-day",boundary:{...day.boundary,key:"old-day",localDate:"2026-11-04"}};
 const oldInstance={...execution,id:"old-execution",personalDayId:"old-day",scheduleOccurrenceKey:"2026-11-04"};
 const f=fixture(base,[day,oldDay],[execution,oldInstance]);await configure(f);
 await assert.rejects(()=>f.service.execute("owner",{type:"correct-historical-execution",executionId:"old-execution",localDate:"2026-11-04",expectedStatus:"Planned",completed:true}));
 assert.equal(f.store.snapshot().dailyExecution.find(e=>e.id==="old-execution").status,"Planned");
});
test("R254 review: whole pages never become fractional or overlap in equal plans",()=>{
 const targets=session.equalSessionTargets(300,18,true);
 assert.equal(targets.reduce((a,b)=>a+b,0),300);
 assert.equal(targets.length,18);
 assert.ok(targets.every(n=>Number.isSafeInteger(n)&&n>=1));
 assert.deepEqual(targets.slice(0,3),[17,17,17]);
 assert.deepEqual(targets.slice(-3),[16,16,16]);
 assert.throws(()=>session.equalSessionTargets(10,12,true));
 assert.throws(()=>session.equalSessionTargets(10.5,3,true));
 assert.equal(session.isPageUnit("صفحة"),true);
 const invalid={distribution:"custom",sessions:[item("s1",1,10,1,11)]};
 assert.throws(()=>session.prepareTaskSessionPlan(undefined,invalid,[],{target:30,unit:"صفحة"},now),/PAGE_RANGE/);
});
test("R255: an opt-in session plan with zero sessions must never count as completed",async()=>{
 const f=fixture();
 await configure(f,{distribution:"custom",sessions:[]});
 await assert.rejects(()=>f.service.execute("owner",{type:"set-execution-completed",executionId:"execution-1",completed:true}),/TASK_SESSIONS_NOT_COMPLETED/);
 await assert.rejects(()=>f.service.execute("owner",{type:"record-activity",executionId:"execution-1",entryId:"empty-complete",amount:0,note:"",endReason:"achieved"}),/TASK_SESSIONS_NOT_COMPLETED/);
 assert.equal(f.get().activityLog?.length??0,0);
});
test("R255: all allocated sessions completed is insufficient if the total parent target remains unfinished",async()=>{
 const f=fixture();
 await configure(f,{distribution:"custom",sessions:[item("s1",1,10,1,10)]});
 await progress(f,"s1","portion",10);
 assert.equal(session.sessionStatus(f.get().sessionPlan.sessions[0],f.get().activityLog),"Completed");
 await assert.rejects(()=>f.service.execute("owner",{type:"set-execution-completed",executionId:"execution-1",completed:true}),/TARGET_NOT_REACHED/);
 await assert.rejects(()=>f.service.execute("owner",{type:"record-activity",executionId:"execution-1",entryId:"early-complete",amount:0,note:"",endReason:"achieved"}),/TARGET_NOT_REACHED/);
 assert.equal(f.get().state,"Active");
});
test("R254: parent task general note is independently editable, owner protected and revision guarded",async()=>{
 const f=fixture();await configure(f);
 const revision=f.get().revisionId;
 await f.service.execute("owner",{type:"edit-task-general-note",definitionId:"book",expectedRevisionId:revision,note:"خلاصة المهمة العامة"});
 assert.equal(f.get().taskGeneralNote,"خلاصة المهمة العامة");
 assert.equal(f.get().sessionPlan.sessions[0].note,"");
 assert.equal(f.get().activityLog?.length??0,0);
 await assert.rejects(()=>f.service.execute("owner",{type:"edit-task-general-note",definitionId:"book",expectedRevisionId:revision,note:"نص متعارض"}));
 await assert.rejects(()=>f.service.execute("another-user",{type:"edit-task-general-note",definitionId:"book",expectedRevisionId:f.get().revisionId,note:"محاولة غير مصرح بها"}));
 await f.service.execute("owner",{type:"edit-task-general-note",definitionId:"book",expectedRevisionId:f.get().revisionId,note:""});
 assert.equal(f.get().taskGeneralNote,undefined);
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
 assert.ok(Math.abs(session.sessionDayCredit(state.definitions[0].activityLog,date)-1/6)<1e-12);
 const nextDay={...day,id:"day-2",boundary:{...day.boundary,key:"day-2",localDate:"2026-11-06"},state:"Open"};
 const nextExec={...execution,id:"execution-2",personalDayId:"day-2",scheduleOccurrenceKey:"2026-11-06",status:"Planned"};
 const snapshot={listDefinitions:()=>state.definitions,listPersonalDays:()=>[day,nextDay],listDailyExecutionForUser:()=>[execution,nextExec]};
 const workspace=buildPersonalWorkspace("owner",snapshot);
 assert.equal(workspace.insights.periods.week.completionRate,8);
 assert.equal(session.taskCumulativeProgress(state.definitions[0].activityLog),5);
});
test("one-time session task remains eligible on a later day, while an old one-time task does not",async()=>{
 const domain=await import(pathToFileURL(path.join(root,"domain/materialization.js")).href);
 const once={...base,schedule:{kind:"OneTime",localDate:"2026-11-05"}};
 const zone={weekday:()=>4};
 assert.equal(domain.definitionIsEligible(once,"2026-11-06",zone),false);
 const f=fixture();await configure(f);
 assert.equal(domain.definitionIsEligible({...f.get(),schedule:once.schedule},"2026-11-06",zone),true);
 assert.equal(domain.definitionIsEligible({...f.get(),schedule:once.schedule,state:"Stopped"},"2026-11-06",zone),false);
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
