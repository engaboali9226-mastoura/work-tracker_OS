import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {UpcomingCountdownR301} from "../src/noor-upcoming-countdown-r301.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

const zone="Asia/Riyadh";
const prayers=[
 {key:"fajr",at:"2026-11-06T02:45:00Z"},
 {key:"sunrise",at:"2026-11-06T03:01:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:40:00Z"},
 {key:"maghrib",at:"2026-11-06T14:02:00Z"}
];
const renderWindows=(nowMs:number,nextFajrAt?:string)=>renderToStaticMarkup(
 createElement(NoorR232TimeWindows,{
  prayers,nowMs,timeZone:zone,preferences:NOOR_R232_DEFAULT,
  nextFajrAt,precedingNight:null
 }));
test("R322 active Islamic night preview uses authenticated Fajr and keeps every old time/Friday fact inside sheet",()=>{
 const now=Date.parse("2026-11-06T18:02:00Z");
 const html=renderWindows(now,"2026-11-07T02:50:00Z");
 assert.match(html,/data-testid="r322-premium-timer-hub"/);
 assert.match(html,/مؤقت الليل/);
 assert.match(html,/08:48:00/);
 assert.match(html,/data-testid="noor-day-night-friday-r232"/);
 assert.match(html,/ساعات الجمعة الخمس/);
 assert.match(html,/الساعة الخامسة/);
 assert.match(html,/aria-label="إغلاق مؤقتات اليوم"/);
});
test("R322 never makes up Fajr or a night duration when tomorrow's authority is missing",()=>{
 const html=renderWindows(Date.parse("2026-11-06T18:02:00Z"));
 assert.match(html,/لا توجد فترة نشطة الآن/);
 assert.match(html,/لم تتوفر مواقيت الغد من مصدر نور المعتمد/);
 assert.doesNotMatch(html,/08:48:00/);
});
test("R322 pre-dawn countdown falls back only to verified Fajr; never invents previous Maghrib",()=>{
 const html=renderWindows(Date.parse("2026-11-06T00:10:00Z"),"2026-11-06T02:45:00Z");
 assert.match(html,/مؤقت الليل/);
 assert.match(html,/02:35:00/);
 assert.match(html,/لم تتوفر بداية الليل لحساب مدته/);
});
test("R322: brand-new pre-dawn account can count to CURRENT verified Fajr even when nextFajrAt is missing",()=>{
 const html=renderWindows(Date.parse("2026-11-06T00:10:00Z"));
 assert.match(html,/مؤقت الليل/);
 assert.match(html,/02:35:00/);
 assert.match(html,/لم تتوفر بداية الليل لحساب مدته/);
 assert.match(html,/لم تتوفر مواقيت الغد من مصدر نور المعتمد/);
});
test("R322 appointments show nearest on card and retain all others for closeable sheet",()=>{
 const definitions=Array.from({length:7},(_,i)=>({
  id:"test-"+i,title:"الموعد "+i,state:"Active",
  countdownPlan:{kind:"appointment" as const,date:"2026-11-"+String(16+i).padStart(2,"0"),time:"13:30"}
 }));
 const html=renderToStaticMarkup(createElement(UpcomingCountdownR301,{
  definitions,nowMs:Date.parse("2026-11-12T09:00:00Z"),timeZone:zone
 }));
 assert.match(html,/الموعد 0/);
 assert.match(html,/عرض جميع المواعيد \(7\)/);
 assert.match(html,/aria-label="جميع المواعيد القادمة"/);
 assert.match(html,/الموعد 6/);
 for(let i=0;i<7;i++)assert.match(html,new RegExp('data-testid="r301-countdown-test-'+i+'"'));
});
test("R322 gateway exposes independent MFA admin, registration and recovery without privileging self-registration",()=>{
 const gateway=readFileSync(new URL("../src/platform-shell.tsx",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.tsx",import.meta.url),"utf8");
 assert.match(gateway,/href="\/admin\/security"/);
 assert.match(gateway,/نسيت كلمة المرور/u);
 assert.match(gateway,/إنشاء حساب جديد/u);
 assert.match(gateway,/noor_registration_request|registerPendingAccount/u);
 assert.match(main,/noor-premium-r322\.css/);
});
