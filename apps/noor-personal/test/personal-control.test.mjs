import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const buildDir = process.env.NOOR_PERSONAL_BUILD_DIR ?? "dist";
const moduleUrl = pathToFileURL(path.resolve(buildDir,"index.js")).href;

function personalDay() {
  return {
    id:"day-1",userId:"user-1",
    boundary:{key:"personal-day:user-1:2026-10-24",localDate:"2026-10-24",startAt:"2026-10-24T01:37:00.000Z",endAt:"2026-10-25T01:37:00.000Z",calculatedFajrAt:"2026-10-24T01:37:00.000Z",nextCalculatedFajrAt:"2026-10-25T01:37:00.000Z",fajrAdjustmentMinutes:0,personalDayOffsetMinutes:0,locationRevisionId:"location-1",prayerPolicyRevisionId:"policy-1",timeZone:"Asia/Riyadh",calculationMethod:"UmmAlQura",calculationSource:"adhan",calculationEngineVersion:"4.4.4"},
    state:"Open",version:1,createdAt:"2026-10-24T02:00:00.000Z",updatedAt:"2026-10-24T02:00:00.000Z",
  };
}

function command(overrides={}) {
  return {type:"create-definition",kind:"Habit",title:"المشي",category:"الصحة والرياضة",startDate:"2026-10-24",endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Supporting",...overrides};
}

test("create-definition requires classification, dates, recurrence and importance", async()=>{
  const { parsePersonalCommand } = await import(moduleUrl);
  assert.equal(parsePersonalCommand({type:"create-definition",kind:"Habit",title:"المشي"}),null);
  assert.deepEqual(parsePersonalCommand(command()),command());
  assert.equal(parsePersonalCommand(command({scheduleKind:"Weekdays",weekdays:[]})),null);
  assert.equal(parsePersonalCommand(command({endDate:"2026-10-20"})),null);
});

test("creates categorized scheduled definitions and archives without deleting history", async()=>{
  const { InMemoryFoundationStore, PersonalCommandService, SequenceIdGenerator } = await import(moduleUrl);
  const store = new InMemoryFoundationStore({personalDays:[personalDay()]});
  const service = new PersonalCommandService({clock:{now(){return "2026-10-24T12:00:00.000Z";}},idGenerator:new SequenceIdGenerator(),transaction:store});
  await service.execute("user-1",command({kind:"Task",title:"تمرين",scheduleKind:"Weekdays",weekdays:[0,2,4],importance:"Important",endDate:"2026-12-31"}));
  let definition=store.snapshot().definitions[0];
  assert.equal(definition.category,"الصحة والرياضة");
  assert.deepEqual(definition.schedule,{kind:"Weekdays",weekdays:[0,2,4]});
  assert.equal(definition.effectiveFromDate,"2026-10-24");
  assert.equal(definition.effectiveUntilDate,"2026-12-31");
  assert.equal(definition.importance,"Important");
  await service.execute("user-1",{type:"archive-definition",definitionId:definition.id});
  definition=store.snapshot().definitions[0];
  assert.equal(definition.state,"Archived");
});

test("pause and reactivate preserve definition identity", async()=>{
  const { InMemoryFoundationStore, PersonalCommandService, SequenceIdGenerator } = await import(moduleUrl);
  const definition={id:"habit-1",userId:"user-1",kind:"Habit",revisionId:"revision-1",title:"المشي",category:"الصحة والرياضة",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:"2026-10-24",importance:"Supporting",weight:1,gatePolicy:"NonBlocking",targets:{}};
  const store=new InMemoryFoundationStore({personalDays:[personalDay()],definitions:[definition]});
  const service=new PersonalCommandService({clock:{now(){return "2026-10-24T12:00:00.000Z";}},idGenerator:new SequenceIdGenerator(),transaction:store});
  await service.execute("user-1",{type:"set-definition-state",definitionId:"habit-1",state:"Paused"});
  assert.equal(store.snapshot().definitions[0].state,"Paused");
  assert.equal(store.snapshot().definitions[0].revisionId,"revision-1");
  await service.execute("user-1",{type:"set-definition-state",definitionId:"habit-1",state:"Active"});
  assert.equal(store.snapshot().definitions[0].state,"Active");
});

test("workspace preserves categories and computes streaks", async()=>{
  const { buildPersonalWorkspace } = await import(moduleUrl);
  const execution=["2026-10-22","2026-10-23","2026-10-24"].map((date,index)=>({id:`e-${index}`,userId:"user-1",personalDayId:`d-${index}`,definitionId:"habit-1",definitionRevisionId:"r1",kind:"Habit",title:"المشي",materializationKey:`m-${index}`,scheduleOccurrenceKey:date,status:"Completed",eligibility:{definitionRevisionId:"r1",importance:"Supporting",weight:1,gatePolicy:"NonBlocking",targets:{}},version:1,createdAt:"2026-10-24T02:00:00.000Z",updatedAt:"2026-10-24T02:00:00.000Z"}));
  const workspace=buildPersonalWorkspace("user-1",{listDefinitions(){return [{id:"habit-1",userId:"user-1",kind:"Habit",revisionId:"r1",title:"المشي",category:"الصحة والرياضة",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:"2026-10-22",importance:"Supporting",weight:1,gatePolicy:"NonBlocking",targets:{}}];},listPersonalDays(){return ["2026-10-22","2026-10-23","2026-10-24"].map((date,index)=>({...personalDay(),id:`d-${index}`,boundary:{...personalDay().boundary,localDate:date}}));},listDailyExecutionForUser(){return execution;}});
  assert.equal(workspace.definitions[0].category,"الصحة والرياضة");
  assert.equal(workspace.insights.currentStreakDays,3);
});
