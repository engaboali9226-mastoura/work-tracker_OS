import {useEffect,useState,type ReactElement} from "react";
import type {NoorCountdownPlanR301} from "./noor-personal-today-client.js";

/** Pure civil-time countdown. Clock comes from the existing app heartbeat.
 * The target is owner-saved local time in the selected account timezone.
 * Never schedules a notification or stores a timer in browser storage. */
export type UpcomingDefinitionR301=Readonly<{id:string;title:string;state:string;countdownPlan?:NoorCountdownPlanR301}>;
export type CountdownStateR301=Readonly<{phase:"days"|"today"|"begun"|"past";days:number;hours:number;minutes:number;seconds:number}>;
const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+"T00:00:00Z"))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
const dateNumber=(value:string)=>Date.parse(value+"T00:00:00Z");
export function accountClockPartsR301(nowMs:number,timeZone:string):{date:string;seconds:number}|null{
 if(!Number.isFinite(nowMs))return null;
 try{
  const parts=new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn",{
   timeZone,year:"numeric",month:"2-digit",day:"2-digit",
   hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
  }).formatToParts(new Date(nowMs));
  const get=(key:string)=>parts.find(part=>part.type===key)?.value;
  const date=[get("year"),get("month"),get("day")].join("-");
  const hour=Number(get("hour")),minute=Number(get("minute")),second=Number(get("second"));
  return validDate(date)&&[hour,minute,second].every(Number.isInteger)?
   {date,seconds:hour*3600+minute*60+second}:null;
 }catch{return null;}
}
export function countdownStateR301(targetDate:string,time:string,nowMs:number,timeZone:string):CountdownStateR301|null{
 if(!validDate(targetDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return null;
 const local=accountClockPartsR301(nowMs,timeZone);
 if(!local)return null;
 const deltaDays=Math.round((dateNumber(targetDate)-dateNumber(local.date))/86400000);
 if(deltaDays>0)return {phase:"days",days:deltaDays,hours:0,minutes:0,seconds:0};
 if(deltaDays<0)return {phase:"past",days:0,hours:0,minutes:0,seconds:0};
 const seconds=Number(time.slice(0,2))*3600+Number(time.slice(3))*60-local.seconds;
 if(seconds<=0&&seconds>=-3600)return {phase:"begun",days:0,hours:0,minutes:0,seconds:0};
 if(seconds<0)return {phase:"past",days:0,hours:0,minutes:0,seconds:0};
 return {phase:"today",days:0,hours:Math.floor(seconds/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60};
}
const number=(n:number)=>new Intl.NumberFormat("ar-SA-u-nu-latn").format(n);
function displayCountdown(item:CountdownStateR301):string{
 if(item.phase==="days")return number(item.days)+" يوم";
 if(item.phase==="today")return number(item.hours)+" س "+number(item.minutes)+" د "+number(item.seconds)+" ث";
 if(item.phase==="begun")return "حان الموعد";
 return "انتهى الموعد";
}
/** R303: concise mobile-first presentation. The first event is the hero;
 * no more than two following rows appear until the owner expands the list. */
const kindLabelR303=(kind:NoorCountdownPlanR301["kind"])=>
 kind==="appointment"?"موعد":kind==="event"?"حدث مرتقب":"موعد إنجاز مهمة";
const kindIconR303=(kind:NoorCountdownPlanR301["kind"])=>
 kind==="appointment"?"◷":kind==="event"?"✦":"✓";
const shortDateR303=(date:string)=>{
 try{return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{timeZone:"UTC",weekday:"long",day:"numeric",month:"short"}).format(new Date(date+"T00:00:00Z"));}
 catch{return date;}
};
const paddedR303=(value:number)=>String(value).padStart(2,"0");
export function UpcomingCountdownR301({definitions,nowMs,timeZone,onAdd}:{definitions:readonly UpcomingDefinitionR301[];nowMs:number;timeZone:string;onAdd?:()=>void}):ReactElement{
 const [detailOpen,setDetailOpen]=useState(false);
 useEffect(()=>{if(!detailOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setDetailOpen(false);};document.addEventListener("keydown",onKey);return ()=>document.removeEventListener("keydown",onKey);},[detailOpen]);
 const upcoming=definitions.flatMap(definition=>{
  if(!definition.countdownPlan||definition.state!=="Active")return [];
  const countdown=countdownStateR301(definition.countdownPlan.date,definition.countdownPlan.time,nowMs,timeZone);
  if(!countdown||countdown.phase==="past")return [];
  return [{id:definition.id,title:definition.title,plan:definition.countdownPlan,countdown}];
 }).sort((a,b)=>a.plan.date.localeCompare(b.plan.date)||a.plan.time.localeCompare(b.plan.time));
 const featured=upcoming[0];
 const additional=upcoming.slice(1,3);
 const hidden=upcoming.slice(3);
 return <section className="np-card np-upcoming-r301 np-upcoming-r303" aria-label="العد التنازلي للمواعيد والأحداث"
   data-testid="r301-upcoming-countdowns" data-countdown-empty={!upcoming.length} data-layout="compact-mobile-r303">
   <header className="np-upcoming-head-r301">
    <span className="np-upcoming-icon-r301" aria-hidden="true">
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M7.5 3v5M16.5 3v5M3.5 10h17M8 14h3M8 17h6"/></svg>
    </span>
    <div><h2>المواعيد</h2><small>أقرب موعد</small></div>
    {onAdd?<button type="button" className="np-upcoming-add-r302" data-testid="r302-add-countdown"
       aria-label="إضافة موعد للعد التنازلي" onClick={onAdd}>+ إضافة</button>:null}
   </header>
   {!featured?<div className="np-upcoming-empty-r302 np-upcoming-empty-r303" data-testid="r302-countdown-empty" role="status">
     <span className="np-upcoming-empty-icon-r302" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
       <rect x="12" y="13" width="39" height="39" rx="9"/><path d="M22 8v11M41 8v11M12 24h39M23 33h7M23 40h14"/><circle cx="48" cy="47" r="11" fill="var(--panel)"/><path d="M48 40v7l5 3"/>
      </svg>
     </span>
     <div><strong>لا توجد مواعيد مرتقبة بعد</strong><small>أضف موعدًا أو حدثًا ليظهر هنا عدّ تنازلي.</small></div>
     {onAdd?<button type="button" className="np-upcoming-empty-add-r302" data-testid="r302-add-first-countdown"
       onClick={onAdd}>+ إضافة موعد مرتقب</button>:null}
    </div>:<div className="np-upcoming-list-r301 np-upcoming-list-r303">
    <article className={"np-upcoming-feature-r303 np-upcoming-feature-"+featured.countdown.phase+"-r303"}
      data-countdown-phase={featured.countdown.phase} data-testid={"r301-countdown-"+featured.id}>
      <div className="np-upcoming-feature-main-r303">
       <span className="np-upcoming-feature-icon-r303" aria-hidden="true">{kindIconR303(featured.plan.kind)}</span>
       <div className="np-upcoming-feature-copy-r303">
        <strong title={featured.title}>{featured.title}</strong>
        <span className="np-upcoming-meta-r303">
         <span className="np-upcoming-type-r303">{kindLabelR303(featured.plan.kind)}</span>
         {(featured.countdown.phase==="today"||featured.countdown.phase==="begun")?
          <span className="np-upcoming-today-badge-r303" aria-label="تنبيه: الموعد اليوم">اليوم</span>:null}
        </span>
        <small><time dateTime={featured.plan.date}>{shortDateR303(featured.plan.date)}</time> · <time>{featured.plan.time}</time></small>
       </div>
      </div>
      <div className="np-upcoming-countdown-strip-r303" role="timer" aria-live="off" aria-label={"الوقت المتبقي: "+displayCountdown(featured.countdown)}>
       <span className="np-upcoming-countdown-lead-r303">{featured.countdown.phase==="begun"?"حان":"متبقٍ على الموعد"}</span>
       {featured.countdown.phase==="days"?
         <span className="np-upcoming-counter-r303 np-upcoming-counter-days-r303">
          <strong>{number(featured.countdown.days)}</strong><small>أيام</small>
         </span>:featured.countdown.phase==="begun"?
         <span className="np-upcoming-counter-r303 np-upcoming-due-r303"><strong>حان الموعد</strong></span>:
         <div className="np-upcoming-clock-r303">
          {([{value:featured.countdown.hours,label:"ساعة"},{value:featured.countdown.minutes,label:"دقيقة"},{value:featured.countdown.seconds,label:"ثانية"}] as const).map(part=>
           <span className="np-upcoming-counter-r303" key={part.label}><strong>{paddedR303(part.value)}</strong><small>{part.label}</small></span>)}
         </div>}
      </div>
    </article>
    {upcoming.length>1?<button type="button" className="np-r322-appointments-more" onClick={()=>setDetailOpen(true)} aria-haspopup="dialog" aria-expanded={detailOpen} data-testid="r322-open-appointments">
      عرض جميع المواعيد ({number(upcoming.length)}) ←
     </button>:null}
    <div className="np-r322-appointments-overlay" data-open={detailOpen} role="presentation" aria-hidden={!detailOpen}
      onMouseDown={e=>{if(e.target===e.currentTarget)setDetailOpen(false);}}>
     <div className="np-r322-appointments-sheet" role="dialog" aria-modal={detailOpen} aria-label="جميع المواعيد القادمة" dir="rtl">
       <header className="np-r322-sheet-head"><div><h2>جميع المواعيد القادمة</h2><p>المواعيد المسجلة لحسابك، مرتبة حسب التاريخ والوقت</p></div>
       <button type="button" onClick={()=>setDetailOpen(false)} aria-label="إغلاق المواعيد">✕</button></header>
       <p className="np-r322-featured-modal">الموعد الأقرب: <strong>{featured.title}</strong> · {shortDateR303(featured.plan.date)} · {featured.plan.time}</p>
    {additional.length?<div className="np-upcoming-following-r303">
      {additional.map(item=><div key={item.id} className="np-upcoming-following-item-r303"
        data-countdown-phase={item.countdown.phase} data-testid={"r301-countdown-"+item.id}>
        <span className="np-upcoming-following-icon-r303" aria-hidden="true">{kindIconR303(item.plan.kind)}</span>
        <div><strong title={item.title}>{item.title}</strong>
         <small>{kindLabelR303(item.plan.kind)} · {shortDateR303(item.plan.date)}</small></div>
        <span className="np-upcoming-following-time-r303">{item.countdown.phase==="days"?"بعد "+number(item.countdown.days)+" أيام":
          item.countdown.phase==="begun"?"حان الآن":"اليوم"}</span>
       </div>)}
    </div>:null}
    {hidden.length?<details className="np-upcoming-more-r303" open={detailOpen}><summary>عرض {number(hidden.length)} مواعيد أخرى</summary>
      {hidden.map(item=><div key={item.id} data-testid={"r301-countdown-"+item.id}>
       <strong>{item.title}</strong><small>{shortDateR303(item.plan.date)} · {item.plan.time}</small></div>)}
    </details>:null}
    </div></div>
   </div>}
  </section>;
}
