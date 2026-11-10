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
const view=()=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
 prayers,nowMs:Date.parse("2026-11-06T13:00:00Z"),
 timeZone:"Asia/Riyadh",nextFajrAt:"2026-11-07T02:33:00Z",
 preferences:{...NOOR_R232_DEFAULT,fastingTimerOutsideRamadan:true},onPreferencesChange:()=>{},
}));
test("R249 retains approved preview, 3 RTL periods, colors and white digital timers",()=>{
 const html=view();
 assert.match(html,/data-reference-design="preview-r248"/);
 const a=html.indexOf('aria-label="وقت صلاة الضحى"'),
       b=html.indexOf('aria-label="ساعات النهار"'),
       c=html.indexOf('aria-label="ساعات الليل الشرعي"');
 assert.ok(a>=0&&a<b&&b<c);
 assert.equal((html.split('data-testid="friday-five-hours-r232"')[0].match(/class="np-r247-timer"/g)||[]).length,3);
 for(const color of ["#fffaea","#fff2dc","#eaf5f3"])assert.ok(css.includes(color));
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test("R249 desktop cards use shorter min-height and centered narrow timers while preserving overall width",()=>{
 const section=css.slice(css.indexOf("/* R249: approved"));
 assert.ok(section.length>1000);
 assert.match(section,/\.np-r232-section\.np-r248-reference-card \{\s*box-sizing:border-box;\s*width:100%/);
 assert.match(section,/min-height:105px/);
 assert.match(section,/@media \(min-width:900px\)/);
 assert.match(section,/min-height:100px/);
 assert.match(section,/max-width:200px/);
 assert.match(section,/margin-inline:auto/);
 assert.match(section,/\.np-r248-reference-strip \.np-r247-digits/);
});
test("R249 mobile preserves three visible columns and compact 105px card body",()=>{
 const section=css.slice(css.indexOf("/* R249: approved"));
 assert.match(section,/@media \(max-width:530px\)/);
 assert.match(section,/min-height:105px/);
 assert.match(section,/max-width:100%/);
 assert.match(section,/font-size:clamp\(11px,2\.9vw,14px\)/);
});
