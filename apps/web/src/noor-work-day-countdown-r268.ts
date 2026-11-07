import {riyadhDayR267} from "./noor-work-school-calendar-r267.js";

export const WORKDAY_START_R268="06:30" as const;
export const WORKDAY_END_R268="12:30" as const;
type Slot=Readonly<{id:string;day:number;period:number;subject:string;group:string;start:string;end:string}>;
export type WorkdayCountdownR268=Readonly<{
 stage:"before_work"|"next_lesson"|"in_lesson"|"after_lessons"|"finished"|"day_off";
 remainingSeconds:number;
 progress:number;
 heading:string;
 description:string;
 target:string;
 slot?:Slot;
}>;

const seconds=(clock:string):number|null=>{
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))return null;
 const [h,m]=clock.split(":").map(Number);
 return h*3600+m*60;
};
const displaySeconds=(remaining:number)=>Math.max(0,Math.ceil(remaining));
export function clockRemainingR268(n:number):string {
 const total=displaySeconds(n);
 const pad=(x:number)=>String(x).padStart(2,"0");
 return [Math.floor(total/3600),Math.floor(total%3600/60),total%60].map(pad).join(":");
}
export function workdayCountdownR268(now:Date,timetable:readonly Slot[]):WorkdayCountdownR268{
 const today=riyadhDayR267(now);
 const weekday=new Date(today+"T12:00:00.000Z").getUTCDay();
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false
 }).formatToParts(now);
 const get=(part:string)=>Number(parts.find(x=>x.type===part)?.value??"0");
 const t=get("hour")*3600+get("minute")*60+get("second");
 const start=seconds(WORKDAY_START_R268)!;
 const end=seconds(WORKDAY_END_R268)!;
 const result=(stage:WorkdayCountdownR268["stage"],target:number,heading:string,
   description:string,progress:number,slot?:Slot):WorkdayCountdownR268=>({
   stage,target:target>=0?clockRemainingR268(target):"00:00:00",
   remainingSeconds:displaySeconds(target),heading,description,
   progress:Math.max(0,Math.min(100,Math.round(progress))),...(slot?{slot}:{})
 });
 if(weekday===5||weekday===6)return result("day_off",0,"إجازة أسبوعية","الدوام من الأحد إلى الخميس",100);
 if(t<start)return result("before_work",start-t,"بداية الدوام","الدوام يبدأ ٦:٣٠ صباحًا",0);
 if(t>=end)return result("finished",0,"انتهى الدوام","انتهى الدوام الساعة ١٢:٣٠ ظهرًا",100);
 const lessons=timetable.filter(x=>x.day===weekday).map(slot=>({slot,begin:seconds(slot.start),finish:seconds(slot.end)}))
  .filter((x):x is {slot:Slot;begin:number;finish:number}=>x.begin!==null&&x.finish!==null&&
   x.begin<x.finish&&x.begin>=start&&x.finish<=end)
  .sort((a,b)=>a.begin-b.begin||a.finish-b.finish||a.slot.period-b.slot.period);
 const active=lessons.find(x=>x.begin<=t&&t<x.finish);
 if(active){
  const {slot,begin,finish}=active;
  return result("in_lesson",finish-t,"الحصة "+slot.period+" الآن",
   slot.subject+" · "+slot.group+" · تنتهي "+slot.end,((t-begin)/(finish-begin))*100,slot);
 }
 const next=lessons.find(x=>x.begin>t);
 if(next){
  const preceding=[start,...lessons.filter(x=>x.finish<=t).map(x=>x.finish)];
  const last=Math.max(...preceding);
  return result("next_lesson",next.begin-t,"الحصة القادمة: "+next.slot.period,
   next.slot.subject+" · "+next.slot.group+" · تبدأ "+next.slot.start,
   next.begin===last?0:((t-last)/(next.begin-last))*100,next.slot);
 }
 return result("after_lessons",end-t,"المتبقي لنهاية الدوام",
  lessons.length?"اكتملت حصص اليوم، ينتهي الدوام ١٢:٣٠":"لا توجد حصص مجدولة اليوم",((t-start)/(end-start))*100);
}
