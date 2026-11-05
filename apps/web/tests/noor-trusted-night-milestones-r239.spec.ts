import assert from "node:assert/strict";
import test from "node:test";
import {nightMilestones,nightCountdownState} from "../src/noor-personal-application-view.js";
const prayers=[
 {key:"fajr",at:"2026-11-06T02:50:00Z",label:"الفجر"},
 {key:"maghrib",at:"2026-11-06T14:15:00Z",label:"المغرب"},
 {key:"isha",at:"2026-11-06T15:37:00Z",label:"العشاء"},
];
test("R239 next-day Fajr must be trusted and missing snapshot never derives today Fajr + 24h",()=>{
 assert.equal(nightMilestones(prayers),null);
 assert.equal(nightMilestones(prayers,prayers[0]!.at),null);
 assert.equal(nightCountdownState(prayers,Date.parse("2026-11-06T20:00:00Z")),null);
 assert.equal(nightMilestones(prayers,"not-a-time"),null);
});
test("R239 midnight and final third are based on real tomorrow Fajr even if tomorrow differs from today",()=>{
 const next="2026-11-07T02:57:00Z";
 const start=Date.parse(prayers[1]!.at),end=Date.parse(next),duration=end-start;
 const result=nightMilestones(prayers,next);
 assert.deepEqual(result,{
   midnight:new Date(start+duration/2).toISOString(),
   lastThird:new Date(start+2*duration/3).toISOString(),
 });
 assert.notEqual(result?.midnight,new Date(start+(Date.parse("2026-11-07T02:50:00Z")-start)/2).toISOString());
});
test("R239 countdown is only enabled inside the confirmed tonight window",()=>{
 const next="2026-11-07T02:57:00Z";
 const before=nightCountdownState(prayers,Date.parse("2026-11-06T15:36:59Z"),next);
 const during=nightCountdownState(prayers,Date.parse("2026-11-07T00:00:01Z"),next);
 const after=nightCountdownState(prayers,Date.parse(next),next);
 assert.equal(before?.enabled,false);
 assert.equal(during?.enabled,true);
 assert.equal(after?.enabled,false);
 assert.equal(during?.midnight,nightMilestones(prayers,next)?.midnight);
 assert.equal(nightMilestones(prayers,"2026-11-09T12:00:00Z"),null);
});
