import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import {act,createElement} from "react";
import {createRoot} from "react-dom/client";
import {NoorWorkTeacherViewR264} from "../src/noor-work-teacher-view-r264.js";

test("R267: teacher toggles two external-portal checkpoints on a lesson without recording student data",async()=>{
 const state={version:1,timetable:[{id:"science_first",day:0,period:1,subject:"علوم",group:"الخامس أ",room:"",start:"08:00",end:"08:45"}],
  workdays:[],preparations:[],students:[],attendance:[],assessments:[],grades:[],termStartDate:"2026-08-23",
  lessonChecks:[],assessmentChecks:[]};
 let submitted:unknown=null;
 const dom=new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>',{url:"https://noor-teacher-r267.invalid"});
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,
  Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,
  IS_REACT_ACT_ENVIRONMENT:true,fetch:async(_url:unknown,init?:RequestInit)=>{
   if(init?.method==="PUT"){submitted=JSON.parse(String(init.body));return {ok:true,status:200,json:async()=>({revision:1})};}
   return {ok:true,status:200,json:async()=>({revision:0,state})};
  }};
 const previous=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,val] of Object.entries(globals)){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:val});
 }
 const root=createRoot(dom.window.document.getElementById("root")!);
 try{
  await act(async()=>{root.render(createElement(NoorWorkTeacherViewR264));});
  const document=dom.window.document;
  assert.match(document.body.textContent??"",/مساحة المعلم/);
  assert.match(document.body.textContent??"",/الأسبوع/);
  assert.match(document.body.textContent??"",/توقيت الرياض/);
  assert.equal(document.querySelector('[aria-label="إعداد الأسبوع الدراسي"]')!==null,true);
  const follow=[...document.querySelectorAll<HTMLButtonElement>(".nw-tabs button")].find(b=>b.textContent?.includes("متابعة الحصص"));
  assert.ok(follow);
  await act(async()=>{follow.click();});
  const prep=document.querySelector<HTMLInputElement>('input[aria-label^="تم تحضير درس"]');
  const attend=document.querySelector<HTMLInputElement>('input[aria-label^="تم رصد حضور طلاب حصة"]');
  assert.ok(prep&&attend);
  assert.equal(prep.checked,false);
  assert.equal(attend.checked,false);
  await act(async()=>{prep.click();});
  await act(async()=>{attend.click();});
  assert.equal(prep.checked,true);
  assert.equal(attend.checked,true);
  const save=[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent?.includes("حفظ التغييرات"));
  assert.ok(save);
  await act(async()=>{save.click();});
  assert.ok(submitted&&typeof submitted==="object");
  const payload=submitted as {expectedRevision:number;state:{students:unknown[];attendance:unknown[];grades:unknown[];
    lessonChecks:Array<{slotId:string;prepared:boolean;attendanceRecorded:boolean;date:string}>}};
  assert.equal(payload.expectedRevision,0);
  assert.equal(payload.state.students.length,0);
  assert.equal(payload.state.attendance.length,0);
  assert.equal(payload.state.grades.length,0);
  assert.equal(payload.state.lessonChecks.length,1);
  assert.equal(payload.state.lessonChecks[0]?.slotId,"science_first");
  assert.equal(payload.state.lessonChecks[0]?.prepared,true);
  assert.equal(payload.state.lessonChecks[0]?.attendanceRecorded,true);
 }finally{
  await act(async()=>{root.unmount();});
  for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  dom.window.close();
 }
});
