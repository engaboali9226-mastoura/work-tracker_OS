import assert from "node:assert/strict";
import test from "node:test";
import {JSDOM} from "jsdom";
import {act,createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createRoot} from "react-dom/client";
import {PlatformShell} from "../src/platform-shell.js";
import {NoorWorkTeacherViewR264} from "../src/noor-work-teacher-view-r264.js";

test("R265: authenticated Noor gateway exposes working, accessible Work navigation, not disabled soon card",()=>{
 const html=renderToStaticMarkup(createElement(PlatformShell,{
  state:{kind:"no-application-selected"},
  navigate:()=>{},
  authenticationState:"authenticated",
 }));
 const dom=new JSDOM(html);
 const work=dom.window.document.querySelector<HTMLAnchorElement>('a[href="/work"]');
 assert.ok(work,"Work must be an actual app link");
 assert.match(work.textContent??"",/نور ورك/);
 assert.doesNotMatch(work.className,/disabled/);
 assert.doesNotMatch(html,/قريبًا/);
 assert.ok(dom.window.document.querySelector('a[href="/personal"]'),"Personal remains accessible");
 dom.window.close();
});

function mounted(getData:()=>Promise<{ok:boolean;status:number;json:()=>Promise<unknown>}>){
 const dom=new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>',{
  url:"https://noor-work-r265.invalid",
 });
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,
  Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,
  IS_REACT_ACT_ENVIRONMENT:true,fetch:async()=>getData()};
 const previous=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,val] of Object.entries(globals)){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:val});
 }
 const root=createRoot(dom.window.document.getElementById("root")!);
 return {dom,root,async close(){
  await act(async()=>root.unmount());
  for(const [key,descriptor] of previous){
   if(descriptor)Object.defineProperty(globalThis,key,descriptor);
   else Reflect.deleteProperty(globalThis,key);
  }
  dom.window.close();
 }};
}
const empty={version:1,timetable:[],workdays:[],preparations:[],students:[],attendance:[],assessments:[],grades:[]};

test("R265: empty teacher workspace shows complete dashboard and onboarding entry point",async()=>{
 const t=mounted(async()=>({status:200,ok:true,json:async()=>({revision:0,state:empty})}));
 try{
  await act(async()=>{t.root.render(createElement(NoorWorkTeacherViewR264));});
  const text=t.dom.window.document.body.textContent??"";
  assert.match(text,/مساحة المعلم/);
  assert.match(text,/ابدأ تجهيز مساحة المعلم/);
  assert.match(text,/٢١ حصة/);
  const setup=[...t.dom.window.document.querySelectorAll("button")].find(b=>b.textContent?.includes("إعداد جدول الحصص"));
  assert.ok(setup,"onboarding has actionable next step");
  await act(async()=>{setup.click();});
  assert.match(t.dom.window.document.body.textContent??"",/إضافة حصة للجدول/);
 }finally{await t.close();}
});

test("R265: request failure never renders incomplete fake empty dashboard",async()=>{
 const t=mounted(async()=>{throw Error("connection interrupted");});
 try{
  await act(async()=>{t.root.render(createElement(NoorWorkTeacherViewR264));});
  const doc=t.dom.window.document;
  assert.match(doc.body.textContent??"",/تعذر تحميل مساحة المعلم/);
  assert.ok([...doc.querySelectorAll("button")].some(b=>b.textContent?.includes("إعادة المحاولة")));
  assert.equal(doc.querySelector(".nw-metrics"),null,"do not show zero KPI values if fetch failed");
 }finally{await t.close();}
});

test("R265: unauthorized Work does not show teacher data or imply access",async()=>{
 const t=mounted(async()=>({ok:false,status:403,json:async()=>({})}));
 try{
  await act(async()=>{t.root.render(createElement(NoorWorkTeacherViewR264));});
  assert.match(t.dom.window.document.body.textContent??"",/صلاحية نور ورك غير مفعّلة/);
  assert.equal(t.dom.window.document.querySelector(".nw-metrics"),null);
 }finally{await t.close();}
});
