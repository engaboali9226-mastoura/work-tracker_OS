import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {
 r232DailyWindows,r232FridayFiveHours,r232LocalWeekday,r232Countdown,
} from "../src/noor-islamic-daylight-r232.js";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT,readNoorR232Preferences} from "../src/noor-time-display-preferences-r232.js";

const friday=Date.parse("2026-11-06T08:00:00Z");
const thursday=Date.parse("2026-11-05T08:00:00Z");
const zone="Asia/Riyadh";
const prayers=[
 {key:"fajr",at:"2026-11-06T02:45:00.000Z"},
 {key:"sunrise",at:"2026-11-06T03:01:00.000Z"},
 {key:"dhuhr",at:"2026-11-06T08:40:00.000Z"},
 {key:"maghrib",at:"2026-11-06T14:02:00.000Z"}
];
test("R232 never invents or reuses tomorrow Fajr for the Islamic night",()=>{
 const noTomorrow=r232DailyWindows(prayers);
 assert.equal(noTomorrow.islamicNight,null);
 assert.equal(r232DailyWindows(prayers,prayers[0]!.at).islamicNight,null);
 assert.equal(r232DailyWindows(prayers,"invalid").islamicNight,null);
 assert.equal(r232DailyWindows(prayers,"2026-11-07T02:50:00Z").islamicNight?.endMs,
  Date.parse("2026-11-07T02:50:00Z"));
});
test("R232 Friday five hours use a mosque-specific adhan, contiguous windows and calendar Friday only",()=>{
 assert.equal(r232LocalWeekday(friday,zone),5);
 assert.equal(r232LocalWeekday(thursday,zone),4);
 const windows=r232FridayFiveHours({nowMs:friday,timeZone:zone,prayers,fridayAdhanClock:"12:12"});
 assert.equal(windows?.length,5);
 assert.equal(windows?.[0]?.startMs,Date.parse("2026-11-06T03:21:00Z"));
 assert.equal(windows?.[4]?.endMs,Date.parse("2026-11-06T09:12:00Z"));
 assert.equal(windows?.reduce((a,b)=>a+b.durationMs,0),
  windows?.[4]!.endMs!-windows?.[0]!.startMs!);
 for(let i=1;i<5;i++)assert.equal(windows?.[i]?.startMs,windows?.[i-1]?.endMs);
 assert.equal(r232FridayFiveHours({nowMs:thursday,timeZone:zone,prayers,fridayAdhanClock:"12:12"}),null);
 assert.equal(r232FridayFiveHours({nowMs:friday,timeZone:zone,prayers,fridayAdhanClock:""}),null);
 assert.equal(r232FridayFiveHours({nowMs:friday,timeZone:zone,prayers,fridayAdhanClock:"06:00"}),null);
});
test("R232 countdown and duha obey separate prayer time boundaries",()=>{
 const w=r232DailyWindows(prayers,"2026-11-07T02:50:00Z",25,15);
 assert.equal(w.fastingDay?.startMs,Date.parse(prayers[0]!.at));
 assert.equal(w.fastingDay?.endMs,Date.parse(prayers[3]!.at));
 assert.equal(w.duha?.startMs,Date.parse(prayers[1]!.at)+25*60000);
 assert.equal(w.duha?.endMs,Date.parse(prayers[2]!.at)-15*60000);
 assert.equal(r232Countdown(w.duha!,w.duha!.startMs).phase,"active");
 assert.equal(r232Countdown(w.duha!,w.duha!.endMs).phase,"finished");
 assert.throws(()=>r232DailyWindows(prayers,undefined,14,10),/R232_INVALID_DUHA_POLICY/);
 assert.equal(r232DailyWindows(prayers.filter(p=>p.key!=="sunrise")).duha,null);
});
test("R232 Friday section appears on Friday only; unavailable clock is not fabricated",()=>{
 const render=(nowMs:number,fridayAdhan:string)=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers,nowMs,timeZone:zone,preferences:{...NOOR_R232_DEFAULT,fridayAdhan},
 }));
 const fridayMarkup=render(friday,"12:12");
 assert.match(fridayMarkup,/data-testid="friday-five-hours-r232"/u);
 assert.match(fridayMarkup,/الساعة الخامسة/u);
 assert.match(fridayMarkup,/وقت صلاة الضحى/u);
 assert.doesNotMatch(render(thursday,"12:12"),/data-testid="friday-five-hours-r232"/u);
 const noClock=render(friday,"");
 assert.match(noClock,/اضبط موعد أذان الجمعة/u);
 assert.doesNotMatch(noClock,/الساعة الخامسة/u);
});
test("R232 city preference is display-only and cannot change authority of prayer times",()=>{
 const data=readFileSync(new URL("../src/noor-time-location-control-r232.tsx",import.meta.url),"utf8");
 const view=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(data,/مواقيت نور الأساسية لن تتغير/u);
 assert.match(data,/لا تتغير مواقيت الصلاة حتى تضغط/u);
 assert.match(data,/يؤكد الخادم الحفظ/u);
 assert.match(data,/البحث والمعاينة مؤقتان/u);
 assert.match(data,/navigator\.geolocation\.getCurrentPosition/u);
 assert.match(data,/credentials:"omit"/u);
 assert.match(view,/serverZone=\{timeZone\}/u);
 assert.match(view,/prayers=\{view\.prayerTimes\}/u);
 assert.deepEqual(NOOR_R232_DEFAULT.selectedCity,null);
 assert.deepEqual(readNoorR232Preferences(),NOOR_R232_DEFAULT);
});
