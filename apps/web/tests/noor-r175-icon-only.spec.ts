import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { NoorThreeSpacesR171 } from '../src/noor-three-spaces-r171.js';
const component=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
test('R175 icons-only contains no visible shortcut title or comment; accessible names remain',()=>{
 assert.doesNotMatch(component,/className="nr171-label"/u);
 assert.match(component,/grid-template-columns:repeat\(3,(?:46|48)px\)/u);
 assert.match(component,/aria-label=\{`فتح \$\{TITLES_R171\[kind\]\}/u);
 assert.match(component,/<h2>\{active==='feelings'/u);
 assert.doesNotMatch(component,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
});
test('R175 real DOM shows three icon-only buttons and opens the feelings dialog',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><div id="root"></div></body></html>',{url:'http://127.0.0.1:5188/'});
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 const old=new Map<string,PropertyDescriptor|undefined>();
 for(const [name,value] of Object.entries(globals)){old.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});}
 const storage={read:async()=>[],write:async()=>{}};
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage})));
  const buttons=[...dom.window.document.querySelectorAll<HTMLButtonElement>('.nr171-shortcut')];
  assert.equal(buttons.length,3);
  assert.ok(buttons.every(x=>x.textContent?.trim()==='' && x.querySelector('svg.nr180-symbol path')),'each journal shortcut must be accessible text-free vector');
  assert.deepEqual(buttons.map(x=>x.getAttribute('aria-label')),['فتح مشاعري وإضافة أو مراجعة التدوينات','فتح أفكاري وإضافة أو مراجعة التدوينات','فتح تطوير نور وإضافة أو مراجعة التدوينات']);
  assert.equal(dom.window.document.querySelector('.nr171-label'),null);
  await act(async()=>buttons[0]!.click());
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/ما الحدث الذي سبق ذلك الشعور؟/u);
 }finally{
  await act(async()=>root.unmount());
  for(const [name,descriptor] of old){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
  dom.window.close();
 }
});
