import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
import {r283FridayHoursAtDhuhr} from "../src/noor-islamic-daylight-r232.js";

const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
const timeZone="Asia/Riyadh";
const prayers=[
 {key:"fajr",at:"2026-11-06T02:45:00Z"},
 {key:"sunrise",at:"2026-11-06T03:01:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:40:00Z"},
 {key:"maghrib",at:"2026-11-06T14:02:00Z"},
];
const first=Date.parse("2026-11-06T03:22:00Z");
const third=Date.parse("2026-11-06T06:00:00Z");
function fridayDom(nowMs:number){
 const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  nowMs,prayers,timeZone,preferences:NOOR_R232_DEFAULT,
 }));
 return new JSDOM(html).window.document;
}
test("R308: all five Friday hours are visible as five ordered cards at once",()=>{
 const dom=fridayDom(first);
 const group=dom.querySelector('[data-testid="friday-five-hours-r232"] .np-r237-friday-hours');
 assert.ok(group);
 assert.equal(group.getAttribute("role"),"group");
 const cards=[...group.querySelectorAll(":scope > .np-r232-window")];
 assert.equal(cards.length,5);
 assert.deepEqual(cards.map(c=>c.querySelector("h3")?.getAttribute("aria-label")),
  ["الساعة الأولى","الساعة الثانية","الساعة الثالثة","الساعة الرابعة","الساعة الخامسة"]);
 assert.deepEqual(cards.map(c=>c.querySelector("h3")?.textContent),
  ["الأولى","الثانية","الثالثة","الرابعة","الخامسة"]);
 assert.equal(cards.filter(c=>c.getAttribute("data-phase")==="active").length,1);
 assert.ok(cards[0]?.querySelector('[role="timer"]'));
 assert.equal(dom.querySelectorAll('[data-testid="r308-friday-details"]').length,1);
 assert.equal(dom.querySelectorAll('[data-testid="r308-friday-details"] li').length,5);
});
test("R308: the active interval changes without concealing the other four",()=>{
 const hours=r283FridayHoursAtDhuhr({nowMs:third,timeZone,prayers});
 assert.equal(hours?.length,5);
 const time=Math.floor(((hours?.[2]?.startMs??0)+(hours?.[2]?.endMs??0))/2);
 const dom=fridayDom(time);
 const cards=[...dom.querySelectorAll(".np-r237-friday-hours > .np-r232-window")];
 assert.equal(cards.length,5);
 assert.deepEqual(cards.map(c=>c.getAttribute("data-phase")),
  ["finished","finished","active","upcoming","upcoming"]);
 assert.ok(cards[2]?.querySelector('[role="timer"]'));
});
test("R308: five equal columns on phone and desktop, no concealed sideways list",()=>{
 const tail=css.slice(css.indexOf("/* R308 — Friday visibility repair."));
 assert.ok(tail.length>2500);
 assert.match(tail,/\.np-r237-friday-inline > \.np-r237-friday-hours\s*\{[\s\S]*?display:grid !important;[\s\S]*?grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(tail,/\.np-r237-friday-hours > \.np-r232-window\.np-r234-window\s*\{[\s\S]*?min-width:0 !important;/);
 assert.match(tail,/overflow:visible !important;/);
 assert.match(tail,/@media\(max-width:530px\)/);
 assert.match(tail,/min-height:68px !important/);
 assert.match(tail,/np-r308-friday-details summary:focus-visible/);
 assert.doesNotMatch(tail,/scroll-snap-type|scrollbar-width|overflow-x:auto/);
});
test("R308: Friday still appears only on Friday; main rhythm and prayer source remain intact",()=>{
 const friday=fridayDom(first);
 assert.equal(friday.querySelectorAll(".np-r248-reference-strip > .np-r232-window.tone-duha").length,1);
 assert.equal(friday.querySelectorAll(".np-r248-reference-strip > .np-r232-fasting-wrapper").length,1);
 assert.equal(friday.querySelectorAll(".np-r248-reference-strip > .np-r232-window.tone-night").length,1);
 const saturday=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  nowMs:Date.parse("2026-11-07T06:00:00Z"),prayers,timeZone,preferences:NOOR_R232_DEFAULT,
 }));
 assert.doesNotMatch(saturday,/data-testid="friday-five-hours-r232"/);
 const source=readFileSync(new URL("../src/noor-time-windows-r232.tsx",import.meta.url),"utf8");
 assert.match(source,/r283FridayHoursAtDhuhr/);
});
