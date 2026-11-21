// S4 real application workflow using EXISTING S3 CI identity ports only.
// No new identity fixture, managed RPC or production access.
import assert from "node:assert/strict";
import {projectS4Analytics} from "./s4-analytics-projection.mjs";
import {weightedStatisticRowsR334,summarizeProgress,statisticPeriods,wholeWeekAchievement,statisticCalendar} from "../../../apps/web/src/progress-statistics.ts";

const total=({scheduled,completed,weight,completedWeight,rate})=>({scheduled,completed,weight,completedWeight,rate});
export async function proveS4Application({database,psql,literal,owner,otherOwner,setNow,send,readToday,readWorkspace}){
 const scope="owner_id="+literal(owner);
 const count=async(extra="true")=>Number(await psql("SELECT count(*) FROM noor_r386_candidate.s4_fact WHERE "+scope+" AND "+extra));
 const readFacts=async()=>JSON.parse(await psql("SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY source_revision,fact_kind,entity_id,sub_id),'[]') FROM noor_r386_candidate.s4_fact f WHERE "+scope));
 const state=()=>database.load(owner);
 const sendOk=async c=>{const response=await send(c);assert.equal(response.status,204,"S4 "+c.type);};
 const day20="2026-11-20",day21="2026-11-21";
 let at=day20+"T12:00:00.000Z";
 setNow(at);
 assert.equal((await readToday()).status,200);
 const common={type:"create-definition",kind:"Habit",category:"الصحة والرياضة",startDate:day20,endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Supporting"};
 await sendOk({...common,title:"S4-private-title-1",requestId:"44444444-4444-4444-8444-444444444444",weight:7});
 await sendOk({...common,title:"S4-private-title-2",requestId:"55555555-5555-4555-8555-555555555555",weight:3});
 await sendOk({...common,kind:"Task",title:"S4-private-title-3",requestId:"66666666-6666-4666-8666-666666666666",weight:5,
  sessionPlan:{distribution:"custom",sessions:[{id:"s4-session-a",title:"S4-private-session-title",objective:"S4-private-objective",target:null,rangeStart:null,rangeEnd:null,scheduledDate:day20},
  {id:"s4-session-b",title:"S4-private-session-title-b",objective:"",target:null,rangeStart:null,rangeEnd:null,scheduledDate:day20}]}});
 assert.equal((await readToday()).status,200);
 let source=await state();
 const def=title=>source.state.definitions.find(d=>d.title===title);
 const first=def("S4-private-title-1"),second=def("S4-private-title-2"),task=def("S4-private-title-3");
 assert.ok(first&&second&&task);
 const execution=(id,date)=>source.state.dailyExecution.find(e=>e.definitionId===id&&e.scheduleOccurrenceKey===date);
 const firstExecution=execution(first.id,day20),secondExecution=execution(second.id,day20),taskExecution=execution(task.id,day20);
 assert.ok(firstExecution&&secondExecution&&taskExecution);
 await sendOk({type:"set-execution-completed",executionId:firstExecution.id,completed:true});
 await sendOk({type:"record-activity",executionId:firstExecution.id,entryId:"77777777-7777-4777-8777-777777777777",note:"S4-private-note",amount:0,endReason:null});
 await sendOk({type:"complete-task-session",executionId:taskExecution.id,taskSessionId:"s4-session-a",entryId:"88888888-8888-4888-8888-888888888888"});
 let captured=await readFacts();
 const recent=(kind,id)=>captured.filter(f=>f.fact_kind===kind&&f.entity_id===id).at(-1);
 assert.equal(recent("execution",firstExecution.id).record.observedEligibilityWeight,7);
 assert.equal(recent("execution",firstExecution.id).record.status,"Completed");
 assert.equal(recent("execution",firstExecution.id).record.performedDate,null);
 assert.equal(recent("execution",firstExecution.id).record.historicalWeight,null);
 const transition=recent("execution-transition",firstExecution.id);
 assert.equal(transition.record.eventType,"ExecutionCompleted");
 assert.equal(transition.record.recordedAt,at);
 assert.equal(transition.record.recordedOnDueDate,day20);
 assert.equal(transition.record.weightAtObservedTransition,7);
 assert.equal(transition.record.performedDate,null);
 assert.equal(recent("activity","88888888-8888-4888-8888-888888888888").record.recordedSessionAchievementShare,1);
 assert.equal(recent("activity","88888888-8888-4888-8888-888888888888").record.recordedSessionDayCredit,0.5);
 assert.equal(recent("session","s4-session-a").record.scheduledDate,day20);
 assert.doesNotMatch(JSON.stringify(captured),/S4-private|title|note|objective|finance|journal|student/i);
 const beforeWeight=await count("fact_kind='execution' AND entity_id="+literal(firstExecution.id));
 await sendOk({type:"rebalance-habit-weights",changes:[{definitionId:first.id,expectedRevisionId:first.revisionId,weight:9}]});
 captured=await readFacts();
 assert.equal(recent("execution",firstExecution.id).record.observedEligibilityWeight,9);
 assert.equal(recent("execution",firstExecution.id).observation,"Revised");
 assert.equal(recent("execution-transition",firstExecution.id).record.weightAtObservedTransition,7);
 assert.ok(captured.some(f=>f.fact_kind==="execution"&&f.entity_id===firstExecution.id&&f.record.observedEligibilityWeight===7));
 assert.equal(await count("fact_kind='execution' AND entity_id="+literal(firstExecution.id)),beforeWeight+1);
 // A private note-only edit changes source revision, not the facts.
 const beforeNote=await count();
 await sendOk({type:"edit-activity-note",executionId:firstExecution.id,entryId:"77777777-7777-4777-8777-777777777777",expectedNote:"S4-private-note",note:"S4-private-correction"});
 assert.equal(await count(),beforeNote);
 await sendOk({type:"configure-prayer-score-r334",expectedPolicyId:null,baseWeight:20,
  shares:{group:{ontime:1,late:0.8},excused:{ontime:0.8,late:0.6},unexcused:{ontime:0.5,late:0.3}},mappings:[],confirm:true});
 at=day21+"T12:00:00.000Z";setNow(at);
 assert.equal((await readToday()).status,200);
 source=await state();
 const old=execution(second.id,day20);
 assert.ok(old);
 await sendOk({type:"recover-historical-execution",executionId:old.id,localDate:day20,performedOn:day21,expectedStatus:old.status});
 captured=await readFacts();
 assert.equal(recent("execution",old.id).record.performedDate,day21);
 assert.equal(recent("execution",old.id).record.legacyRecoveryDate,day21);
 assert.equal(recent("execution",old.id).record.scoringPolicyVersion,"R367");
 assert.equal(recent("execution-transition",old.id).record.recordedOnDueDate,null);
 assert.equal(recent("execution-transition",old.id).record.performedDate,day21);
 assert.equal(recent("execution-transition",old.id).record.weightAtObservedTransition,3);
 assert.equal(recent("execution",old.id).record.dueTimeZone,"Asia/Riyadh");
 const afterRecovery=await state();
 const projected=await projectS4Analytics({owner,sourceRevision:afterRecovery.revision,state:afterRecovery.state,evaluatedAt:at});
 assert.equal(projected.explicitExecutionDates[day21],1);
 const row=projected.scoreRows.find(r=>r.id===old.id);
 assert.equal(row.credit,0.7);
 assert.equal(row.date,day20);
 await sendOk({type:"record-prayer-r331",localDate:day21,key:"fajr",mode:"group",timing:"ontime",expectedRecordedAt:null});
 captured=await readFacts();
 const policy=captured.find(f=>f.fact_kind==="prayer-policy"&&f.sub_id==="fajr"&&f.record.dueDate===day21);
 const recorded=captured.find(f=>f.fact_kind==="prayer-record"&&f.sub_id==="fajr"&&f.record.dueDate===day21);
 assert.ok(policy&&recorded);
 assert.equal(policy.record.weight,20);
 assert.equal(recorded.record.policyId,policy.record.policyId);
 assert.equal(recorded.record.performedDate,null);
 assert.equal(recorded.record.recordedMode,"group");
 // Compare exact current revision with the real authorized workspace HTTP
 // payload and its existing statistics functions, not a new score algorithm.
 const response=await readWorkspace();assert.equal(response.status,200);
 const workspace=await response.json();
 source=await state();
 const analytics=await projectS4Analytics({owner,sourceRevision:source.revision,state:source.state,evaluatedAt:at});
 const weighted=weightedStatisticRowsR334(workspace.statistics.rows,workspace.prayerAchievementR334??[],workspace.statistics.currentDate);
 assert.deepEqual(analytics.daily.find(d=>d.date===day20),{date:day20,...total(summarizeProgress(weighted.filter(r=>r.date===day20)))});
 assert.deepEqual(analytics.daily.find(d=>d.date===day21),{date:day21,...total(summarizeProgress(weighted.filter(r=>r.date===day21)))});
 assert.deepEqual(analytics.week,wholeWeekAchievement(weighted,day21).map(({date,current,future,...x})=>({date,current,future,...total(x)})));
 assert.deepEqual(analytics.calendar,statisticCalendar(weighted,"2026-11",day21));
 assert.deepEqual(analytics.serverPeriods,workspace.insights.periods);
 for(const p of statisticPeriods(weighted,day21)){
  const got=analytics.periods.find(x=>x.key===p.key);
  assert.deepEqual(total(got),total(p));
  assert.equal(got.ready,p.ready);assert.equal(got.start,p.start);assert.equal(got.end,p.end);
 }
 assert.doesNotMatch(JSON.stringify(analytics),/S4-private|finance|journal|student/);
 console.log("R386_S4_REAL_HTTP_FACTS_AND_CANONICAL_PARITY_PASS");
 // Independent month-spanning weighted history: frozen execution weights
 // differ from today's definition, two recovery policies, excluded drinks,
 // superseded duplicate civil day, unknown completion dates. Score expected
 // from known fixture totals, not only comparing two calls to the same code.
 const longState=structuredClone(source.state);
 longState.definitions=[{...first,weight:99,activityLog:[]},{...second,weight:99,activityLog:[]},
  {...first,id:"s4-drink",weight:100,activityLog:[],beveragePlan:{targetServings:3}}];
 longState.personalDays=[];longState.dailyExecution=[];longState.islamicContexts=[];
 const baseDay=source.state.personalDays.find(d=>d.boundary.localDate===day20);
 const civil=(base,delta)=>new Date(Date.parse(base+"T00:00:00Z")+delta*86400000).toISOString().slice(0,10);
 for(let i=34;i>=0;i--){
  const date=civil(day21,-i);
  const id="s4-long-day-"+date;
  const {prayerRecordsR331,prayerScoreSnapshotR334,...plainDay}=baseDay;
  const day={...plainDay,id,boundary:{...plainDay.boundary,key:"personal-day-civil:"+date,localDate:date,startAt:date+"T00:00:00.000Z",endAt:civil(date,1)+"T00:00:00.000Z"}};
  longState.personalDays.push(day);
  const completed={...firstExecution,id:"s4-long-a-"+date,personalDayId:id,scheduleOccurrenceKey:date,
   status:"Completed",eligibility:{...firstExecution.eligibility,weight:7}};
  delete completed.completionDateR367;delete completed.recoveredOnR331;
  if(date===day20){completed.completionDateR367=day21;completed.recoveredOnR331=day21;}
  if(date===civil(day20,-1)){completed.recoveredOnR331=day20;}
  longState.dailyExecution.push(completed,{...secondExecution,id:"s4-long-b-"+date,personalDayId:id,scheduleOccurrenceKey:date,
    status:"Missed",eligibility:{...secondExecution.eligibility,weight:3}},
   {...completed,id:"s4-long-drink-"+date,definitionId:"s4-drink",eligibility:{...completed.eligibility,weight:100}});
 }
 const superseded={...longState.personalDays.find(d=>d.boundary.localDate===day20),id:"s4-obsolete-day",boundary:{...baseDay.boundary,key:"old-fajr-day",localDate:day20}};
 longState.personalDays.push(superseded);
 longState.dailyExecution.push({...firstExecution,id:"s4-obsolete-execution",personalDayId:superseded.id,scheduleOccurrenceKey:day20,eligibility:{...firstExecution.eligibility,weight:100}});
 const longer=await projectS4Analytics({owner,sourceRevision:123,state:longState,evaluatedAt:at});
 assert.equal(longer.daily.find(d=>d.date===day20).rate,49);
 assert.equal(longer.daily.find(d=>d.date===civil(day20,-1)).rate,35);
 assert.equal(longer.daily.find(d=>d.date===day21).rate,70);
 assert.ok(!longer.scoreRows.some(r=>r.id==="s4-obsolete-execution"));
 const month=longer.periods.find(x=>x.key==="month");
 assert.equal(month.ready,true);
 assert.equal(month.start,"2026-10-21");assert.equal(month.end,day20);
 assert.equal(month.weight,310);assert.equal(month.scheduled,62);assert.equal(month.completed,31);
 assert.ok(Math.abs(month.completedWeight-(31*7-2.1-3.5))<1e-8);
 assert.equal(month.rate,68);
 const rollingWeek=longer.serverPeriods.week,rollingMonth=longer.serverPeriods.month;
 assert.equal(rollingWeek.scheduled,14);assert.equal(rollingWeek.completionRate,62);
 assert.equal(rollingMonth.scheduled,60);assert.equal(rollingMonth.completionRate,68);
 assert.equal(longer.explicitExecutionDates[day21],2); // two explicit records incl. excluded informational drink
 assert.ok(longer.coverage.completedUnknownDate>0);
 assert.equal(longer.coverage.historicalWeightUnknown,longer.coverage.executionCount);
 assert.doesNotMatch(JSON.stringify(longer),/S4-private/);
 console.log("R386_S4_MONTH_SPANNING_EXPECTED_WEIGHTED_PARITY_PASS");

 // Correction has its own version, without inventing a performance date;
 // retries must not append facts. Then verify a candidate write failure rolls
 // back facts, receipt and source together.
 await sendOk({type:"correct-historical-execution",executionId:old.id,localDate:day20,expectedStatus:"Completed",completed:false});
 captured=await readFacts();
 assert.equal(recent("execution",old.id).record.status,"Missed");
 assert.equal(recent("execution",old.id).record.performedDate,null);
 assert.ok(captured.some(f=>f.fact_kind==="execution"&&f.entity_id===old.id&&f.record.performedDate===day21));
 const beforeNoop=await count();
 const beforeNoopState=await state();
 await sendOk({type:"correct-historical-execution",executionId:old.id,localDate:day20,expectedStatus:"Missed",completed:false});
 assert.equal((await state()).revision,beforeNoopState.revision);assert.equal(await count(),beforeNoop);
 const beforeFault=await state();
 const beforeFaultFacts=await readFacts();
 // Existing isolated S3 executor only; intentionally invalid candidate
 // scalar under the same transaction. The SQL trigger must reject it.
 const invalid=structuredClone(beforeFault.state);
 invalid.dailyExecution[0].eligibility.weight="invalid";
 const digest="ab".repeat(32);
 await assert.rejects(()=>database.commit({owner,requestId:"s4-invalid-fact",expectedRevision:beforeFault.revision,existed:true,
  before:beforeFault.state,after:invalid,keyId:"ci-key",digest,fingerprints:{"ci-key":digest},deleteRefs:[]}),/R386_S4_NUMBER/);
 assert.deepEqual(await state(),beforeFault);assert.deepEqual(await readFacts(),beforeFaultFacts);
 assert.equal(await database.lookup(owner,"s4-invalid-fact"),null);
 // Role boundary and cross-owner isolation; no new analytics API.
 for(const role of ["anon","authenticated","service_role","noor_r386_s3_executor"]){
  assert.equal(await psql("SELECT has_table_privilege("+literal(role)+",'noor_r386_candidate.s4_fact','SELECT,INSERT,UPDATE,DELETE')"),"f");
  assert.equal(await psql("SELECT has_function_privilege("+literal(role)+",'noor_r386_candidate.s4_extract(text,jsonb)','EXECUTE')"),"f");
 }
 const otherBefore=await psql("SELECT count(*) FROM noor_r386_candidate.s4_fact WHERE owner_id="+literal(otherOwner));
 await sendOk({type:"delete-definition",definitionId:first.id,confirm:true});
 assert.equal(await count("definition_id="+literal(first.id)),0);
 assert.ok(await count("definition_id="+literal(second.id))>0);
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.s4_fact WHERE owner_id="+literal(otherOwner)),otherBefore);
 // Receipt-fenced rollback stops new analytical observations but not erasure.
 assert.equal(await psql("SELECT noor_r386_candidate.s3_enter_rollback("+literal(owner)+")"),"t");
 const beforeRollback=await count();
 await sendOk({type:"delete-definition",definitionId:task.id,confirm:true});
 assert.equal(await count("definition_id="+literal(task.id)),0);
 assert.ok(await count()<beforeRollback);
 const afterErase=await count();
 source=await state();
 const next=execution(second.id,day21);
 assert.ok(next);
 await sendOk({type:"set-execution-completed",executionId:next.id,completed:true});
 assert.equal(await count(),afterErase);
 console.log("R386_S4_CORRECTION_ATOMIC_ROLLBACK_ERASURE_AND_ROLE_PASS");
}
