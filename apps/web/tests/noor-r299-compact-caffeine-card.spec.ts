import test from "node:test";
import assert from "node:assert/strict";
import {act,createElement} from "react";
import {createRoot} from "react-dom/client";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {readFileSync} from "node:fs";
import {NoorBeverageTrackerR294} from "../src/noor-beverage-tracker-r294.js";

const date="2026-11-12",at="2026-11-12T06:00:00.000Z";
function beverageRow(count:number){
 return {
  id:"coffee",executionId:"coffee-today",title:"قهوة",category:"الصحة والرياضة",
  revisionId:"rev",startDate:date,endDate:null,weight:1,importance:"Optional" as const,status:"Pending",
  plan:{targetServings:2,kind:"coffee" as const,sleepTime:"00:00"},
  log:Array.from({length:count},(_,i)=>({id:"cup-"+i,executionId:"coffee-today",at,localDate:date,amount:1,beverageTime:"08:00"}))
 };
}

test("R299: approved whole-card tinted state has a visible dot, cup illustration and compact counters",()=>{
 for(const [cups,color,status] of [[2,"green","أخضر"],[3,"yellow","أصفر"],[4,"red","أحمر"]] as const){
  const html=renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{
   rows:[beverageRow(cups)],localDate:date,timeZone:"Asia/Riyadh",busy:false,onCommand:async()=>true
  }));
  assert.match(html,new RegExp('data-status="'+color+'"'));
  assert.match(html,new RegExp('np-caffeine-card-'+color+'-r299'));
  assert.match(html,new RegExp('data-level="'+color+'"'));
  assert.ok(html.includes('حالة المنبهات: '+status));
  assert.match(html,/np-caffeine-card-dot-r299/);
  assert.match(html,/np-caffeine-cup-r299/);
  assert.match(html,/<svg /);
  assert.match(html,/>القهوة</);
  assert.match(html,/>الشاي</);
  assert.match(html,/إجمالي المنبّهات/);
  assert.match(html,/\+ قهوة/);
  assert.match(html,/\+ شاي/);
  assert.match(html,/<details class="np-caffeine-details-r296">/);
 }
});
test("R299: mobile CSS colors the entire card and keeps status text legible without a separate alert banner",()=>{
 const css=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(css,/R299: approved compact, whole-card status tint/);
 for(const level of ["green","yellow","red"])
  assert.ok(css.includes(".np-page .np-caffeine-card-"+level+"-r299{--np-drink-accent:"),level);
 assert.match(css,/\.np-page \.np-beverages-r294\.np-caffeine-card-r299\{\s*width:min\(100%,550px\)/);
 assert.match(css,/background:color-mix\(in srgb,var\(--panel\) 78%,var\(--np-drink-accent\) 22%\)/);
 assert.match(css,/\.np-page \.np-caffeine-card-dot-r299\{/);
 assert.match(css,/\.np-page \.np-caffeine-card-r299 \.np-caffeine-signal-r295\{\s*display:grid/);
 assert.match(css,/flex:initial;padding:0;border:0;border-radius:0;background:transparent/);
 assert.match(css,/@media\(max-width:350px\)/);
 assert.match(css,/min-height:44px;font-size:13px;border-radius:11px/);
});
test("R299: quick coffee button still opens time picker and keeps original owner command flow",async()=>{
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:"https://noor.test/personal"});
 const originals=new Map<string,PropertyDescriptor|undefined>();
 const globals:Record<string,unknown>={
  window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
  Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT:true,
 };
 for(const [key,value] of Object.entries(globals)){
  originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const root=createRoot(dom.window.document.getElementById("root")!);
 const commands:unknown[]=[];
 try{
  await act(async()=>root.render(createElement(NoorBeverageTrackerR294,{
   rows:[beverageRow(1)],localDate:date,timeZone:"Asia/Riyadh",busy:false,
   onCommand:async command=>{commands.push(command);return true;}
  })));
  const quick=[...dom.window.document.querySelectorAll(".np-caffeine-quick-r295 button")]
    .find(button=>button.textContent?.includes("+ قهوة")) as HTMLButtonElement | undefined;
  assert.ok(quick);
  await act(async()=>quick!.click());
  assert.ok(dom.window.document.querySelector('[data-testid="r295-time-picker"]'));
  const afterIsha=[...dom.window.document.querySelectorAll(".np-caffeine-time-options-r295 button")]
    .find(button=>button.textContent?.includes("بعد العشاء")) as HTMLButtonElement | undefined;
  assert.ok(afterIsha);
  await act(async()=>afterIsha!.click());
  const confirm=[...dom.window.document.querySelectorAll(".np-caffeine-picker-actions-r295 button")]
    .find(button=>button.textContent?.includes("تأكيد تسجيل الكوب")) as HTMLButtonElement | undefined;
  assert.ok(confirm);
  await act(async()=>confirm!.click());
  assert.equal(commands.length,1);
  const command=commands[0] as {type:string;delta:number;beverageTime:string;executionId:string};
  assert.equal(command.type,"adjust-beverage-serving");
  assert.equal(command.delta,1);
  assert.equal(command.beverageTime,"21:00");
  assert.equal(command.executionId,"coffee-today");
 }finally{
  await act(async()=>root.unmount());
  for(const [key,desc] of originals){
   if(desc)Object.defineProperty(globalThis,key,desc);
   else Reflect.deleteProperty(globalThis,key);
  }
  dom.window.close();
 }
});
