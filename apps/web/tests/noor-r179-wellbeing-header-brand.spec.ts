import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { NoorWellbeingLabR165 } from '../src/noor-wellbeing-lab-r165.js';
const panel=readFileSync(new URL('../src/noor-wellbeing-lab-r165.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
test('R179 header slot exists once, with no alteration to the three inline achievement shortcuts',()=>{
 assert.equal((app.match(/data-testid="nw179-header-slot"/gu)??[]).length,0);
 assert.equal((app.match(/<NoorThreeSpacesR171 personalDate=\{view\.localDate\?\?undefined\} \/>/gu)??[]).length,1);
 assert.ok(app.indexOf('className="np-day-achievement-copy"')<app.indexOf('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />'));
 assert.match(panel,/createPortal\(launcher,spaceSlot\)/u);
 assert.doesNotMatch(panel,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
});
test('R179 navy ivory muted gold theme and dark/mobile accessibility rules are present',()=>{
 for(const name of ['NOOR_R179_WELLBEING_HEADER_BRAND_BEGIN','.np-page .np-top-actions .nw165-launch','.nw165-backdrop[data-noor-theme=dark]','--nw-gold:#b8862b','--nw-primary:#315f7b','@media(max-width:360px)','focus-visible','prefers-reduced-motion'])assert.ok(panel.includes(name),name);
 assert.match(panel,/className="nw165-backdrop" data-noor-theme=/u);
 assert.match(panel,/className="nr180-wellbeing-symbol"/u);
});
test('R179 wellness launcher portals into the header and opens all three tabs',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><div id="root"></div></body></html>',{url:'http://127.0.0.1:5188/'});
 const old=new Map<string,PropertyDescriptor|undefined>();
 for(const [name,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){
   old.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 }
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement('div',null,createElement('div',{'data-testid':'nr180-wellbeing-slot',className:'nr180-wellbeing-slot'}),createElement(NoorWellbeingLabR165))));
  const slot=dom.window.document.querySelector('[data-testid="nr180-wellbeing-slot"]')!;
  const launcher=slot.querySelector<HTMLButtonElement>('[data-testid="noor-wellbeing-launch-r165"]');
  assert.ok(launcher,'launcher must be portaled into the fourth achievement slot');
  assert.equal(launcher.textContent?.trim(),'');
  assert.ok(launcher.querySelector('svg.nr180-wellbeing-symbol path'));
  await act(async()=>launcher.click());
  assert.ok(dom.window.document.querySelector('[role="dialog"]'));
  assert.equal(dom.window.document.querySelectorAll('.nw165-tabs [role="tab"]').length,3);
 }finally{
  try {await act(async()=>root.unmount());} catch{}
  for(const [name,descriptor] of old){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name)}
  dom.window.close();
 }
});
