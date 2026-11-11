import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
const root=path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist");
const {PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,parsePersonalCommand}=
 await import(pathToFileURL(path.join(root,"index.js")).href);
const date="2026-11-11",now="2026-11-11T10:00:00.000Z",next="2026-11-12";
const day={id:"day-1",userId:"owner",boundary:{key:"day-1",localDate:date,
 startAt:"2026-11-10T21:00:00.000Z",endAt:"2026-11-11T21:00:00.000Z",timeZone:"Asia/Riyadh"},
 state:"Open",version:1,createdAt:now,updatedAt:now};
const plan={targetServings:2,servingMl:180};
const base={id:"coffee-id",userId:"owner",kind:"Habit",revisionId:"coffee-rev",title:"قهوة",category:"الصحة والرياضة",
 state:"Active",schedule:{kind:"Daily"},effectiveFromDate:date,importance:"Optional",weight:1,gatePolicy:"NonBlocking",
 targets:{},beveragePlan:plan};
const execution={id:"coffee-execution",userId:"owner",personalDayId:day.id,definitionId:base.id,
 definitionRevisionId:base.revisionId,kind:"Habit",title:"قهوة",materializationKey:"coffee-day",
 scheduleOccurrenceKey:date,status:"Pending",eligibility:{definitionRevisionId:base.revisionId,importance:"Optional",
 weight:1,gatePolicy:"NonBlocking",targets:{}},version:1,createdAt:now,updatedAt:now};
const template={type:"create-definition",kind:"Habit",title:"شاي",category:"الصحة والرياضة",
 startDate:date,endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Optional",weight:1};
const cmd=(id,delta=1)=>({type:"adjust-beverage-serving",executionId:execution.id,entryId:id,delta});
const fixture=(definitions=[base],instances=[execution])=>{
 const store=new InMemoryFoundationStore({personalDays:[day],definitions,dailyExecution:instances});
 let current=now;
 const service=new PersonalCommandService({clock:{now:()=>current},idGenerator:new SequenceIdGenerator(),transaction:store});
 return {store,service,setTime:t=>{current=t;},drink:()=>store.snapshot().definitions.find(d=>d.id===base.id),
  item:()=>store.snapshot().dailyExecution.find(d=>d.id===execution.id)};
};

test("R294: strict allowlisted beverage plan and serving counter commands",()=>{
 assert.deepEqual(parsePersonalCommand({...template,beveragePlan:plan})?.beveragePlan,plan);
 assert.deepEqual(parsePersonalCommand({...template,beveragePlan:{targetServings:1}})?.beveragePlan,{targetServings:1});
 assert.deepEqual(parsePersonalCommand({...template,beveragePlan:null})?.beveragePlan,null);
 for(const invalid of [{targetServings:0},{targetServings:31},{targetServings:1.5},
  {targetServings:2,servingMl:0},{targetServings:2,servingMl:2001},{targetServings:2,secret:"x"},[],false])
  assert.equal(parsePersonalCommand({...template,beveragePlan:invalid}),null);
 assert.equal(parsePersonalCommand({...template,kind:"Task",beveragePlan:plan}),null);
 assert.equal(parsePersonalCommand({...template,scheduleKind:"Weekdays",weekdays:[3],beveragePlan:plan}),null);
 assert.equal(parsePersonalCommand({...template,beveragePlan:plan,quranPlan:{anchorDate:date,firstQuarter:1,repeatOccurrences:1}}),null);
 assert.deepEqual(parsePersonalCommand(cmd("a",1)),cmd("a",1));
 assert.deepEqual(parsePersonalCommand(cmd("b",-1)),cmd("b",-1));
 for(const invalid of [0,2,1.5,"1",null]){
  assert.equal(parsePersonalCommand(cmd("x",invalid)),null);
 }
 assert.equal(parsePersonalCommand({...cmd("x"),foreignAccount:"other"}),null);
});

test("R294: coffee 2 servings and tea 1 serving persist independently with exact civil-day credit",async()=>{
 const f=fixture();
 const t=await f.service.execute("owner",parsePersonalCommand({...template,beveragePlan:{targetServings:1}}));
 assert.equal(f.store.snapshot().definitions.length,2);
 assert.equal(f.store.snapshot().definitions.find(d=>d.title==="شاي").beveragePlan.targetServings,1);
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-1")));
 assert.equal(f.item().status,"Pending");assert.equal(f.drink().activityLog.length,1);
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-2")));
 assert.equal(f.item().status,"Completed");
 assert.deepEqual(f.drink().activityLog.map(e=>[e.localDate,e.amount,e.executionId]),[[date,1,execution.id],[date,1,execution.id]]);
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-3")));
 assert.equal(f.item().status,"Completed");
 assert.equal(f.drink().activityLog.reduce((n,e)=>n+e.amount,0),3,"more than the target is valid drink history");
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-3")));
 assert.equal(f.drink().activityLog.length,3,"replayed ack cannot double-add");
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-correct",-1)));
 assert.equal(f.item().status,"Completed");
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-correct-2",-1)));
 assert.equal(f.item().status,"Pending");
 assert.equal(f.drink().activityLog.reduce((n,e)=>n+e.amount,0),1);
 await f.service.execute("owner",parsePersonalCommand(cmd("coffee-correct-2",-1)));
 assert.equal(f.drink().activityLog.length,5,"correction also idempotent");
 await assert.rejects(()=>f.service.execute("owner",parsePersonalCommand(cmd("coffee-low-1",-1))).then(()=>f.service.execute("owner",parsePersonalCommand(cmd("coffee-low-2",-1)))),/BEVERAGE_DAILY_COUNT_OUT_OF_RANGE/);
 assert.equal(f.drink().activityLog.length,6,"cannot subtract below zero");
});

test("R294: cannot tick beverage completion by hand, forge activity amounts or backdate another day",async()=>{
 const f=fixture();
 await assert.rejects(()=>f.service.execute("owner",{type:"set-execution-completed",executionId:execution.id,completed:true}),/BEVERAGE_COMPLETION_FROM_SERVINGS_ONLY/);
 await assert.rejects(()=>f.service.execute("owner",{type:"record-activity",executionId:execution.id,entryId:"other",note:"",amount:1,endReason:null}),/BEVERAGE_SERVINGS_REQUIRE_COUNTER/);
 await assert.rejects(()=>f.service.execute("other",parsePersonalCommand(cmd("attack"))),/EXECUTION_NOT_FOUND/);
 assert.equal(f.drink().activityLog?.length??0,0);
 f.setTime("2026-11-12T10:00:00.000Z");
 await assert.rejects(()=>f.service.execute("owner",parsePersonalCommand(cmd("tomorrow"))),/CURRENT_PERSONAL_DAY_REQUIRED/);
 assert.equal(f.drink().activityLog?.length??0,0);
});

test("R294: edit beverage target and preserve previous owner history and plans",async()=>{
 const f=fixture();
 await f.service.execute("owner",parsePersonalCommand(cmd("first")));
 const definition=f.drink();
 const updated={...template,title:"قهوة سوداء",type:"update-definition",definitionId:definition.id,
   expectedRevisionId:definition.revisionId,beveragePlan:{targetServings:3,servingMl:120}};
 await f.service.execute("owner",parsePersonalCommand(updated));
 assert.equal(f.drink().title,"قهوة سوداء");
 assert.equal(f.drink().beveragePlan.targetServings,3);
 assert.equal(f.drink().activityLog.length,1);
 const revision=f.drink().revisionId;
 await f.service.execute("owner",parsePersonalCommand({...template,title:"قهوة سوداء",type:"update-definition",
  definitionId:definition.id,expectedRevisionId:revision}));
 assert.equal(f.drink().beveragePlan.targetServings,3,"older clients never erase drink settings");
 await assert.rejects(()=>f.service.execute("other",parsePersonalCommand({...updated,expectedRevisionId:f.drink().revisionId})),/DEFINITION_NOT_FOUND/);
 assert.equal(f.drink().activityLog.length,1);
});
