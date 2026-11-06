import assert from "node:assert/strict";
import test from "node:test";
import {JSDOM} from "jsdom";
import {act,createElement} from "react";
import {createRoot} from "react-dom/client";
import {TaskSessionListR254,TaskSessionPlannerR254,TASK_SESSION_STYLES_R254} from "../src/noor-task-sessions-r254.js";

const instant="2026-11-06T09:00:00.000Z";
const record={id:"chapter-1",title:"قراءة الفصل",objective:"تلخيص الفكرة",target:12,rangeStart:1,rangeEnd:12,
 order:1,note:"",revision:0,createdAt:instant,updatedAt:instant,completedAt:null};
function mount(){
 const dom=new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>',{url:"http://noor-session-test.invalid"});
 Object.defineProperties(dom.window.HTMLElement.prototype,{
   attachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.addEventListener(event.replace(/^on/,""),listener);}},
   detachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.removeEventListener(event.replace(/^on/,""),listener);}},
 });
 const vars={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,
   Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,
   HTMLTextAreaElement:dom.window.HTMLTextAreaElement,HTMLInputElement:dom.window.HTMLInputElement,Event:dom.window.Event,
   IS_REACT_ACT_ENVIRONMENT:true};
 const descriptors=new Map<string,PropertyDescriptor|undefined>();
 for(const [name,value] of Object.entries(vars)){
   descriptors.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
   Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
 }
 const root=createRoot(dom.window.document.getElementById("root")!);
 return {dom,root,async close(){
   await act(async()=>root.unmount());
   for(const [name,descriptor] of descriptors){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
   dom.window.close();
 }};
}
function input(dom:JSDOM,el:HTMLTextAreaElement,value:string){
 Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,"value")!.set!.call(el,value);
 el.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 el.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
}
test("R254 mobile scroll: independent expandable sessions remain inside a bounded scroll area and save buttons are present",()=>{
 assert.match(TASK_SESSION_STYLES_R254,/\.nts-list-body\{[^}]*max-height:65dvh;overflow-y:auto/);
 assert.match(TASK_SESSION_STYLES_R254,/@media\(max-width:700px\)\{\.np-page \.nts-list-body\{max-height:62dvh/);
 assert.match(TASK_SESSION_STYLES_R254,/\.nts-session-body button/);
 assert.match(TASK_SESSION_STYLES_R254,/min-height:44px/);
 assert.match(TASK_SESSION_STYLES_R254,/-webkit-overflow-scrolling:touch/);
 assert.match(TASK_SESSION_STYLES_R254,/env\(safe-area-inset-bottom/);
});
test("R254 mounted session note remains in editor on network failure, then sends owner-verified command",async()=>{
 const t=mount();let success=false;const commands:unknown[]=[];
 const render=async(r=record)=>{await act(async()=>{t.root.render(createElement(TaskSessionListR254,{
   plan:{distribution:"custom",sessions:[r]},log:[],definitionId:"parent-task",executionId:"execution-today",
   busy:false,title:"قراءة كتاب",onCommand:async(cmd:unknown)=>{commands.push(cmd);return success;}
 }));});};
 try{
   await render();
   const doc=t.dom.window.document;
   const list=doc.querySelector<HTMLDetailsElement>(".nts-list")!;assert.ok(list);list.open=true;
   const child=doc.querySelector<HTMLDetailsElement>(".nts-session")!;assert.ok(child);child.open=true;
   const text=doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!;
   assert.ok(text);await act(async()=>{text.focus();input(t.dom,text,"ملاحظة تعليمية مستقلة");});
   const save=[...doc.querySelectorAll<HTMLButtonElement>(".nts-session-body button")].find(b=>b.textContent?.includes("حفظ الملاحظة"))!;
   assert.ok(save);
   assert.equal(save.disabled,false,"editing note must enable Save without recording progress");
   await act(async()=>{save.click();});
   assert.equal(commands.length,1);
   assert.deepEqual(commands[0],{type:"edit-task-session-note",definitionId:"parent-task",taskSessionId:"chapter-1",expectedRevision:0,note:"ملاحظة تعليمية مستقلة"});
   assert.equal(text.value,"ملاحظة تعليمية مستقلة");
   assert.match(doc.body.textContent??"",/تعذر حفظ الملاحظة/);
   success=true;await act(async()=>{save.click();});
   assert.equal(commands.length,2);
   await render({...record,note:"ملاحظة تعليمية مستقلة",revision:1,updatedAt:instant});
   assert.equal(doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!.value,"ملاحظة تعليمية مستقلة");
 }finally{await t.close();}
});
test("R256: repeated taps submit one note mutation until its network response resolves",async()=>{
 const t=mount(),commands:unknown[]=[],callbacks:Array<(ok:boolean)=>void>=[];
 try{
   await act(async()=>t.root.render(createElement(TaskSessionListR254,{
     plan:{distribution:"custom",sessions:[record]},log:[],definitionId:"task",executionId:"today",busy:false,title:"Book",
     onCommand:(command:unknown)=>{commands.push(command);return new Promise<boolean>(resolve=>{callbacks.push(resolve);});},
   })));
   const doc=t.dom.window.document;
   const editor=doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!;
   await act(async()=>{editor.focus();input(t.dom,editor,"Unsaved after double tap");});
   const save=[...doc.querySelectorAll<HTMLButtonElement>(".nts-session-body button")].find(el=>el.textContent?.includes("حفظ الملاحظة"))!;
   await act(async()=>{save.click();save.click();});
   assert.equal(commands.length,1);
   assert.equal(save.disabled,true);
   await act(async()=>{callbacks[0]!(false);await Promise.resolve();});
   assert.equal(save.disabled,false);
   assert.equal(editor.value,"Unsaved after double tap");
   assert.match(doc.body.textContent??"",/تعذر حفظ الملاحظة/);
 }finally{await t.close();}
});
test("R255: a background device update preserves unsaved session text and blocks stale overwrite",async()=>{
 const t=mount(),commands:unknown[]=[];
 const render=async(server=record)=>act(async()=>t.root.render(createElement(TaskSessionListR254,{
   plan:{distribution:"custom",sessions:[server]},log:[],definitionId:"task",executionId:"exec",
   busy:false,title:"قراءة كتاب",onCommand:async(value:unknown)=>{commands.push(value);return true;}
 })));
 try{
   await render();
   const doc=t.dom.window.document,editor=doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!;
   assert.ok(editor);
   await act(async()=>{editor.focus();input(t.dom,editor,"MY UNSAVED DRAFT");});
   await render({...record,note:"REMOTE DEVICE CHANGED NOTE",revision:1});
   assert.equal(doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!.value,"MY UNSAVED DRAFT");
   const save=[...doc.querySelectorAll<HTMLButtonElement>(".nts-session-body button")].find(b=>b.textContent?.includes("حفظ الملاحظة"))!;
   await act(async()=>save.click());
   assert.equal(commands.length,0,"a stale draft must not overwrite the current server version");
   assert.match(doc.body.textContent??"",/تغيّرت هذه الجلسة على جهاز آخر/);
 }finally{await t.close();}
});
test("R255: task overview note preserves a dirty draft and rejects stale cross-device save",async()=>{
 const t=mount(),commands:unknown[]=[];
 const render=async(note:string,revisionId:string)=>act(async()=>t.root.render(createElement(TaskSessionListR254,{
   plan:{distribution:"custom",sessions:[record]},log:[],definitionId:"task",executionId:"exec",
   busy:false,title:"قراءة كتاب",revisionId,taskGeneralNote:note,
   onCommand:async(value:unknown)=>{commands.push(value);return true;}
 })));
 try{
   await render("first server version","rev1");
   const doc=t.dom.window.document,editor=doc.querySelector<HTMLTextAreaElement>(".nts-general-note textarea")!;
   assert.ok(editor);
   await act(async()=>{editor.focus();input(t.dom,editor,"LOCAL GENERAL DRAFT");});
   await render("NEW REMOTE OVERVIEW","rev2");
   assert.equal(doc.querySelector<HTMLTextAreaElement>(".nts-general-note textarea")!.value,"LOCAL GENERAL DRAFT");
   const save=[...doc.querySelectorAll<HTMLButtonElement>(".nts-general-note button")].find(b=>b.textContent?.includes("حفظ الملاحظة العامة"))!;
   await act(async()=>save.click());
   assert.equal(commands.length,0);
   assert.match(doc.body.textContent??"",/تغيّرت المهمة على جهاز آخر/);
 }finally{await t.close();}
});
test("R258: session metadata refresh rebases an unsaved note without falsely calling it a note conflict",async()=>{
 const t=mount(),commands:unknown[]=[];
 const render=(server=record)=>act(async()=>t.root.render(createElement(TaskSessionListR254,{
   plan:{distribution:"custom",sessions:[server]},log:[],definitionId:"book",executionId:"today",
   busy:false,title:"Book",onCommand:async(value:unknown)=>{commands.push(value);return true;},
 })));
 try{
   await render();
   const doc=t.dom.window.document,editor=doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!;
   await act(async()=>{editor.focus();input(t.dom,editor,"Private notes while title is edited remotely");});
   await render({...record,title:"Updated title on phone",revision:1});
   assert.equal(editor.value,"Private notes while title is edited remotely");
   assert.equal(doc.querySelector(".nts-conflict"),null,"metadata-only update must not display false note conflict");
   const save=[...doc.querySelectorAll<HTMLButtonElement>(".nts-session-body button")].find(x=>x.textContent?.includes("حفظ الملاحظة"))!;
   await act(async()=>save.click());
   assert.equal(commands.length,1);
   assert.deepEqual(commands[0],{type:"edit-task-session-note",definitionId:"book",
     taskSessionId:"chapter-1",expectedRevision:1,note:"Private notes while title is edited remotely"});
 }finally{await t.close();}
});
test("R258: parent metadata refresh can rebase a dirty overall note while actual remote note change still blocks overwrite",async()=>{
 const t=mount(),commands:unknown[]=[];
 const render=(note:string,revisionId:string)=>act(async()=>t.root.render(createElement(TaskSessionListR254,{
   plan:{distribution:"custom",sessions:[record]},log:[],definitionId:"book",executionId:"today",
   busy:false,title:"Book",revisionId,taskGeneralNote:note,
   onCommand:async(value:unknown)=>{commands.push(value);return true;},
 })));
 try{
   await render("initial saved overview","rev1");
   const doc=t.dom.window.document,editor=doc.querySelector<HTMLTextAreaElement>(".nts-general-note textarea")!;
   await act(async()=>{editor.focus();input(t.dom,editor,"Draft that should survive concurrent session note");});
   await render("initial saved overview","rev2");
   assert.equal(editor.value,"Draft that should survive concurrent session note");
   assert.equal(doc.querySelector(".nts-general-note .nts-conflict"),null);
   const save=doc.querySelector<HTMLButtonElement>(".nts-general-note button")!;
   await act(async()=>save.click());
   assert.equal(commands.length,1);
   assert.deepEqual(commands[0],{type:"edit-task-general-note",definitionId:"book",
     expectedRevisionId:"rev2",note:"Draft that should survive concurrent session note"});
   await render("REMOTE OVERVIEW","rev3");
   assert.equal(editor.value,"Draft that should survive concurrent session note");
   const panel=doc.querySelector(".nts-general-note .nts-conflict")!;
   assert.ok(panel);
   assert.match(panel.textContent??"",/REMOTE OVERVIEW/);
   await act(async()=>save.click());
   assert.equal(commands.length,1,"changed remote note must block a stale overwrite");
   const restore=[...panel.querySelectorAll<HTMLButtonElement>("button")].find(x=>x.textContent?.includes("استخدام النسخة المحفوظة"))!;
   await act(async()=>restore.click());
   assert.equal(editor.value,"REMOTE OVERVIEW","restoring a saved note must be an explicit choice");
   assert.equal(doc.querySelector(".nts-general-note .nts-conflict"),null);
   assert.equal(commands.length,1);
 }finally{await t.close();}
});
test("R258: a conflicting session note stays editable until the user explicitly restores the saved version",async()=>{
 const t=mount();
 const render=(server=record)=>act(async()=>t.root.render(createElement(TaskSessionListR254,{
   plan:{distribution:"custom",sessions:[server]},log:[],definitionId:"book",executionId:"today",
   busy:false,title:"Book",onCommand:async()=>true,
 })));
 try{
   await render();
   const doc=t.dom.window.document,editor=doc.querySelector<HTMLTextAreaElement>('.nts-session-body textarea[maxlength="10000"]')!;
   await act(async()=>{editor.focus();input(t.dom,editor,"MY UNSAVED PRIVATE DRAFT");});
   await render({...record,note:"PHONE CURRENT NOTE",revision:1});
   assert.equal(editor.value,"MY UNSAVED PRIVATE DRAFT");
   const panel=doc.querySelector(".nts-session-body .nts-conflict")!;
   assert.ok(panel);assert.match(panel.textContent??"",/PHONE CURRENT NOTE/);
   assert.ok(panel.querySelector<HTMLButtonElement>("button")?.textContent?.includes("نسخ مسودتي"));
   const restore=[...panel.querySelectorAll<HTMLButtonElement>("button")].find(x=>x.textContent?.includes("استخدام النسخة المحفوظة"))!;
   await act(async()=>restore.click());
   assert.equal(editor.value,"PHONE CURRENT NOTE");
   assert.equal(doc.querySelector(".nts-session-body .nts-conflict"),null);
 }finally{await t.close();}
});
test("R254 mounted default task-session planner does not force splitting a normal task",async()=>{
 const t=mount();
 try{
   await act(async()=>t.root.render(createElement(TaskSessionPlannerR254,{
     enabled:false,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},sessions:[],setSessions:()=>{},
     target:null,unit:"صفحة",busy:false,
   })));
   assert.ok(t.dom.window.document.querySelector('input[type="checkbox"]'));
   assert.equal(t.dom.window.document.querySelector(".nts-editor"),null);
 }finally{await t.close();}
});
