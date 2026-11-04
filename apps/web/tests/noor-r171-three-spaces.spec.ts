import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {developerExportR171, localDateR171,readNotesR171,validateNoteR171,NoorThreeSpacesR171,indexedNotesR173,type NoteR171} from '../src/noor-three-spaces-r171.js';
const source=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const component=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
test('R173 browser authority boundary: reflections never store credentials or use session storage',()=>{
 assert.match(component,/indexedDB/u);
 assert.doesNotMatch(component,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
});
const one={id:'b0d8d7e4-69b0-4e1c-8451-afcebd223600',kind:'feelings' as const,title:'عنوان',body:'وصف',createdAt:'2026-11-03T10:00:00.000Z',localDate:'2026-11-03',precedingEvent:'حدث سابق',helpful:'',mood:3,category:'',shareApproved:false};
test('R171 three spaces are mounted INSIDE day achievement, not in separate floating widget',()=>{
 assert.match(source,/import \{ NoorThreeSpacesR171 \}/);
 const start=source.indexOf('data-testid="today-summary"'),end=source.indexOf('className="np-day-context"',start);
 assert.ok(start>0&&end>start&&source.slice(start,end).includes('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />'));
 assert.equal(source.split('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />').length-1,1);
});
test('R173 without IndexedDB fails closed, never claims persistent saving',async()=>{
 await assert.rejects(indexedNotesR173.read(),/IndexedDB unavailable/);
 await assert.rejects(indexedNotesR173.write([one]),/IndexedDB unavailable/);
});
test('R171 reflections include explicit preceding event and validation',()=>{
 assert.equal(validateNoteR171(one),null);
 assert.match(validateNoteR171({...one,title:''})!,/عنوان/);
 assert.match(validateNoteR171({...one,mood:0})!,/الشعور/);
 assert.match(validateNoteR171({...one,precedingEvent:'x'.repeat(501)})!,/طول/);
 assert.equal(localDateR171(new Date('2026-11-02T22:30:00.000Z')),'2026-11-03');
});
test('R171 export only explicitly approved developer feedback, never feelings and personal ideas',()=>{
 const feedback={...one,kind:'developer' as const,precedingEvent:'',mood:null,category:'issue',shareApproved:true};
 const personalIdea={...one,kind:'ideas' as const,mood:null,precedingEvent:'',shareApproved:false};
 const output=developerExportR171([one,feedback,personalIdea,{...feedback,id:'b0d8d7e4-69b0-4e1c-8451-afcebd223601',shareApproved:false}]);
 assert.equal(output.proposals.length,1);
 assert.deepEqual(Object.keys(output.proposals[0]!).sort(),['body','category','createdAt','id','localDate','title']);
 assert.equal(output.proposals[0]!.body,'وصف');
});
test('R171 storage parser rejects malformed payloads, duplicate IDs and invalid consent',()=>{
 assert.deepEqual(readNotesR171('invalid'),[]);
 assert.equal(readNotesR171(JSON.stringify([one,one])).length,1);
 assert.equal(readNotesR171(JSON.stringify([{...one,shareApproved:true}])).length,0);
});
test('R173 three shortcuts, preceding event, durable adapter and previous records',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><div id="root"></div></body></html>',{url:'http://127.0.0.1:5188/'});
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 const previous=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,val] of Object.entries(globals)){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:val});}
 let persisted:NoteR171[]=[];
 const storage={read:async()=>persisted,write:async(rows:readonly NoteR171[])=>{persisted=[...rows];}};
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage})));
  assert.equal(dom.window.document.querySelectorAll('.nr171-shortcut').length,3);
  await act(async()=>(dom.window.document.querySelector('[data-testid="r171-shortcut-feelings"]') as HTMLButtonElement).click());
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/ما الحدث الذي سبق ذلك الشعور؟/);
  const form=dom.window.document.querySelector('[data-testid="r171-form-feelings"]') as HTMLFormElement;
  (form.querySelector('[name="title"]') as HTMLInputElement).value='راحة بعد الصلاة';
  (form.querySelector('[name="body"]') as HTMLTextAreaElement).value='أشعر بهدوء';
  (form.querySelector('[name="precedingEvent"]') as HTMLTextAreaElement).value='صلاة الفجر';
  await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await Promise.resolve();});
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/صلاة الفجر/);
  assert.equal(persisted.length,1);

  await act(async()=>(dom.window.document.querySelector('[role="dialog"]') as HTMLElement).dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'),null);
  await act(async()=>(dom.window.document.querySelector('[data-testid="r171-shortcut-developer"]') as HTMLButtonElement).click());
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/المطوّر/);
  await act(async()=>(dom.window.document.querySelector('[role="tab"][aria-selected="false"]') as HTMLButtonElement).click());
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/تصدير المقترحات/);
 }finally{await act(async()=>root.unmount());for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}dom.window.close();}
});
