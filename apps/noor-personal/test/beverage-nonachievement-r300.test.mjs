import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
const {buildPersonalWorkspace}=await import(pathToFileURL(path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist","index.js")).href);
const at="2026-11-12T10:00:00.000Z",date="2026-11-12";
const day={id:"day",userId:"owner",boundary:{key:"day",localDate:date,startAt:"2026-11-11T21:00:00Z",endAt:"2026-11-12T21:00:00Z",timeZone:"Asia/Riyadh"},state:"Open",version:1,createdAt:at,updatedAt:at};
const definition=(id,beveragePlan)=>({id,userId:"owner",kind:"Habit",revisionId:id+"-rev",title:id,
 category:"الصحة والرياضة",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:date,importance:"Optional",weight:5,gatePolicy:"NonBlocking",targets:{},...(beveragePlan?{beveragePlan}:{})});
const execution=(id,status)=>({id:id+"-exec",userId:"owner",personalDayId:"day",definitionId:id,definitionRevisionId:id+"-rev",
 kind:"Habit",title:id,materializationKey:id+"-key",scheduleOccurrenceKey:date,status,
 eligibility:{definitionRevisionId:id+"-rev",importance:"Optional",weight:5,gatePolicy:"NonBlocking",targets:{}},
 version:1,createdAt:at,updatedAt:at});
const view=(ordinaryStatus,drinkStatus)=>buildPersonalWorkspace("owner",{
 listDefinitions:()=>[definition("prayer",null),definition("coffee",{targetServings:2,kind:"coffee"})],
 listPersonalDays:()=>[day],listDailyExecutionForUser:()=>[execution("prayer",ordinaryStatus),execution("coffee",drinkStatus)]
});
test("R300: coffee changes remain informational, never change activity achievement, streak or period rate",()=>{
 const low=view("Completed","Pending"),high=view("Completed","Completed");
 assert.equal(low.insights.periods.week.completionRate,100);
 assert.equal(high.insights.periods.week.completionRate,100);
 assert.equal(low.insights.periods.week.scheduled,1);
 assert.equal(high.insights.periods.week.completed,1);
 assert.equal(low.insights.currentStreakDays,1);
 assert.equal(high.insights.currentStreakDays,1);
 assert.equal(low.statistics.rows.length,2,"beverage must remain readable in history");
 assert.equal(low.statistics.rows.find(row=>row.definitionId==="coffee").nonAchievement,true);
 assert.equal(high.statistics.rows.find(row=>row.definitionId==="coffee").nonAchievement,true);
 assert.equal(low.statistics.rows.find(row=>row.definitionId==="prayer").nonAchievement,undefined);
});
test("R300: not completing cups does not spoil zero-remaining-task days",()=>{
 const onlyDrink=buildPersonalWorkspace("owner",{
  listDefinitions:()=>[definition("coffee",{targetServings:2})],
  listPersonalDays:()=>[day],listDailyExecutionForUser:()=>[execution("coffee","Pending")]
 });
 assert.equal(onlyDrink.insights.periods.week.scheduled,0);
 assert.equal(onlyDrink.insights.currentStreakDays,0);
 assert.equal(onlyDrink.statistics.rows[0].nonAchievement,true);
});
