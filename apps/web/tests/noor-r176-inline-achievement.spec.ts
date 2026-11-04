import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { NoorThreeSpacesR171 } from '../src/noor-three-spaces-r171.js';
const app=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const component=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const mount='<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />';
test('R176 shortcuts are inside the EXISTING achievement header row with title, rate and remaining count',()=>{
 const start=app.indexOf('className="np-day-achievement-copy"');
 const end=app.indexOf('className="np-day-remaining"',start);
 assert.ok(start>=0&&end>start,'summary title and remaining counter exist');
 const section=app.slice(start,end);
 assert.match(section,/className="np-day-achievement-text"/u);
 assert.ok(section.includes(mount),'shortcuts inside summary copy, never in separate strip');
 assert.ok(section.indexOf('</p>')<section.indexOf(mount),'shortcut after description in same header grid cell');
 assert.equal(app.split(mount).length-1,1);
 assert.doesNotMatch(app,/\n\s*\{!historyDate\?<NoorThreeSpacesR171[^\n]+\n\s*<div className="np-day-context"/u);
});
test('R176 removes separate full-width strip and extra divider, retains 44px targets and responsive in-cell layout',()=>{
 const block=component.match(/\/\* NOOR_R176_INLINE_ACHIEVEMENT_BEGIN \*\/([\s\S]*?)\/\* NOOR_R176_INLINE_ACHIEVEMENT_END \*\//u)?.[1];
 assert.ok(block,'unique inline layout marker exists');
 assert.match(block,/\.np-day-achievement-copy\{display:flex/u);
 assert.match(block,/\.np-day-achievement-copy>\.nr171-shortcuts\{grid-column:auto;display:flex/u);
 assert.match(block,/border-top:0/u);
 assert.match(block,/min-height:44px/u);
 assert.match(block,/@media\(max-width:700px\)/u);
 assert.doesNotMatch(block,/grid-column:1\/-1/u);
 assert.doesNotMatch(component,/className="nr171-label"/u);
 assert.doesNotMatch(component,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
});
test('R176 unchanged icon interactions: three emoji-only shortcuts and accessible dialog',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><main id="root"></main></body></html>',{url:'http://127.0.0.1:5188/'});
 const overrides={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 const old=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries(overrides)){old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage:{read:async()=>[],write:async()=>{}}})));
  const icons=[...dom.window.document.querySelectorAll<HTMLButtonElement>('.nr171-shortcut')];
  assert.ok(icons.every(x=>x.textContent?.trim()==='' && x.querySelector('svg.nr180-symbol path')),'each journal shortcut must be accessible text-free vector');
  assert.equal(icons.length,3);
  assert.ok(icons.every(x=>x.getAttribute('aria-label')?.startsWith('فتح ')));
  await act(async()=>icons[0]!.click());
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/ما الحدث الذي سبق ذلك الشعور؟/u);
 }finally{
  await act(async()=>root.unmount());
  for(const [key,descriptor] of old){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  dom.window.close();
 }
});
