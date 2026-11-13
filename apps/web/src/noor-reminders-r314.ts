import {noorLinkedActivityInsightsR312} from "./noor-linked-activity-insights-r312.js";
import {statisticEligible,validStatisticDate,type StatisticRow} from "./progress-statistics.js";
import {parseNoorReminderPlanR314, type NoorReminderPlanR314} from "../../noor-personal/src/domain/reminder-plan-r314.js";

/**
 * In-app ONLY. No permissions, push, browser storage, timers, or outbound
 * delivery. The caller gives authoritative Today date + IANA account timezone.
 */
export type NoorReminderDefinitionR314=Readonly<{
  id:string; title:string; state:string; reminderPlan?:NoorReminderPlanR314;
}>;
export type NoorReminderAlertR314=Readonly<{
  definitionId:string; title:string; time:string;
  kind:"due"|"streak-risk"|"overdue";
  streak:number;
}>;
const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3,5));
export function noorLocalClockR314(nowMs:number,zone:string):Readonly<{date:string;minute:number}>|null {
  if(!Number.isFinite(nowMs))return null;
  try{
    const parts=new Intl.DateTimeFormat("en-GB-u-nu-latn",{
      timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
    }).formatToParts(new Date(nowMs));
    const get=(x:string)=>parts.find(p=>p.type===x)?.value??"";
    const date=`${get("year")}-${get("month")}-${get("day")}`;
    const minute=Number(get("hour"))*60+Number(get("minute"));
    return validStatisticDate(date)&&Number.isInteger(minute)&&minute>=0&&minute<1440?{date,minute}:null;
  }catch{return null;}
}
function isQuiet(now:number,start:string|null,end:string|null):boolean {
  if(start===null||end===null||start===end)return false;
  const s=minutes(start),e=minutes(end);
  return s<e?now>=s&&now<e:now>=s||now<e;
}
export function noorDueRemindersR314(
  rows:readonly StatisticRow[],
  definitions:readonly NoorReminderDefinitionR314[],
  todayDate:string|null, nowMs:number, accountTimeZone:string,
):readonly NoorReminderAlertR314[] {
  const local=noorLocalClockR314(nowMs,accountTimeZone);
  if(!local||!validStatisticDate(todayDate)||local.date!==todayDate)return [];
  const insights=new Map(noorLinkedActivityInsightsR312(rows,todayDate).map(x=>[x.definitionId,x]));
  return definitions.flatMap(def=>{
    const plan=parseNoorReminderPlanR314(def.reminderPlan);
    if(!plan?.enabled||def.state!=="Active"||isQuiet(local.minute,plan.quietStart,plan.quietEnd))return [];
    const insight=insights.get(def.id);
    if(!insight?.todayDue||insight.todayComplete)return [];
    const due=minutes(plan.time);
    // At midnight do not backdate prior-day reminders.
    const opening=Math.max(0,due-plan.leadMinutes);
    if(local.minute<opening)return [];
    const todayRows=rows.filter(r=>r.date===todayDate&&r.definitionId===def.id&&statisticEligible(r));
    if(!todayRows.length||todayRows.every(r=>r.status==="Completed"||r.credit===1))return [];
    const kind:NoorReminderAlertR314["kind"]=local.minute>=due+plan.graceMinutes
      ?"overdue":insight.current>=plan.minStreak&&plan.minStreak>0?"streak-risk":"due";
    return [{definitionId:def.id,title:def.title,time:plan.time,kind,streak:insight.current}];
  }).sort((a,b)=>({overdue:0,"streak-risk":1,due:2})[a.kind]-({overdue:0,"streak-risk":1,due:2})[b.kind]
     ||a.time.localeCompare(b.time)||a.title.localeCompare(b.title,"ar"));
}
