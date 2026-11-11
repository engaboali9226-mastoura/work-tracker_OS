import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {NoorBeverageTrackerR294} from "../src/noor-beverage-tracker-r294.js";

const src=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
const drinks=readFileSync(new URL("../src/noor-beverage-tracker-r294.tsx",import.meta.url),"utf8");
const row={id:"coffee",executionId:"coffee-day",title:"قهوة",category:"الصحة والرياضة",
 revisionId:"r1",startDate:"2026-11-11",endDate:null,weight:1,importance:"Optional" as const,status:"Pending",
 plan:{targetServings:2,kind:"coffee" as const,sleepTime:"00:00"},log:[{id:"cup-1",executionId:"coffee-day",localDate:"2026-11-11",at:"2026-11-11T06:30:00.000Z",amount:1,beverageTime:"09:30"}]};

test("R296: daily drink card is compact by default, with quick-add buttons and native collapsed settings",()=>{
 const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{rows:[row],localDate:"2026-11-11",busy:false,onCommand:async()=>true}));
 assert.match(html,/data-testid="r294-beverage-tracker"/);
 assert.match(html,/القهوة والشاي/);
 assert.match(html,/data-testid="r295-health-indicator"/);
 assert.match(html,/\+ قهوة/);
 assert.match(html,/\+ شاي/);
 assert.match(html,/<details class="np-caffeine-details-r296">/);
 assert.doesNotMatch(html,/<details class="np-caffeine-details-r296" open/);
 assert.match(html,/التفاصيل والإعدادات/);
 assert.match(html,/وقت النوم المعتاد/);
 assert.match(html,/09:30/);
 assert.doesNotMatch(html,/تسجيل كوب بوقته التقريبي/);
 assert.match(src,/width:min\(100%,550px\)/);
});

test("R296: date history remains read-only, open on demand, and preserves count/event metadata",()=>{
 const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{rows:[row],localDate:"2026-11-11",busy:false,historical:true,onCommand:async()=>true}));
 assert.match(html,/<details class="np-caffeine-details-r296" open/);
 assert.match(html,/مشروبات اليوم المحدد/);
 assert.doesNotMatch(html,/\+ قهوة/);
 assert.doesNotMatch(html,/حفظ وقت النوم/);
 assert.match(html,/09:30/);
 assert.match(drinks,/adjust-beverage-serving/);
 assert.match(drinks,/set-beverage-bedtime/);
});

test("R296: sign-out exists solely in Control Center, never the day header",()=>{
 assert.equal((src.match(/aria-label="تسجيل الخروج والعودة إلى شاشة الدخول"/g)??[]).length,1);
 const dashboard=src.slice(src.indexOf("function Dashboard("),src.indexOf("function PersonalEntryLoading("));
 const center=src.slice(src.indexOf("function ControlCenter("),src.indexOf("function ActivityCard("));
 assert.doesNotMatch(dashboard,/تسجيل الخروج/);
 assert.match(center,/تسجيل الخروج/);
 assert.match(src,/revokeNoorBrowserSessionR269/);
});

test("R296: recover an asleep server from the current page without navigation or destroying unsaved notes",()=>{
 assert.match(src,/data-testid="r296-reconnect-button"/);
 assert.match(src,/data-testid="r296-reconnect-state"/);
 assert.match(src,/invalidateNoorPersonalReads\(\);\s*try\{const ok=await refresh\(\)/);
 assert.match(src,/setResult\(previous=>today.kind==="unavailable" && previous\?\.kind==="success" && !strict\?previous:today\)/);
 assert.match(src,/if\(commandInFlight.current\|\|fastQueue.current.length\|\|orderQueue.current.length/);
 assert.match(src,/connectionWarning \? <p className="np-reconnect-notice-r296"/);
 assert.match(src,/title="نور غير متصل" onRetry=/);
 assert.match(src,/onReconnect=\{\(\)=>\{void reconnect\(\);\}\}/);
 assert.equal((src.match(/window.location.replace\("\/"\)/g)??[]).length,1); // logout only
});
