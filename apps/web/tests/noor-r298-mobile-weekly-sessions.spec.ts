import test from "node:test";
import assert from "node:assert/strict";
import {createElement,useState} from "react";
import {act} from "react";
import {createRoot} from "react-dom/client";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {readFileSync} from "node:fs";
import {weeklyTaskSessionDatesR298} from "../src/noor-session-calendar-r288.js";
import {TaskSessionPlannerR254} from "../src/noor-task-sessions-r254.js";
import {NoorBeverageTrackerR294} from "../src/noor-beverage-tracker-r294.js";
import type {NoorTaskSessionDraft} from "../src/noor-personal-today-client.js";

const parent={kind:"Daily" as const,startDate:"2026-11-16",endDate:null,weekdays:[]};

test("R298: without an end date, schedule one session per chosen weekday in calendar order",()=>{
 const dates=weeklyTaskSessionDatesR298({firstDate:"2026-11-16",endDate:null,sessionCount:6,weekdays:[1,3,5],parent});
 assert.deepEqual(dates,["2026-11-16","2026-11-18","2026-11-20","2026-11-23","2026-11-25","2026-11-27"]);
 assert.deepEqual(weeklyTaskSessionDatesR298({firstDate:"2026-11-17",endDate:null,sessionCount:2,weekdays:[1,3],parent}),["2026-11-18","2026-11-23"]);
});
test("R298: when bounded, use both ends of the eligible interval and distribute evenly",()=>{
 const dates=weeklyTaskSessionDatesR298({firstDate:"2026-11-16",endDate:"2026-12-04",sessionCount:3,weekdays:[1,3,5],parent});
 assert.deepEqual(dates,["2026-11-16","2026-11-25","2026-12-04"]);
 const all=weeklyTaskSessionDatesR298({firstDate:"2026-11-16",endDate:"2026-12-04",sessionCount:9,weekdays:[1,3,5],parent});
 assert.equal(all.length,9);
 assert.equal(new Set(all).size,9);
 assert.equal(all.at(-1),"2026-12-04");
});
test("R298: enforce task boundaries, repeat days and sufficient slots without mutating existing drafts",()=>{
 const attempt=(overrides:Partial<Parameters<typeof weeklyTaskSessionDatesR298>[0]>)=>
  weeklyTaskSessionDatesR298({firstDate:"2026-11-16",endDate:"2026-11-23",sessionCount:2,weekdays:[1,3],parent,...overrides});
 assert.throws(()=>attempt({sessionCount:4,weekdays:[1]}),/SESSION_CALENDAR_INSUFFICIENT_DAYS/);
 assert.throws(()=>attempt({firstDate:"2026-11-15"}),/SESSION_CALENDAR_OUTSIDE_RANGE/);
 assert.throws(()=>attempt({endDate:"2026-11-15"}),/SESSION_CALENDAR_OUTSIDE_RANGE/);
 assert.throws(()=>attempt({endDate:"2026-02-30"}),/SESSION_CALENDAR_INVALID_DATE/);
 assert.throws(()=>attempt({weekdays:[1,1]}),/SESSION_CALENDAR_WEEKDAYS_INVALID/);
 assert.throws(()=>attempt({weekdays:[]}),/SESSION_CALENDAR_WEEKDAYS_INVALID/);
 assert.throws(()=>attempt({sessionCount:201}),/SESSION_CALENDAR_COUNT_INVALID/);
 assert.throws(()=>attempt({parent:{kind:"Weekdays",startDate:"2026-11-16",endDate:null,weekdays:[1]},weekdays:[1,3]}),/SESSION_CALENDAR_PARENT_MISMATCH/);
 assert.deepEqual(attempt({parent:{...parent,endDate:"2026-11-23"},endDate:null}),["2026-11-16","2026-11-23"]);
 assert.throws(()=>attempt({parent:{...parent,endDate:"2026-11-20"},endDate:"2026-11-23"}),/SESSION_CALENDAR_OUTSIDE_RANGE/);
 assert.throws(()=>attempt({parent:{kind:"OneTime",startDate:"2026-11-16",endDate:null,weekdays:[]}}),/SESSION_CALENDAR_PARENT_MISMATCH/);
});
test("R298: phone planner exposes start, count, optional end, days of the week and opt-in reschedule",()=>{
 const session:NoorTaskSessionDraft={id:"existing",title:"الجلسة 1",objective:"",target:10,rangeStart:1,rangeEnd:10,scheduledDate:"2026-11-16"};
 const markup=renderToStaticMarkup(createElement(TaskSessionPlannerR254,{
  enabled:true,setEnabled:()=>{},distribution:"equal",setDistribution:()=>{},sessions:[session],setSessions:()=>{},
  target:10,unit:"صفحات",busy:false,parentStartDate:"2026-11-16",parentEndDate:"2026-12-04",parentScheduleKind:"Weekdays",parentWeekdays:[1,3,5]
 }));
 for(const token of ["r298-weekly-planner","r298-weekly-start","r298-weekly-count","r298-weekly-end","r298-weekly-apply","السبت","الأحد","الإثنين","الجمعة","إعادة توزيع مواعيد"])
  assert.ok(markup.includes(token),token);
 assert.match(markup,/عدد الجلسات/);
 assert.match(markup,/type="checkbox"/);
 assert.match(markup,/مواعيد الجلسات/);
 assert.match(markup,/خيارات التوزيع الأخرى/);
});
test("R298: mounted mobile planner produces dated sessions as a local draft without a server call",async()=>{
 const dom=new JSDOM('<!doctype html><html><body><main id="root"></main></body></html>',{url:"https://noor.test/personal"});
 const globals:Record<string,unknown>={
  window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
  Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT:true
 };
 const originals=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries(globals)){
  originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const element=dom.window.document.getElementById("root")!;
 const root=createRoot(element);
 let latest:readonly NoorTaskSessionDraft[]=[];
 function Harness(){
  const [sessions,setSessions]=useState<NoorTaskSessionDraft[]>([]);
  latest=sessions;
  return createElement(TaskSessionPlannerR254,{
   enabled:true,setEnabled:()=>{},distribution:"equal",setDistribution:()=>{},
   sessions,setSessions,target:50,unit:"صفحة",busy:false,
   parentStartDate:"2026-11-16",parentEndDate:null,parentScheduleKind:"Daily",parentWeekdays:[]
  });
 }
 try{
  await act(async()=>root.render(createElement(Harness)));
  await act(async()=>{(dom.window.document.querySelector('[data-testid="r298-weekly-apply"]') as HTMLButtonElement).click();});
  assert.equal(latest.length,5);
  assert.deepEqual(latest.map(s=>s.scheduledDate),["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20"]);
  assert.deepEqual(latest.map(s=>s.target),[10,10,10,10,10]);
  assert.deepEqual(latest.map(s=>s.rangeStart),[1,11,21,31,41]);
  assert.equal(dom.window.document.querySelectorAll('.nts-editor').length,5);
 }finally{
  await act(async()=>root.unmount());
  for(const [key,descriptor] of originals){
   if(descriptor)Object.defineProperty(globalThis,key,descriptor);
   else Reflect.deleteProperty(globalThis,key);
  }
  dom.window.close();
 }
});
test("R298: caffeine banner shows an accessible explicit three-color state on mobile",()=>{
 const at="2026-11-11T08:00:00.000Z";
 const row=(n:number)=>({
  id:"coffee",executionId:"coffee-today",title:"قهوة",category:"الصحة والرياضة",
  revisionId:"rev",startDate:"2026-11-11",endDate:null,weight:1,importance:"Optional" as const,status:"Pending",
  plan:{targetServings:2,kind:"coffee" as const,sleepTime:"00:00"},
  log:Array.from({length:n},(_,i)=>({id:"e"+i,executionId:"coffee-today",at,localDate:"2026-11-11",amount:1,beverageTime:"08:00"}))
 });
 const html=(n:number)=>renderToStaticMarkup(createElement(NoorBeverageTrackerR294,{rows:[row(n)],localDate:"2026-11-11",busy:false,onCommand:async()=>true}));
 assert.match(html(2),/np-caffeine-green/);
 assert.match(html(3),/np-caffeine-yellow/);
 assert.match(html(4),/np-caffeine-red/);
 assert.match(html(3),/حالة المنبهات: أصفر/);
 assert.match(html(4),/حالة المنبهات: أحمر/);
 const css=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(css,/R298 mobile-first full-width green/);
 assert.match(css,/np-caffeine-signal-r295 .np-caffeine-reason-r296\{display:block;position:static/);
 assert.match(css,/np-caffeine-green\{--np-caffeine-accent:/);
 assert.match(css,/np-caffeine-yellow\{--np-caffeine-accent:/);
 assert.match(css,/np-caffeine-red\{--np-caffeine-accent:/);
 assert.match(css,/np-caffeine-time-options-r295\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
