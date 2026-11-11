import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {NoorBeverageTrackerR294,beverageCountR294} from "../src/noor-beverage-tracker-r294.js";

const at="2026-11-11T16:15:00.000Z";
const coffee={id:"coffee",executionId:"coffee-day",title:"قهوة",category:"الصحة والرياضة",
 revisionId:"rev-1",startDate:"2026-11-11",endDate:null,weight:1,importance:"Optional" as const,status:"Completed",
 plan:{targetServings:2,servingMl:180},log:[
 {id:"cup-1",executionId:"coffee-day",localDate:"2026-11-11",at,amount:1},
 {id:"cup-2",executionId:"coffee-day",localDate:"2026-11-11",at,amount:1},
 {id:"other",executionId:"tea-day",localDate:"2026-11-11",at,amount:1}]};
const tea={...coffee,id:"tea",executionId:"tea-day",title:"شاي",revisionId:"rev-2",status:"Pending",
 plan:{targetServings:1},log:[]};
test("R294: counted servings are per exact execution ID; correction never crosses drinks or civil days",()=>{
 assert.equal(beverageCountR294(coffee.log,"coffee-day"),2);
 assert.equal(beverageCountR294(coffee.log,"tea-day"),1);
 assert.equal(beverageCountR294([...coffee.log,{id:"correction",executionId:"coffee-day",localDate:"2026-11-11",at,amount:-1}],"coffee-day"),1);
 assert.equal(beverageCountR294(coffee.log,"not-an-execution"),0);
});
test("R294: dashboard drink card displays independently counted coffee/tea and editable daily quantities",()=>{
 const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{
  rows:[coffee,tea],allNames:["قهوة","شاي"],localDate:"2026-11-11",busy:false,
  onCommand:async()=>true,
 }));
 assert.match(html,/data-testid="r294-beverage-tracker"/);
 assert.match(html,/قهوة/);
 assert.match(html,/2 من 2/);
 assert.match(html,/360 مل مسجلة/);
 assert.match(html,/شاي/);
 assert.match(html,/0 من 1/);
 assert.match(html,/إضافة مشروب/);
 assert.match(html,/إنقاص قهوة بمقدار مرة/);
 assert.match(html,/إضافة مرة شاي/);
 assert.match(html,/اكتمل المستهدف/);
});
test("R294: historical drink card is immutable and does not display action or add controls",()=>{
 const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{
  rows:[coffee],localDate:"2026-11-11",busy:false,onCommand:async()=>true,historical:true,
 }));
 assert.match(html,/مشروبات اليوم المحدد/);
 assert.doesNotMatch(html,/إضافة مشروب/);
 assert.doesNotMatch(html,/إنقاص قهوة بمقدار مرة/);
 assert.match(html,/عرض سجلات هذا اليوم دون تغييرها/);
});
test("R294: integration mounts drink card and removes its entries from regular checkbox habit card",()=>{
 const src=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(src,/NoorBeverageTrackerR294 rows=\{beverageRows\}/);
 assert.match(src,/if\(definition\?\.beveragePlan\)continue/);
 assert.match(src,/beveragePlan:NoorBeveragePlanR294/);
 assert.match(src,/data-testid="r294-definition-drink-settings"/);
});
