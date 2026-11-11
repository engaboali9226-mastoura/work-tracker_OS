import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";
const root=path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist");
const {PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,parsePersonalCommand}=
  await import(pathToFileURL(path.join(root,"index.js")).href);
const date="2026-11-11",now="2026-11-11T10:00:00.000Z";
const day={id:"owner-day",userId:"owner",boundary:{key:"owner-day",localDate:date,
  startAt:"2026-11-10T21:00:00.000Z",endAt:"2026-11-11T21:00:00.000Z",timeZone:"Asia/Riyadh"},
  state:"Open",version:1,createdAt:now,updatedAt:now};
const habit={type:"create-definition",kind:"Habit",title:"الورد اليومي",category:"العبادات",
  startDate:date,endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Important"};
const task={...habit,kind:"Task",title:"قراءة كتاب",category:"القراءة"};
const fixture=()=>{const store=new InMemoryFoundationStore({personalDays:[day],definitions:[],dailyExecution:[]});
  const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
  return {store,service,get:()=>store.snapshot().definitions[0]};};
const update=(old,fields={})=>({...habit,type:"update-definition",definitionId:old.id,expectedRevisionId:old.revisionId,...fields});
test("R293 strict optional description: no unknown keys or oversized content, older clients still valid",()=>{
  assert.ok(parsePersonalCommand(habit));assert.ok(parsePersonalCommand(task));
  assert.equal(parsePersonalCommand({...habit,description:"تحضير الورد"})?.description,"تحضير الورد");
  assert.equal(parsePersonalCommand({...habit,description:"  "})?.description,"");
  for(const invalid of [null,{},4,"x".repeat(2001)])assert.equal(parsePersonalCommand({...habit,description:invalid}),null);
  assert.equal(parsePersonalCommand({...habit,description:"safe",unexpected:"no"}),null);
});
test("R293 owner saves, updates, clears, and preserves description across old-client edits",async()=>{
  const f=fixture();
  await f.service.execute("owner",parsePersonalCommand({...habit,description:"  الربع الأول\nخطة اليوم  "}));
  const first=f.get();assert.equal(first.description,"الربع الأول\nخطة اليوم");
  const originalId=first.id;
  await f.service.execute("owner",parsePersonalCommand(update(first,{title:"ورد القراءة"})));
  const second=f.get();assert.equal(second.id,originalId);assert.equal(second.description,first.description);
  await f.service.execute("owner",parsePersonalCommand(update(second,{description:"تسميع بعد الفجر"})));
  assert.equal(f.get().description,"تسميع بعد الفجر");
  await assert.rejects(()=>f.service.execute("other",parsePersonalCommand(update(f.get(),{description:"unauthorized"}))),/DEFINITION_NOT_FOUND/);
  assert.equal(f.get().description,"تسميع بعد الفجر");
  await f.service.execute("owner",parsePersonalCommand(update(f.get(),{description:""})));
  assert.equal(f.get().description,undefined);assert.equal(f.get().id,originalId);
});
test("R293 descriptions work on tasks without altering session plans",async()=>{
  const f=fixture();
  await f.service.execute("owner",parsePersonalCommand({...task,description:"ثلاث جلسات قراءة"}));
  assert.equal(f.get().description,"ثلاث جلسات قراءة");assert.equal(f.get().kind,"Task");
});
