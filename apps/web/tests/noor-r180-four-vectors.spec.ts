import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { NoorThreeSpacesR171 } from '../src/noor-three-spaces-r171.js';
import { NoorWellbeingLabR165 } from '../src/noor-wellbeing-lab-r165.js';

const three=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const wellbeing=readFileSync(new URL('../src/noor-wellbeing-lab-r165.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');

test('R180 four vector glyphs in the existing daily achievement row; no visible titles',()=>{
 assert.equal((three.match(/className="nr180-wellbeing-slot"/gu)??[]).length,1);
 assert.equal((three.match(/className="nr180-symbol"/gu)??[]).length,3);
 assert.equal((wellbeing.match(/className="nr180-wellbeing-symbol"/gu)??[]).length,1);
 assert.match(three,/NOOR_R180_VECTOR_ICONS_BEGIN/u);
 assert.match(wellbeing,/NOOR_R180_WELLBEING_ICON_BEGIN/u);
 assert.equal(app.split('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />').length-1,1);
 const achievement=app.slice(app.indexOf('className="np-day-achievement-copy"'),app.indexOf('className="np-day-remaining"'));
 assert.ok(achievement.includes('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />'));
 assert.doesNotMatch(app,/data-testid="nw179-header-slot"/u);
 assert.doesNotMatch(three,/className="nr171-label"/u);
 assert.doesNotMatch(three,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
 assert.doesNotMatch(wellbeing,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
});

test('R180 brand tones, dark mode, 44px minimum, focus and reduced motion are retained',()=>{
 assert.match(three,/\.nr180-wellbeing-slot>\.nw165-launch\{[\s\S]*?background:linear-gradient\(145deg,#244e67,#183b56\)/u);
 assert.match(three,/\.np-page\[data-appearance=dark\] \.nr180-wellbeing-slot>\.nw165-launch/u);
 assert.match(three,/min-height:44px/u);
 assert.match(three,/@media\(max-width:700px\)/u);
 assert.match(three,/prefers-reduced-motion/u);
 assert.match(three,/focus-visible/u);
 assert.match(wellbeing,/createPortal\(launcher,spaceSlot\)/u);
 assert.match(wellbeing,/data-testid="nr180-wellbeing-slot"/u);
 assert.match(three,/export const indexedNotesR173/u);
 assert.match(three,/developerExportR171/u);
});

test('R180 four accessible icon-only buttons and functioning journal/wellbeing dialogs',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><main id="root"></main></body></html>',{url:'http://127.0.0.1:5188/'});
 const previous=new Map<string,PropertyDescriptor|undefined>();
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 for(const [key,value] of Object.entries(globals)){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const viewport=Object.assign(new dom.window.EventTarget(),{height:667,offsetTop:0});
 Object.defineProperty(dom.window,'visualViewport',{configurable:true,value:viewport});
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement('section',{className:'np-page','data-appearance':'dark',style:{transform:'translateZ(0)',overflow:'hidden',height:180}},
    createElement(NoorThreeSpacesR171,{storage:{read:async()=>[],write:async()=>{}}}),
    createElement(NoorWellbeingLabR165))));
  const strip=dom.window.document.querySelector('[data-testid="noor-three-spaces-r171"]');
  assert.ok(strip,'four icon placement in same section');
  const journal=[...strip.querySelectorAll<HTMLButtonElement>('.nr171-shortcut')];
  assert.equal(journal.length,3);
  assert.ok(journal.every(button=>button.textContent?.trim()===''&&button.querySelector('svg.nr180-symbol path')));
  assert.deepEqual(journal.map(button=>button.getAttribute('aria-label')),[
   'فتح مشاعري وإضافة أو مراجعة التدوينات','فتح أفكاري وإضافة أو مراجعة التدوينات','فتح تطوير نور وإضافة أو مراجعة التدوينات']);
  const fourth=strip.querySelector<HTMLButtonElement>('[data-testid="noor-wellbeing-launch-r165"]');
  assert.ok(fourth,'fourth personal-area shortcut is portaled in achievement');
  assert.equal(fourth.textContent?.trim(),'');
  assert.match(fourth.getAttribute('aria-label')??'',/مساحتي/u);
  assert.ok(fourth.querySelector('svg.nr180-wellbeing-symbol path'));
  assert.equal(strip.querySelectorAll('button').length,4);
  await act(async()=>journal[0]!.click());
  assert.match(dom.window.document.querySelector('.nr171-modal')?.textContent??'',/ما الحدث الذي سبق ذلك الشعور؟/u);
  await act(async()=>{(dom.window.document.querySelector('button[aria-label="إغلاق مساحة التدوين"]') as HTMLButtonElement).click();});
  assert.equal(dom.window.document.querySelector('.nr171-modal'),null);
  await act(async()=>fourth.click());
  const dialog=dom.window.document.querySelector('.nw165-dialog');
  assert.ok(dialog);
  const overlay=dom.window.document.querySelector<HTMLElement>('.nw165-backdrop')!;
  assert.equal(overlay.parentElement,dom.window.document.body,'dialog must escape clipped/transformed application ancestors');
  assert.equal(overlay.style.height,'667px');
  viewport.height=280;viewport.offsetTop=95;
  await act(async()=>viewport.dispatchEvent(new dom.window.Event('resize')));
  assert.equal(overlay.style.height,'280px');assert.equal(overlay.style.top,'95px');assert.equal(overlay.style.bottom,'auto');
  const tabs=dialog.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  await act(async()=>tabs[1]!.click());
  assert.ok([...dialog.querySelectorAll('button')].some(b=>b.textContent==='حفظ مؤشرات تجريبية لهذا اليوم'));
  viewport.height=667;viewport.offsetTop=0;
  await act(async()=>viewport.dispatchEvent(new dom.window.Event('scroll')));
  assert.equal(overlay.style.height,'667px');assert.equal(overlay.style.top,'0px');
  assert.equal(dialog.querySelectorAll('.nw165-tabs [role="tab"]').length,3);
  assert.equal(dom.window.document.querySelector('.nw165-backdrop')?.getAttribute('data-noor-theme'),'dark');
  await act(async()=>{(dialog.querySelector('button[aria-label="إغلاق مساحتي"]') as HTMLButtonElement).click();});
  assert.equal(dom.window.document.querySelector('.nw165-dialog'),null);
  assert.equal(dom.window.document.body.style.overflow,'');
  assert.equal(dom.window.document.activeElement,fourth);
 }finally{
  try{await act(async()=>root.unmount());}catch{}
  for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  dom.window.close();
 }
});
