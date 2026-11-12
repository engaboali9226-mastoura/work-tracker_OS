import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
const {parsePersonalCommand,PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,buildPersonalWorkspace}=
 await import(pathToFileURL(path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist","index.js")).href);
const date="2026-11-12",at="2026-11-12T09:00:00.000Z";
const day={id:"day",userId:"owner",boundary:{key:"day",localDate:date,startAt:"2026-11-11T21:00:00Z",endAt:"2026-11-12T21:00:00Z",timeZone:"Asia/Riyadh"},
 state:"Open",version:1,createdAt:at,updatedAt:at};
const command=(countdownPlan,extra={})=>({
 type:"create-definition",kind:"Task",title:"مراجعة الطبيب",category:"الشؤون الشخصية",
 startDate:"2026-11-19",endDate:null,scheduleKind:"OneTime",weekdays:[],
 importance:"Supporting",countdownPlan,...extra
});
test("R301: task, event and appointment plans are allowlisted and strictly validated",()=>{
 const plan={kind:"appointment",date:"2026-11-19",time:"13:30"};
 assert.deepEqual(parsePersonalCommand(command(plan))?.countdownPlan,plan);
 assert.deepEqual(parsePersonalCommand(command({...plan,kind:"event"}))?.countdownPlan,{...plan,kind:"event"});
 for(const invalid of [
  {...plan,time:"24:00"},{...plan,time:"13:60"},
  {...plan,date:"2026-02-30"},{...plan,kind:"alarm"},
  {...plan,secret:"x"},null,[],false
 ]){
  if(invalid===null)assert.equal(parsePersonalCommand(command(invalid))?.countdownPlan,null);
  else assert.equal(parsePersonalCommand(command(invalid)),null);
 }
 assert.equal(parsePersonalCommand(command(plan,{startDate:"2026-11-18"})),null);
 assert.equal(parsePersonalCommand(command(plan,{scheduleKind:"Daily"})),null);
 assert.equal(parsePersonalCommand(command(plan,{measurement:{target:1,unit:"مرة"}})),null);
 assert.equal(parsePersonalCommand(command(plan,{kind:"Habit"})),null);
 assert.ok(parsePersonalCommand(command({kind:"task",date:"2026-11-19",time:"09:00"},{startDate:"2026-11-12",endDate:"2026-11-22",scheduleKind:"Daily"})));
});
test("R301: owner-saved event survives workspace read and is excluded from task achievement without changing legacy tasks",async()=>{
 const store=new InMemoryFoundationStore({personalDays:[day],definitions:[],dailyExecution:[]});
 const service=new PersonalCommandService({clock:{now:()=>at},transaction:store,idGenerator:new SequenceIdGenerator()});
 const plan={kind:"event",date:"2026-11-19",time:"18:00"};
 await service.execute("owner",parsePersonalCommand(command(plan)));
 const snapshot=store.snapshot();
 const saved=snapshot.definitions.find(x=>x.title==="مراجعة الطبيب");
 assert.ok(saved);
 assert.deepEqual(saved.countdownPlan,plan);
 assert.equal(saved.effectiveFromDate,"2026-11-19");
 const w=buildPersonalWorkspace("owner",{
  listDefinitions:()=>snapshot.definitions,listPersonalDays:()=>snapshot.personalDays,
  listDailyExecutionForUser:()=>snapshot.dailyExecution
 });
 assert.deepEqual(w.definitions.find(x=>x.id===saved.id)?.countdownPlan,plan);
 assert.equal(w.insights.periods.week.scheduled,0);
 assert.equal(w.statistics.rows.length,0);
 const fakeExecution={id:"ev",userId:"owner",personalDayId:"day",definitionId:saved.id,definitionRevisionId:saved.revisionId,kind:"Task",title:saved.title,materializationKey:"ev",scheduleOccurrenceKey:date,status:"Pending",eligibility:{definitionRevisionId:saved.revisionId,importance:"Supporting",weight:1,gatePolicy:"NonBlocking",targets:{}},version:1,createdAt:at,updatedAt:at};
 const marked=buildPersonalWorkspace("owner",{
  listDefinitions:()=>snapshot.definitions,listPersonalDays:()=>snapshot.personalDays,
  listDailyExecutionForUser:()=>[fakeExecution]
 });
 assert.equal(marked.insights.periods.week.scheduled,0);
 assert.equal(marked.statistics.rows[0].nonAchievement,true);
});
