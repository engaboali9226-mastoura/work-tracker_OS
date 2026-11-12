import assert from "node:assert/strict";
import test from "node:test";
import {JSDOM} from "jsdom";
import {act,createElement} from "react";
import {createRoot} from "react-dom/client";
import {NoorPersonalApplicationView} from "../src/noor-personal-application-view.js";

test("R304: users can switch between category, time and legacy without duplicating completion controls",async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>',{url:"https://noor.test/personal",runScripts:"outside-only"});
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,getComputedStyle:dom.window.getComputedStyle.bind(dom.window),fetch:async()=>new Response(JSON.stringify({current:{temperature_2m:25}}),{status:200,headers:{"content-type":"application/json"}}),IS_REACT_ACT_ENVIRONMENT:true} as const;
 const previous=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries(globals)){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 // React legacy input-event compatibility on JSDOM.
 Object.defineProperties(dom.window.HTMLElement.prototype,{
  attachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.addEventListener(event.replace(/^on/,""),listener);}},
  detachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.removeEventListener(event.replace(/^on/,""),listener);}}
 });
 const container=dom.window.document.getElementById("root")!;
 const now=new Date(Date.now()+3600000).toISOString();
 const today={kind:"success" as const,today:{
  personalDay:{id:"d",userId:"u",state:"Open",boundary:{localDate:"2026-11-12",timeZone:"Asia/Riyadh"}},
  islamicContext:{hijriDate:{day:1,month:6,year:1448},prayerTimes:{fajr:"2026-11-12T01:30:00Z",nextFajr:"2026-11-13T01:30:00Z",sunrise:"2026-11-12T03:00:00Z",dhuhr:"2026-11-12T08:30:00Z",asr:"2026-11-12T11:50:00Z",maghrib:"2026-11-12T14:10:00Z",isha:"2026-11-12T15:30:00Z"}},
  nextPrayer:{name:"Fajr",at:now,secondsRemaining:3600},
  tasks:[{id:"execution-task",definitionId:"task",kind:"Task",title:"قراءة الفصل",status:"Planned"}],
  habits:[{id:"execution-habit",definitionId:"habit",kind:"Habit",title:"عادة التعلم",status:"Pending"}],automationPending:0
 }};
 const workspace={kind:"success" as const,workspace:{
  definitions:[
   {id:"task",kind:"Task",title:"قراءة الفصل",revisionId:"rt",state:"Active",category:"التعلم",timeOfDay:"19:00",importance:"Important",schedule:{kind:"Daily"},effectiveFromDate:"2026-11-12",activityLog:[]},
   {id:"habit",kind:"Habit",title:"عادة التعلم",revisionId:"rh",state:"Active",category:"التعلم",timeOfDay:"07:00",importance:"Supporting",schedule:{kind:"Daily"},effectiveFromDate:"2026-11-12",activityLog:[]}
  ],categories:["التعلم"],
  insights:{currentStreakDays:0,bestStreakDays:0,periods:{week:{windowDays:7,scheduled:2,completed:0,completionRate:0,successfulDays:0},month:{windowDays:30,scheduled:2,completed:0,completionRate:0,successfulDays:0},quarter:{windowDays:90,scheduled:2,completed:0,completionRate:0,successfulDays:0},year:{windowDays:365,scheduled:2,completed:0,completionRate:0,successfulDays:0}}}
 }};
 const root=createRoot(container);
 const click=async(text:string)=>{const buttons=[...container.querySelectorAll<HTMLButtonElement>('[data-testid="r304-activity-view"] button')];const button=buttons.find(b=>b.textContent===text);assert.ok(button, "missing choice "+text);await act(async()=>{button.click();});};
 try{
  await act(async()=>{root.render(createElement(NoorPersonalApplicationView,{initialResult:today,initialWorkspace:workspace}));});
  assert.equal(container.querySelectorAll('[data-testid="habit-category-card"]').length,1);
  await click("حسب المجال");
  assert.equal(container.querySelectorAll('[data-testid="r304-unified-group"]').length,1);
  assert.equal(container.querySelectorAll('[data-testid="activity-card-execution-task"]').length,1);
  assert.equal(container.querySelectorAll('[data-testid="activity-card-execution-habit"]').length,1);
  assert.equal(container.querySelectorAll('.np-habit-check').length,1);
  assert.equal(container.querySelectorAll('[data-testid="habit-category-card"]').length,0,"legacy cards should unmount when unified");
  await click("حسب الوقت");
  assert.equal(container.querySelectorAll('[data-testid="r304-unified-group"]').length,2);
  assert.equal(container.querySelectorAll('.np-habit-check').length,1);
  await click("العرض المنفصل");
  assert.equal(container.querySelectorAll('[data-testid="habit-category-card"]').length,1);
  assert.equal(container.querySelectorAll('.np-tasks-card .np-activity-item').length,1);
 }finally{
  await act(async()=>root.unmount());
  for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  dom.window.close();
 }
});
