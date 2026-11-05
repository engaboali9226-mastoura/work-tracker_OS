import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";
const moduleUrl=pathToFileURL(path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist","index.js")).href;
const now="2026-11-05T11:00:00.000Z";
const day={id:"today",userId:"owner",boundary:{key:"civil:owner:2026-11-05",localDate:"2026-11-05",startAt:"2026-11-04T21:00:00.000Z",endAt:"2026-11-05T21:00:00.000Z",calculatedFajrAt:"2026-11-05T02:00:00.000Z",nextCalculatedFajrAt:"2026-11-06T02:00:00.000Z",fajrAdjustmentMinutes:0,personalDayOffsetMinutes:0,locationRevisionId:"loc",prayerPolicyRevisionId:"p",timeZone:"Asia/Riyadh",calculationMethod:"UmmAlQura",calculationSource:"adhan",calculationEngineVersion:"4.4.4"},state:"Open",version:1,createdAt:now,updatedAt:now};
const def=(id,kind="Habit")=>({id,userId:"owner",kind,revisionId:id+"-rev",title:id,category:"عام",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:"2026-11-01",importance:"Supporting",weight:1,gatePolicy:"NonBlocking",targets:{}});
const exe=(id,personalDayId)=>({id:id+"-"+personalDayId,userId:"owner",personalDayId,definitionId:id,definitionRevisionId:id+"-rev",kind:"Habit",title:id,materializationKey:id+"-"+personalDayId,scheduleOccurrenceKey:"2026-11-05",status:"Completed",eligibility:{definitionRevisionId:id+"-rev",importance:"Supporting",weight:1,gatePolicy:"NonBlocking",targets:{}},version:1,createdAt:now,updatedAt:now});
test("R251 validates bounded unique weight batch",async()=>{
 const {parsePersonalCommand}=await import(moduleUrl);
 const item={definitionId:"fajr",expectedRevisionId:"fajr-rev",weight:25};
 assert.deepEqual(parsePersonalCommand({type:"rebalance-habit-weights",changes:[item]}),{type:"rebalance-habit-weights",changes:[item]});
 for(const weight of [0,101,1.3])assert.equal(parsePersonalCommand({type:"rebalance-habit-weights",changes:[{...item,weight}]}),null);
 assert.equal(parsePersonalCommand({type:"rebalance-habit-weights",changes:[item,item]}),null);
});
test("R251 updates today's snapshot and future habit definition, but never past day or task",async()=>{
 const {InMemoryFoundationStore,PersonalCommandService,SequenceIdGenerator}=await import(moduleUrl);
 const past={...day,id:"past",state:"Closed",boundary:{...day.boundary,localDate:"2026-11-04",startAt:"2026-11-03T21:00:00.000Z",endAt:"2026-11-04T21:00:00.000Z"}};
 const store=new InMemoryFoundationStore({personalDays:[past,day],definitions:[def("fajr"),def("quran"),def("task","Task")],dailyExecutions:[exe("fajr","past"),exe("fajr","today"),exe("quran","today")]});
 const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 await service.execute("owner",{type:"rebalance-habit-weights",changes:[{definitionId:"fajr",expectedRevisionId:"fajr-rev",weight:25},{definitionId:"quran",expectedRevisionId:"quran-rev",weight:12}]});
 const snapshot=store.snapshot();
 assert.equal(snapshot.definitions.find(d=>d.id==="fajr").weight,25);
 assert.equal(snapshot.definitions.find(d=>d.id==="quran").weight,12);
 assert.equal(snapshot.definitions.find(d=>d.id==="task").weight,1);
 assert.equal(snapshot.dailyExecutions.find(d=>d.id==="fajr-past").eligibility.weight,1);
 assert.equal(snapshot.dailyExecutions.find(d=>d.id==="fajr-today").eligibility.weight,25);
});
test("R251 rejects stale revision for all-or-nothing batch",async()=>{
 const {InMemoryFoundationStore,PersonalCommandService,SequenceIdGenerator}=await import(moduleUrl);
 const store=new InMemoryFoundationStore({personalDays:[day],definitions:[def("a"),def("b")]});
 const svc=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 await assert.rejects(()=>svc.execute("owner",{type:"rebalance-habit-weights",changes:[{definitionId:"a",expectedRevisionId:"a-rev",weight:25},{definitionId:"b",expectedRevisionId:"stale",weight:8}]}));
 assert.deepEqual(store.snapshot().definitions.map(d=>d.weight),[1,1]);
});
