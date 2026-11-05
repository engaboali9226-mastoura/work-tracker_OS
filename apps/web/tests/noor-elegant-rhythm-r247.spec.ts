import assert from "node:assert/strict";
import test from "node:test";
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
const render=(at,fridayAdhan="",fastingTimerOutsideRamadan=false)=>
 renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  prayers,nowMs:at,timeZone:"Asia/Riyadh",nextFajrAt:"2026-11-07T02:33:00Z",
  preferences:{...NOOR_R232_DEFAULT,fridayAdhan,fastingTimerOutsideRamadan},
  onPreferencesChange:()=>{},
 }));
test("R247 digital timer is separate from label and all three periods remain in order",()=>{
 const html=render(Date.parse("2026-11-06T18:00:00Z"),"",true);
 assert.match(html,/np-r247-rhythm-card/);
 assert.match(html,/np-r247-rhythm-strip/);
 assert.match(html,/np-r247-timer-caption/);
 assert.match(html,/np-r247-digits/);
 assert.match(html,/dir="ltr">[0-9]{2}:[0-9]{2}:[0-9]{2}<\/strong>/);
 assert.equal((html.match(/class="np-r247-timer"/g)||[]).length,3);
 const day=html.indexOf('aria-label="ساعات النهار"');
 const duha=html.indexOf('aria-label="وقت صلاة الضحى"');
 const night=html.indexOf('aria-label="ساعات الليل الشرعي"');
 assert.ok(day>0&&day<duha&&duha<night);
 assert.match(html,/tone-day/);assert.match(html,/tone-duha/);assert.match(html,/tone-night/);
});
test("R247 fasting timer off is explicit and other countdowns remain enabled",()=>{
 const html=render(Date.parse("2026-11-06T18:00:00Z"));
 assert.match(html,/data-testid="fasting-timer-disabled-r232">مؤقت الصيام متوقف/);
 assert.equal((html.match(/class="np-r247-timer"/g)||[]).length,2);
 assert.match(html,/12 س 21 د/);
});
test("R247 calm color identity and mobile width equal thirds with tabular digital countdown",()=>{
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 assert.match(css,/\.np-r247-rhythm-strip > \.np-r232-fasting-wrapper/);
 assert.match(css,/\.np-r247-rhythm-strip > \.np-r232-window\.tone-duha/);
 assert.match(css,/\.np-r247-rhythm-strip > \.np-r232-window\.tone-night/);
 assert.match(css,/calc\(\(100% - 10px\)\/3\)/);
 assert.match(css,/font-variant-numeric:tabular-nums/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test("R247 Friday schedule remains in one horizontally extensible card",()=>{
 const html=render(Date.parse("2026-11-06T08:00:00Z"),"12:12");
 assert.ok(html.indexOf('np-r237-friday-inline')>html.indexOf('aria-label="ساعات الليل الشرعي"'));
 assert.match(html,/الساعة الخامسة/);
});
