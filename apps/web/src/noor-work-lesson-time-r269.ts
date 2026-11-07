import {riyadhDayR267} from "./noor-work-school-calendar-r267.js";

export type LessonTimingR269=Readonly<{
  phase:"upcoming"|"active"|"finished"|"unscheduled";
  label:string;
}>;

// Work is a checklist of external-school-platform obligations. A lesson's
// live status must depend ONLY on its scheduled date/time in Riyadh.
export function lessonTimingR269(now:Date,day:string,start:string,end:string):LessonTimingR269{
 const valid=(clock:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(clock);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!valid(start)||!valid(end)||start>=end){
  return {phase:"unscheduled",label:"موعد غير محدد"};
 }
 const today=riyadhDayR267(now);
 if(day<today)return {phase:"finished",label:"انتهت"};
 if(day>today)return {phase:"upcoming",label:"لم تبدأ"};
 const parts=new Intl.DateTimeFormat("en-GB-u-nu-latn",{
  timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
 }).formatToParts(now);
 const get=(type:string)=>Number(parts.find(x=>x.type===type)?.value??"0");
 const time=get("hour")*3600+get("minute")*60+get("second");
 const toSeconds=(clock:string)=>{
  const [h,m]=clock.split(":").map(Number);
  return h*3600+m*60;
 };
 if(time<toSeconds(start))return {phase:"upcoming",label:"لم تبدأ"};
 if(time>=toSeconds(end))return {phase:"finished",label:"انتهت"};
 return {phase:"active",label:"جارٍ الآن"};
}

export function schoolClockPartsR269(now:Date):Readonly<{digits:string;period:"ص"|"م"}>{
 const parts=new Intl.DateTimeFormat("ar-SA-u-nu-latn",{
  timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true
 }).formatToParts(now);
 const part=(type:string)=>parts.find(x=>x.type===type)?.value??"00";
 const digits=["hour","minute","second"].map(x=>part(x).padStart(2,"0")).join(":");
 const raw=part("dayPeriod").trim();
 const period: "ص"|"م"=raw==="م"||/pm/i.test(raw)?"م":"ص";
 return {digits,period};
}
