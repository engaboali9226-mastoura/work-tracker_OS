import test from "node:test";
import assert from "node:assert/strict";
import {act,createElement} from "react";
import {createRoot} from "react-dom/client";
import {JSDOM} from "jsdom";
import {TaskSessionPlannerR254} from "../src/noor-task-sessions-r254.js";
import {NoorThreeSpacesR171,type NoteR171} from "../src/noor-three-spaces-r171.js";

test("R288: calendar button proposes dates without persisting a session or overwriting its identity",async()=>{
  const dom=new JSDOM('<!doctype html><html><body><main id="root"></main></body></html>',{url:"https://noor.example/"});
  const names=["window","document","navigator","Node","Element","HTMLElement","IS_REACT_ACT_ENVIRONMENT"] as const;
  const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
    Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true};
  const prev=new Map<string,PropertyDescriptor|undefined>();
  for(const name of names){prev.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:globals[name]});}
  const root=createRoot(dom.window.document.getElementById("root")!);
  const drafts=Array.from({length:5},(_,i)=>({id:"s"+i,title:"جلسة "+i,objective:"",target:10,rangeStart:10*i+1,rangeEnd:10*(i+1),scheduledDate:null}));
  let proposed:typeof drafts|null=null,commands=0;
  try{
    await act(async()=>root.render(createElement(TaskSessionPlannerR254,{
      enabled:true,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},sessions:drafts,
      setSessions:s=>{proposed=s as typeof drafts;},target:50,unit:"صفحة",busy:false,
      parentStartDate:"2026-11-11",parentEndDate:null,parentScheduleKind:"Daily",parentWeekdays:[],
    })));
    const button=dom.window.document.querySelector('[data-testid="r288-calendar-apply"]') as HTMLButtonElement;
    assert.equal(button.disabled,false);
    await act(async()=>button.click());
    assert.deepEqual((proposed as typeof drafts|null)?.map(s=>s.scheduledDate),
      ["2026-11-11","2026-11-12","2026-11-13","2026-11-14","2026-11-15"]);
    assert.equal(drafts[0]!.scheduledDate,null);
    assert.equal((proposed as typeof drafts|null)?.[0]?.id,"s0");
    assert.equal(commands,0,"editing draft dates must not submit an authenticated write");
  }finally{
    await act(async()=>root.unmount());
    for(const name of names){const desc=prev.get(name);if(desc)Object.defineProperty(globalThis,name,desc);else Reflect.deleteProperty(globalThis,name);}
    dom.window.close();
  }
});
test("R288: development textarea has explicit RTL direction even on an empty new line",async()=>{
  const dom=new JSDOM('<!doctype html><html><body><main id="root"></main></body></html>',{url:"https://noor.example/"});
  const names=["window","document","navigator","Node","Element","HTMLElement","FormData","IS_REACT_ACT_ENVIRONMENT"] as const;
  const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
    Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
  const prev=new Map<string,PropertyDescriptor|undefined>();
  for(const name of names){prev.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:globals[name]});}
  const root=createRoot(dom.window.document.getElementById("root")!);
  const storage={read:async()=>[] as NoteR171[],write:async(_notes:readonly NoteR171[])=>{}};
  try{
    await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage})));
    await act(async()=>(dom.window.document.querySelector('[data-testid="r171-shortcut-developer"]') as HTMLButtonElement).click());
    const form=dom.window.document.querySelector('[data-testid="r171-form-developer"]') as HTMLFormElement;
    const textarea=form.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
    assert.equal(form.dir,"rtl");
    assert.equal(textarea.dir,"rtl");
    textarea.value="السطر الأول\n";
    assert.ok(textarea.value.endsWith("\n"));
    assert.equal(form.querySelector('input[name="password"]'),null);
  }finally{
    await act(async()=>root.unmount());
    for(const name of names){const desc=prev.get(name);if(desc)Object.defineProperty(globalThis,name,desc);else Reflect.deleteProperty(globalThis,name);}
    dom.window.close();
  }
});
