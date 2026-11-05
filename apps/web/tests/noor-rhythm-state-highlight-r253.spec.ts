import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
const prayers=[
 {key:"fajr",at:"2026-11-05T01:43:00Z"},
 {key:"sunrise",at:"2026-11-05T03:03:00Z"},
 {key:"dhuhr",at:"2026-11-05T08:37:00Z"},
 {key:"maghrib",at:"2026-11-05T14:11:00Z"},
];
const markup=at=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
 prayers,nowMs:Date.parse(at),timeZone:"Asia/Riyadh",
 nextFajrAt:"2026-11-06T01:44:00Z",preferences:{...NOOR_R232_DEFAULT,fastingTimerOutsideRamadan:true},
 onPreferencesChange:()=>{},
}));
function phase(html,tone){
 const match=html.match(new RegExp('class="np-r232-window np-r234-window tone-'+tone+'" data-phase="([^"]+)"'));
 assert.ok(match,"missing "+tone+" period");
 return match[1];
}
test("R253 at night: finished daytime/duha are NOT active while night IS",()=>{
 const html=markup("2026-11-05T14:13:00Z");
 assert.equal(phase(html,"day"),"finished");
 assert.equal(phase(html,"duha"),"finished");
 assert.equal(phase(html,"night"),"active");
 assert.match(html,/data-reference-design="preview-r248"/);
});
test("R253 in daytime: day active, night upcoming; accessible timers unchanged",()=>{
 const html=markup("2026-11-05T10:00:00Z");
 assert.equal(phase(html,"day"),"active");
 assert.equal(phase(html,"night"),"upcoming");
 assert.equal((html.match(/class="np-r247-timer"/g)||[]).length,3);
});
test("R253 scoped state selector removes finished-day highlight and applies moonlit teal to active night",()=>{
 const block=css.slice(css.indexOf("/* R253 — owner-approved rhythm:"));
 assert.ok(block.length>1200);
 assert.match(block,/\.np-r232-fasting-wrapper:has\(> \.tone-day\[data-phase="finished"\]\)/);
 assert.match(block,/\.np-r232-fasting-wrapper:has\(> \.tone-day\[data-phase="active"\]\)/);
 assert.match(block,/\.np-r232-window\.tone-night\[data-phase="active"\]/);
 assert.match(block,/rgba\(52,109,113,\.16\)/);
 assert.match(block,/box-shadow: none !important/);
 assert.match(block,/prefers-reduced-motion: reduce/);
});
