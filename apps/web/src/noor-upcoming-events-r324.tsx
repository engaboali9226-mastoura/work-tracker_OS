import {useEffect,useState,type ReactElement} from "react";
import {r232DailyWindows,r283FridayHoursAtDhuhr,r232LocalWeekday,type R283PrecedingNight} from "./noor-islamic-daylight-r232.js";
import type {NoorR232Preferences} from "./noor-time-display-preferences-r232.js";
import type {UpcomingDefinitionR301} from "./noor-upcoming-countdown-r301.js";
export type ReligiousEventR324=Readonly<{id:string;title:string;atMs:number;kind:"prayer"|"night"|"day"|"friday"}>;
export function religiousEventsR324(input:{prayers:readonly {key:string;label:string;at:string}[];nowMs:number;timeZone:string;nextFajrAt?:string|null;precedingNight?:R283PrecedingNight|null|undefined;preferences:NoorR232Preferences;night?:{midnight:string;lastThird:string}|null}):ReligiousEventR324[]{
 const {prayers,nowMs,timeZone,preferences}=input;
 const out:ReligiousEventR324[]=[];
 const add=(id:string,title:string,atMs:number,kind:ReligiousEventR324["kind"])=>{if(Number.isFinite(atMs)&&atMs>nowMs&&!out.some(e=>e.id===id&&e.atMs===atMs))out.push({id,title,atMs,kind});};
 for(const p of prayers)add(p.key,p.key==="dhuhr"&&Number.isFinite(Date.parse(p.at))&&r232LocalWeekday(Date.parse(p.at),timeZone)===5?"صلاة الجمعة":p.label,Date.parse(p.at),p.key==="sunrise"?"day":"prayer");
 add("fajr","الفجر",Date.parse(input.nextFajrAt??""),"prayer");
 if(input.night){add("midnight","منتصف الليل",Date.parse(input.night.midnight),"night");add("last-third","بداية الثلث الأخير",Date.parse(input.night.lastThird),"night");}
 // Same validated authority and preference offsets as the day-rhythm card.
 const windows=r232DailyWindows(prayers,input.nextFajrAt??undefined,preferences.afterSunrise,preferences.beforeDhuhr);
 if(windows.islamicNight){const n=windows.islamicNight;add("midnight","منتصف الليل",n.startMs+n.durationMs/2,"night");add("last-third","بداية الثلث الأخير",n.startMs+n.durationMs*2/3,"night");}
 if(windows.duha){add("duha-start","بداية الضحى",windows.duha.startMs,"day");add("duha-end","نهاية الضحى",windows.duha.endMs,"day");}
 const friday=r283FridayHoursAtDhuhr({nowMs,timeZone,prayers,sunriseOffsetMinutes:preferences.afterSunrise});
 for(const hour of friday??[])add("friday-"+hour.number,"بداية ساعة الجمعة "+["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][hour.number-1],hour.startMs,"friday");
 return out.sort((a,b)=>a.atMs-b.atMs||a.id.localeCompare(b.id));
}
type ScheduleEvent=Readonly<{id:string;title:string;atMs:number;kind:ReligiousEventR324["kind"]|"personal";detail:string}>;
function localParts(ms:number,zone:string):string{
 const parts=new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));
 const get=(k:string)=>parts.find(p=>p.type===k)?.value??"";
 return get("year")+"-"+get("month")+"-"+get("day")+"T"+get("hour")+":"+get("minute")+":"+get("second");
}
// Resolve a saved local civil appointment without assuming the browser timezone.
// A nonexistent DST local time is rejected; an ambiguous time uses the earlier matching instant.
export function appointmentInstantR324(date:string,clock:string,zone:string):number|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))return null;
 const label=date+"T"+clock+":00",naive=Date.parse(label+"Z");
 if(!Number.isFinite(naive))return null;
 try{
  const matches=new Set<number>();for(const hint of [naive-86400000,naive,naive+86400000]){
   const offset=Date.parse(localParts(hint,zone)+"Z")-hint;
   const candidate=naive-offset;if(localParts(candidate,zone)===label)matches.add(candidate);
  }
  return matches.size?Math.min(...matches):null;
 }catch{return null;}
}
export function mergeUpcomingR324(definitions:readonly UpcomingDefinitionR301[],religious:readonly ReligiousEventR324[],nowMs:number,zone:string):ScheduleEvent[]{
 const rows:ScheduleEvent[]=religious.filter(e=>Number.isFinite(e.atMs)&&e.atMs>nowMs).map(e=>({...e,id:"religious:"+e.id+":"+e.atMs,detail:e.kind==="prayer"?"صلاة":e.kind==="night"?"من المغرب إلى الفجر المعتمد":e.kind==="friday"?"ساعات التبكير":"المواقيت الشمسية المعتمدة"}));
 for(const d of definitions){if(d.state!=="Active"||!d.countdownPlan)continue;const p=d.countdownPlan,ms=appointmentInstantR324(p.date,p.time,zone);if(ms===null||ms<nowMs-3600000)continue;rows.push({id:"personal:"+d.id,title:d.title,atMs:ms,kind:"personal",detail:p.kind==="appointment"?"موعد شخصي":p.kind==="event"?"حدث مرتقب":"موعد إنجاز مهمة"});}
 return rows.sort((a,b)=>a.atMs-b.atMs||a.id.localeCompare(b.id));
}
const countdown=(ms:number,now:number)=>{const sec=Math.max(0,Math.ceil((ms-now)/1000));return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(v=>String(v).padStart(2,"0")).join(":");};
const clock=(ms:number,zone:string)=>new Intl.DateTimeFormat("ar-SA-u-nu-latn",{timeZone:zone,hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(ms));
const dateLabel=(ms:number,zone:string)=>new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{timeZone:zone,weekday:"long",day:"numeric",month:"long"}).format(new Date(ms));
export function UnifiedUpcomingR324({definitions,religiousEvents,nowMs,timeZone,onAdd}:{definitions:readonly UpcomingDefinitionR301[];religiousEvents:readonly ReligiousEventR324[];nowMs:number;timeZone:string;onAdd?:()=>void}):ReactElement{
 const [open,setOpen]=useState(false),[filter,setFilter]=useState<"all"|"religious"|"personal">("all");
 const events=mergeUpcomingR324(definitions,religiousEvents,nowMs,timeZone);
 const next=events.find(e=>e.atMs>nowMs)??events[0];
 const filtered=events.filter(e=>filter==="all"||(filter==="personal"?e.kind==="personal":e.kind!=="personal"));
 useEffect(()=>{if(!open)return;const trigger=document.activeElement as HTMLElement|null;const close=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();setOpen(false);}};document.addEventListener("keydown",close);document.querySelector<HTMLElement>("[data-r324-close-upcoming]")?.focus();return()=>{document.removeEventListener("keydown",close);trigger?.focus();};},[open]);
 const show=()=>{setFilter("all");setOpen(true);};
 return <section className="np-card np-upcoming-r301 np-upcoming-r303 np-r324-upcoming" data-testid="r301-upcoming-countdowns" data-countdown-empty={!events.length} aria-label="المواقيت القادمة">
 <header className="np-r324-upcoming-head"><span className="np-r324-clock-icon" aria-hidden="true">◷</span><h2>المواقيت القادمة</h2></header>
 <button className="np-r324-next-event" type="button" onClick={show} aria-haspopup="dialog" aria-expanded={open} data-testid="r322-open-appointments">
 {next?<><strong>{next.title}</strong><b dir="ltr" role="timer">{next.atMs>nowMs?countdown(next.atMs,nowMs):"حان الموعد"}</b><small>{dateLabel(next.atMs,timeZone)} · {clock(next.atMs,timeZone)}</small></>:<small>لا توجد مواقيت مؤكدة بعد</small>}
 <span>عرض جميع المواقيت ({events.length}) ‹</span></button>
 <div className="np-r322-appointments-overlay np-r324-schedule-overlay" data-open={open} aria-hidden={!open} onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
 <section className="np-r322-appointments-sheet np-r324-schedule-sheet" role="dialog" aria-modal={open} aria-label="جميع المواقيت القادمة" dir="rtl">
 <header className="np-r322-sheet-head"><div><h2>المواقيت القادمة</h2><p>مرتبة زمنيًا حسب موقعك وسياسة الصلاة</p></div><button type="button" data-r324-close-upcoming aria-label="إغلاق المواعيد" onClick={()=>setOpen(false)}>×</button></header>
 <div className="np-r324-schedule-filters">{([["all","الكل"],["religious","الصلوات والليل"],["personal","مواعيدي"]] as const).map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
 {next?<div className="np-r324-schedule-hero"><strong>الأقرب · {next.title}</strong><b dir="ltr">{next.atMs>nowMs?countdown(next.atMs,nowMs):"حان الموعد"}</b><small>{dateLabel(next.atMs,timeZone)} · {clock(next.atMs,timeZone)}</small></div>:null}
 <div className="np-r324-schedule-list">{filtered.map((e,i)=><div key={e.id}>{(i===0||localParts(e.atMs,timeZone).slice(0,10)!==localParts(filtered[i-1]!.atMs,timeZone).slice(0,10))?<h3>{dateLabel(e.atMs,timeZone)}</h3>:null}<article className="np-r324-event-row" data-testid={"r324-event-"+e.kind}><span aria-hidden="true">◷</span><div><strong>{e.title}</strong><small>{e.detail}{e.atMs<=nowMs?" · حان الموعد":""}</small></div><time dateTime={new Date(e.atMs).toISOString()}>{clock(e.atMs,timeZone)}</time></article></div>)}</div>
 {!filtered.length?<p role="status">لا توجد مواقيت في هذا القسم.</p>:null}
 <p className="np-r324-schedule-note">يظهر كل توقيت مستقبلي متاح من مصدر نور المعتمد. لا تُقدّر المواقيت غير المتوفرة من أوقات يوم آخر.</p>
 {onAdd?<button type="button" className="np-r324-add-event" data-testid="r302-add-countdown" onClick={()=>{setOpen(false);onAdd();}}>+ إضافة موعد شخصي</button>:null}
 </section></div></section>;
}
