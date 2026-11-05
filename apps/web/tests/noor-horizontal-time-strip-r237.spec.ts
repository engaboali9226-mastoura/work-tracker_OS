import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
const prayers=[
  {key:"fajr",at:"2026-11-06T02:40:00Z"},
  {key:"sunrise",at:"2026-11-06T03:50:00Z"},
  {key:"dhuhr",at:"2026-11-06T08:35:00Z"},
  {key:"maghrib",at:"2026-11-06T14:05:00Z"},
];
const render=(nowMs:number,fridayAdhan:string)=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers,nowMs,timeZone:"Asia/Riyadh",nextFajrAt:"2026-11-07T02:41:00Z",
  preferences:{...NOOR_R232_DEFAULT,fridayAdhan},
  onPreferencesChange:()=>{},
}));
test("R237 one shallow strip contains all day/night/Duha periods in ONE horizontal row",()=>{
  const html=render(Date.parse("2026-11-05T08:00:00Z"),"12:15");
  assert.equal((html.match(/np-r237-horizontal-strip/gu)||[]).length,1);
  assert.match(html,/ساعات النهار/u);
  assert.match(html,/ساعات الليل الشرعي/u);
  assert.match(html,/وقت صلاة الضحى/u);
  assert.doesNotMatch(html,/np-r237-friday-inline/u);
  const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
  assert.match(css,/\.np-r235-unified-rows\.np-r237-horizontal-strip\s*\{\s*display: flex !important;\s*flex-direction: row !important;/u);
  assert.match(css,/overflow-x: auto/u);
  assert.match(css,/min-height: 103px/u);
  assert.match(css,/scroll-snap-type: x proximity/u);
  assert.match(css,/\.np-r237-horizontal-strip \.np-r234-progress/u);
});
test("R237 five Friday hours remain within same strip, not below the card",()=>{
  const html=render(Date.parse("2026-11-06T08:00:00Z"),"12:15");
  const strip=html.indexOf("np-r237-horizontal-strip");
  const friday=html.indexOf("np-r237-friday-inline");
  assert.ok(strip>=0&&friday>strip);
  assert.match(html,/np-r237-friday-hours/u);
  assert.match(html,/الساعة الخامسة/u);
  assert.equal((html.match(/data-testid="noor-day-night-friday-r232"/gu)||[]).length,1);
  const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
  assert.match(css,/\.np-r235-five-rows\.np-r237-friday-hours\s*\{\s*display: flex !important;\s*flex-direction: row !important;/u);
});
