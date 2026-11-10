import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {
 r283FridayHoursAtDhuhr,r283CarriedNightWindow,r232DailyWindows,
 type R283PrecedingNight,
} from "../src/noor-islamic-daylight-r232.js";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {nightCountdownState} from "../src/noor-personal-application-view.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
const zone="Asia/Riyadh";
const today=[
 {key:"fajr",label:"الفجر",at:"2026-11-07T02:57:00.000Z"},
 {key:"sunrise",label:"الشروق",at:"2026-11-07T03:54:00.000Z"},
 {key:"dhuhr",label:"الظهر",at:"2026-11-07T08:35:00.000Z"},
 {key:"maghrib",label:"المغرب",at:"2026-11-07T14:13:00.000Z"},
 {key:"isha",label:"العشاء",at:"2026-11-07T15:38:00.000Z"},
];
const prior:R283PrecedingNight={
 maghribAt:"2026-11-06T14:12:00.000Z",
 ishaAt:"2026-11-06T15:35:00.000Z",
 fajrAt:"2026-11-07T02:57:00.000Z",
};
test("R283 Friday five windows end at exact Dhuhr without a manual Friday adhan",()=>{
 const fridayDate="2026-11-06T08:00:00.000Z";
 const prayers=[
  {key:"sunrise",at:"2026-11-06T03:54:00.000Z"},
  {key:"dhuhr",at:"2026-11-06T08:35:37.000Z"},
 ];
 const periods=r283FridayHoursAtDhuhr({nowMs:Date.parse(fridayDate),timeZone:zone,prayers});
 assert.equal(periods?.length,5);
 assert.equal(periods?.[4]?.endMs,Date.parse(prayers[1]!.at));
 assert.equal(periods?.[0]?.startMs,Date.parse(prayers[0]!.at)+20*60000);
 assert.equal(periods?.reduce((sum,x)=>sum+x.durationMs,0),periods![4]!.endMs-periods![0]!.startMs);
 assert.equal(r283FridayHoursAtDhuhr({nowMs:Date.parse(fridayDate),timeZone:zone,
  prayers:prayers.map(x=>({...x,at:x.at.replace("2026-11-06","2026-10-30")}))}),null);
 assert.equal(r283FridayHoursAtDhuhr({nowMs:Date.parse("2026-11-07T08:00:00Z"),timeZone:zone,prayers}),null);
});
test("R283 rhythm shows no countdown before a window, counts only while active",()=>{
 const fridayPrayers=[
  {key:"fajr",at:"2026-11-06T02:40:00Z"},
  {key:"sunrise",at:"2026-11-06T03:50:00Z"},
  {key:"dhuhr",at:"2026-11-06T08:35:00Z"},
  {key:"maghrib",at:"2026-11-06T14:20:00Z"},
 ];
 const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers:fridayPrayers,nowMs:Date.parse("2026-11-06T04:30:00Z"),timeZone:zone,
  nextFajrAt:"2026-11-07T02:57:00Z",preferences:NOOR_R232_DEFAULT,
 }));
 // Duha active, day active, night upcoming, five Friday segments upcoming.
 assert.match(html,/tone-night" data-phase="upcoming"/);
 assert.match(html,/لم تبدأ بعد/u);
 assert.doesNotMatch(html,/تبدأ بعد/u);
 assert.match(html,/role="timer"/u);
 const nightSlice=html.split('tone-night" data-phase="upcoming"')[1]!.split('</article>')[0]!;
 assert.doesNotMatch(nightSlice,/np-r247-digits/u);
 assert.match(nightSlice,/لم تبدأ بعد/u);
 assert.match(html,/data-testid="friday-five-hours-r232"/u);
 assert.match(html,/الساعة الخامسة/u);
 assert.doesNotMatch(html,/اضبط موعد أذان الجمعة/u);
});
test("R283 last third uses prior authenticated night after civil midnight and continues until Fajr",()=>{
 const before=Date.parse("2026-11-06T20:59:59.000Z");
 const after=Date.parse("2026-11-06T21:00:01.000Z");
 const afterLastThird=Date.parse("2026-11-07T00:00:00.000Z");
 const ending=Date.parse(prior.fajrAt);
 // Today's dawn after local midnight belongs to yesterday's Maghrib-to-Fajr night.
 const carried=r283CarriedNightWindow(after,prior);
 assert.equal(carried?.startMs,Date.parse(prior.maghribAt));
 assert.equal(carried?.endMs,ending);
 const justAfterMidnight=nightCountdownState(today,after,"2026-11-08T03:00:00.000Z",prior);
 assert.equal(justAfterMidnight?.carriedOver,true);
 assert.equal(justAfterMidnight?.enabled,true);
 assert.equal(justAfterMidnight?.endsAt,prior.fajrAt);
 const within=nightCountdownState(today,afterLastThird,"2026-11-08T03:00:00.000Z",prior);
 assert.equal(within?.carriedOver,true);
 assert.ok(Date.parse(within!.lastThird)<ending);
 assert.equal(within?.endsAt,prior.fajrAt);
 assert.equal(nightCountdownState(today,ending,"2026-11-08T03:00:00.000Z",prior)?.enabled,false);
 assert.equal(r283CarriedNightWindow(ending,prior),null);
 assert.equal(r283CarriedNightWindow(before,prior)?.endMs,ending);
});
test("R283 rhythm correctly marks yesterday's night active at 00:15 local while new day is upcoming",()=>{
 const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers:today,nowMs:Date.parse("2026-11-06T21:15:00Z"),
  timeZone:zone,nextFajrAt:"2026-11-08T03:00:00.000Z",
  precedingNight:prior,preferences:NOOR_R232_DEFAULT,
 }));
 assert.match(html,/tone-night" data-phase="active"/);
 const night=html.split('tone-night" data-phase="active"')[1]!.split('</article>')[0]!;
 assert.match(night,/role="timer"/);
 assert.match(night,/np-r247-digits"/);
 assert.match(html,/tone-day" data-phase="upcoming"/);
 const windows=r232DailyWindows(today,"2026-11-08T03:00:00.000Z");
 assert.ok(windows.islamicNight?.startMs!>Date.parse(prior.fajrAt));
});
test("R283 rejects fabricated preceding-night boundaries and respects exact Fajr",()=>{
 const altered={...prior,fajrAt:"2026-11-06T11:00:00Z"};
 assert.equal(r283CarriedNightWindow(Date.parse("2026-11-06T21:15:00Z"),altered),null);
 assert.equal(r283CarriedNightWindow(Date.parse("2026-11-06T21:15:00Z"),null),null);
});
