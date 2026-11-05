import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { correlation, formatMinutes, isValidLocalDate, numberOrNull, riyadhDate, validateReflection, type Reflection, type DailySignals, type AppMinutes } from './noor-wellbeing-data-r165.js';

import type {NoorWellbeingPortR227} from './noor-wellbeing-journal-r227.js';

const FEELINGS = ['هادئ','مطمئن','ممتن','سعيد','متحمس','مشتت','قلق','حزين','مرهق','غاضب','محبط','متوتر'];
const BASE_STYLE = `
.nw165-launch{position:fixed;left:12px;bottom:12px;z-index:90000;min-height:46px;padding:10px 16px;background:#17655c;color:white;border:2px solid white;border-radius:16px;box-shadow:0 7px 25px #102a4366;font:700 14px system-ui,sans-serif;cursor:pointer}
.nw165-backdrop,.nw165-backdrop *{box-sizing:border-box}
.nw165-backdrop{position:fixed;inset:0;z-index:90001;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top,0px)) max(8px,env(safe-area-inset-right,0px)) max(8px,env(safe-area-inset-bottom,0px)) max(8px,env(safe-area-inset-left,0px));background:#0b2032b8;direction:rtl;font:14px/1.75 system-ui,Tahoma,Arial,sans-serif;color:#173d4e}
.nw165-dialog{width:min(950px,100%);max-width:100%;height:min(850px,100%);max-height:100%;min-height:0;overflow:hidden;display:flex;flex-direction:column;background:#f9fcfa;border-radius:19px;box-shadow:0 22px 70px #0005}
.nw165-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:#e5f2ed;border-bottom:1px solid #c8ddd5;flex:0 0 auto}
.nw165-head h2{font-size:21px;margin:0}.nw165-head p{margin:0;color:#567073;font-size:12px}.nw165-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:15px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.nw165-tabs{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px;flex:0 0 auto;scrollbar-width:thin}
.nw165-tabs button{flex:0 0 auto;white-space:nowrap}
.nw165-dialog button{font:inherit;min-height:44px;border-radius:11px;border:1px solid #b8d3c8;background:white;color:#205249;padding:8px 13px;cursor:pointer}
.nw165-dialog button[aria-selected=true],.nw165-dialog button.nw165-primary{background:#17695b;color:white;border-color:#17695b;font-weight:700}
.nw165-dialog button:focus-visible,.nw165-dialog input:focus-visible,.nw165-dialog textarea:focus-visible{outline:3px solid #447eb9;outline-offset:2px}
.nw165-dialog label{display:grid;gap:5px;font-size:13px;min-width:0}.nw165-dialog input,.nw165-dialog textarea{width:100%;max-width:100%;min-width:0;border:1px solid #bed3d3;border-radius:10px;padding:10px 12px;background:white;color:#153c4b;font:inherit;font-size:16px}.nw165-dialog textarea{resize:vertical;min-height:110px}
.nw165-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.nw165-card{border:1px solid #d7e4df;border-radius:14px;background:white;padding:15px;min-width:0}.nw165-stack{display:grid;gap:11px}
.nw165-feelings{display:flex;flex-wrap:wrap;gap:6px}.nw165-feelings button{min-height:38px;padding:6px 10px;font-size:12px}.nw165-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}.nw165-actions>button{flex:1 1 140px}
.nw165-help{font-size:12px;color:#607678;line-height:1.8}.nw165-warning{border:1px solid #ddb98d;background:#fff3df;border-radius:10px;padding:10px;color:#725321}.nw165-error{background:#fff0ee;border:1px solid #e5ada7;padding:10px;border-radius:10px;color:#953e32}
.nw165-entry{border-bottom:1px solid #e4efea;padding:12px 0;white-space:pre-wrap;overflow-wrap:anywhere}.nw165-entry:last-child{border-bottom:0}.nw165-entry p{margin:5px 0}.nw165-entry small{color:#658079}.nw165-number{font-weight:750;font-size:22px;color:#17695b}.nw165-metric{display:grid;gap:3px;border:1px solid #dfebe5;background:#fff;padding:11px;border-radius:12px}.nw165-metric span{font-size:12px;color:#506f67}
@media(max-width:600px){.nw165-backdrop{padding:4px}.nw165-dialog{width:100%;height:100%;max-height:100%;border-radius:12px}.nw165-head{padding:9px 10px}.nw165-head h2{font-size:17px}.nw165-body{padding:10px}.nw165-grid{grid-template-columns:1fr;gap:9px}.nw165-card{padding:11px}.nw165-tabs button{padding:7px 10px}.nw165-head button{flex:0 0 auto}}
@media(max-height:480px){.nw165-dialog{height:100%;border-radius:8px}.nw165-head{padding:6px 9px}.nw165-head p{display:none}.nw165-body{padding:8px}}
/* NOOR_R179_WELLBEING_HEADER_BRAND_BEGIN */
/* The R170 dashboard is separate from quick-entry icons in today's achievement. */
.nw179-header-slot{display:flex;align-items:center;min-width:0}
.nw165-launch{background:linear-gradient(145deg,#fffdf9,#f3ede3);color:#183b56;border:1px solid #d9c8ac;border-radius:13px;box-shadow:0 3px 12px rgba(25,53,74,.10);font:700 13px/1.35 system-ui,Tahoma,Arial,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:46px;padding:9px 13px;cursor:pointer}
.nw165-launch:hover{border-color:#b8862b;background:#fff9ed}
.nw165-launch:focus-visible{outline:3px solid #397b9e;outline-offset:3px}
.nw179-launch-symbol{color:#b8862b;font-size:22px;line-height:1}
.np-page .np-top-actions{gap:9px}
.np-page .np-top-actions .nw165-launch{position:static;left:auto;bottom:auto;z-index:auto;min-height:44px;white-space:nowrap}
.np-page[data-appearance=light] .np-top-actions .nw165-launch{background:linear-gradient(145deg,#fff,#f2f6f8);color:#183b56;border-color:#d7e1e7}
.np-page[data-appearance=dark] .np-top-actions .nw165-launch{background:linear-gradient(145deg,#304253,#263744);color:#e2eaf2;border-color:#4c6375;box-shadow:0 3px 12px #0003}
.np-page[data-appearance=dark] .np-top-actions .nw165-launch .nw179-launch-symbol{color:#d5b371}
.nw165-backdrop{--nw-surface:#fffefa;--nw-base:#f7f5ef;--nw-ink:#183b56;--nw-muted:#657889;--nw-line:#e2dbce;--nw-gold:#b8862b;--nw-primary:#315f7b;--nw-soft:#f2ede3;color:var(--nw-ink)}
.nw165-backdrop[data-noor-theme=light]{--nw-surface:#fff;--nw-base:#f3f5f7;--nw-line:#dfe6ea;--nw-soft:#edf3f6}
.nw165-backdrop[data-noor-theme=dark]{--nw-surface:#202d39;--nw-base:#17222d;--nw-ink:#e3edf4;--nw-muted:#aebfcd;--nw-line:#3e5364;--nw-gold:#d2b476;--nw-primary:#a6d1e8;--nw-soft:#293b49}
.nw165-dialog{background:var(--nw-base);color:var(--nw-ink);border:1px solid var(--nw-line);border-radius:22px;box-shadow:0 26px 85px rgba(9,26,43,.28)}
.nw165-head{padding:22px 25px;background:linear-gradient(120deg,var(--nw-surface),var(--nw-soft));border-bottom:1px solid var(--nw-line);border-inline-start:4px solid var(--nw-gold)}
.nw165-head h2{font-size:25px;line-height:1.5;color:var(--nw-ink);font-weight:750}
.nw165-head p{margin-top:5px;color:var(--nw-muted);line-height:1.7}
.nw165-body{padding:22px 24px 28px;scrollbar-color:var(--nw-line) transparent}
.nw165-card,.nw165-metric{background:var(--nw-surface);border:1px solid var(--nw-line);border-radius:16px;box-shadow:0 2px 12px rgba(19,47,65,.035);padding:19px}
.nw165-card h3{margin:0 0 14px;color:var(--nw-ink);font-size:17px}
.nw165-tabs{border-bottom:1px solid var(--nw-line);margin:17px 0;padding:0 0 12px;gap:9px}
.nw165-dialog button{background:var(--nw-surface);color:var(--nw-ink);border:1px solid var(--nw-line);border-radius:11px;min-height:44px;transition:background .15s ease,border-color .15s ease}
.nw165-tabs button[aria-selected=true]{background:var(--nw-soft);color:var(--nw-primary);border-color:var(--nw-gold);font-weight:750}
.nw165-dialog button.nw165-primary{background:#315f7b;border-color:#315f7b;color:#fff}
.nw165-backdrop[data-noor-theme=dark] .nw165-dialog button.nw165-primary{background:#a6d1e8;border-color:#a6d1e8;color:#152a38}
.nw165-dialog label{font-weight:650;color:var(--nw-ink);line-height:1.6}
.nw165-dialog input,.nw165-dialog textarea{background:var(--nw-surface);color:var(--nw-ink);border:1px solid var(--nw-line);border-radius:12px;min-height:45px;padding:11px 13px;box-sizing:border-box}
.nw165-dialog textarea{min-height:135px}
.nw165-dialog input:focus-visible,.nw165-dialog textarea:focus-visible,.nw165-dialog button:focus-visible{outline:3px solid #639ab8;outline-offset:2px}
.nw165-entry{border-color:var(--nw-line);color:var(--nw-ink);padding:13px 0}
.nw165-entry small,.nw165-help,.nw165-metric span{color:var(--nw-muted)}
.nw165-number{color:var(--nw-primary)}
.nw165-warning{background:var(--nw-soft);border-color:var(--nw-line);color:var(--nw-ink);border-inline-start:3px solid var(--nw-gold)}
@media(max-width:600px){
 .np-page .np-top-actions .nw165-launch{min-height:44px;padding:8px 10px;font-size:12px;gap:5px}
 .nw165-head{padding:15px 14px}.nw165-head h2{font-size:19px}.nw165-body{padding:12px}
 .nw165-card,.nw165-metric{padding:14px}.nw165-dialog{border-radius:14px}
}
@media(max-width:360px){.np-page .np-top-actions{gap:6px}.np-page .np-top-actions .nw165-launch{padding:8px 7px;font-size:11px}.nw179-launch-symbol{font-size:17px}}
@media(max-height:480px){.nw165-head{padding:10px 13px}.nw165-body{padding:9px}}
@media(prefers-reduced-motion:reduce){.nw165-dialog button{transition:none}}
/* NOOR_R179_WELLBEING_HEADER_BRAND_END */
/* NOOR_R180_WELLBEING_ICON_BEGIN */
/* The fourth shortcut is a genuine vector glyph; its header and dialog remain accessible. */
.nw165-launch .nr180-wellbeing-symbol{display:block;overflow:visible;width:25px;height:25px;flex:none}
.nr180-wellbeing-slot>.nw165-launch{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;z-index:auto!important;min-width:44px!important;width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border-radius:14px!important;font-size:0!important;line-height:1!important;gap:0!important}
@media(prefers-reduced-motion:reduce){.nr180-wellbeing-slot>.nw165-launch{transition:none!important}}
/* NOOR_R180_WELLBEING_ICON_END */
/* R225: a definite viewport height lets the flex body shrink and scroll on mobile. */
.nw165-backdrop{height:100vh;height:100dvh;overflow:hidden;min-height:0}
.nw165-dialog{flex:0 1 auto;min-height:0}
.nw165-body{scroll-padding-block:16px; padding-bottom:max(24px,env(safe-area-inset-bottom,0px))}
@media(max-width:600px){.nw165-backdrop{padding:max(4px,env(safe-area-inset-top,0px)) max(4px,env(safe-area-inset-right,0px)) max(4px,env(safe-area-inset-bottom,0px)) max(4px,env(safe-area-inset-left,0px))}}

`;

export function NoorWellbeingLabR165({personalDate,trustedWellbeing:provided}:{personalDate?:string|undefined;trustedWellbeing?:NoorWellbeingPortR227}={}): ReactElement {
 const production=(((import.meta as ImportMeta & {env?:{PROD?:boolean}}).env?.PROD)===true);
 const cloudMode=production||provided!==undefined;
 const [serverPort,setServerPort]=useState<NoorWellbeingPortR227|undefined>();
 const port=provided??serverPort;
 const [cloudReady,setCloudReady]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[deleteId,setDeleteId]=useState<string|null>(null);
 const [visualViewport,setVisualViewport]=useState<{top:number;height:number}|null>(null);
 const [open,setOpen]=useState(false),[tab,setTab]=useState<'journal'|'metrics'|'patterns'>('journal');
 const [spaceSlot,setSpaceSlot]=useState<HTMLElement|null>(null);
 const [date,setDate]=useState(riyadhDate()),[mood,setMood]=useState(3),[energy,setEnergy]=useState(3);
 const [feelings,setFeelings]=useState<string[]>([]),[writing,setWriting]=useState(''),[trigger,setTrigger]=useState(''),[helpful,setHelpful]=useState('');
 const [journal,setJournal]=useState<Reflection[]>([]),[signals,setSignals]=useState<DailySignals[]>([]);
 const [screen,setScreen]=useState(''),[steps,setSteps]=useState(''),[sleep,setSleep]=useState(''),[pickups,setPickups]=useState('');
 const [appName,setAppName]=useState(''),[appMinutes,setAppMinutes]=useState(''),[appOpens,setAppOpens]=useState(''),[appRows,setAppRows]=useState<AppMinutes[]>([]);
 const [error,setError]=useState('');const dialogRef=useRef<HTMLDivElement>(null),launcherRef=useRef<HTMLButtonElement>(null);
 const selected=useMemo(()=>signals.find(x=>x.date===date),[date,signals]);
 // NOOR_R179_WELLBEING_HEADER_BRAND: Stable React portal into the existing top-bar slot.
 useEffect(()=>{
   if(typeof document==='undefined')return;
   const locate=()=>{
     const next=document.querySelector<HTMLElement>('[data-testid="nr180-wellbeing-slot"]');
     setSpaceSlot(current=>current===next?current:next);
   };
   locate();
   if(typeof window==='undefined'||!window.MutationObserver)return;
   const watcher=new window.MutationObserver(locate);
   watcher.observe(document.body,{childList:true,subtree:true});
   return ()=>watcher.disconnect();
 },[]);

 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';dialogRef.current?.focus();return()=>{document.body.style.overflow=previous;launcherRef.current?.focus();};},[open]);
 // Keep the dialog inside the visible screen when mobile browser chrome or the keyboard moves.
 useEffect(()=>{
  if(!open)return;
  const viewport=window.visualViewport;
  const update=()=>setVisualViewport({top:Math.max(0,viewport?.offsetTop??0),height:Math.max(1,Math.floor(viewport?.height??window.innerHeight))});
  update();window.addEventListener('resize',update);viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  return()=>{window.removeEventListener('resize',update);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);};
 },[open]);
 // Production never opens browser storage or falls back to session-only writes.
 useEffect(()=>{
  if(!open||!cloudMode)return;
  let active=true;const cancel=new AbortController();const timeout=window.setTimeout(()=>cancel.abort(),30000);
  setCloudReady(false);setServerPort(undefined);setJournal([]);setSignals([]);setError('');setStatus('جارٍ فتح التخزين الآمن…');
  void (async()=>{
   let service=provided;
   if(!service){
    const response=await window.fetch('/api/noor/personal/journal/status',{method:'POST',mode:'same-origin',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json'},body:'{}',signal:cancel.signal});
    if(response.status!==204||response.headers.get('cache-control')!=='no-store'||!personalDate)throw Error('WELLBEING_NOT_READY');
    const {createNoorWellbeingPortR227}=await import('./noor-wellbeing-journal-r227.js');
    service=createNoorWellbeingPortR227((path,init)=>window.fetch(path,{...init,signal:AbortSignal.timeout(30000)}),personalDate);
   }
   const loaded=await service.read();
   if(active){setJournal(loaded.reflections);setSignals(loaded.signals);setServerPort(service);setCloudReady(true);setStatus('');}
  })().catch(()=>{if(active){setError('تعذر فتح التخزين الآمن. أغلق مساحتي وافتحها لإعادة المحاولة؛ لم تُحفظ بيانات محلية بديلة.');setStatus('');}}).finally(()=>window.clearTimeout(timeout));
  return()=>{active=false;cancel.abort();window.clearTimeout(timeout);};
 },[open,cloudMode,provided,personalDate]);
 useEffect(()=>{setScreen(selected?.screenMinutes===null||selected===undefined?'':String(selected.screenMinutes));setSteps(selected?.steps===null||selected===undefined?'':String(selected.steps));setSleep(selected?.sleepMinutes===null||selected===undefined?'':String(selected.sleepMinutes));setPickups(selected?.pickups===null||selected===undefined?'':String(selected.pickups));setAppRows([...(selected?.apps??[])]);},[date,selected]);
 const close=()=>{if(busy)return;setOpen(false);setError('');setStatus('');setDeleteId(null);};
 const toggleFeeling=(value:string)=>setFeelings(old=>old.includes(value)?old.filter(x=>x!==value):old.length<6?[...old,value]:old);
 const addReflection=async(event:FormEvent)=>{
  event.preventDefault();if(busy)return;
  const item:Reflection={id:crypto.randomUUID(),date,mood,energy,emotions:feelings,text:writing.trim(),trigger:trigger.trim(),helpful:helpful.trim()};
  const failure=validateReflection(item);if(failure){setError(failure);return;}
  if(cloudMode&&(!cloudReady||!port)){setError('التخزين الآمن غير متاح؛ لم تُحفظ التدوينة.');return;}
  setBusy(true);setError('');setStatus('');
  try{const saved=cloudMode?await port!.addReflection(item):item;setJournal(old=>[saved,...old]);setWriting('');setTrigger('');setHelpful('');setFeelings([]);setStatus(cloudMode?'تم حفظ التدوينة بأمان.':'أُضيفت التدوينة لهذه الجلسة فقط.');}
  catch{setError('تعذر تأكيد حفظ التدوينة. احتفظنا بالنص؛ أعد فتح السجل للتحقق قبل تكرار الحفظ.');}
  finally{setBusy(false);}
 };
 const addApplication=()=>{const n=numberOrNull(appMinutes,1440),opens=appOpens===''?null:numberOrNull(appOpens,2000);if(!appName.trim()||n===null||(appOpens!==''&&opens===null)||appRows.some(x=>x.name===appName.trim())){setError('أدخل اسم تطبيق مختلفًا ومدة استخدام صحيحة.');return;}setAppRows(old=>[...old,{name:appName.trim().slice(0,80),minutes:n,opens}]);setAppName('');setAppMinutes('');setAppOpens('');setError('');};
 const saveSignals=async(event:FormEvent)=>{
  event.preventDefault();if(busy)return;
  const fields=[[steps,100000],[sleep,1440],[screen,1440],[pickups,2000]] as const;const values=fields.map(([s,max])=>numberOrNull(s,max));
  if(!isValidLocalDate(date)||fields.some(([s],i)=>s!==''&&values[i]===null)){setError('راجع التاريخ والأرقام. القيم يجب أن تكون صحيحة وغير سالبة.');return;}
  if(cloudMode&&(!cloudReady||!port)){setError('التخزين الآمن غير متاح؛ لم تُحفظ المؤشرات.');return;}
  const value:DailySignals={date,steps:values[0]??null,sleepMinutes:values[1]??null,screenMinutes:values[2]??null,pickups:values[3]??null,apps:[...appRows],source:'manual'};
  setBusy(true);setError('');setStatus('');
  try{if(cloudMode)await port!.saveSignals(value);setSignals(old=>[value,...old.filter(row=>row.date!==date)]);setStatus(cloudMode?'تم حفظ مؤشرات اليوم بأمان.':'حُفظت المؤشرات لهذه الجلسة فقط.');}
  catch{setError('تعذر تأكيد حفظ المؤشرات. بقيت القيم المدخلة كما هي؛ تحقق من السجل قبل إعادة الحفظ.');}
  finally{setBusy(false);}
 };
 const removeReflection=async(id:string)=>{
  if(busy)return;if(deleteId!==id){setDeleteId(id);return;}
  if(cloudMode&&(!cloudReady||!port))return;
  setBusy(true);setError('');
  try{if(cloudMode)await port!.removeReflection(id);setJournal(old=>old.filter(x=>x.id!==id));setDeleteId(null);setStatus('تم حذف التدوينة.');}
  catch{setError('تعذر تأكيد الحذف. أعد فتح السجل للتحقق.');}finally{setBusy(false);}
 };
 const reportFor=(field:'steps'|'sleepMinutes'|'screenMinutes')=>correlation(journal,signals,field);
 const keyHandler=(event:import('react').KeyboardEvent<HTMLDivElement>)=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const els=[...dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled])')??[]];if(!els.length)return;const first=els[0],last=els.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};
 const launcher=<button ref={launcherRef} className="nw165-launch" type="button" aria-label="فتح مساحتي: مؤشرات اليوم وتحليل التغيرات" onClick={()=>setOpen(true)} data-testid="noor-wellbeing-launch-r165"><svg className="nr180-wellbeing-symbol" data-glyph="NOOR_R181A_PERSONAL_SPACE" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.3"/><path d="M15.9 12a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0Z"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/></svg></button>;
 return <><style>{BASE_STYLE}</style>{spaceSlot?createPortal(launcher,spaceSlot):(typeof document!=='undefined'&&!document.querySelector('.np-page')?launcher:null)}
 {open&&createPortal(<div className="nw165-backdrop" data-noor-theme={typeof document === "undefined" ? "noor" : (document.querySelector(".np-page")?.getAttribute("data-appearance") ?? "noor")}  style={visualViewport?{top:visualViewport.top,height:visualViewport.height,bottom:'auto'}:undefined} onMouseDown={event=>{if(event.target===event.currentTarget)close();}}><div className="nw165-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-label="مساحتي: المشاعر والمؤشرات" tabIndex={-1} onKeyDown={keyHandler}>
 <header className="nw165-head"><div><h2>مساحتي · المشاعر والمؤشرات</h2><p>{cloudMode?'تدوينات ومؤشرات خاصة مرتبطة بحسابك — إدخال يدوي دون مزامنة Apple':'R165 — نسخة اختبار فقط، بدون مزامنة Apple أو تخزين دائم'}</p></div><button type="button" onClick={close} aria-label="إغلاق مساحتي" disabled={busy}>إغلاق ×</button></header>
 <div className="nw165-body"><div className="nw165-warning" role="note">{cloudMode?'تُحفظ التدوينات والمؤشرات مشفّرة في حسابك عند تأكيد الحفظ. لا تُشارك مع المطوّر، ولا توجد نسخة محلية بديلة.':'هذه تجربة محلية بذاكرة مؤقتة. لا تكتب معلومات شديدة الخصوصية هنا؛ ستضيع المدخلات عند تحديث الصفحة ولا تُرسل إلى الإنتاج.'}</div>
 <nav className="nw165-tabs" aria-label="أقسام مساحتي" role="tablist">{([['journal','تفريغ المشاعر'],['metrics','مؤشرات اليوم'],['patterns','فهم التغيرات']] as const).map(([key,title])=><button key={key} type="button" role="tab" disabled={busy} aria-selected={tab===key} onClick={()=>{setTab(key);setError('');}}>{title}</button>)}</nav>
 {error&&<p role="alert" className="nw165-error">{error}</p>}{status&&<p role="status">{status}</p>}
 <fieldset disabled={busy||(cloudMode&&!cloudReady)} style={{border:0,padding:0,margin:0,minWidth:0}}>
 {tab==='journal'&&<div className="nw165-grid"><section className="nw165-card"><h3>اكتب ما بداخلك</h3><form className="nw165-stack" onSubmit={addReflection}><label>التاريخ<input type="date" value={date} onChange={event=>setDate(event.currentTarget.value)} required/></label><label>مزاجك الآن: {mood} من 5<input type="range" min="1" max="5" value={mood} onChange={event=>setMood(Number(event.currentTarget.value))}/></label><label>الطاقة: {energy} من 5<input type="range" min="1" max="5" value={energy} onChange={event=>setEnergy(Number(event.currentTarget.value))}/></label><div><strong>المشاعر</strong><div className="nw165-feelings">{FEELINGS.map(value=><button type="button" key={value} aria-pressed={feelings.includes(value)} className={feelings.includes(value)?'nw165-primary':''} onClick={()=>toggleFeeling(value)}>{value}</button>)}</div></div><label>تفريغ حر<textarea maxLength={5000} value={writing} onChange={event=>setWriting(event.target.value)} placeholder="ما الذي تشعر به؟"/></label><label>ما الذي أثّر عليك؟ (اختياري)<input maxLength={300} value={trigger} onChange={event=>setTrigger(event.target.value)}/></label><label>ما الذي ساعدك؟ (اختياري)<input maxLength={300} value={helpful} onChange={event=>setHelpful(event.target.value)}/></label><button className="nw165-primary" type="submit" disabled={busy||(cloudMode&&!cloudReady)}>{busy?'جارٍ الحفظ…':cloudMode?'حفظ التدوينة':'إضافة تدوينة تجريبية'}</button></form></section><section className="nw165-card"><h3>{cloudMode?'تدويناتي المحفوظة':'تدوينات هذه الجلسة'} ({journal.length})</h3>{journal.length===0?<p className="nw165-help">لا توجد تدوينات بعد. سجّل شعورًا واحدًا أو أكثر في أي يوم.</p>:journal.map(entry=><article key={entry.id} className="nw165-entry"><strong>{entry.date} · مزاج {entry.mood}/5</strong><small> · طاقة {entry.energy}/5 · {entry.emotions.join('، ')||'بلا تصنيف'}</small>{entry.text&&<p>{entry.text}</p>}{entry.trigger&&<p>المؤثر: {entry.trigger}</p>}{entry.helpful&&<p>ما ساعدني: {entry.helpful}</p>}<button type="button" disabled={busy||(cloudMode&&!cloudReady)} onClick={()=>{void removeReflection(entry.id);}}>{deleteId===entry.id?'تأكيد حذف التدوينة':'حذف التدوينة'}</button></article>)}</section></div>}
 {tab==='metrics'&&<div className="nw165-grid"><section className="nw165-card"><h3>{cloudMode?'مؤشرات اليوم — إدخال يدوي':'إدخال يدوي للاختبار'}</h3><form className="nw165-stack" onSubmit={saveSignals}><label>اليوم<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>الخطوات<input type="number" min="0" max="100000" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="مثال 7500"/></label><label>مدة النوم بالدقائق<input type="number" min="0" max="1440" value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="مثال 450"/></label><label>وقت الشاشة بالدقائق<input type="number" min="0" max="1440" value={screen} onChange={e=>setScreen(e.target.value)} placeholder="مثال 180"/></label><label>مرات التقاط الهاتف<input type="number" min="0" max="2000" value={pickups} onChange={e=>setPickups(e.target.value)}/></label><button className="nw165-primary" type="submit" disabled={busy||(cloudMode&&!cloudReady)}>{busy?'جارٍ الحفظ…':cloudMode?'حفظ مؤشرات اليوم':'حفظ مؤشرات تجريبية لهذا اليوم'}</button></form></section><section className="nw165-card"><h3>استخدام التطبيقات (يدوي)</h3><p className="nw165-help">«مرات الفتح» هنا قيمة تُدخلها أنت، وليست عددًا قُرئ من نظام iOS.</p><div className="nw165-stack"><label>اسم التطبيق<input maxLength={80} value={appName} onChange={e=>setAppName(e.target.value)} placeholder="اسم التطبيق"/></label><label>دقائق الاستخدام<input type="number" min="0" max="1440" value={appMinutes} onChange={e=>setAppMinutes(e.target.value)}/></label><label>مرات الفتح (اختياري)<input type="number" min="0" max="2000" value={appOpens} onChange={e=>setAppOpens(e.target.value)}/></label><button type="button" onClick={addApplication}>إضافة تطبيق إلى اليوم</button>{appRows.map(app=><div className="nw165-entry" key={app.name}><strong>{app.name}</strong> · {formatMinutes(app.minutes)} · {app.opens===null?'مرات الفتح غير متاحة':`${app.opens} مرة`} <button type="button" onClick={()=>setAppRows(old=>old.filter(row=>row.name!==app.name))}>حذف</button></div>)}</div></section></div>}
 {tab==='patterns'&&<div className="nw165-stack"><p className="nw165-help">العلاقات أدناه وصفية فقط، وليست تشخيصًا أو دليلًا على السبب. يتطلب المؤشر 7 أيام على الأقل لها مزاج ومقياس معًا.</p><div className="nw165-grid">{([['sleepMinutes','النوم'],['steps','الخطوات'],['screenMinutes','وقت الشاشة']] as const).map(([field,title])=>{const result=reportFor(field);return <section key={field} className="nw165-metric"><span>العلاقة بين المزاج و{title}</span><strong className="nw165-number">{result.status==='ok'?result.value!.toFixed(2):'—'}</strong><small>{result.status==='insufficient'?`يلزم 7 أيام، المتاح ${result.n}`:result.status==='no-variance'?'القيم لا تتغير بما يكفي للحساب':`${result.n} أيام صالحة للمقارنة`}</small></section>;})}</div><section className="nw165-card"><h3>مقارنة الأيام</h3>{signals.length===0?<p className="nw165-help">ابدأ بإدخال مؤشرات يوم واحد على الأقل.</p>:[...signals].sort((a,b)=>b.date.localeCompare(a.date)).map(item=><div key={item.date} className="nw165-entry"><strong>{item.date}</strong><p>خطوات: {item.steps??'—'} · نوم: {formatMinutes(item.sleepMinutes)} · شاشة: {formatMinutes(item.screenMinutes)} · التقاط: {item.pickups??'—'}</p><p>المزاج المتوسط: {journal.filter(r=>r.date===item.date).length?((journal.filter(r=>r.date===item.date).reduce((s,r)=>s+r.mood,0))/journal.filter(r=>r.date===item.date).length).toFixed(1):'—'}</p></div>)}</section></div>}
 </fieldset></div></div></div>,document.body)}</>;
}
