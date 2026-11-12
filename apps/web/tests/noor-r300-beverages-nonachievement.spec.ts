import test from "node:test";
import assert from "node:assert/strict";
import {parseStatisticRows,summarizeProgress,yesterdayAchievement,wholeWeekAchievement,statisticInsights,statisticCalendar} from "../src/progress-statistics.js";
import {readFileSync} from "node:fs";

const date="2026-11-12";
const row=(id:string,status:string,nonAchievement?:boolean)=>({
 id,definitionId:id,title:id,kind:"Habit",date,weight:5,status,amount:1,unit:"",
 ...(nonAchievement?{nonAchievement:true}:{})
});
test("R300: decreasing coffee counter never affects daily, weekly, missed or streak achievements",()=>{
 const ordinary=row("الصلاة","Completed");
 const low=parseStatisticRows([ordinary,row("القهوة","Pending",true)]);
 const high=parseStatisticRows([ordinary,row("القهوة","Completed",true)]);
 for(const list of [low,high]){
  assert.equal(list.length,2,"keep coffee in read-model for its historical drink card");
  assert.equal(summarizeProgress(list).rate,100);
  assert.equal(summarizeProgress(list).completed,1);
  assert.equal(summarizeProgress(list).scheduled,1);
  assert.equal(statisticInsights(list,date).perfect,1);
  assert.equal(statisticCalendar(list,"2026-11",date).days.find(day=>day.date===date)?.rate,100);
  assert.equal(wholeWeekAchievement(list,date).find(day=>day.date===date)?.rate,100);
 }
 const yesterday="2026-11-13";
 assert.equal(yesterdayAchievement(low,yesterday)?.missed.length,0);
});
test("R300: reject malformed forged marker, and ensure remaining list filters drink plans",()=>{
 assert.equal(parseStatisticRows([row("x","Pending","not-boolean" as unknown as boolean)]).length,0);
 const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(source,/const achievementItems=\[\.\.\.view\.habits,\.\.\.view\.tasks\]\.filter/);
 assert.match(source,/!\s*definitionsById\.get\(e\.definitionId\)\?\.beveragePlan/);
 assert.match(source,/todayRows:StatisticRow\[\]=/);
});
