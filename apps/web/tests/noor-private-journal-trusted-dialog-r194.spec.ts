import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {NoorThreeSpacesR171,type NoteR171} from '../src/noor-three-spaces-r171.js';
import {createNoorTrustedJournalDialogAdapterR194} from '../src/noor-trusted-journal-dialog-adapter-r194.js';
import type {NoorJournalFetchR193,NoorPrivateJournalEntryR193} from '../src/noor-private-journal-client-r193.js';
const component=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const R194DATE='2026-11-03';
const id='d0d8d7e4-69b0-4e1c-8451-afcebd223600';
const draft:NoteR171={id,kind:'feelings',createdAt:'2026-11-04T06:10:00Z',localDate:R194DATE,title:'test',body:'FAKE_R194_TEST_ONLY',precedingEvent:'',helpful:'',category:'',mood:3,shareApproved:false};
function fixture(){
 const entries:NoorPrivateJournalEntryR193[]=[];
 const paths:string[]=[];
 const transport:NoorJournalFetchR193=async(path,init)=>{
  paths.push(path);
  assert.equal(init.credentials,'same-origin');
  assert.equal(init.mode,'same-origin');
  assert.equal(init.cache,'no-store');
  assert.equal(JSON.stringify(init.headers),JSON.stringify({'Content-Type':'application/json'}));
  const body=JSON.parse(init.body as string) as Record<string,any>;
  const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(path.endsWith('/list'))return json({entries});
  if(path.endsWith('/create')){
   assert.equal(Object.keys(body).join(','),'note');
   assert.equal(body.note.localDate,R194DATE);
   entries.unshift({id,createdAt:'2026-11-04T06:10:00Z',...body.note});
   return json({id},201);
  }
  if(path.endsWith('/remove')){
   const idx=entries.findIndex(e=>e.id===body.id);if(idx<0)return json({},404);
   entries.splice(idx,1);return new Response(null,{status:204});
  }
  throw Error('UNEXPECTED_ACTION');
 };
 return {entries,paths,adapter:createNoorTrustedJournalDialogAdapterR194(transport)};
}
test('R194 new encrypted payload preserves explicit personal date; legacy malformed date fails closed',async()=>{
 const f=fixture();
 assert.deepEqual(await f.adapter.read(),[]);
 await f.adapter.create(draft);
 assert.equal((await f.adapter.read())[0]?.localDate,R194DATE);
 assert.equal((await f.adapter.read())[0]?.body,draft.body);
 await f.adapter.remove(id);
 assert.deepEqual(await f.adapter.read(),[]);
 const bad=fixture();bad.entries.push({...draft,id,kind:'feelings',createdAt:'2026-11-04T06:10:00Z',localDate:'2026-02-30'});
 await assert.rejects(bad.adapter.read(),/NOOR_JOURNAL_INVALID_RESPONSE|NOOR_TRUSTED_JOURNAL_PERSONAL_DATE_REQUIRED/u);
 await assert.rejects(f.adapter.create({...draft,localDate:'2026-02-30'}),/INVALID_DRAFT/u);
});
test('R194 no implicit browser journal migration; live mount remains legacy lab mode',()=>{
 assert.match(component,/trustedJournal \? trustedJournal\.read\(\) : storage\.read\(\)/u);
 assert.match(component,/await trustedJournal\.create\(note\)/u);
 assert.match(component,/await trustedJournal\.remove\(id\)/u);
 assert.doesNotMatch(component,/localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY/u);
 assert.match(app,/<NoorThreeSpacesR171 personalDate=\{view\.localDate\?\?undefined\} \/>/u);
 assert.doesNotMatch(app,/trustedJournal=\{/u);
});
test('R194 trusted dialog opt-in never invokes legacy IndexedDB read/write, can add test note and display it',async()=>{
 const dom=new JSDOM('<!doctype html><html lang="ar"><body><div id="root"></div></body></html>',{url:'http://127.0.0.1:5188/'});
 const globals={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
 const before=new Map<string,PropertyDescriptor|undefined>();
 for(const [k,v] of Object.entries(globals)){before.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});}
 const local={read:async()=>{throw Error('LOCAL_READ_CALLED');},write:async()=>{throw Error('LOCAL_WRITE_CALLED');}};
 const f=fixture();const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage:local,trustedJournal:f.adapter,personalDate:R194DATE})));
  await act(async()=>{(dom.window.document.querySelector('[data-testid="r171-shortcut-feelings"]') as HTMLButtonElement).click();});
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/خادم المختبر/u);
  const form=dom.window.document.querySelector('[data-testid="r171-form-feelings"]') as HTMLFormElement;
  (form.querySelector('[name="title"]') as HTMLInputElement).value='test';
  (form.querySelector('[name="body"]') as HTMLTextAreaElement).value='FAKE_R194_TEST_ONLY';
  await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})); await Promise.resolve();});
  assert.equal(f.entries.length,1);
  assert.equal(f.entries[0]?.localDate,R194DATE);
  assert.match(dom.window.document.querySelector('[role="dialog"]')?.textContent??'',/FAKE_R194_TEST_ONLY/u);
 }finally{await act(async()=>root.unmount());for(const [k,d] of before){if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);}dom.window.close();}
});
