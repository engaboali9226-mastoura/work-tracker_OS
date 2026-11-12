import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {accountClockPartsR301,countdownStateR301,UpcomingCountdownR301} from "../src/noor-upcoming-countdown-r301.js";
import {DefinitionForm} from "../src/noor-personal-application-view.js";

const riyadh="Asia/Riyadh";
test("R301: civil-day countdown switches to hour/min/sec in account local timezone",()=>{
 const early=Date.parse("2026-11-12T08:30:00Z"); // 11:30 Riyadh
 assert.deepEqual(accountClockPartsR301(early,riyadh),{date:"2026-11-12",seconds:11*3600+30*60});
 assert.equal(countdownStateR301("2026-11-19","13:00",early,riyadh)?.days,7);
 const same=countdownStateR301("2026-11-12","13:00",early,riyadh);
 assert.equal(same?.phase,"today");
 assert.equal(same?.hours,1);
 assert.equal(same?.minutes,30);
 const due=countdownStateR301("2026-11-12","11:30",early,riyadh);
 assert.equal(due?.phase,"begun");
 assert.equal(countdownStateR301("2026-11-12","11:00",early,riyadh)?.phase,"begun");
 assert.equal(countdownStateR301("2026-11-12","10:00",early,riyadh)?.phase,"past");
 assert.equal(countdownStateR301("2026-11-11","23:30",early,riyadh)?.phase,"past");
 assert.equal(countdownStateR301("2026-02-30","23:30",early,riyadh),null);
 assert.equal(countdownStateR301("2026-11-12","25:30",early,riyadh),null);
});
test("R301: account timezone changes the calendar-day count, avoiding device timezone assumptions",()=>{
 const at=Date.parse("2026-11-12T22:30:00Z");
 assert.equal(accountClockPartsR301(at,"Asia/Riyadh")?.date,"2026-11-13");
 assert.equal(accountClockPartsR301(at,"America/New_York")?.date,"2026-11-12");
 assert.equal(countdownStateR301("2026-11-13","09:00",at,"Asia/Riyadh")?.phase,"today");
 assert.equal(countdownStateR301("2026-11-13","09:00",at,"America/New_York")?.phase,"days");
});
test("R301: compact live strip includes owner-saved event, appointment and task, omits archived and older",()=>{
 const html=renderToStaticMarkup(createElement(UpcomingCountdownR301,{
  timeZone:riyadh,nowMs:Date.parse("2026-11-12T09:00:00Z"),
  definitions:[
   {id:"e1",state:"Active",title:"زيارة المدرسة",countdownPlan:{kind:"event",date:"2026-11-15",time:"14:00"}},
   {id:"a1",state:"Active",title:"موعد الطبيب",countdownPlan:{kind:"appointment",date:"2026-11-12",time:"13:00"}},
   {id:"t1",state:"Active",title:"تسليم التقرير",countdownPlan:{kind:"task",date:"2026-11-14",time:"18:30"}},
   {id:"a2",state:"Archived",title:"سرّ محفوظ",countdownPlan:{kind:"appointment",date:"2026-11-12",time:"14:00"}},
  ]
 }));
 assert.match(html,/data-testid="r301-upcoming-countdowns"/);
 assert.match(html,/العد التنازلي/);
 assert.match(html,/زيارة المدرسة/);
 assert.match(html,/موعد الطبيب/);
 assert.match(html,/تسليم التقرير/);
 assert.match(html,/data-countdown-phase="today"/);
 assert.match(html,/تنبيه: الموعد اليوم/);
 assert.doesNotMatch(html,/سرّ محفوظ/);
});
test("R301: task definition editor allows appointment, event and task deadlines while preserving old forms",()=>{
 const html=renderToStaticMarkup(createElement(DefinitionForm,{busy:false,onCommand:async()=>true,defaultStartDate:"2026-11-12",defaultKind:"Task",categories:["الشؤون الشخصية"]}));
 assert.match(html,/data-testid="r301-countdown-editor"/);
 assert.match(html,/data-testid="r301-countdown-kind"/);
 assert.match(html,/حدث مرتقب/);
 assert.match(html,/موعد مرتقب/);
 assert.match(html,/مهمة بموعد إنجاز/);
 assert.match(html,/name="startDate"/);
 const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(source,/UpcomingCountdownR301 definitions=\{workspace\?\.definitions\?\?\[\]\}/);
 assert.match(source,/countdownPlan:NoorCountdownPlanR301/);
 assert.match(source,/R301 upcoming timers/);
});
