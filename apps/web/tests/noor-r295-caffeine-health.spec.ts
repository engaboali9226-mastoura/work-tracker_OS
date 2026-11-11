import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {NoorBeverageTrackerR294} from "../src/noor-beverage-tracker-r294.js";
import {activeServingsR295,classifyCaffeineR295,hoursBeforeSleepR295,kindForDrinkR295,localClockR295,validClockR295} from "../src/noor-caffeine-health-r295.js";

const date="2026-11-11",at="2026-11-11T12:00:00.000Z",zone="Asia/Riyadh";
const row=(id:string,kind:"coffee"|"tea"|"other",times:readonly string[],log?:any)=>({
 id,executionId:id+"-today",title:kind==="coffee"?"قهوة":kind==="tea"?"شاي":"ماء",category:"الصحة والرياضة",
 revisionId:"rev-"+id,startDate:date,endDate:null,weight:1,importance:"Optional" as const,
 status:"Pending",plan:{targetServings:2,kind,sleepTime:"00:00"},
 log:log??times.map((beverageTime,i)=>({id:id+"-"+i,executionId:id+"-today",localDate:date,at,amount:1,beverageTime}))
});
test("R295: 2 coffee + 2 tea is green, 3 yellow, 4 red, remaining other beverages ignored",()=>{
 const coffee=row("coffee","coffee",["08:00","10:00"]),tea=row("tea","tea",["09:00","11:00"]);
 const green=classifyCaffeineR295([coffee,tea,row("water","other",["22:30"])],zone,"00:00");
 assert.equal(green.level,"green");assert.equal(green.coffee,2);assert.equal(green.tea,2);assert.equal(green.total,4);assert.equal(green.other,1);
 assert.equal(classifyCaffeineR295([{...coffee,log:[...coffee.log,{id:"third",executionId:coffee.executionId,at,amount:1,beverageTime:"13:00"}]}],zone).level,"yellow");
 assert.equal(classifyCaffeineR295([row("coffee","coffee",["08:00","10:00","12:00","14:00"])],zone).level,"red");
});
test("R295: last 4 hours before owner bedtime red, 4–6 yellow, >6 green (including midnight rollover)",()=>{
 assert.equal(hoursBeforeSleepR295("22:30","00:00"),1.5);
 assert.equal(hoursBeforeSleepR295("19:30","00:00"),4.5);
 assert.equal(hoursBeforeSleepR295("17:00","00:00"),7);
 assert.equal(classifyCaffeineR295([row("x","tea",["22:30"])],zone).level,"red");
 assert.equal(classifyCaffeineR295([row("x","tea",["19:30"])],zone).level,"yellow");
 assert.equal(classifyCaffeineR295([row("x","tea",["17:00"])],zone).level,"green");
 assert.equal(classifyCaffeineR295([row("x","tea",["18:30"])],zone,"23:00").level,"yellow");
});
test("R295: correction cancels most recent serving and preserves earlier measured times",()=>{
 const d=row("coffee","coffee",["08:30","22:00"]);
 const corrected=[...d.log,{id:"undo",at,executionId:d.executionId,amount:-1}];
 assert.deepEqual(activeServingsR295(corrected,d.executionId,zone).map(e=>e.time),["08:30"]);
 assert.equal(classifyCaffeineR295([{...d,log:corrected}],zone).level,"green");
 assert.equal(activeServingsR295(corrected,"other-owner-execution",zone).length,0);
});
test("R295: legacy event without wall-clock falls back to timestamp in account timezone",()=>{
 assert.equal(localClockR295("2026-11-11T16:15:00.000Z",zone),"19:15");
 const d=row("coffee","coffee",[],[{id:"old",executionId:"coffee-today",at:"2026-11-11T16:15:00.000Z",amount:1}]);
 assert.equal(activeServingsR295(d.log,d.executionId,zone)[0]?.time,"19:15");
 assert.equal(kindForDrinkR295({...d,plan:{targetServings:2},title:"قهوة تركية"}),"coffee");
 assert.equal(kindForDrinkR295({...d,plan:{targetServings:2},title:"شاي كرك"}),"tea");
 assert.equal(validClockR295("24:00"),false);
 assert.equal(validClockR295("23:59"),true);
});
test("R295: card renders exact counts, status, quick choices, owner bedtime and historical-only mode",()=>{
 const coffee=row("coffee","coffee",["08:00","22:15"]),tea=row("tea","tea",["11:00"]);
 const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{rows:[coffee,tea],allNames:["قهوة","شاي"],localDate:date,timeZone:zone,busy:false,onCommand:async()=>true}));
 assert.match(html,/المشروبات المنبّهة اليوم/);
 assert.match(html,/data-testid="r295-health-indicator"/);
 assert.match(html,/data-level="red"/);
 assert.match(html,/>القهوة</);
 assert.match(html,/إجمالي المنبّهات/);
 assert.match(html,/\+ قهوة/);
 assert.match(html,/\+ شاي/);
 assert.match(html,/وقت النوم المعتاد/);
 assert.match(html,/22:15/);
 const archived=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{rows:[coffee],localDate:date,timeZone:zone,busy:false,historical:true,onCommand:async()=>true}));
 assert.doesNotMatch(archived,/\+ قهوة/);
 assert.doesNotMatch(archived,/حفظ وقت النوم/);
});
test("R295: Personal integration preserves new drink metadata through parser and time zone and JSX",()=>{
 const src=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(src,/timeZone=\{view.timeZone\}/);
 assert.match(src,/beverageTime\?:string/);
 assert.match(src,/sourceDrink.sleepTime/);
 assert.match(src,/sourceDrink.kind/);
 assert.match(src,/initial.beveragePlan.sleepTime/);
});
