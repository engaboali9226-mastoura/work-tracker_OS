import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {r232DailyWindows} from "../src/noor-islamic-daylight-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

const viewSource=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
const prayers=[
 {key:"fajr",at:"2026-11-06T02:31:00Z"},
 {key:"sunrise",at:"2026-11-06T03:40:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:30:00Z"},
 {key:"maghrib",at:"2026-11-06T14:12:00Z"},
];
const nextFajr="2026-11-07T02:33:00Z";
test("R234 the night uses tomorrow's Fajr from authoritative server prayer snapshot",()=>{
 assert.match(viewSource,/stringValue\(rawPrayerTimes\.nextFajr\)/u);
 assert.match(viewSource,/nextFajrAt=\{view\.nextFajrAt\?\?undefined\}/u);
 assert.doesNotMatch(viewSource,/nextFajrAt=\{\(view\.nextPrayer\?/u);
 const w=r232DailyWindows(prayers,nextFajr);
 assert.equal(w.islamicNight?.startMs,Date.parse("2026-11-06T14:12:00Z"));
 assert.equal(w.islamicNight?.endMs,Date.parse("2026-11-07T02:33:00Z"));
 assert.equal(w.islamicNight?.durationMs,12*60*60*1000+21*60000);
 assert.equal(r232DailyWindows(prayers).islamicNight,null);
});
test("R234 presentation is compact unified rhythm and renders confirmed night interval",()=>{
 const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers,nowMs:Date.parse("2026-11-06T18:00:00Z"),
  timeZone:"Asia/Riyadh",preferences:NOOR_R232_DEFAULT,nextFajrAt:nextFajr,
 }));
 assert.match(html,/إيقاع يومك/u);
 assert.match(html,/np-r234-grid/u);
 assert.match(html,/tone-night/u);
 assert.match(html,/ساعات الليل الشرعي/u);
 assert.match(html,/12 س 21 د/u);
 assert.match(html,/np-r234-time-point/u);
 assert.match(html,/np-r234-card-bottom/u);
 assert.match(html,/وقت صلاة الضحى/u);
 assert.match(html,/data-testid="friday-five-hours-r232"/u);
 assert.match(css,/\.np-r232-grid\.np-r234-grid/u);
 assert.match(css,/max-width: 650px/u);
 assert.match(css,/\.tone-night \.np-r234-progress span/u);
});
test("R234 unsafe night snapshot fails closed instead of reusing today's Fajr",()=>{
 const wrong=r232DailyWindows(prayers,"2026-11-06T02:31:00Z");
 assert.equal(wrong.islamicNight,null);
});
