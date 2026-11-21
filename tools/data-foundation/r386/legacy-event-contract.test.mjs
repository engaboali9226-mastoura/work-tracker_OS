import test from "node:test";
import assert from "node:assert/strict";
import {validateLegacyEvent,validateOwnerEvents,eventTypeCounts,supportedLegacyEventTypes} from "./legacy-event-contract.mjs";
const owner="synthetic-owner";
function event(type="ExecutionCompleted",aggregateType="DailyExecutionInstance",payload={definitionId:"d1",executionStatus:"Completed"}){
 return {id:"e1",idempotencyKey:"k1",eventType:type,eventVersion:1,aggregateType,aggregateId:"a1",aggregateVersion:1,userId:owner,occurredAt:"2026-11-01T10:00:00.000Z",correlationId:"c1",personalDayId:"day1",privacyClassification:"PersonalOperationalData",payload,deliveryState:"Pending"};
}
const fixtures=[
 event(),event("ExecutionMissed","DailyExecutionInstance",{definitionId:"d1",executionStatus:"Missed"}),
 event("ExecutionCancelled","DailyExecutionInstance",{definitionId:"d1",executionStatus:"Cancelled"}),
 event("ExecutionReopened","DailyExecutionInstance",{definitionId:"d1",executionStatus:"Pending"}),
 event("PersonalDayCreated","PersonalDay",{boundaryKey:"b1",localDate:"2026-11-01"}),
 event("DailyIslamicContextBuilt","DailyIslamicContext",{personalDayId:"day1",localDate:"2026-11-01",approvedHistoryEventCount:2}),
 event("DailyTaskMaterialized","DailyTaskInstance",{definitionId:"d1",definitionRevisionId:"rev1",materializationKey:"m1"}),
 event("HabitOccurrenceMaterialized","HabitOccurrence",{definitionId:"d1",definitionRevisionId:"rev1",materializationKey:"m1"}),
 event("LocationProfileChanged","LocationProfile",{newLocationRevisionId:"r2",previousLocationRevisionId:"r1",newTimeZone:"Asia/Riyadh",previousTimeZone:"UTC"}),
 event("TodayReconciled","PersonalDay",{definitionsEvaluated:2,duplicatesPrevented:0,instancesCreated:1,instancesUpdated:0,restored:0,suppressed:0})
].map((e,i)=>({...e,id:"e"+i,idempotencyKey:"k"+i}));
test("all ten code-defined v1 event types accepted without mutation",()=>{assert.equal(fixtures.length,supportedLegacyEventTypes.length);const before=JSON.stringify(fixtures);assert.equal(validateOwnerEvents(owner,fixtures),10);assert.equal(JSON.stringify(fixtures),before);assert.deepEqual(Object.values(eventTypeCounts(owner,fixtures)),Array(10).fill(1));});
test("location may have no personal day; others require one",()=>{const location={...fixtures[8]};delete location.personalDayId;assert.equal(validateLegacyEvent(owner,location),true);const completion=event();delete completion.personalDayId;assert.throws(()=>validateLegacyEvent(owner,completion),/R386_EVENT_IDENTITY/);});
test("owner, ID and request-key collisions rejected independently",()=>{assert.throws(()=>validateLegacyEvent("wrong",event()),/R386_EVENT_OWNER/);assert.throws(()=>validateOwnerEvents(owner,[event(),{...event(),idempotencyKey:"k2"}]),/DUPLICATE/);assert.throws(()=>validateOwnerEvents(owner,[event(),{...event(),id:"e2"}]),/DUPLICATE/);});
test("reject private payload, unrecognized fields and versions without exposing content",()=>{for(const e of [{...event(),payload:{...event().payload,note:"synthetic-secret"}},{...event(),note:"synthetic-secret"},{...event(),privacyClassification:"SensitiveWellbeingData"},{...event(),eventVersion:2},{...event(),eventType:"unknown"}])assert.throws(()=>validateLegacyEvent(owner,e),err=>/^R386_/.test(err.message)&&!err.message.includes("synthetic-secret"));});
test("date, counts, status and day integrity",()=>{for(const e of [{...event(),occurredAt:"2026-02-30T12:00:00Z"},{...fixtures[4],payload:{boundaryKey:"b1",localDate:"2026-02-30"}},{...fixtures[5],payload:{...fixtures[5].payload,approvedHistoryEventCount:-1}},{...fixtures[5],payload:{...fixtures[5].payload,personalDayId:"wrong-day"}},{...event(),payload:{definitionId:"d1",executionStatus:"Missed"}},{...fixtures[8],payload:{...fixtures[8].payload,newTimeZone:"not-a-zone"}}])assert.throws(()=>validateLegacyEvent(owner,e),/R386_EVENT_/);});
test("output contains counts only and preserves original delivery state",()=>{const e=event();const value=eventTypeCounts(owner,[e]);assert.equal(value.ExecutionCompleted,1);assert.equal(Object.values(value).reduce((a,b)=>a+b),1);assert.equal(e.deliveryState,"Pending");assert.equal(JSON.stringify(value).includes(owner),false);});
