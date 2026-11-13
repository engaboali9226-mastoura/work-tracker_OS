import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {noorFridayPresentationR310} from "../src/noor-friday-visibility-r310.js";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
import {NOOR_FRIDAY_VIRTUES_R284} from "../src/noor-friday-virtues-r284.js";

const zone="Asia/Riyadh";
const thursdayPrayers=[
 {key:"fajr",at:"2026-11-05T02:45:00Z"},
 {key:"sunrise",at:"2026-11-05T03:01:00Z"},
 {key:"dhuhr",at:"2026-11-05T08:40:00Z"},
 {key:"asr",at:"2026-11-05T12:15:00Z"},
 {key:"maghrib",at:"2026-11-05T14:02:00Z"},
];
const fridayPrayers=thursdayPrayers.map(p=>({...p,at:p.at.replace("2026-11-05","2026-11-06")}));
const at=(utc:string)=>Date.parse(utc);
const render=(ms:number,prayers=thursdayPrayers)=>new JSDOM(renderToStaticMarkup(
 createElement(NoorR232TimeWindows,{nowMs:ms,timeZone:zone,prayers,preferences:NOOR_R232_DEFAULT})
)).window.document;

test("R310: the Friday-specific card is hidden before Thursday Asr, then visible starting exactly at authoritative Asr",()=>{
 const before=at("2026-11-05T12:14:59Z");
 const atAsr=at("2026-11-05T12:15:00Z");
 const nearMidnight=at("2026-11-05T20:59:59Z");
 assert.equal(noorFridayPresentationR310(before,zone,thursdayPrayers),"hidden");
 assert.equal(noorFridayPresentationR310(atAsr,zone,thursdayPrayers),"thursday-reminder");
 assert.equal(noorFridayPresentationR310(nearMidnight,zone,thursdayPrayers),"thursday-reminder");
 assert.equal(render(before).querySelectorAll('[data-testid="friday-five-hours-r232"]').length,0);
 const dom=render(atAsr);
 const friday=dom.querySelector('[data-testid="friday-five-hours-r232"]');
 assert.ok(friday);
 assert.equal(friday.getAttribute("data-friday-mode"),"thursday-reminder");
 assert.match(friday.textContent??"",/غدًا الجمعة/u);
 const cards=[...friday.querySelectorAll(".np-r237-friday-hours > .np-r232-window")];
 assert.equal(cards.length,5);
 assert.deepEqual(cards.map(x=>x.querySelector(".np-r284-friday-virtue span:first-child")?.textContent),
  NOOR_FRIDAY_VIRTUES_R284.map(x=>x.icon));
 assert.ok(cards.every(c=>c.querySelector('[role="status"]')?.textContent==="غدًا"));
 assert.equal(friday.querySelectorAll('[role="timer"]').length,0,"Do not invent timers for tomorrow");
 assert.equal(friday.querySelectorAll('[data-testid="r308-friday-details"] li').length,5);
});

test("R310: bad or missing current-day Asr cannot prematurely reveal the reminder",()=>{
 const during=at("2026-11-05T13:00:00Z");
 assert.equal(noorFridayPresentationR310(during,zone,thursdayPrayers.filter(x=>x.key!=="asr")),"hidden");
 assert.equal(noorFridayPresentationR310(during,zone,thursdayPrayers.map(x=>x.key==="asr"?{...x,at:"untrusted"}:x)),"hidden");
 assert.equal(noorFridayPresentationR310(during,zone,thursdayPrayers.map(x=>x.key==="asr"?{...x,at:"2026-10-29T12:15:00Z"}:x)),"hidden","Stale last-week Asr invalid");
 assert.equal(noorFridayPresentationR310(during,zone,thursdayPrayers.map(x=>x.key==="asr"?{...x,at:"2026-11-05T14:00:00Z"}:x)),"hidden","Not yet after Asr");
 assert.equal(noorFridayPresentationR310(NaN,zone,thursdayPrayers),"hidden");
 assert.equal(render(during,thursdayPrayers.filter(x=>x.key!=="asr")).querySelector('[data-testid="friday-five-hours-r232"]'),null);
});

test("R310: use local account timezone; show actual Friday timers on Friday and hide on Saturday through Thursday morning",()=>{
 const lateThu=at("2026-11-05T20:59:59Z");
 const localFriStart=at("2026-11-05T21:00:00Z");
 const friAtNoon=at("2026-11-06T08:00:00Z");
 const saturday=at("2026-11-06T21:00:00Z");
 assert.equal(noorFridayPresentationR310(lateThu,zone,thursdayPrayers),"thursday-reminder");
 assert.equal(noorFridayPresentationR310(localFriStart,zone,fridayPrayers),"friday");
 assert.equal(noorFridayPresentationR310(friAtNoon,zone,fridayPrayers),"friday");
 assert.equal(noorFridayPresentationR310(saturday,zone,fridayPrayers),"hidden");
 assert.equal(noorFridayPresentationR310(at("2026-11-03T12:30:00Z"),zone,thursdayPrayers),"hidden");
 const dom=render(friAtNoon,fridayPrayers);
 const section=dom.querySelector('[data-testid="friday-five-hours-r232"]');
 assert.equal(section?.getAttribute("data-friday-mode"),"friday");
 assert.equal(section?.querySelectorAll(".np-r237-friday-hours > .np-r232-window").length,5);
 assert.equal(section?.querySelectorAll(".np-r237-friday-hours [role=timer]").length,1);
 assert.equal(section?.querySelector(".np-r310-friday-caption"),null);
 assert.equal(render(saturday,fridayPrayers).querySelectorAll('[data-testid="friday-five-hours-r232"]').length,0);
});

test("R310: daily Duha, day and night panels stay visible throughout the week",()=>{
 for(const ms of [at("2026-11-03T12:30:00Z"),at("2026-11-05T12:14:59Z"),at("2026-11-05T12:15:00Z"),at("2026-11-06T08:00:00Z")]){
  const today=ms===at("2026-11-06T08:00:00Z")?fridayPrayers:thursdayPrayers;
  const dom=render(ms,today);
  assert.equal(dom.querySelectorAll(".np-r248-reference-strip > .tone-duha").length,1);
  assert.equal(dom.querySelectorAll(".np-r248-reference-strip > .np-r232-fasting-wrapper").length,1);
  assert.equal(dom.querySelectorAll(".np-r248-reference-strip > .tone-night").length,1);
 }
});
