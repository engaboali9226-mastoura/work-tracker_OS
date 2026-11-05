import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
const prayers=[
 {key:"fajr",at:"2026-11-06T02:31:00Z"},
 {key:"sunrise",at:"2026-11-06T03:40:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:30:00Z"},
 {key:"maghrib",at:"2026-11-06T14:12:00Z"},
];
function markup(nowMs=Date.parse("2026-11-06T08:00:00Z"),fridayAdhan=""){
 return renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers,nowMs,timeZone:"Asia/Riyadh",nextFajrAt:"2026-11-07T02:33:00Z",
  preferences:{...NOOR_R232_DEFAULT,fridayAdhan,fastingTimerOutsideRamadan:true},
  onPreferencesChange:()=>{},
 }));
}
test("R250 regression: old Mac ≤1030px span-two rule must be explicitly overridden",()=>{
 const prior=css.indexOf(".np-r234-grid > .tone-duha { grid-column: span 2; }");
 const fix=css.indexOf("/* R250 — Fix verified Mac screenshot:");
 assert.ok(prior>=0&&fix>prior);
 const overrides=css.slice(fix);
 assert.match(overrides,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\) !important/);
 assert.match(overrides,/grid-template-rows:auto/);
 assert.match(overrides,/\.np-r232-window\.tone-duha \{ grid-column:1 !important; \}/);
 assert.match(overrides,/\.np-r232-fasting-wrapper \{ grid-column:2 !important; \}/);
 assert.match(overrides,/\.np-r232-window\.tone-night \{ grid-column:3 !important; \}/);
 assert.match(overrides,/@media \(max-width:1030px\)/);
});
test("R250 approved RTL markup still Duha/day/night and all three are direct grid items",()=>{
 const html=markup();
 const a=html.indexOf('aria-label="وقت صلاة الضحى"');
 const b=html.indexOf('data-testid="fasting-timer-control-r232"');
 const c=html.indexOf('aria-label="ساعات الليل الشرعي"');
 assert.ok(a>0 && b>a && c>b);
 assert.match(html,/np-r248-reference-strip/);
 assert.match(html,/data-reference-design="preview-r248"/);
 assert.equal((html.match(/class="np-r247-timer"/g)||[]).length,3);
});
test("R250 Friday hours remain a full-width second grid row only on Friday",()=>{
 const html=markup(Date.parse("2026-11-06T08:00:00Z"),"12:12");
 assert.match(html,/data-testid="friday-five-hours-r232"/);
 const segment=css.slice(css.indexOf("/* R248: faithful implementation"));
 assert.match(segment,/grid-column:1 \/ -1/);
 assert.ok(html.indexOf("np-r237-friday-inline")>html.indexOf("tone-night"));
});
