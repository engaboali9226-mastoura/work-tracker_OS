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
const render=(nowMs,fridayAdhan)=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
 prayers,nowMs,timeZone:"Asia/Riyadh",nextFajrAt:"2026-11-07T02:33:00Z",
 preferences:{...NOOR_R232_DEFAULT,fridayAdhan,fastingTimerOutsideRamadan:true},
 onPreferencesChange:()=>{},
}));
test("R248 exact reference composition: Duha / daylight / night with subtitle and white timer",()=>{
 const html=render(Date.parse("2026-11-06T04:00:00Z"),"");
 assert.match(html,/data-reference-design="preview-r248"/);
 const duha=html.indexOf('aria-label="وقت صلاة الضحى"');
 const day=html.indexOf('aria-label="ساعات النهار"');
 const night=html.indexOf('aria-label="ساعات الليل الشرعي"');
 assert.ok(duha>0 && day>duha && night>day);
 for(const caption of ["بعد الشروق","من الفجر للمغرب","حتى فجر الغد"])assert.ok(html.includes(caption));
 assert.equal((html.split('data-testid="friday-five-hours-r232"')[0].match(/class="np-r247-timer"/g)||[]).length,3);
});
test("R248 colors and layout strictly match reference cards, inner white timers",()=>{
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 for(const value of ["#fffaea","#fff2dc","#eaf5f3","#fff"]) assert.ok(css.includes(value));
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.np-r248-reference-strip \.np-r247-digits/);
 assert.match(css,/R248: faithful implementation/);
});
test("R248 Friday remains in the same card after the three primary periods",()=>{
 const html=render(Date.parse("2026-11-06T08:00:00Z"),"12:12");
 assert.ok(html.indexOf("np-r237-friday-inline")>html.indexOf('aria-label="ساعات الليل الشرعي"'));
 assert.match(html,/الساعة الخامسة/);
});
