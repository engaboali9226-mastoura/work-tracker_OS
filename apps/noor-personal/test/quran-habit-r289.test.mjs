import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
const root=path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist");
const {PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,parsePersonalCommand}=
 await import(pathToFileURL(path.join(root,"index.js")).href);
const now="2026-11-11T10:00:00.000Z";
const date="2026-11-11";
const day={id:"owner-day",userId:"owner",boundary:{key:"owner-day",localDate:date,
 startAt:"2026-11-10T21:00:00.000Z",endAt:"2026-11-11T21:00:00.000Z",timeZone:"Asia/Riyadh"},
 state:"Open",version:1,createdAt:now,updatedAt:now};
const base={type:"create-definition",kind:"Habit",title:"الورد القرآني",category:"العبادات",
 startDate:date,endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Essential",weight:10};
const plan={anchorDate:date,firstQuarter:2,repeatOccurrences:3};
const fixture=()=>{const store=new InMemoryFoundationStore({personalDays:[day],definitions:[],dailyExecution:[]});
 const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 return {store,service};};
test("R289: strict Quran quarter plan allowlist and legacy habit compatibility",()=>{
 assert.equal(parsePersonalCommand(base)?.type,"create-definition");
 assert.deepEqual(parsePersonalCommand({...base,quranPlan:plan})?.quranPlan,plan);
 assert.equal(parsePersonalCommand({...base,quranPlan:null})?.quranPlan,null);
 for(const invalid of [
  {anchorDate:date,firstQuarter:0,repeatOccurrences:1},{anchorDate:date,firstQuarter:241,repeatOccurrences:1},
  {anchorDate:date,firstQuarter:1.5,repeatOccurrences:1},{anchorDate:date,firstQuarter:1,repeatOccurrences:31},
  {anchorDate:date,firstQuarter:1,repeatOccurrences:1,secret:"x"},{anchorDate:"2026-02-30",firstQuarter:1,repeatOccurrences:1},[],false]){
   assert.equal(parsePersonalCommand({...base,quranPlan:invalid}),null);
 }
 assert.equal(parsePersonalCommand({...base,kind:"Task",quranPlan:plan}),null);
});
test("R289: owner creates, modifies and clears Quran plan without mutating history",async()=>{
 const f=fixture();await f.service.execute("owner",parsePersonalCommand({...base,quranPlan:plan}));
 const first=f.store.snapshot().definitions[0];
 assert.equal(first.kind,"Habit");assert.deepEqual(first.quranPlan,plan);
 const revised={...base,type:"update-definition",definitionId:first.id,expectedRevisionId:first.revisionId,
   quranPlan:{anchorDate:date,firstQuarter:120,repeatOccurrences:2}};
 await f.service.execute("owner",parsePersonalCommand(revised));
 const second=f.store.snapshot().definitions[0];
 assert.deepEqual(second.quranPlan,revised.quranPlan);
 assert.equal(second.id,first.id);
 assert.equal(second.activityLog?.length??0,0);
 await assert.rejects(()=>f.service.execute("other",parsePersonalCommand({
    ...revised,expectedRevisionId:second.revisionId,quranPlan:null
   })),/DEFINITION_NOT_FOUND/);
 assert.deepEqual(f.store.snapshot().definitions[0].quranPlan,revised.quranPlan);
 await f.service.execute("owner",parsePersonalCommand({
   ...revised,expectedRevisionId:second.revisionId,quranPlan:null
 }));
 const third=f.store.snapshot().definitions[0];
 assert.equal(third.quranPlan,undefined);
 assert.equal(third.kind,"Habit");
});
test("R289: old client updates do not accidentally clear Quran plan",async()=>{
 const f=fixture();await f.service.execute("owner",parsePersonalCommand({...base,quranPlan:plan}));
 const first=f.store.snapshot().definitions[0];
 await f.service.execute("owner",parsePersonalCommand({
   ...base,type:"update-definition",definitionId:first.id,expectedRevisionId:first.revisionId,title:"ورد القرآن اليوم"
 }));
 assert.deepEqual(f.store.snapshot().definitions[0].quranPlan,plan);
});
