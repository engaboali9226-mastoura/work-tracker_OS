import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import type { NoorTrustedJournalPortR194 } from './noor-trusted-journal-dialog-adapter-r194.js';
import { resolveNoorJournalReleaseModeR202 } from './noor-journal-release-gate-r202.js';

export type SpaceKindR171 = 'feelings'|'ideas'|'developer';
export type NoteR171 = Readonly<{
 id:string; kind:SpaceKindR171; createdAt:string; localDate:string;
 title:string; body:string; precedingEvent:string; helpful:string; mood:number|null;
 category:string; shareApproved:boolean;
}>;
export const STORAGE_KEY_R171 = 'noor.lab.r171.three-spaces.v1';
export const TITLES_R171:Record<SpaceKindR171,string> = {feelings:'مشاعري',ideas:'أفكاري',developer:'تطوير نور'};
export function localDateR171(date:Date = new Date()):string {
 const parts=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const get=(kind:string)=>parts.find(p=>p.type===kind)?.value??'';
 return `${get('year')}-${get('month')}-${get('day')}`;
}
const MAX_ENTRIES=250;
// Personal writing data only. No authentication/session tokens, cookies, or
// production database access. IndexedDB is NOT encrypted; experimental lab only.
const DB_NAME_R173='noor.lab.r173.reflection-drafts';
const STORE_NAME_R173='notes';
export type NotesPersistenceR173={
 read():Promise<NoteR171[]>;
 write(notes:readonly NoteR171[]):Promise<void>;
};
function openNotesDbR173():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  if(typeof window==='undefined'||!window.indexedDB){reject(new Error('IndexedDB unavailable'));return;}
  let settled=false;
  const req=window.indexedDB.open(DB_NAME_R173,1);
  req.onupgradeneeded=()=>{
   if(!req.result.objectStoreNames.contains(STORE_NAME_R173))req.result.createObjectStore(STORE_NAME_R173);
  };
  req.onblocked=()=>{if(!settled){settled=true;reject(new Error('IndexedDB upgrade blocked'));}};
  req.onerror=()=>{if(!settled){settled=true;reject(req.error??new Error('IndexedDB opening failed'));}};
  req.onsuccess=()=>{
   if(settled){req.result.close();return;}
   settled=true;resolve(req.result);
  };
 });
}
export const indexedNotesR173:NotesPersistenceR173={
 async read(){
  const db=await openNotesDbR173();
  try{return await new Promise<NoteR171[]>((resolve,reject)=>{
   const tx=db.transaction(STORE_NAME_R173,'readonly');
   const req=tx.objectStore(STORE_NAME_R173).get(STORAGE_KEY_R171);
   req.onsuccess=()=>resolve(readNotesR171(typeof req.result==='string'?req.result:null));
   req.onerror=()=>reject(req.error??new Error('Read failed'));
   tx.onabort=()=>reject(tx.error??new Error('Read aborted'));
  });}finally{db.close();}
 },
 async write(notes){
  const db=await openNotesDbR173();
  try{await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(STORE_NAME_R173,'readwrite');
   tx.objectStore(STORE_NAME_R173).put(JSON.stringify(notes.slice(0,MAX_ENTRIES)),STORAGE_KEY_R171);
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error??new Error('Write failed'));
   tx.onabort=()=>reject(tx.error??new Error('Write aborted'));
  });}finally{db.close();}
 }
};
export function validateNoteR171(note:NoteR171):string|null {
 if(!['feelings','ideas','developer'].includes(note.kind))return 'نوع المساحة غير صالح';
 if(!note.title.trim()||note.title.length>100)return 'اكتب عنوانًا مختصرًا (حتى 100 حرف)';
 if(!note.body.trim()||note.body.length>4000)return 'اكتب التفاصيل (حتى 4000 حرف)';
 if(note.precedingEvent.length>500||note.helpful.length>500||note.category.length>80)return 'راجع طول البيانات';
 if(note.kind==='feelings'&&(note.mood===null||!Number.isInteger(note.mood)||note.mood<1||note.mood>5))return 'اختر درجة الشعور من 1 إلى 5';
 if(note.kind!=='feelings'&&note.mood!==null)return 'درجة الشعور تخص المشاعر فقط';
 if(note.kind!=='developer'&&note.shareApproved)return 'المشاركة متاحة لمقترحات التطوير فقط';
 return null;
}
export function readNotesR171(raw:string|null):NoteR171[] {
 if(!raw||raw.length>2_000_000)return [];
 try {
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed))return [];
  const good:NoteR171[]=[];
  const ids=new Set<string>();
  for(const row of parsed.slice(0,MAX_ENTRIES)){
   if(!row||typeof row!=='object')continue;
   const obj=row as Record<string,unknown>;
   if(typeof obj.id!=='string'||typeof obj.createdAt!=='string'||typeof obj.localDate!=='string'||typeof obj.kind!=='string'||typeof obj.title!=='string'||typeof obj.body!=='string'||typeof obj.precedingEvent!=='string'||typeof obj.helpful!=='string'||typeof obj.category!=='string'||typeof obj.shareApproved!=='boolean')continue;
   const item:NoteR171={id:obj.id,createdAt:obj.createdAt,localDate:obj.localDate,kind:obj.kind as SpaceKindR171,title:obj.title,body:obj.body,precedingEvent:obj.precedingEvent,helpful:obj.helpful,category:obj.category,shareApproved:obj.shareApproved,mood:typeof obj.mood==='number'?obj.mood:null};
   if(!/^[\da-f-]{10,50}$/i.test(item.id)||!/^\d{4}-\d{2}-\d{2}$/.test(item.localDate)||!Number.isFinite(Date.parse(item.createdAt))||ids.has(item.id)||validateNoteR171(item)!==null)continue;
   ids.add(item.id);good.push(item);
  }
  return good;
 }catch{return [];}
}
export function developerExportR171(notes:readonly NoteR171[]):{version:number;proposals:Pick<NoteR171,'id'|'createdAt'|'localDate'|'title'|'body'|'category'>[]} {
 return {version:1,proposals:notes.filter(x=>x.kind==='developer'&&x.shareApproved&&validateNoteR171(x)===null).map(({id,createdAt,localDate,title,body,category})=>({id,createdAt,localDate,title,body,category}))};
}
const STYLES=`
.nr171-shortcuts,.nr171-shortcuts *{box-sizing:border-box}
.nr171-shortcuts{grid-column:1/-1;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding-top:13px;border-top:1px solid var(--border)}
.nr171-shortcut{display:flex;align-items:center;gap:11px;min-width:0;min-height:64px;border:1px solid var(--border);border-radius:14px;padding:9px 12px;background:var(--panel-soft);color:var(--text);cursor:pointer;font:inherit;text-align:right;transition:background .16s}
.nr171-shortcut:hover{background:var(--panel)}.nr171-shortcut:focus-visible{outline:3px solid #5d99c6;outline-offset:2px}
.nr171-icon{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;flex:0 0 43px;font-size:24px;line-height:1}
.nr171-feelings .nr171-icon{background:#f6dfe8}.nr171-ideas .nr171-icon{background:#fff0c9}.nr171-developer .nr171-icon{background:#d9e9f4}
.nr171-label{min-width:0;display:grid;gap:2px}.nr171-label strong{font-size:14px;font-weight:750}.nr171-label small{font-size:11px;color:var(--muted);line-height:1.5;overflow-wrap:anywhere}
.nr171-overlay,.nr171-overlay *{box-sizing:border-box}.nr171-overlay{position:fixed;z-index:14020;inset:0;display:flex;align-items:center;justify-content:center;padding:12px;background:#092232b9;direction:rtl;font:14px/1.7 system-ui,Tahoma,Arial,sans-serif}
.nr171-modal{width:min(680px,100%);max-width:100%;height:min(760px,100%);max-height:100%;display:flex;flex-direction:column;min-height:0;overflow:hidden;border:1px solid #d7e4e2;border-radius:20px;background:#fcfdfc;color:#163947;box-shadow:0 18px 60px #0005}
.nr171-head{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #dae5e4;flex:0 0 auto}.nr171-head h2{margin:0;font-size:20px}.nr171-head p{margin:3px 0 0;font-size:12px;color:#617781}.nr171-head button{flex-shrink:0}
.nr171-tabs{display:flex;gap:7px;overflow-x:auto;padding:10px 18px;border-bottom:1px solid #e5eded;flex:0 0 auto}.nr171-tabs button{white-space:nowrap;flex:1}
.nr171-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:15px 18px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.nr171-form{display:grid;gap:13px}.nr171-form label{display:grid;gap:5px;font-weight:650}.nr171-form input,.nr171-form textarea,.nr171-form select{max-width:100%;width:100%;min-width:0;border:1px solid #bdcfcd;border-radius:11px;padding:10px;background:#fff;color:#163947;font:inherit;font-size:16px}.nr171-form textarea{min-height:100px;resize:vertical}
.nr171-modal button{font:inherit;min-height:44px;padding:8px 13px;border:1px solid #c7d8d6;border-radius:10px;background:#fff;color:#20524b;cursor:pointer}.nr171-modal button.nr171-primary,.nr171-tabs button[aria-selected=true]{background:#23695b;color:#fff;border-color:#23695b;font-weight:720}
.nr171-modal :is(button,input,select,textarea):focus-visible{outline:3px solid #80b0d4;outline-offset:2px}
.nr171-info{font-size:12px;line-height:1.9;border:1px solid #e7d3a9;border-radius:10px;background:#fff7e5;color:#70552c;padding:9px 10px;margin:0 0 11px}
.nr171-error{font-size:13px;color:#9a382f;border:1px solid #ebbbb0;border-radius:10px;background:#fff1ec;padding:8px 12px}.nr171-action{display:flex;flex-wrap:wrap;gap:8px}.nr171-action>*{flex:1 1 120px}
.nr171-record{border:1px solid #dce7e4;border-radius:12px;background:#fff;padding:12px;margin:0 0 10px;min-width:0}.nr171-record h3{font-size:15px;margin:0 0 5px;overflow-wrap:anywhere}.nr171-record time,.nr171-record small{font-size:11px;color:#5d757d}.nr171-record p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.nr171-record-meta{font-size:12px;color:#456d6a}.nr171-check{display:flex!important;align-items:flex-start;gap:10px;font-size:13px;line-height:1.8;font-weight:400!important}.nr171-check input{width:18px!important;height:18px;flex:0 0 18px;margin-top:3px}
.nr171-empty{color:#627981;line-height:1.9}.nr171-status{font-size:12px;color:#376652}
@media(max-width:620px){.nr171-overlay{padding:4px max(4px,env(safe-area-inset-right)) max(4px,env(safe-area-inset-bottom)) max(4px,env(safe-area-inset-left))}.nr171-modal{height:100%;max-height:100%;border-radius:13px}.nr171-head{padding:10px 12px}.nr171-head h2{font-size:18px}.nr171-scroll{padding:11px 12px}.nr171-tabs{padding:9px 12px}.nr171-shortcuts{gap:5px}.nr171-shortcut{flex-direction:column;justify-content:center;text-align:center;gap:5px;min-height:80px;padding:8px 4px}.nr171-icon{width:37px;height:37px;flex-basis:37px;font-size:21px}.nr171-label strong{font-size:12px}.nr171-label small{font-size:10px}}
@media(max-width:350px){.nr171-shortcut{min-height:85px}.nr171-label small{font-size:9px}}
@media(max-height:480px){.nr171-overlay{padding:3px}.nr171-modal{height:100%;border-radius:8px}.nr171-head{padding:7px 10px}.nr171-scroll{padding:8px 10px}}
/* NOOR_R175_ICON_ONLY_STYLES_BEGIN */
.nr171-shortcuts{display:grid;grid-template-columns:repeat(3,48px);justify-content:center;gap:12px;padding-top:12px}
.nr171-shortcut{display:grid;place-items:center;width:48px;height:48px;min-width:44px;min-height:44px;padding:4px;border-radius:15px;text-align:center;gap:0;box-sizing:border-box}
.nr171-icon{width:38px;height:38px;flex:none;display:grid;place-items:center;font-size:24px;line-height:1}
@media(max-width:620px){.nr171-shortcuts{grid-template-columns:repeat(3,46px);gap:10px}.nr171-shortcut{width:46px;height:46px;min-height:44px;flex-direction:row;padding:3px}.nr171-icon{width:36px;height:36px;font-size:22px}}
@media(max-width:350px){.nr171-shortcuts{gap:8px}.nr171-shortcut{min-height:44px}}
/* NOOR_R175_ICON_ONLY_STYLES_END */
/* NOOR_R176_INLINE_ACHIEVEMENT_BEGIN */
.np-page .np-day-achievement-copy{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0}
.np-page .np-day-achievement-text{flex:1 1 auto;min-width:0}
.np-page .np-day-achievement-copy>.nr171-shortcuts{grid-column:auto;display:flex;flex:0 0 auto;align-items:center;justify-content:center;flex-wrap:nowrap;gap:7px;min-width:0;width:auto;margin:0;padding:0;border:0;border-top:0;background:transparent}
.np-page .np-day-achievement-copy>.nr171-shortcuts>.nr171-shortcut{width:44px;height:44px;min-width:44px;min-height:44px;padding:3px;border-radius:13px}
.np-page .np-day-achievement-copy>.nr171-shortcuts>.nr171-shortcut .nr171-icon{width:34px;height:34px;flex:none;font-size:21px}
@media(max-width:700px){.np-page .np-day-achievement-copy{display:grid;grid-template-columns:minmax(0,1fr);align-content:center;justify-items:start;gap:7px}.np-page .np-day-achievement-copy>.nr171-shortcuts{gap:5px}.np-page .np-day-achievement-copy>.nr171-shortcuts>.nr171-shortcut{width:44px;height:44px;min-width:44px;min-height:44px}}
@media(max-width:350px){.np-page .np-day-achievement-copy{gap:5px}.np-page .np-day-achievement-copy>.nr171-shortcuts{gap:3px}}
/* NOOR_R176_INLINE_ACHIEVEMENT_END */
/* NOOR_R177_CENTER_SPACED_ICONS_BEGIN */
/* Desktop: the title remains by the progress ring; shortcuts fill and center in the actual free space. */
@media(min-width:701px){
.np-page .np-day-achievement-copy{justify-content:flex-start;gap:clamp(16px,2.1vw,26px)}
.np-page .np-day-achievement-text{flex:0 1 auto;max-width:min(420px,50%)}
.np-page .np-day-achievement-copy>.nr171-shortcuts{flex:1 1 0;min-width:0;justify-content:center;gap:clamp(16px,2.2vw,28px)}
}
/* Phone: keep the icons INSIDE the existing summary cell, centered, with safe tap targets. */
@media(max-width:700px){
.np-page .np-day-achievement-copy{justify-items:stretch}
.np-page .np-day-achievement-copy>.nr171-shortcuts{width:100%;justify-content:center;gap:clamp(7px,2.3vw,15px)}
}
@media(max-width:390px){
.np-page .np-day-achievement-copy>.nr171-shortcuts{gap:6px}
}
/* NOOR_R177_CENTER_SPACED_ICONS_END */
/* NOOR_R178_BRAND_JOURNALS_BEGIN */
/* Brand tokens follow NOOR's warm ivory, navy and muted gold, not bright individual palettes. */
.nr171-shortcut{background:linear-gradient(155deg,#fffefa,#f7f1e8);border:1px solid #e6ddcf;box-shadow:0 2px 7px rgba(33,51,65,.055);transition:background .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease}
.nr171-shortcut:hover{background:#fffaf0;border-color:#bf9b59;box-shadow:0 5px 14px rgba(25,54,72,.10);transform:translateY(-2px)}
.nr171-shortcut:active{transform:translateY(0)}
.nr171-shortcut:focus-visible{outline:3px solid #396e90;outline-offset:3px}
.nr171-icon{background:transparent!important;filter:saturate(.72);transition:filter .18s ease}
.nr171-shortcut:hover .nr171-icon,.nr171-shortcut:focus-visible .nr171-icon{filter:saturate(.92)}
.np-page[data-appearance=light] .nr171-shortcut{background:linear-gradient(150deg,#fff,#f2f6f8);border-color:#dce4e9}
.np-page[data-appearance=dark] .nr171-shortcut{background:linear-gradient(150deg,#2b3a48,#202c37);border-color:#485a68;box-shadow:0 2px 8px #0002}
.np-page[data-appearance=dark] .nr171-shortcut:hover{border-color:#af985c;background:#354653}
/* Portaled dialogs use their own NOOR appearance tokens, since they are outside .np-page. */
.nr171-overlay{--nr-bg:#fffdfa;--nr-surface:#fff;--nr-soft:#f8f4ed;--nr-soft-alt:#f3f6f7;--nr-ink:#19394d;--nr-muted:#607789;--nr-line:#e5ded2;--nr-primary:#315f7b;--nr-primary-hover:#244c65;--nr-gold:#b8862b;--nr-ring:#35799e;--nr-danger:#a4443a;background:rgba(11,29,42,.57);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);color:var(--nr-ink);font:14px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}
.nr171-overlay[data-noor-theme=light]{--nr-bg:#fff;--nr-soft:#f5f7f9;--nr-soft-alt:#f1f5f8;--nr-line:#dde4ea;--nr-gold:#a87a23}
.nr171-overlay[data-noor-theme=dark]{--nr-bg:#202b36;--nr-surface:#263440;--nr-soft:#263340;--nr-soft-alt:#2c3b48;--nr-ink:#ebf1f6;--nr-muted:#b5c6d2;--nr-line:#405466;--nr-primary:#acd2e8;--nr-primary-hover:#c0e0f0;--nr-gold:#e2bb73;--nr-ring:#9cd3ef;--nr-danger:#f1b2aa;background:rgba(5,13,20,.77)}
.nr171-modal{position:relative;width:min(720px,100%);height:min(780px,100%);max-height:min(780px,calc(100dvh - 28px));border-radius:24px;border:1px solid var(--nr-line);background:var(--nr-bg);color:var(--nr-ink);box-shadow:0 28px 90px rgba(7,23,34,.28),0 5px 16px rgba(7,23,34,.10);isolation:isolate}
.nr171-modal::before{content:"";position:absolute;z-index:2;inset:0 0 auto;height:4px;background:linear-gradient(90deg,var(--nr-primary),var(--nr-gold));pointer-events:none}
.nr171-head{position:relative;gap:18px;align-items:center;padding:25px 27px 19px;background:linear-gradient(120deg,var(--nr-soft),var(--nr-bg));border-bottom:1px solid var(--nr-line)}
.nr171-head>div{min-width:0;flex:1}
.nr171-head h2{font-size:25px;line-height:1.5;letter-spacing:-.3px;font-weight:750;color:var(--nr-ink)}
.nr171-head p{font-size:13px;line-height:1.75;color:var(--nr-muted);margin:4px 0 0}
.nr171-head>button{min-width:44px;max-width:94px;flex-shrink:0;align-self:flex-start;background:var(--nr-surface)!important;border-color:var(--nr-line)!important;border-radius:12px!important;color:var(--nr-muted)!important;font-size:13px!important;font-weight:650}
.nr171-head>button:hover{color:var(--nr-ink)!important;border-color:var(--nr-primary)!important}
.nr171-tabs{padding:12px 26px;gap:7px;background:var(--nr-bg);border-bottom:1px solid var(--nr-line);overflow-x:auto}
.nr171-tabs button{font-size:13px!important;border:1px solid transparent!important;background:transparent!important;border-radius:11px!important;color:var(--nr-muted)!important;font-weight:650;min-height:45px;transition:background .16s ease,color .16s ease,border-color .16s ease}
.nr171-tabs button[aria-selected=true]{background:var(--nr-soft-alt)!important;border-color:var(--nr-line)!important;color:var(--nr-ink)!important;box-shadow:inset 0 -2px var(--nr-gold)}
.nr171-tabs button:hover:not([aria-selected=true]){background:var(--nr-soft)!important;color:var(--nr-ink)!important}
.nr171-scroll{padding:22px 27px 28px;scrollbar-gutter:stable;scrollbar-color:var(--nr-line) transparent}
.nr171-info{padding:12px 14px;margin:0 0 19px;border-radius:12px;border:1px solid var(--nr-line);border-inline-start:3px solid var(--nr-gold);background:var(--nr-soft);color:var(--nr-muted);font-size:12px;line-height:1.9}
.nr171-form{gap:17px}
.nr171-form label{gap:8px;color:var(--nr-ink);font-size:13.5px;font-weight:700;line-height:1.7}
.nr171-form :is(input,select,textarea){background:var(--nr-surface);color:var(--nr-ink);border:1px solid var(--nr-line);box-shadow:0 1px 2px rgba(12,40,58,.035);border-radius:12px;padding:12px 14px;font-size:16px;line-height:1.65;min-height:48px;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
.nr171-form :is(input,select,textarea)::placeholder{color:var(--nr-muted);opacity:.8}
.nr171-form :is(input,select,textarea):hover{border-color:var(--nr-muted)}
.nr171-form :is(input,select,textarea):focus{outline:0;border-color:var(--nr-ring);box-shadow:0 0 0 3px rgba(71,139,174,.20)}
.nr171-form textarea{resize:vertical;min-height:105px;max-height:45vh;line-height:1.85}
.nr171-form textarea[name=body]{min-height:162px}
.nr171-form select{appearance:auto;cursor:pointer}
.nr171-modal button{border-radius:11px;border:1px solid var(--nr-line);background:var(--nr-surface);color:var(--nr-primary);font-size:13px;font-weight:650;transition:background .16s ease,border-color .16s ease,transform .16s ease;min-height:44px}
.nr171-modal button:hover:not(:disabled){border-color:var(--nr-primary);background:var(--nr-soft-alt)}
.nr171-modal button:active:not(:disabled){transform:translateY(1px)}
.nr171-modal button:disabled{opacity:.55;cursor:not-allowed}
.nr171-modal button.nr171-primary{background:#315f7b;color:#fff;border-color:#315f7b;box-shadow:0 4px 13px rgba(49,95,123,.18);font-weight:750}
.nr171-modal button.nr171-primary:hover:not(:disabled){background:#244c65;border-color:#244c65}
.nr171-overlay[data-noor-theme=dark] .nr171-modal button.nr171-primary{background:#acd2e8;color:#152b3b;border-color:#acd2e8}
.nr171-overlay[data-noor-theme=dark] .nr171-modal button.nr171-primary:hover:not(:disabled){background:#c0e0f0;border-color:#c0e0f0}
.nr171-modal :is(button,input,select,textarea):focus-visible{outline:3px solid var(--nr-ring);outline-offset:2px}
.nr171-action{gap:11px;margin-top:6px}
.nr171-form>.nr171-action{position:sticky;bottom:-28px;z-index:1;background:linear-gradient(to bottom,transparent 0,var(--nr-bg) 14px,var(--nr-bg) 100%);padding:18px 0 6px;margin-top:0}
.nr171-action>*{flex:1 1 145px}
.nr171-check{display:flex!important;align-items:flex-start;gap:11px;background:var(--nr-soft);border:1px solid var(--nr-line);border-radius:12px;padding:13px 14px;font-weight:500!important;color:var(--nr-muted)!important}
.nr171-check input{accent-color:var(--nr-primary);min-height:18px!important;padding:0!important;margin-top:5px!important}
.nr171-record{position:relative;background:var(--nr-surface);border:1px solid var(--nr-line);border-radius:16px;padding:17px 18px;margin-bottom:13px;box-shadow:0 3px 13px rgba(22,55,77,.035)}
.nr171-record::before{content:"";position:absolute;inset-inline-start:0;top:16px;bottom:16px;width:3px;background:var(--nr-gold);border-radius:99px}
.nr171-record h3{color:var(--nr-ink);font-size:16px;line-height:1.6;margin-bottom:4px}
.nr171-record time,.nr171-record small{color:var(--nr-muted);font-size:11.5px}
.nr171-record p{color:var(--nr-ink);font-size:13px;line-height:1.85;margin:9px 0}
.nr171-record-meta{display:inline-block!important;border-radius:99px;padding:3px 9px;background:var(--nr-soft-alt);color:var(--nr-muted)!important;font-size:11.5px!important}
.nr171-record .nr171-action{margin-top:15px;padding-top:11px;border-top:1px solid var(--nr-line)}
.nr171-record .nr171-action button{flex:0 1 auto;min-width:110px}
.nr171-record .nr171-action button:first-child{color:var(--nr-danger)}
.nr171-record .nr171-action button:first-child:hover{border-color:var(--nr-danger)}
.nr171-empty{padding:46px 15px;text-align:center;border:1px dashed var(--nr-line);border-radius:15px;background:var(--nr-soft);color:var(--nr-muted)}
.nr171-error{color:#9c4539;border-color:#e7c7bf;background:#fff3ed;border-radius:12px}
.nr171-status{padding:8px 11px;background:var(--nr-soft-alt);color:var(--nr-primary);border-radius:10px}
.nr171-overlay[data-noor-theme=dark] .nr171-error{background:#483632;border-color:#73544b;color:#ffd7c9}
@media(max-width:620px){
 .nr171-overlay{padding:6px max(6px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left))}
 .nr171-modal{width:100%;height:100%;max-height:100%;border-radius:18px}
 .nr171-head{padding:18px 16px 14px;gap:10px}.nr171-head h2{font-size:21px}.nr171-head p{font-size:12px}
 .nr171-head>button{min-width:44px;padding:6px 8px}
 .nr171-tabs{padding:9px 13px;gap:5px}.nr171-tabs button{min-width:120px;font-size:12px!important}
 .nr171-scroll{padding:16px 15px 24px;scrollbar-gutter:auto}.nr171-form{gap:14px}
 .nr171-form>.nr171-action{bottom:-24px;padding-top:15px}
 .nr171-info{font-size:11.5px;padding:11px}.nr171-record{padding:14px}
 .nr171-shortcut{transform:none}
}
@media(max-height:480px){.nr171-modal{height:100%;max-height:100%}.nr171-head{padding:11px 16px 9px}.nr171-scroll{padding-top:11px}}
@media(prefers-reduced-motion:reduce){.nr171-shortcut,.nr171-icon,.nr171-modal button,.nr171-form :is(input,select,textarea){transition:none!important}.nr171-shortcut:hover{transform:none}}
/* NOOR_R178_BRAND_JOURNALS_END */
/* NOOR_R180_VECTOR_ICONS_BEGIN */
/* All four affordances share the same vector grid, optical weight and 44px touch targets. */
.np-page .np-day-achievement-copy>.nr171-shortcuts{display:flex;align-items:center;justify-content:center;gap:clamp(11px,1.55vw,22px);min-width:0}
.nr171-shortcut,.nr180-wellbeing-slot>.nw165-launch{--nr180-surface:#fffefa;display:grid;place-items:center;position:relative;flex:0 0 44px;width:44px;height:44px;min-width:44px;min-height:44px;max-width:44px;border:1px solid #dedbd4;border-radius:14px;background:linear-gradient(145deg,#fffefa,#f5f2eb);color:#315f7b;box-shadow:0 2px 9px rgba(19,43,61,.05);padding:0;cursor:pointer;transition:background .17s ease,border-color .17s ease,box-shadow .17s ease,transform .17s ease}
.nr171-icon{display:grid;place-items:center;width:100%;height:100%;filter:none!important;background:transparent!important}
.nr180-symbol,.nr180-wellbeing-symbol{display:block;width:23px;height:23px;flex:none;overflow:visible;color:currentColor}
.nr171-shortcut:hover,.nr180-wellbeing-slot>.nw165-launch:hover{transform:translateY(-1px);background:#fff9ed;border-color:#b99555;box-shadow:0 5px 15px rgba(20,46,67,.11)}
.nr171-shortcut:active,.nr180-wellbeing-slot>.nw165-launch:active{transform:scale(.96)}
.nr171-shortcut:focus-visible,.nr180-wellbeing-slot>.nw165-launch:focus-visible{outline:3px solid #4484a6;outline-offset:3px}
.nr180-wellbeing-slot{display:flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;min-width:44px;height:44px;min-height:44px}
.nr180-wellbeing-slot>.nw165-launch{--nr180-surface:#23485f;border-color:#274c60;color:#f9f0d9;background:linear-gradient(145deg,#244e67,#183b56);box-shadow:0 3px 11px rgba(16,49,70,.16);border-radius:14px;position:static;left:auto;right:auto;top:auto;bottom:auto;z-index:auto;font-size:0;line-height:1;padding:0;gap:0}
.nr180-wellbeing-slot>.nw165-launch:hover{background:linear-gradient(145deg,#315f7b,#214a63);color:#ffe7ae;border-color:#b8862b;box-shadow:0 4px 14px rgba(16,49,70,.24)}
.nr180-wellbeing-slot>.nw165-launch .nr180-wellbeing-symbol{width:25px;height:25px}
.np-page[data-appearance=light] .nr171-shortcut{background:linear-gradient(150deg,#fff,#f2f6f8);border-color:#dce4e9;color:#315f7b}
.np-page[data-appearance=dark] .nr171-shortcut{--nr180-surface:#263542;background:linear-gradient(150deg,#2b3a48,#202c37);color:#ddebf2;border-color:#495c6a}
.np-page[data-appearance=dark] .nr180-wellbeing-slot>.nw165-launch{--nr180-surface:#2f495d;background:linear-gradient(145deg,#38566b,#294253);color:#f4dca4;border-color:#a88b58}
.np-page[data-appearance=dark] .nr171-shortcut:hover{background:#354957;border-color:#c1a364}
@media(min-width:701px){.np-page .np-day-achievement-copy>.nr171-shortcuts{flex:1 1 0;min-width:0;justify-content:center;gap:clamp(12px,1.8vw,26px)}}
@media(max-width:700px){.np-page .np-day-achievement-copy>.nr171-shortcuts{max-width:100%;width:100%;overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain;justify-content:safe center;gap:clamp(6px,1.4vw,11px);padding:3px 0;min-width:0}.np-page .np-day-achievement-copy>.nr171-shortcuts::-webkit-scrollbar{display:none}}
@media(max-width:390px){.np-page .np-day-achievement-copy>.nr171-shortcuts{gap:6px}}
@media(prefers-reduced-motion:reduce){.nr171-shortcut,.nr180-wellbeing-slot>.nw165-launch{transition:none!important;transform:none!important}}
/* NOOR_R180_VECTOR_ICONS_END */
/* NOOR_R181A_ABSTRACT_ICON_FAMILY_BEGIN */
/* The fourth shortcut shares the same tile, border, optical size, hover and focus as the other three. */
.np-page .nr180-wellbeing-slot>.nw165-launch{background:linear-gradient(145deg,#fffefa,#f5f2eb);color:#315f7b;border-color:#dedbd4;box-shadow:0 2px 9px rgba(19,43,61,.05)}
.np-page .nr180-wellbeing-slot>.nw165-launch .nr180-wellbeing-symbol{width:23px;height:23px;stroke-width:1.7}
.np-page .nr180-wellbeing-slot>.nw165-launch:hover{background:#fff9ed;color:#315f7b;border-color:#b99555;box-shadow:0 5px 15px rgba(20,46,67,.11)}
.np-page[data-appearance=light] .nr180-wellbeing-slot>.nw165-launch{background:linear-gradient(150deg,#fff,#f2f6f8);color:#315f7b;border-color:#dce4e9}
.np-page[data-appearance=dark] .nr180-wellbeing-slot>.nw165-launch{background:linear-gradient(150deg,#2b3a48,#202c37);color:#ddebf2;border-color:#495c6a;box-shadow:0 2px 9px rgba(0,0,0,.12)}
.np-page[data-appearance=dark] .nr180-wellbeing-slot>.nw165-launch:hover{background:#354957;color:#ddebf2;border-color:#c1a364}
/* NOOR_R181A_ABSTRACT_ICON_FAMILY_END */

`;
export function NoorThreeSpacesR171({personalDate,storage=indexedNotesR173,trustedJournal}:{personalDate?:string|undefined;storage?:NotesPersistenceR173;trustedJournal?:NoorTrustedJournalPortR194}):ReactElement {
 // NOOR_R202_PRIVACY_FAIL_CLOSED: a production build never enters unscoped IndexedDB mode.
 const r202Production=(((import.meta as ImportMeta & {env?:{PROD?:boolean}}).env?.PROD)===true);
 const closed=resolveNoorJournalReleaseModeR202({production:r202Production,trustedJournalPresent:trustedJournal!==undefined})==='blocked';
 const [active,setActive]=useState<SpaceKindR171|null>(null);
 const [view,setView]=useState<'add'|'history'>('add');
 const [notes,setNotes]=useState<NoteR171[]>([]);
 const [ready,setReady]=useState(false),[storageError,setStorageError]=useState(false),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[status,setStatus]=useState('');
 const [confirmDelete,setConfirmDelete]=useState<string|null>(null);
 const [visualViewport,setVisualViewport]=useState<{top:number;height:number}|null>(null);
 const modal=useRef<HTMLDivElement|null>(null),opener=useRef<HTMLButtonElement|null>(null);
 const current=active?notes.filter(x=>x.kind===active):[];
 useEffect(()=>{
  // Clear previous storage mode immediately; never mix local and trusted records.
  setNotes([]);setReady(false);setStorageError(false);
  // R202: production without verified trusted adapter never opens browser storage.
  if(closed){setNotes([]);setReady(false);setStorageError(false);return;}
  let activeRead=true;
  // Trusted mode is explicitly injected; it NEVER touches IndexedDB or falls back to it.
  void (trustedJournal ? trustedJournal.read() : storage.read()).then(rows=>{
   if(!activeRead)return;
   setNotes(rows);setReady(true);setStorageError(false);
  }).catch(()=>{
   if(!activeRead)return;
   setReady(false);setStorageError(true);
  });
  return()=>{activeRead=false;};
 },[storage,trustedJournal,closed]);
 useEffect(()=>{
  if(!active)return;
  const old=document.body.style.overflow;
  document.body.style.overflow='hidden';modal.current?.focus();
  return()=>{document.body.style.overflow=old;opener.current?.focus();};
 },[active]);
 useEffect(()=>{
  if(!active)return;
  const update=()=>{const vp=window.visualViewport;setVisualViewport({top:Math.max(0,vp?.offsetTop??0),height:Math.max(120,Math.floor(vp?.height??window.innerHeight))});};
  update();window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);
  return()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);window.visualViewport?.removeEventListener('scroll',update);};
 },[active]);
 const show=(kind:SpaceKindR171,event:import('react').MouseEvent<HTMLButtonElement>)=>{
  opener.current=event.currentTarget;setActive(kind);setView('add');setError('');setConfirmDelete(null);setStatus('');
 };
 const close=()=>{setActive(null);setError('');setConfirmDelete(null);};
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(!active||saving)return;
  if(closed){setError('حفظ التدوينات الخاصة غير متاح حتى تفعيل الخدمة الآمنة.');return;}
  if(!ready){setError('التخزين غير متاح. لم تُحفظ أي تدوينة.');return;}
  const form=event.currentTarget, data=new FormData(form);
  const field=(key:string)=>String(data.get(key)??'').trim();
  const note:NoteR171={id:crypto.randomUUID(),kind:active,createdAt:new Date().toISOString(),localDate:personalDate&&/^\d{4}-\d{2}-\d{2}$/.test(personalDate)?personalDate:localDateR171(),title:field('title'),body:field('body'),precedingEvent:active==='feelings'?field('precedingEvent'):'',helpful:active==='feelings'?field('helpful'):'',mood:active==='feelings'?Number(field('mood')):null,category:active==='developer'?field('category'):'',shareApproved:active==='developer'&&data.get('shareApproved')==='on'};
  const failure=validateNoteR171(note);
  if(failure){setError(failure);return;}
  if(notes.length>=MAX_ENTRIES){setError('وصلت إلى الحد التجريبي (250 تدوينة). احذف تدوينة سابقة أولًا.');return;}
  const updated=[note,...notes];
  setSaving(true);
  try{
   if (trustedJournal) {
    // No bulk migration: create only the newly submitted note in the trusted API.
    await trustedJournal.create(note);
    const currentRemote=await trustedJournal.read();
    setNotes(currentRemote);
    setStatus('تم حفظ التدوينة في خدمة المختبر الآمنة.');
   } else {
    await storage.write(updated);
    setNotes(updated);
    setStatus('تم الحفظ محليًا على هذا المتصفح فقط.');
   }
   setError('');setView('history');
  }catch{setError(trustedJournal?'تعذر تأكيد عملية الحفظ. راجع السجل قبل المحاولة مرة أخرى؛ فقد تكون العملية تمت.':'تعذر حفظ البيانات؛ لم تُضف التدوينة.');}
  finally{setSaving(false);}
 };
 const remove=async(id:string)=>{
  if(saving)return;
  if(closed){setError('إدارة التدوينات الخاصة غير متاحة حتى تفعيل الخدمة الآمنة.');return;}
  if(confirmDelete!==id){setConfirmDelete(id);return;}
  if(!ready){setError('التخزين المحلي غير متاح.');return;}
  const updated=notes.filter(x=>x.id!==id);
  setSaving(true);
  try{
   if (trustedJournal) {
    await trustedJournal.remove(id);
   } else {
    await storage.write(updated);
   }
   setNotes(updated);setConfirmDelete(null);setStatus(trustedJournal?'حُذفت التدوينة من خدمة المختبر.':'حُذفت التدوينة محليًا.');
  }catch{setError('تعذر تحديث التخزين؛ أعد المحاولة.');}
  finally{setSaving(false);}
 };
 const exportDeveloper=()=>{
  if(closed){setError('تصدير التدوينات الخاصة غير متاح حتى تفعيل الخدمة الآمنة.');return;}
  const pack=developerExportR171(notes);
  if(!pack.proposals.length){setError('لا توجد مقترحات وافقت على مشاركتها.');return;}
  const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  try{const a=document.createElement('a');a.href=url;a.download=`noor-developer-proposals-${localDateR171()}.json`;document.body.appendChild(a);a.click();a.remove();setStatus('تم تجهيز ملف للمشاركة يدويًا. لم يُرسل إلى أي جهة.');}
  finally{window.setTimeout(()=>URL.revokeObjectURL(url),500);}
 };
 const keyDown=(event:import('react').KeyboardEvent<HTMLDivElement>)=>{
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const controls=[...modal.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled])')??[]];
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 };
 return <><style>{STYLES}</style><div className="nr171-shortcuts" aria-label="مساحات التدوين في إنجاز اليوم" data-testid="noor-three-spaces-r171">
  {(['feelings','ideas','developer'] as const).map(kind=><button key={kind} type="button" className={`nr171-shortcut nr171-${kind}`} data-testid={`r171-shortcut-${kind}`} onClick={event=>show(kind,event)} aria-label={`فتح ${TITLES_R171[kind]} وإضافة أو مراجعة التدوينات`}>
   <span className="nr171-icon" aria-hidden="true">{kind==='feelings'?<svg className="nr180-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.3 9.1c0 4-5.1 8.1-8.3 10.5C8.8 17.2 3.7 13.1 3.7 9.1a4.7 4.7 0 0 1 8.3-3 4.7 4.7 0 0 1 8.3 3Z"/></svg>:kind==='ideas'?<svg className="nr180-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17.2h6m-5.1 2.9h4.2M12 2.7a6.3 6.3 0 0 0-3.6 11.4c.7.5 1.2 1.4 1.3 2.3h4.6c.1-.9.6-1.8 1.3-2.3A6.3 6.3 0 0 0 12 2.7Z"/></svg>:<svg className="nr180-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--nr180-surface,#fffefa)"/><circle cx="16" cy="12" r="2" fill="var(--nr180-surface,#fffefa)"/><circle cx="11" cy="18" r="2" fill="var(--nr180-surface,#fffefa)"/></svg>}</span>

  </button>)}
  <span className="nr180-wellbeing-slot" data-testid="nr180-wellbeing-slot" aria-label="مساحتي" />
 </div>
 {active&&createPortal(<div className="nr171-overlay" data-noor-theme={typeof document === "undefined" ? "noor" : (document.querySelector(".np-page")?.getAttribute("data-appearance") ?? "noor")} style={visualViewport?{top:visualViewport.top,height:visualViewport.height,bottom:'auto'}:undefined} onMouseDown={event=>{if(event.target===event.currentTarget)close();}}>
  <div className="nr171-modal" role="dialog" aria-modal="true" aria-label={`مساحة ${TITLES_R171[active]}`} tabIndex={-1} ref={modal} onKeyDown={keyDown}>
   <header className="nr171-head"><div><h2>{active==='feelings'?'💗 مشاعري':active==='ideas'?'💡 أفكاري':'🛠️ تطوير نور'}</h2><p>{active==='feelings'?'ألاحظ الشعور وما سبقه دون أحكام':active==='ideas'?'أدوّن الفكرة قبل أن تضيع':'ملاحظاتي لتحسين المنصة'}</p></div><button type="button" onClick={close} aria-label="إغلاق مساحة التدوين">إغلاق ×</button></header>
   <nav className="nr171-tabs" role="tablist" aria-label="إضافة أو سجل المساحة"><button role="tab" type="button" aria-selected={view==='add'} onClick={()=>{setView('add');setError('');}}>إضافة جديدة</button><button role="tab" type="button" aria-selected={view==='history'} onClick={()=>{setView('history');setError('');}}>السجل السابق ({current.length})</button></nav>
   <div className="nr171-scroll"><p className="nr171-info" role="note">{closed?'التدوينات الخاصة غير متاحة مؤقتًا في هذا الإصدار حتى اعتماد التخزين المشفّر المرتبط بحسابك. لن تُحفظ بياناتك في هذا المتصفح، ولم تُحذف أي تدوينات محلية قديمة.':trustedJournal?'مختبر الخدمة الموثوقة: تُرسل هذه التدوينة الجديدة فقط إلى خادم المختبر المصرّح به، ولا يتم نقل سجلات IndexedDB القديمة أو حذفها. لا تستخدم بيانات خاصة حتى اعتماد الإصدار النهائي.':'مختبر محلي فقط: السجل يُحفظ في IndexedDB داخل هذا المتصفح دون تشفير أو مزامنة، وقد يراه مستخدم الجهاز. استخدم بيانات تجريبية، ولا تكتب معلومات شديدة الخصوصية. لا يُرسل شيء إلى المطوّر تلقائيًا.'}</p>
   {storageError&&<p className="nr171-error" role="alert">{trustedJournal?'خدمة المختبر الموثوقة غير متاحة. لا يوجد رجوع تلقائي إلى IndexedDB.':'التخزين المحلي غير متاح. لن تُحفظ التدوينات حتى تفعّله.'}</p>}{error&&<p className="nr171-error" role="alert">{error}</p>}{status&&<p className="nr171-status" role="status">{status}</p>}
   {view==='add'?(closed?<p className="nr171-info" role="status">الحفظ متوقف لحماية خصوصيتك. لن يتم حفظ أي تدوينة محليًا أو إرسالها للخادم في هذا الوضع.</p>:<form className="nr171-form" key={active} onSubmit={save} data-testid={`r171-form-${active}`}>
    <label>عنوان مختصر *<input name="title" maxLength={100} placeholder={active==='feelings'?'مثلًا: شعور بالراحة بعد الصلاة':active==='ideas'?'عنوان الفكرة':'ملخص المقترح'} required/></label>
    {active==='feelings'?<><label>كيف كان شعورك؟<select name="mood" defaultValue="3" required><option value="1">1 — صعب جدًا</option><option value="2">2 — غير مريح</option><option value="3">3 — متوازن</option><option value="4">4 — جيد</option><option value="5">5 — جيد جدًا</option></select></label><label>ما الحدث الذي سبق ذلك الشعور؟<textarea name="precedingEvent" maxLength={500} rows={2} placeholder="صف ما حدث قبل أن تشعر بهذه الطريقة"/></label><label>ماذا شعرت أو فكّرت؟ *<textarea name="body" maxLength={4000} rows={4} required placeholder="مساحة حرة لكتابة ما بداخلك"/></label><label>ما الذي ساعدني أو قد يساعدني؟ (اختياري)<textarea name="helpful" maxLength={500} rows={2}/></label></>:<>
     {active==='developer'&&<label>نوع المقترح<select name="category" defaultValue="improvement"><option value="improvement">اقتراح تطوير</option><option value="issue">ملاحظة / مشكلة</option><option value="efficiency">زيادة الفاعلية</option><option value="ux">تحسين تجربة الاستخدام</option><option value="other">أخرى</option></select></label>}
     <label>{active==='ideas'?'تفاصيل الفكرة *':'وصف المشكلة أو المقترح *'}<textarea name="body" maxLength={4000} rows={5} required placeholder={active==='ideas'?'ما الفكرة؟ وما أول خطوة لتجربتها؟':'ما الذي يحتاج التحسين؟ وكيف تتصور الحل؟'}/></label>
     {active==='developer'&&<label className="nr171-check"><input type="checkbox" name="shareApproved"/><span>أوافق على تضمين هذا المقترح وحده في ملف أُصدّره يدويًا للمطوّر لاحقًا. لا يسمح ذلك بمشاركة مشاعري أو أفكاري الشخصية.</span></label>}
    </>}
    <div className="nr171-action"><button className="nr171-primary" type="submit" disabled={!ready||saving}>{saving?"جارٍ الحفظ…":trustedJournal?"حفظ في الخدمة الموثوقة":"حفظ التدوينة في المختبر"}</button><button type="button" onClick={()=>{setView('history');setError('');}}>عرض السابق</button></div>
   </form>):<div><div className="nr171-action" style={{marginBottom:12}}><button type="button" onClick={()=>{setView('add');setConfirmDelete(null);}}>+ إضافة جديدة</button>{active==='developer'&&<button type="button" onClick={exportDeveloper}>تصدير المقترحات الموافق عليها للمطوّر</button>}</div>
    {closed?<p className="nr171-info" role="status">السجل غير متاح حتى اعتماد خدمة التدوينات الآمنة؛ البيانات المحلية السابقة لم تُمس.</p>:current.length===0?<p className="nr171-empty">لا توجد تدوينات سابقة في هذه المساحة.</p>:current.map(n=><article className="nr171-record" key={n.id} data-testid={`r171-record-${n.kind}`}><h3>{n.title}</h3><time dateTime={n.createdAt}>{n.localDate}</time>{active==='feelings'&&<p className="nr171-record-meta">تقييم الشعور: {n.mood}/5</p>}{n.precedingEvent&&<p><strong>الحدث الذي سبق الشعور:</strong> {n.precedingEvent}</p>}<p>{n.body}</p>{n.helpful&&<p><strong>ما يساعدني:</strong> {n.helpful}</p>}{active==='developer'&&<p className="nr171-record-meta">{n.shareApproved?'موافقة محلية على التصدير — لم يُرسل':'خاص — غير مخصص للمشاركة'}</p>}<div className="nr171-action"><button type="button" onClick={()=>{void remove(n.id);}} disabled={saving}>{confirmDelete===n.id?'تأكيد الحذف':'حذف التدوينة'}</button>{confirmDelete===n.id&&<button type="button" onClick={()=>setConfirmDelete(null)}>إلغاء الحذف</button>}</div></article>)}
   </div>}
   </div>
  </div>
 </div>,document.body)}
 </>;
}
