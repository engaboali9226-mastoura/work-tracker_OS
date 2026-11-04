import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { NoorThreeSpacesR171 } from '../src/noor-three-spaces-r171.js';
const source=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const css=source.match(/\/\* NOOR_R178_BRAND_JOURNALS_BEGIN \*\/([\s\S]*?)\/\* NOOR_R178_BRAND_JOURNALS_END \*\//u)?.[1]??'';
test('R178 uses Noor navy, ivory and muted gold for all three icon shortcuts',()=>{
 assert.ok(css,'polish CSS block exists');
 assert.match(css,/\.nr171-shortcut\{background:linear-gradient/u);
 assert.match(css,/\.nr171-icon\{background:transparent!important/u);
 assert.match(css,/\.np-page\[data-appearance=dark\] \.nr171-shortcut/u);
 assert.match(css,/--nr-primary:#315f7b/u);
 assert.match(css,/--nr-gold:#b8862b/u);
 assert.doesNotMatch(css,/#f6dfe8|#fff0c9|#d9e9f4/u);
});
test('R178 journal modals have coherent dialog, form, tabs, saved records, responsive and contrast-aware styling',()=>{
 for(const fragment of ['.nr171-modal{','.nr171-head{','.nr171-tabs{','.nr171-form{','.nr171-info{','.nr171-record{','.nr171-check{','@media(max-width:620px)','@media(prefers-reduced-motion:reduce)']) assert.ok(css.includes(fragment),fragment);
 assert.match(css,/\.nr171-overlay\[data-noor-theme=dark\]/u);
 assert.match(css,/\.nr171-overlay\[data-noor-theme=light\]/u);
 assert.match(css,/min-height:48px/u);
 assert.match(css,/focus-visible/u);
 assert.match(source,/data-noor-theme=\{typeof document === "undefined" \? "noor" : \(document\.querySelector\("\.np-page"\)\?\.getAttribute\("data-appearance"\) \?\? "noor"\)\}/u);
});
test('R178 preserves inline R176 / optional R177 and browser authority boundaries',()=>{
 assert.ok(app.indexOf('className="np-day-achievement-copy"')<app.indexOf('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />'));
 assert.ok(app.indexOf('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />')<app.indexOf('className="np-day-remaining"'));
 assert.match(source,/NOOR_R176_INLINE_ACHIEVEMENT_BEGIN/u);
 assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
 assert.doesNotMatch(source,/className="nr171-label"/u);
 assert.match(source,/export const indexedNotesR173/u);
 assert.match(source,/developerExportR171/u);
});
test('R178 open all three professional journal dialogs; appearance follows actual Noor theme',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><section class="np-page" data-appearance="dark"></section><main id="root"></main></body></html>',{url:'http://127.0.0.1:5188/'});
 const overrides={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 const old=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries(overrides)){old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage:{read:async()=>[],write:async()=>{}}})));
  const buttons=[...dom.window.document.querySelectorAll<HTMLButtonElement>('.nr171-shortcut')];
  assert.ok(buttons.every(b=>b.textContent?.trim()==='' && b.querySelector('svg.nr180-symbol path')),'each journal shortcut must be accessible text-free vector');
  for(const [i,heading] of ['مشاعري','أفكاري','تطوير نور'].entries()){
   await act(async()=>buttons[i]!.click());
   const dialog=dom.window.document.querySelector('[role="dialog"]');
   assert.ok(dialog);
   assert.match(dialog!.textContent??'',new RegExp(heading,'u'));
   assert.equal(dom.window.document.querySelector('.nr171-overlay')?.getAttribute('data-noor-theme'),'dark');
   assert.ok(dialog!.querySelector('form'));
   assert.equal(dialog!.querySelectorAll('[role="tab"]').length,2);
   await act(async()=>{(dialog!.querySelector('button[aria-label="إغلاق مساحة التدوين"]') as HTMLButtonElement).click();});
   assert.equal(dom.window.document.querySelector('[role="dialog"]'),null);
  }
 }finally{
  await act(async()=>root.unmount());
  for(const [key,descriptor] of old){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  dom.window.close();
 }
});
