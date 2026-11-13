import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";
const moduleUrl=pathToFileURL(path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist","index.js")).href;
const {InMemoryFoundationStore,PersonalCommandService,SequenceIdGenerator,parsePersonalCommand}=
  await import(moduleUrl);
const now="2026-11-13T08:30:00.000Z";
const base=(id,userId="owner")=>({id,userId,kind:"Habit",revisionId:id+"-rev",
 title:"القراءة",category:"التعلم",state:"Active",schedule:{kind:"Daily"},
 effectiveFromDate:"2026-11-01",importance:"Important",weight:2,gatePolicy:"NonBlocking",targets:{}});
const plan={enabled:true,time:"18:30",leadMinutes:15,graceMinutes:30,
 minStreak:3,quietStart:"22:00",quietEnd:"06:00"};
const fixture=()=>{
 const store=new InMemoryFoundationStore({definitions:[base("habit"),base("foreign","someone-else")]});
 const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 const get=(id="habit")=>store.snapshot().definitions.find(d=>d.id===id);
 return {store,service,get};
};
test("R314 command strictly rejects malformed reminders and keeps unrelated commands backwards compatible",()=>{
 const cmd={type:"configure-reminder",definitionId:"habit",expectedRevisionId:"habit-rev",plan};
 assert.deepEqual(parsePersonalCommand(cmd),cmd);
 for(const invalid of [
  {...cmd,plan:{...plan,time:"25:05"}},
  {...cmd,plan:{...plan,enabled:"true"}},
  {...cmd,plan:{...plan,leadMinutes:14}},
  {...cmd,plan:{...plan,quietStart:"22:00",quietEnd:null}},
  {...cmd,plan:{...plan,unexpected:"debug"}},
  {...cmd,unexpected:true},
  {...cmd,expectedRevisionId:""},
 ]) assert.equal(parsePersonalCommand(invalid),null);
 assert.deepEqual(parsePersonalCommand({...cmd,plan:null}),{...cmd,plan:null});
});
test("R314 persist/modify/remove reminder under one owner, never change frozen achievement",async()=>{
 const f=fixture(),first=f.get();
 await f.service.execute("owner",{type:"configure-reminder",definitionId:first.id,expectedRevisionId:first.revisionId,plan});
 const saved=f.get();
 assert.deepEqual(saved.reminderPlan,plan);
 assert.notEqual(saved.revisionId,first.revisionId);
 assert.equal(saved.id,first.id);
 assert.equal(saved.weight,first.weight);
 await assert.rejects(()=>f.service.execute("owner",{type:"configure-reminder",definitionId:first.id,expectedRevisionId:first.revisionId,plan:{...plan,time:"07:00"}}),/DEFINITION_STATE_CONFLICT/);
 assert.equal(f.get().reminderPlan.time,"18:30");
 await assert.rejects(()=>f.service.execute("owner",{type:"configure-reminder",definitionId:"foreign",expectedRevisionId:"foreign-rev",plan}),/DEFINITION_NOT_FOUND/);
 assert.equal(f.get("foreign").reminderPlan,undefined);
 await f.service.execute("owner",{type:"configure-reminder",definitionId:saved.id,expectedRevisionId:saved.revisionId,plan:null});
 assert.equal(f.get().reminderPlan,undefined);
});
test("R314 idempotent retry does not churn revision; archived definitions reject writes",async()=>{
 const f=fixture(),first=f.get();
 await f.service.execute("owner",{type:"configure-reminder",definitionId:first.id,expectedRevisionId:first.revisionId,plan});
 const saved=f.get();
 await f.service.execute("owner",{type:"configure-reminder",definitionId:saved.id,expectedRevisionId:saved.revisionId,plan});
 assert.equal(f.get().revisionId,saved.revisionId);
 await f.service.execute("owner",{type:"archive-definition",definitionId:saved.id});
 await assert.rejects(()=>f.service.execute("owner",{type:"configure-reminder",definitionId:saved.id,expectedRevisionId:saved.revisionId,plan:null}),/DEFINITION_STATE_CONFLICT/);
});
