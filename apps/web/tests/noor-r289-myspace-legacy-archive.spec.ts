import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {act,createElement} from "react";
import {createRoot} from "react-dom/client";
import {JSDOM} from "jsdom";
import {NoorThreeSpacesR171,type NoteR171} from "../src/noor-three-spaces-r171.js";
const source=readFileSync(new URL("../src/noor-three-spaces-r171.tsx",import.meta.url),"utf8");
const wellbeing=readFileSync(new URL("../src/noor-wellbeing-lab-r165.tsx",import.meta.url),"utf8");
test("R289: production hides duplicate feelings shortcut, My Space retains archive entry",()=>{
 assert.match(source,/r202Production\?\(\['ideas','developer'\] as const\)/);
 assert.match(source,/document.addEventListener\("noor:open-legacy-feelings"/);
 assert.match(wellbeing,/data-testid="r289-legacy-feelings-access"/);
 assert.match(wellbeing,/noor:open-legacy-feelings/);
 assert.match(source,/legacyFeelingsArchiveR285/);
 assert.doesNotMatch(source,/migrateLegacyFeelingsR289|dropLegacyFeelingsR289/);
});
test("R289: navigating from My Space to old feelings reads the original store, never migrates/writes",async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><div id="root"></div></body></html>',{url:"https://noor.example/"});
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
   Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 const prev=new Map<string,PropertyDescriptor|undefined>();
 for(const [k,v] of Object.entries(globals)){prev.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});}
 const row:NoteR171={id:"b0d8d7e4-69b0-4e1c-8451-afcebd223600",kind:"feelings",
   title:"مشاعري القديمة",body:"كتبتها من قبل",createdAt:"2026-11-03T10:00:00.000Z",
   localDate:"2026-11-03",precedingEvent:"",helpful:"",mood:4,category:"",shareApproved:false};
 let writes=0,reads=0;
 const storage={read:async()=>{reads++;return [row];},write:async()=>{writes++;}};
 const root=createRoot(dom.window.document.getElementById("root")!);
 try{
   await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage})));
   await act(async()=>dom.window.document.dispatchEvent(new dom.window.Event("noor:open-legacy-feelings")));
   const dialog=dom.window.document.querySelector('[role="dialog"]') as HTMLElement;
   assert.ok(dialog);
   assert.match(dialog.textContent??"",/مشاعري القديمة/);
   assert.match(dialog.textContent??"",/كتبتها من قبل/);
   assert.ok(reads>=1);
   assert.equal(writes,0,"navigation must not copy/delete old notes");
   assert.equal(dom.window.document.querySelectorAll('[data-testid="r171-record-feelings"]').length,1);
 }finally{
   await act(async()=>root.unmount());
   for(const [k,v] of prev){if(v)Object.defineProperty(globalThis,k,v);else Reflect.deleteProperty(globalThis,k);}
   dom.window.close();
 }
});
