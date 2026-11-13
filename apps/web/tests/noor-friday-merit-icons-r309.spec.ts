import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {NOOR_FRIDAY_VIRTUES_R284} from "../src/noor-friday-virtues-r284.js";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

const prayers=[
 {key:"fajr",at:"2026-11-06T02:45:00Z"},
 {key:"sunrise",at:"2026-11-06T03:01:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:40:00Z"},
 {key:"maghrib",at:"2026-11-06T14:02:00Z"},
];

test("R309: keep the original five Friday merit pictures visibly associated with the five hour headings",()=>{
 const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  nowMs:Date.parse("2026-11-06T06:00:00Z"),
  prayers,timeZone:"Asia/Riyadh",preferences:NOOR_R232_DEFAULT,
 }));
 const dom=new JSDOM(html).window.document;
 const cards=[...dom.querySelectorAll(".np-r237-friday-hours > .np-r232-window")];
 assert.equal(cards.length,5);
 assert.deepEqual(NOOR_FRIDAY_VIRTUES_R284.map(v=>v.icon),["🐪","🐄","🐏","🐓","🥚"]);
 for(const [i,card] of cards.entries()){
  const virtue=NOOR_FRIDAY_VIRTUES_R284[i]!;
  const head=card.querySelector(".np-r234-card-title");
  assert.ok(head,`Friday hour ${i+1} has heading`);
  const picture=head.querySelector(`[data-testid="friday-virtue-${i+1}"]`);
  assert.ok(picture,`Friday hour ${i+1} picture remains in its heading`);
  assert.equal(picture.querySelector("span:first-child")?.textContent,virtue.icon);
  assert.equal(picture.querySelector("span:last-child")?.textContent,virtue.description);
  assert.equal(head.querySelector("h3")?.getAttribute("aria-label"),
   `الساعة ${["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][i]}`);
 }
 assert.equal(dom.querySelectorAll('[data-testid="r308-friday-details"] li').length,5);
});

test("R309: restore visible pictograms without hiding the five compact intervals or increasing card height",()=>{
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 const patch=css.slice(css.indexOf("/* R309 — Preserve the established Friday merit pictograms."));
 assert.ok(patch.length>800);
 assert.match(patch,/\.np-r237-friday-hours \.np-r284-friday-virtue\s*\{[\s\S]*?display:inline-flex !important/);
 assert.match(patch,/\.np-r237-friday-hours \.np-r234-card-title\s*\{[\s\S]*?flex-direction:row !important/);
 assert.match(patch,/\.np-r284-friday-virtue > span:first-child\s*\{[\s\S]*?display:inline-block/);
 assert.match(patch,/\.np-r284-friday-virtue > span:last-child\s*\{[\s\S]*?clip-path:inset\(50%\)/);
 assert.doesNotMatch(patch,/min-height\s*:\s*\d+px/,"No extra card height added");
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});
