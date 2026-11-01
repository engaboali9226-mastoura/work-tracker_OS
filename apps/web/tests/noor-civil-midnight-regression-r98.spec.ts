import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { NoorPersonalApplicationView } from "../src/noor-personal-application-view.js";

test("civil midnight refreshes an overlapping legacy Fajr day before its persisted endAt", async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {url:"https://noor.test/personal"});
  const tracked = ["window", "document", "navigator", "Node", "Element", "HTMLElement", "MutationObserver", "getComputedStyle", "fetch", "IS_REACT_ACT_ENVIRONMENT"] as const;
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const globals = {
    window:dom.window,
    document:dom.window.document,
    navigator:dom.window.navigator,
    Node:dom.window.Node,
    Element:dom.window.Element,
    HTMLElement:dom.window.HTMLElement,
    MutationObserver:dom.window.MutationObserver,
    getComputedStyle:dom.window.getComputedStyle.bind(dom.window),
    fetch:async (_url: unknown) => new Response("{}", {status:503}),
    IS_REACT_ACT_ENVIRONMENT:true,
  };
  for (const key of tracked) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis,key));
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:globals[key]});
  }
  Object.defineProperties(dom.window.HTMLElement.prototype,{
    attachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.addEventListener(event.replace(/^on/,""),listener);}},
    detachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.removeEventListener(event.replace(/^on/,""),listener);}},
  });
  const originalNow=Date.now;
  const originalInterval=dom.window.setInterval;
  let now=Date.parse("2026-10-24T20:59:59.000Z");
  let tick:(()=>void)|undefined;
  let todayReads=0;
  Date.now=()=>now;
  dom.window.setInterval=((handler:TimerHandler,delay?:number,...args:unknown[])=>{
    if(delay===1000){tick=handler as ()=>void;return 99999;}
    return originalInterval.call(dom.window,handler,delay,...args);
  }) as typeof dom.window.setInterval;
  const oldDay={id:"day-24",state:"Open",boundary:{localDate:"2026-10-24",timeZone:"Asia/Riyadh",endAt:"2026-10-25T01:45:00.000Z"}};
  const newDay={id:"day-25",state:"Open",boundary:{localDate:"2026-10-25",timeZone:"Asia/Riyadh",endAt:"2026-10-26T01:46:00.000Z"}};
  const definition={id:"d1",kind:"Habit",title:"المشي",state:"Active",category:"الصحة",importance:"Supporting",schedule:{kind:"Daily"},effectiveFromDate:"2026-10-01"};
  const oldHabit={id:"e-old",definitionId:"d1",kind:"Habit",title:"المشي",status:"Completed",weight:1};
  const newHabit={...oldHabit,id:"e-new",status:"Pending"};
  const historical=[{id:"e-old",definitionId:"d1",title:"المشي",kind:"Habit",date:"2026-10-24",weight:1,status:"Completed",amount:0,unit:""}];
  const period=(windowDays:number)=>({windowDays,scheduled:1,completed:1,completionRate:100,successfulDays:1});
  const oldWorkspace={definitions:[definition],insights:{currentStreakDays:1,bestStreakDays:1,periods:{week:period(7),month:period(30),quarter:period(90),year:period(365)}},statistics:{currentDate:"2026-10-24",rows:historical}};
  const newWorkspace={...oldWorkspace,statistics:{currentDate:"2026-10-25",rows:[...historical,{...historical[0],id:"e-new",date:"2026-10-25",status:"Pending"}]}};
  const context={hijriDate:{day:13,month:5,year:1448},prayerTimes:{fajr:"2026-10-25T01:40:00.000Z",sunrise:"2026-10-25T02:59:00.000Z",dhuhr:"2026-10-25T08:37:00.000Z",asr:"2026-10-25T11:50:00.000Z",maghrib:"2026-10-25T14:15:00.000Z",isha:"2026-10-25T15:45:00.000Z"}};
  const oldToday={personalDay:oldDay,islamicContext:context,nextPrayer:{name:"Dhuhr",at:"2026-10-25T08:37:00Z"},tasks:[],habits:[oldHabit],automationPending:0};
  const newToday={...oldToday,personalDay:newDay,habits:[newHabit],workspace:newWorkspace};
  Object.defineProperty(globalThis,"fetch",{configurable:true,writable:true,value:async (url:unknown)=>{
    if(String(url).endsWith("/today")){
      todayReads++;
      // First refresh fails; on resume the retry should recover without a reload.
      return todayReads===1
        ? new Response("{}",{status:503})
        : new Response(JSON.stringify(newToday),{status:200,headers:{"content-type":"application/json"}});
    }
    return new Response("{}",{status:503});
  }});
  const root=createRoot(dom.window.document.getElementById("root")!);
  const checkbox=()=>dom.window.document.querySelector<HTMLInputElement>('[aria-label="إتمام عادة المشي اليوم"]');
  const rate=()=>dom.window.document.querySelector('[data-testid="today-completion-rate"]')?.textContent;
  try {
    await act(async()=>root.render(createElement(NoorPersonalApplicationView,{initialResult:{kind:"success",today:oldToday},initialWorkspace:{kind:"success",workspace:oldWorkspace}})));
    assert.equal(checkbox()?.checked,true);
    assert.equal(rate(),"100%");
    now=Date.parse("2026-10-24T21:00:00.000Z");
    await act(async()=>tick!());
    assert.equal(todayReads,1);
    assert.equal(checkbox()?.checked,true,"failed read preserves the last confirmed state");
    now+=31_000;
    await act(async()=>dom.window.dispatchEvent(new dom.window.Event("focus")));
    assert.equal(todayReads,2);
    assert.equal(checkbox()?.checked,false,"a new occurrence must be pending");
    assert.equal(rate(),"0%");
    assert.ok(dom.window.document.querySelector('[data-week-state="today"]'));
    assert.equal(dom.window.document.querySelector('[data-week-state="today"]')?.getAttribute('data-week-rate'),"0");
    assert.match(dom.window.document.querySelector('[data-testid="yesterday-achievement"]')?.textContent??"",/100%/,"yesterday's completed record is retained");
  } finally {
    await act(async()=>root.unmount());
    Date.now=originalNow;
    dom.window.setInterval=originalInterval;
    for (const key of tracked){const prior=previous.get(key);if(prior)Object.defineProperty(globalThis,key,prior);else Reflect.deleteProperty(globalThis,key);}
    dom.window.close();
  }
});
