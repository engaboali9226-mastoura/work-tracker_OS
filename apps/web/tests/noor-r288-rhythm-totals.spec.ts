import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
const prayers=[
 {key:"fajr",at:"2026-11-06T02:31:00Z"},
 {key:"sunrise",at:"2026-11-06T03:40:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:30:00Z"},
 {key:"maghrib",at:"2026-11-06T14:12:00Z"},
];
test("R288 day and night total hours use trusted interval lengths, not a secondary clock",()=>{
  const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
    prayers,nowMs:Date.parse("2026-11-06T13:00:00Z"),timeZone:"Asia/Riyadh",
    nextFajrAt:"2026-11-07T02:33:00Z",
    preferences:NOOR_R232_DEFAULT,
  }));
  assert.match(html,/data-testid="r288-day-total-hours">ساعات النهار: 11 س 41 د/);
  assert.match(html,/data-testid="r288-night-total-hours">ساعات الليل: 12 س 21 د/);
  const dayAt=html.indexOf('data-testid="r288-day-total-hours"');
  const nightAt=html.indexOf('data-testid="r288-night-total-hours"');
  assert.ok(dayAt>0&&nightAt>dayAt);
  assert.match(html.slice(dayAt,dayAt+500),/np-r247-timer/,"day total remains adjacent to active timer");
});
test("R288 missing authoritative next Fajr does not invent total night length",()=>{
  const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
    prayers,nowMs:Date.parse("2026-11-06T13:00:00Z"),timeZone:"Asia/Riyadh",
    preferences:NOOR_R232_DEFAULT,
  }));
  assert.doesNotMatch(html,/data-testid="r288-night-total-hours"/);
  assert.match(html,/لم تتوفر مواقيت الغد/);
});
test("R288 three-column rhythm retains compact width while revealing duration",()=>{
  const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
  assert.match(css,/R288: restore real, trusted whole-duration labels/);
  assert.match(css,/\.np-r248-reference-strip :is\(\.tone-day,\.tone-night\) \.np-r234-duration/);
  assert.match(css,/@media\(max-width:700px\)/);
});
