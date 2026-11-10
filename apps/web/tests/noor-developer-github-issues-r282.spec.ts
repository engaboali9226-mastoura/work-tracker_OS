import assert from 'node:assert/strict';
import test from 'node:test';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {createNoorDeveloperGitHubIssueUrlR282,NOOR_DEVELOPER_GITHUB_ISSUES_R282} from '../src/noor-developer-github-issues-r282.js';
import {NoorThreeSpacesR171,type NoteR171} from '../src/noor-three-spaces-r171.js';

const draft={kind:'developer' as const,title:'تصحيح عطل المؤقت',body:'المؤقت لا يبدأ عند دخول الوقت.',category:'issue'};

test('R282 explicit public opt-in, not old manual export checkbox, required',()=>{
 assert.throws(()=>createNoorDeveloperGitHubIssueUrlR282(draft,false),/PUBLIC_CONSENT_REQUIRED/);
 assert.throws(()=>createNoorDeveloperGitHubIssueUrlR282({...draft,kind:'feelings'},true),/DEVELOPER_ONLY/);
 assert.throws(()=>createNoorDeveloperGitHubIssueUrlR282({...draft,kind:'ideas'},true),/DEVELOPER_ONLY/);
 assert.throws(()=>createNoorDeveloperGitHubIssueUrlR282({...draft,category:'invalid'},true),/INVALID_CATEGORY/);
 assert.throws(()=>createNoorDeveloperGitHubIssueUrlR282({...draft,body:' '},true),/INVALID_NOTE/);
});

test('R282 GitHub issue draft encodes only the chosen development note and no credentials',()=>{
 const url=createNoorDeveloperGitHubIssueUrlR282(draft,true);
 const u=new URL(url);
 assert.equal(u.origin,'https://github.com');
 assert.equal(u.pathname,'/engaboali9226-mastoura/work-tracker_OS/issues/new');
 assert.equal(u.searchParams.get('title'),'[NOOR Development] تصحيح عطل المؤقت');
 assert.match(u.searchParams.get('body')??'',/المؤقت لا يبدأ/);
 assert.match(u.searchParams.get('body')??'',/بلاغ عن مشكلة/);
 assert.match(u.searchParams.get('body')??'',/\n/);
 assert.doesNotMatch(url,/token|password|sessionId|service_role/iu);
 assert.equal(NOOR_DEVELOPER_GITHUB_ISSUES_R282,'https://github.com/engaboali9226-mastoura/work-tracker_OS/issues');
});

test('R282 long URL fails closed instead of truncating',()=>{
 assert.throws(()=>createNoorDeveloperGitHubIssueUrlR282({...draft,body:'م'.repeat(1500)},true),/URL_TOO_LONG/);
});

test('R282 only developer view has public GitHub issue action and requires explicit agreement',async()=>{
 const dom=new JSDOM('<!doctype html><html><body><main id="root"></main></body></html>',{url:'https://noor.example/'});
 const names=['window','document','navigator','Node','Element','HTMLElement','FormData','IS_REACT_ACT_ENVIRONMENT'] as const;
 const globals={
  window:dom.window,document:dom.window.document,navigator:dom.window.navigator,
  Node:dom.window.Node,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,
  FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true,
 };
 const previous=new Map<string,PropertyDescriptor|undefined>();
 for(const name of names){previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:globals[name]});}
 let opened:string[]=[];
 dom.window.open=(url)=>{opened.push(String(url));return null;};
 const storage={read:async()=>[] as NoteR171[],write:async(_notes:readonly NoteR171[])=>{}};
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{
  await act(async()=>root.render(createElement(NoorThreeSpacesR171,{storage})));
  await act(async()=>(dom.window.document.querySelector('[data-testid="r171-shortcut-developer"]') as HTMLButtonElement).click());
  const form=dom.window.document.querySelector('[data-testid="r171-form-developer"]') as HTMLFormElement;
  assert.ok(form);
  const title=form.querySelector('[name="title"]') as HTMLInputElement;
  const body=form.querySelector('[name="body"]') as HTMLTextAreaElement;
  const cat=form.querySelector('[name="category"]') as HTMLSelectElement;
  title.value=draft.title;body.value=draft.body;cat.value='issue';
  const btn=[...form.querySelectorAll('button')].find(x=>x.textContent?.includes('مسودة GitHub'))!;
  assert.ok(btn);
  await act(async()=>btn.click());
  assert.equal(opened.length,0);
  assert.match(dom.window.document.querySelector('[role="alert"]')?.textContent??'',/الموافقة الصريحة/);
  (form.querySelector('[name="githubPublicConsent"]') as HTMLInputElement).checked=true;
  await act(async()=>btn.click());
  assert.equal(opened.length,1);
  assert.equal(new URL(opened[0]).searchParams.get('title'),'[NOOR Development] تصحيح عطل المؤقت');
  assert.equal(new URL(opened[0]).host,'github.com');
  assert.equal(form.querySelector('input[name="password"]'),null);
  assert.match(dom.window.document.body.textContent??'',/Create issue/);
  await act(async()=>(dom.window.document.querySelector('[role="dialog"]') as HTMLElement).dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  await act(async()=>(dom.window.document.querySelector('[data-testid="r171-shortcut-feelings"]') as HTMLButtonElement).click());
  assert.equal(dom.window.document.querySelector('[name="githubPublicConsent"]'),null);
  assert.equal(dom.window.document.querySelector('.nr171-github-public'),null);
 }finally{
  await act(async()=>root.unmount());
  for(const name of names){const desc=previous.get(name);if(desc)Object.defineProperty(globalThis,name,desc);else Reflect.deleteProperty(globalThis,name);}
  dom.window.close();
 }
});
