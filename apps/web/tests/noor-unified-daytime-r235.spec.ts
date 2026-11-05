import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

const zone="Asia/Riyadh",friday=Date.parse("2026-11-06T08:00:00.000Z");
const times=[
  {key:"fajr",at:"2026-11-06T02:45:00.000Z"},
  {key:"sunrise",at:"2026-11-06T03:50:00.000Z"},
  {key:"dhuhr",at:"2026-11-06T08:40:00.000Z"},
  {key:"maghrib",at:"2026-11-06T14:02:00.000Z"},
];
const view=(at:number,fridayAdhan:string,nextFajrAt?:string)=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
 prayers:times,nowMs:at,timeZone:zone,
 preferences:{...NOOR_R232_DEFAULT,fridayAdhan},
 nextFajrAt,
 onPreferencesChange:()=>{},
}));
test("R235 unified timeline retains one surface while R238 orders day Duha night",()=>{
 const markup=view(friday,"","2026-11-07T02:50:00.000Z");
 assert.equal((markup.match(/data-testid="noor-day-night-friday-r232"/gu)||[]).length,1);
 assert.equal((markup.match(/np-r235-unified-rows/gu)||[]).length,1);
 assert.match(markup,/role="group" aria-label="الضحى والنهار والليل وساعات الجمعة في صف واحد"/u);
 const day=markup.indexOf('aria-label="ساعات النهار"'),duha=markup.indexOf('aria-label="وقت صلاة الضحى"'),night=markup.indexOf('aria-label="ساعات الليل الشرعي"');
 assert.ok(duha>=0&&duha<day&&day<night);
 assert.match(markup,/ساعات النهار/u);
 assert.match(markup,/ساعات الليل الشرعي/u);
 assert.match(markup,/وقت صلاة الضحى/u);
 assert.doesNotMatch(markup,/لم تتوفر مواقيت الغد/u);
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 assert.match(css,/np-r235-unified-rows \.np-r232-window\.np-r234-window/u);
 assert.match(css,/background: transparent; border: 0; border-radius: 0/u);
 assert.match(css,/grid-template-columns: 1fr/u);
 assert.match(css,/max-width: 530px/u);
});
test("R235 five Friday segments are part of the same master card, hidden on other days",()=>{
 const fridayMarkup=view(friday,"12:12","2026-11-07T02:50:00.000Z");
 assert.equal((fridayMarkup.match(/data-testid="noor-day-night-friday-r232"/gu)||[]).length,1);
 assert.match(fridayMarkup,/np-r235-friday-inline/u);
 assert.match(fridayMarkup,/np-r235-five-rows/u);
 assert.match(fridayMarkup,/الساعة الخامسة/u);
 const thursdayMarkup=view(Date.parse("2026-11-05T08:00:00Z"),"12:12");
 assert.doesNotMatch(thursdayMarkup,/np-r235-friday-inline/u);
});
test("R235 incomplete next-day Fajr is never fabricated and no account timezone changes",()=>{
 const missing=view(friday,"");
 assert.match(missing,/لم تتوفر مواقيت الغد/u);
 const dayEnd=view(friday,"",undefined);
 assert.equal((dayEnd.match(/np-r235-unified-rows/gu)||[]).length,1);
 const component=readFileSync(new URL("../src/noor-time-windows-r232.tsx",import.meta.url),"utf8");
 assert.match(component,/nextFajrAt/u);
 assert.doesNotMatch(component,/localStorage|sessionStorage|navigator\.geolocation/u);
});
