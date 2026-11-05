import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
const prayers=[
  {key:"fajr",at:"2026-11-06T02:45:00Z"},
  {key:"sunrise",at:"2026-11-06T03:55:00Z"},
  {key:"dhuhr",at:"2026-11-06T08:35:00Z"},
  {key:"maghrib",at:"2026-11-06T14:05:00Z"},
];
const view=(nowMs,fridayAdhan="")=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers,nowMs,timeZone:"Asia/Riyadh",
  nextFajrAt:"2026-11-07T02:46:00Z",
  preferences:{...NOOR_R232_DEFAULT,fridayAdhan},
  onPreferencesChange:()=>{},
}));
test("R246 provides an explicitly versioned, full-width, low-height rhythm card",()=>{
 const html=view(Date.parse("2026-11-05T08:00:00Z"));
 assert.match(html,/data-rhythm-layout="three-visible-columns-r246"/);
 assert.match(html,/np-r246-three-up/);
 assert.match(html,/إيقاع اليوم/);
 const day=html.indexOf('aria-label="ساعات النهار"');
 const duha=html.indexOf('aria-label="وقت صلاة الضحى"');
 const night=html.indexOf('aria-label="ساعات الليل الشرعي"');
 assert.ok(duha>0 && duha<day && day<night);
 for(const label of ["النهار","الضحى","الليل"]){
   assert.match(html,new RegExp(">"+label+"</h3>"));
 }
 assert.equal((html.match(/data-testid="noor-day-night-friday-r232"/g)||[]).length,1);
 assert.doesNotMatch(html,/np-r237-friday-inline/);
});
test("R246 mobile shows all three periods at one-third width, never legacy 210px",()=>{
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 assert.match(css,/\.np-r246-three-up > \.np-r232-fasting-wrapper,/);
 assert.match(css,/flex: 0 0 33\.333333% !important/);
 assert.match(css,/width: 33\.333333% !important/);
 assert.match(css,/min-width: 0 !important/);
 assert.match(css,/min-height: 105px/);
 assert.match(css,/\.np-r246-three-up \.np-r234-time-point strong/);
 assert.match(css,/\.np-r246-three-up \.np-r246-fasting-label \{ display: none; \}/);
});
test("R246 Friday hours stay inside same horizontally scrollable band after three visible periods",()=>{
 const html=view(Date.parse("2026-11-06T08:00:00Z"),"12:15");
 assert.match(html,/data-testid="friday-five-hours-r232"/);
 const day=html.indexOf('aria-label="ساعات النهار"');
 const night=html.indexOf('aria-label="ساعات الليل الشرعي"');
 const friday=html.indexOf('np-r237-friday-inline');
 assert.ok(day>=0&&night>day&&friday>night);
 assert.match(html,/الساعة الخامسة/);
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 assert.match(css,/\.np-r232-section \.np-r246-three-up > \.np-r237-friday-inline/);
});
