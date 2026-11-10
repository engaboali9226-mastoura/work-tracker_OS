import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {NoorWellbeingLabR165} from '../src/noor-wellbeing-lab-r165.js';
import {riyadhDate,type Reflection,type DailySignals} from '../src/noor-wellbeing-data-r165.js';
import type {NoorWellbeingPortR227} from '../src/noor-wellbeing-journal-r227.js';

test('R227 cloud personal-space reloads saved fields, awaits persistence, and never substitutes a local save on failure',async()=>{
 const dom=new JSDOM('<!doctype html><body><main id="root"></main></body>',{url:'http://localhost/'}),previous=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 let reflections:Reflection[]=[],signals:DailySignals[]=[{date:riyadhDate(),steps:7500,sleepMinutes:450,screenMinutes:120,pickups:10,apps:[{name:'Synthetic',minutes:20,opens:2}],source:'manual'}],failSave=false,failRead=false;
 const port:NoorWellbeingPortR227={
  async read(){if(failRead)throw Error('offline');return structuredClone({reflections,signals});},
  async addReflection(value){if(failSave)throw Error('offline');const saved={...value,id:randomUUID()};reflections.push(saved);return saved;},
  async saveSignals(value){if(failSave)throw Error('offline');signals=[value];},
  async removeReflection(id){reflections=reflections.filter(r=>r.id!==id);},
 };
 const root=createRoot(dom.window.document.getElementById('root')!);
 const button=(label:string)=>[...dom.window.document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===label)!;
 const open=async()=>act(async()=>dom.window.document.querySelector<HTMLButtonElement>('[data-testid="noor-wellbeing-launch-r165"]')!.click());
 const close=async()=>act(async()=>dom.window.document.querySelector<HTMLButtonElement>('[aria-label="إغلاق مساحتي"]')!.click());
 const submit=async()=>act(async()=>{dom.window.document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});
 try{
  await act(async()=>root.render(createElement(NoorWellbeingLabR165,{personalDate:riyadhDate(),trustedWellbeing:port})));
  await open();assert.equal(dom.window.document.querySelector('fieldset')?.disabled,false);
  assert.ok(button('حفظ التدوينة'));assert.doesNotMatch(dom.window.document.querySelector('[role="dialog"]')!.textContent!,/تجربة محلية بذاكرة مؤقتة/);
  await submit();assert.equal(reflections.length,1);assert.match(dom.window.document.querySelector('[role="status"]')!.textContent!,/تم حفظ التدوينة/);
  failSave=true;await submit();assert.equal(reflections.length,1);assert.match(dom.window.document.querySelector('[role="alert"]')!.textContent!,/تعذر تأكيد حفظ/);failSave=false;
  await close();await open();assert.match(dom.window.document.querySelector('[role="dialog"]')!.textContent!,/تدويناتي المحفوظة \(1\)/);
  await act(async()=>button('مؤشرات اليوم').click());
  assert.equal(dom.window.document.querySelector<HTMLInputElement>('input[type="number"]')!.value,'7500');assert.match(dom.window.document.querySelector('[role="dialog"]')!.textContent!,/Synthetic/);
  await submit();assert.equal(signals[0].apps[0].minutes,20);assert.match(dom.window.document.querySelector('[role="status"]')!.textContent!,/تم حفظ مؤشرات/);
  await act(async()=>button('مشاعري · تفريغ المشاعر').click());await act(async()=>button('حذف التدوينة').click());assert.equal(reflections.length,1);await act(async()=>button('تأكيد حذف التدوينة').click());assert.equal(reflections.length,0);
  await close();failRead=true;await open();assert.equal(dom.window.document.querySelector('fieldset')?.disabled,true);assert.match(dom.window.document.querySelector('[role="alert"]')!.textContent!,/تعذر فتح التخزين الآمن/);
 }finally{
  await act(async()=>root.unmount());dom.window.close();for(const[key,d]of previous){if(d)Object.defineProperty(globalThis,key,d);else Reflect.deleteProperty(globalThis,key);}
 }
});
