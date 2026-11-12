import type {ReactElement} from "react";
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
export function UpcomingCountdownR301({definitions,nowMs,timeZone,onAdd}:{definitions:readonly UpcomingDefinitionR301[];nowMs:number;timeZone:string;onAdd?:()=>void}):ReactElement{
 const upcoming=definitions.flatMap(definition=>{
  if(!definition.countdownPlan||definition.state!=="Active")return [];
  const countdown=countdownStateR301(definition.countdownPlan.date,definition.countdownPlan.time,nowMs,timeZone);
  if(!countdown||countdown.phase==="past")return [];
  return [{id:definition.id,title:definition.title,plan:definition.countdownPlan,countdown}];
 }).sort((a,b)=>a.plan.date.localeCompare(b.plan.date)||a.plan.time.localeCompare(b.plan.time)).slice(0,5);
 return <section className="np-card np-upcoming-r301" aria-label="العد التنازلي للمواعيد والأحداث" data-testid="r301-upcoming-countdowns" data-countdown-empty={!upcoming.length}>
   <header className="np-upcoming-head-r301">
    <span className="np-upcoming-icon-r301" aria-hidden="true">◷</span>
    <div><h2>المواعيد المرتقبة</h2><small>عدّ تنازلي للمهام والأحداث والمواعيد</small></div>
    {onAdd?<button type="button" className="np-upcoming-add-r302" data-testid="r302-add-countdown"
       aria-label="إضافة موعد للعد التنازلي" onClick={onAdd}>+ موعد</button>:null}
   </header>
   {!upcoming.length?<div className="np-upcoming-empty-r302" data-testid="r302-countdown-empty" role="status">
     <span className="np-upcoming-empty-icon-r302" aria-hidden="true">◷</span>
     <div><strong>لا توجد مواعيد مرتقبة بعد</strong><small>أضف موعدًا أو حدثًا أو مهمة بوقت محدد ليظهر هنا العد التنازلي.</small></div>
     {onAdd?<button type="button" className="np-upcoming-empty-add-r302" data-testid="r302-add-first-countdown"
       onClick={onAdd}>إضافة أول موعد</button>:null}
    </div>:<div className="np-upcoming-list-r301">
    {upcoming.map(item=><div key={item.id} className={"np-upcoming-item-r301 np-upcoming-"+item.countdown.phase+"-r301"} data-countdown-phase={item.countdown.phase} data-testid={"r301-countdown-"+item.id}>
      <div className="np-upcoming-copy-r301"><strong>{item.title}</strong>
       <small>{item.plan.kind==="appointment"?"موعد":item.plan.kind==="event"?"حدث مرتقب":"موعد إنجاز مهمة"} · <time dateTime={item.plan.date}>{item.plan.date}</time> · <time>{item.plan.time}</time></small>
      </div>
      <div className="np-upcoming-value-r301" role="timer" aria-live="off">
       <span>{item.countdown.phase==="today"||item.countdown.phase==="begun"?"اليوم": "متبقٍ"}</span>
       <strong>{displayCountdown(item.countdown)}</strong>
      </div>
      {item.countdown.phase==="today"||item.countdown.phase==="begun"?<span className="np-upcoming-today-indicator-r301" aria-label="تنبيه: الموعد اليوم">●</span>:null}
     </div>)}
   </div>}
   {upcoming.length?<small className="np-upcoming-foot-r301">يُحدّث العداد أثناء فتح نور، ويعتمد على المنطقة الزمنية لحسابك. التنبيه ظاهر داخل التطبيق فقط.</small>:null}
  </section>;
}
