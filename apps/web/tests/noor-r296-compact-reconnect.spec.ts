import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorBeverageTrackerR294} from "../src/noor-beverage-tracker-r294.js";

const date="2026-11-11";
test("R296: compact caffeine card keeps quiet summary, quick add, editable history and bedtime",()=>{
 const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{
   rows:[{id:"coffee",executionId:"coffee-1",title:"قهوة",category:"الصحة والرياضة",
    revisionId:"revision",startDate:date,endDate:null,weight:1,importance:"Optional",status:"Pending",
    plan:{targetServings:2,kind:"coffee",sleepTime:"00:00"},log:[]}],
   localDate:date,busy:false,onCommand:async()=>true
 }));
 assert.match(html,/القهوة والشاي/);
 assert.match(html,/data-testid="r295-health-indicator"/);
 assert.match(html,/\+ قهوة/);assert.match(html,/\+ شاي/);
 assert.match(html,/class="np-caffeine-options-r296"/);
 assert.match(html,/class="np-beverages-detail-r296"/);
 assert.match(html,/وقت نومك المعتاد/);
 assert.doesNotMatch(html,/تسجيل كوب بوقته التقريبي/);
 assert.doesNotMatch(html,/الألوان تقدير تنظيمي/);
});
test("R296: logout is only in Control Center; dashboard offers manual reconnect",()=>{
 const src=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 const dashboard=src.slice(src.indexOf("function Dashboard({"),src.indexOf("function StatePage({"));
 const center=src.slice(src.indexOf("function ControlCenter({"),src.indexOf("function ActivityCard({"));
 assert.match(center,/تسجيل الخروج والعودة إلى شاشة الدخول/);
 assert.doesNotMatch(dashboard,/np-signout-icon-r269/);
 assert.doesNotMatch(dashboard,/onLogout/);
 assert.match(dashboard,/aria-label="إعادة الاتصال"/);
 assert.match(src,/data-testid="r296-reconnect"/);
 assert.match(src,/await refresh\(true\)/);
 assert.match(src,/fastChanges.length\|\|orderChanges.length/);
});
