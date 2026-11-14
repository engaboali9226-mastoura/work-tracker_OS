import test from "node:test";
import assert from "node:assert/strict";
import {createElement,act} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createRoot} from "react-dom/client";
import {JSDOM} from "jsdom";
import {readFileSync} from "node:fs";
import {UpcomingCountdownR301} from "../src/noor-upcoming-countdown-r301.js";
import {DefinitionForm} from "../src/noor-personal-application-view.js";

const nowMs=Date.parse("2026-11-12T10:00:00.000Z");
const render=(definitions:Parameters<typeof UpcomingCountdownR301>[0]["definitions"],onAdd?:()=>void)=>
 renderToStaticMarkup(createElement(UpcomingCountdownR301,{definitions,nowMs,timeZone:"Asia/Riyadh",...(onAdd?{onAdd}:{})}));

test("R302: upcoming card is visible with zero saved plans, not silently hidden",()=>{
 const html=render([],()=>{});
 assert.match(html,/data-testid="r301-upcoming-countdowns"/);
 assert.match(html,/data-countdown-empty="true"/);
 assert.match(html,/data-testid="r302-countdown-empty"/);
 assert.match(html,/لا توجد مواعيد مرتقبة بعد/);
 assert.match(html,/data-testid="r302-add-first-countdown"/);
 assert.match(html,/data-testid="r302-add-countdown"/);
});
test("R302: upcoming card keeps visible add action when there are scheduled events",()=>{
 const html=render([{id:"first",title:"موعد المدرسة",state:"Active",countdownPlan:{kind:"appointment",date:"2026-11-18",time:"09:00"}}],()=>{});
 assert.match(html,/data-countdown-empty="false"/);
 assert.match(html,/data-testid="r302-add-countdown"/);
 assert.doesNotMatch(html,/data-testid="r302-countdown-empty"/);
 assert.match(html,/data-countdown-phase="days"/);
});
test("R302: tapping add-first in the mounted mobile card calls the direct creation action",async()=>{
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:"https://noor.test/personal"});
 const globals:Record<string,unknown>={
  window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
  HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,Node:dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT:true
 };
 const saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries(globals)){
  saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const root=createRoot(dom.window.document.getElementById("root")!);
 let clicks=0;
 try{
  await act(async()=>root.render(createElement(UpcomingCountdownR301,{
   definitions:[],timeZone:"Asia/Riyadh",nowMs,onAdd:()=>{clicks++;}
  })));
  await act(async()=>{(dom.window.document.querySelector('[data-testid="r302-add-first-countdown"]') as HTMLButtonElement).click();});
  assert.equal(clicks,1);
  await act(async()=>{(dom.window.document.querySelector('[data-testid="r302-add-countdown"]') as HTMLButtonElement).click();});
  assert.equal(clicks,2);
 }finally{
  await act(async()=>root.unmount());
  for(const [key,descriptor] of saved){
   if(descriptor)Object.defineProperty(globalThis,key,descriptor);
   else Reflect.deleteProperty(globalThis,key);
  }
  dom.window.close();
 }
});
test("R302: direct creation form preselects appointment but ordinary task creation stays unchanged",()=>{
 const props={busy:false,onCommand:async()=>true,defaultStartDate:"2026-11-12",defaultKind:"Task" as const,categories:["الشؤون الشخصية"]};
 const quick=renderToStaticMarkup(createElement(DefinitionForm,{...props,defaultCountdownKind:"appointment"}));
 assert.match(quick,/data-testid="r301-countdown-kind"/);
 assert.match(quick,/<option value="appointment" selected=""/);
 assert.match(quick,/data-testid="r301-countdown-date"/);
 assert.match(quick,/data-testid="r301-countdown-time"/);
 assert.doesNotMatch(quick,/name="startDate"/,"appointments have a single selected event day");
 const ordinary=renderToStaticMarkup(createElement(DefinitionForm,props));
 assert.match(ordinary,/<option value="none" selected=""/);
 assert.match(ordinary,/name="startDate"/);
});
test("R302: Dashboard action opens Control Center directly on the appointment creation modal",()=>{
 const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(source,/onAddCountdown=\{\(\) => \{setControlCountdownCreate\(true\);setControlOpen\(true\);\}\}/);
 assert.match(source,/initialCountdownCreate=\{controlCountdownCreate\}/);
 assert.match(source,/const \[section,setSection\].*initialCountdownCreate\?"Task":initialSection/);
 assert.match(source,/initialSection="Habit"/);
 assert.match(source,/initialSection=\{controlInitialSection\}/);
 assert.match(source,/const \[creating,setCreating\] = useState\(initialCountdownCreate\)/);
 assert.match(source,/defaultCountdownKind=\{quickCountdown&&!editing\?"appointment":"none"\}/);
 assert.match(source,/onAdd=\{onAddCountdown\}/);
 assert.match(source,/R302: countdown discovery and direct add on mobile/);
});
