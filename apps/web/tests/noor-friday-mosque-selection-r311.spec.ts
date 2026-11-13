import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {createElement,act} from "react";
import {createRoot} from "react-dom/client";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

const prayers=[
 {key:"fajr",at:"2026-11-13T02:45:00Z"},
 {key:"sunrise",at:"2026-11-13T03:01:00Z"},
 {key:"dhuhr",at:"2026-11-13T08:40:00Z"},
 {key:"asr",at:"2026-11-13T12:15:00Z"},
 {key:"maghrib",at:"2026-11-13T14:02:00Z"},
];
const render=(opts:Record<string,unknown>={})=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
 nowMs:Date.parse("2026-11-13T06:00:00Z"),prayers,timeZone:"Asia/Riyadh",preferences:NOOR_R232_DEFAULT,
 ...opts,
}));

test("R311: selection is optional and five compact Friday tiles stay unchanged for non-interactive callers",()=>{
 const html=render();
 assert.equal(new JSDOM(html).window.document.querySelectorAll(".np-r237-friday-hours > .np-r232-window").length,5);
 assert.doesNotMatch(html,/r311-select-friday-/);
 const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
 const patch=css.slice(css.indexOf("/* R311: compact accessible Friday mosque arrival selection."));
 assert.ok(patch.length>1000);
 assert.match(patch,/\.np-r311-friday-select\s*\{[\s\S]*?position:absolute/);
 assert.match(patch,/\.np-r311-friday-select:focus-visible/);
 assert.doesNotMatch(patch,/min-height:\s*(?:8\d|9\d|1\d\d)px/,"No taller base card height");
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});

test("R311: actual Friday tile is pressable, saved choice has visible tick, and selection can be changed",()=>{
 const root=(choice:1|2|3|4|5|null)=>new JSDOM(render({
  selectedFridayHour:choice,onSelectFridayHour:(_hour:1|2|3|4|5)=>{}
 })).window.document;
 const plain=root(null);
 assert.equal(plain.querySelectorAll('[data-testid^="r311-select-friday-"]').length,5);
 const chosen=root(3);
 const buttons=[...chosen.querySelectorAll('[data-testid^="r311-select-friday-"]')];
 assert.deepEqual(buttons.map(x=>x.getAttribute("aria-pressed")),["false","false","true","false","false"]);
 assert.equal(chosen.querySelectorAll(".np-r311-visited").length,1);
 assert.equal(chosen.querySelectorAll(".np-r311-selected-mark").length,1);
 assert.equal(buttons[2]?.getAttribute("aria-label"),"إلغاء تسجيل الوصول إلى المسجد خلال الساعة الثالثة");
 const blocked=root(4);
 assert.ok(blocked.querySelector('[data-testid="r311-select-friday-4"]'));
 const disabled=new JSDOM(render({selectedFridayHour:4,fridaySelectionBusy:true,onSelectFridayHour:()=>{}})).window.document;
 assert.equal(disabled.querySelectorAll('[data-testid^="r311-select-friday-"]:disabled').length,5);
});

test("R311: touching a Friday card dispatches exactly the intended arrival hour",async()=>{
 const doc=new JSDOM("<!doctype html><div id='root'></div>",{url:"https://localhost/"});
 const before={window:globalThis.window,document:globalThis.document,HTMLElement:globalThis.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:doc.window,document:doc.window.document,HTMLElement:doc.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const calls:number[]=[];
 const parent=doc.window.document.getElementById("root")!;
 const root=createRoot(parent);
 try{
  await act(async()=>root.render(createElement(NoorR232TimeWindows,{
    nowMs:Date.parse("2026-11-13T06:00:00Z"),prayers,timeZone:"Asia/Riyadh",
    preferences:NOOR_R232_DEFAULT,onSelectFridayHour:(hour)=>calls.push(hour),
  })));
  const button=parent.querySelector('[data-testid="r311-select-friday-2"]');
  assert.ok(button);
  await act(async()=>button.dispatchEvent(new doc.window.MouseEvent("click",{bubbles:true,cancelable:true})));
  assert.deepEqual(calls,[2]);
 }finally{
  await act(async()=>root.unmount());
  Object.assign(globalThis,before);
  doc.window.close();
 }
});

test("R311: Thursday preview has no selectable hours, and cross-device sync uses authenticated Personal command",()=>{
 const thursday=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
  nowMs:Date.parse("2026-11-12T13:00:00Z"),
  prayers:prayers.map(p=>({...p,at:p.at.replace("2026-11-13","2026-11-12")})),
  timeZone:"Asia/Riyadh",preferences:NOOR_R232_DEFAULT,onSelectFridayHour:()=>{},
 }));
 assert.match(thursday,/data-friday-mode="thursday-reminder"/);
 assert.doesNotMatch(thursday,/r311-select-friday-/);
 const view=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 const client=readFileSync(new URL("../src/noor-personal-today-client.ts",import.meta.url),"utf8");
 assert.match(view,/type:"set-friday-mosque-hour",hour:selected===hour\?null:hour,expectedHour:selected/);
 assert.match(view,/workspace\?\.fridayMosqueVisits\.find/);
 assert.match(client,/set-friday-mosque-hour/);
 assert.doesNotMatch(view,/localStorage\.setItem\(["']friday/);
});
