/** R288: Explicit, opt-in calendar spreading for existing task-session drafts.
 * No session is stored until the owner saves the parent task, and the trusted
 * domain still validates every scheduled date against the parent recurrence. */
export type SessionCadenceR288 = "daily" | "weekly" | "monthly";
export interface ParentSessionScheduleR288 {
  kind:"OneTime" | "Daily" | "Weekdays";
  startDate:string;
  endDate:string|null;
  weekdays:readonly number[];
}
export interface SessionCalendarOptionsR288 {
  firstDate:string;
  days:number;
  cadence:SessionCadenceR288;
  parent:ParentSessionScheduleR288;
}
const DAY_MS=86_400_000;
const validDate=(date:string):boolean=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const at=Date.parse(date+"T00:00:00.000Z");
  return Number.isFinite(at)&&new Date(at).toISOString().slice(0,10)===date;
};
const asDate=(ms:number):string=>new Date(ms).toISOString().slice(0,10);
const addDays=(date:string,n:number):string=>asDate(Date.parse(date+"T00:00:00.000Z")+n*DAY_MS);
function addMonthsClamped(date:string,months:number):string{
  const [y,m,d]=date.split("-").map(Number) as [number,number,number];
  // Anchor to the original day of month; February must not shift March dates.
  const monthIndex=y*12+m-1+months;
  const targetYear=Math.floor(monthIndex/12),targetMonth=monthIndex%12;
  if(targetYear>9999)throw Error("SESSION_CALENDAR_OUTSIDE_RANGE");
  const last=new Date(Date.UTC(targetYear,targetMonth+1,0)).getUTCDate();
  return String(targetYear).padStart(4,"0")+"-"+String(targetMonth+1).padStart(2,"0")+"-"+String(Math.min(d,last)).padStart(2,"0");
}
function eligible(date:string,parent:ParentSessionScheduleR288):boolean{
  if(date<parent.startDate||(parent.endDate!==null&&date>parent.endDate))return false;
  if(parent.kind==="OneTime")return date===parent.startDate;
  return parent.kind==="Daily"||parent.weekdays.includes(new Date(date+"T00:00:00.000Z").getUTCDay());
}
/** Distribute sessions across N distinct eligible calendar days; multiple sessions
 * can share a day. Existing IDs, page ranges, targets and notes are unchanged. */
export function spreadTaskSessionsR288<T extends {readonly scheduledDate?:string|null}>(
  sessions:readonly T[],options:SessionCalendarOptionsR288,
):T[]{
  const {firstDate,days,cadence,parent}=options;
  if(!sessions.length||sessions.length>200||!Number.isInteger(days)||days<1||days>sessions.length)
    throw Error("SESSION_CALENDAR_DAYS_INVALID");
  if(!validDate(firstDate)||!validDate(parent.startDate)||parent.endDate!==null&&!validDate(parent.endDate))
    throw Error("SESSION_CALENDAR_INVALID_DATE");
  if(firstDate<parent.startDate||(parent.endDate!==null&&firstDate>parent.endDate))
    throw Error("SESSION_CALENDAR_OUTSIDE_RANGE");
  if(!["daily","weekly","monthly"].includes(cadence))
    throw Error("SESSION_CALENDAR_INVALID_CADENCE");
  if(parent.kind==="OneTime"&&days!==1)
    throw Error("SESSION_CALENDAR_PARENT_MISMATCH");
  const dates:string[]=[];
  let cursor=firstDate;
  for(let i=0;i<days;i++){
    let date:string;
    if(cadence==="daily"){
      // Exclude weekdays on which the parent task itself is not due.
      while(!eligible(cursor,parent)){
        if(parent.endDate!==null&&cursor>parent.endDate)throw Error("SESSION_CALENDAR_OUTSIDE_RANGE");
        if(cursor>="9999-12-31")throw Error("SESSION_CALENDAR_OUTSIDE_RANGE");
        cursor=addDays(cursor,1);
      }
      date=cursor;
      if(i<days-1)cursor=addDays(cursor,1);
    }else{
      date=cadence==="weekly"?addDays(firstDate,i*7):addMonthsClamped(firstDate,i);
      if(!validDate(date)||!eligible(date,parent))throw Error("SESSION_CALENDAR_PARENT_MISMATCH");
    }
    if(!eligible(date,parent))throw Error("SESSION_CALENDAR_PARENT_MISMATCH");
    dates.push(date);
  }
  return sessions.map((session,i)=>({...session,scheduledDate:dates[Math.floor(i*days/sessions.length)]!}));
}


/** R298: Calendar-day allocation for a selected set of weekdays.
 * For a bounded interval, distribute sessions across the whole eligible range;
 * without an end date, use successive eligible days from the starting date.
 * Pure proposal only: saving remains an explicit owner-authenticated action.
 */
export interface WeeklySessionCalendarR298 {
  firstDate:string;
  endDate:string|null;
  sessionCount:number;
  weekdays:readonly number[];
  parent:ParentSessionScheduleR288;
}
export function weeklyTaskSessionDatesR298(options:WeeklySessionCalendarR298):string[]{
  const {firstDate,endDate,sessionCount,weekdays,parent}=options;
  if(!Number.isInteger(sessionCount)||sessionCount<1||sessionCount>200)
    throw Error("SESSION_CALENDAR_COUNT_INVALID");
  if(!Array.isArray(weekdays)||!weekdays.length||new Set(weekdays).size!==weekdays.length||
     weekdays.some(day=>!Number.isInteger(day)||day<0||day>6))
    throw Error("SESSION_CALENDAR_WEEKDAYS_INVALID");
  if(!validDate(firstDate)||!validDate(parent.startDate)||
     endDate!==null&&!validDate(endDate)||
     parent.endDate!==null&&!validDate(parent.endDate))
    throw Error("SESSION_CALENDAR_INVALID_DATE");
  if(firstDate<parent.startDate||(endDate!==null&&endDate<firstDate)||
     parent.endDate!==null&&(firstDate>parent.endDate||endDate!==null&&endDate>parent.endDate))
    throw Error("SESSION_CALENDAR_OUTSIDE_RANGE");
  if(parent.kind==="OneTime"&&sessionCount!==1)
    throw Error("SESSION_CALENDAR_PARENT_MISMATCH");
  if(parent.kind==="Weekdays"&&weekdays.some(day=>!parent.weekdays.includes(day)))
    throw Error("SESSION_CALENDAR_PARENT_MISMATCH");
  const last=endDate??parent.endDate;
  const startMs=Date.parse(firstDate+"T00:00:00.000Z");
  const maxMs=Date.parse("9999-12-31T00:00:00.000Z");
  const stopMs=last===null?maxMs:Date.parse(last+"T00:00:00.000Z");
  const eligibleDates:string[]=[];
  let reachedEnd=false;
  for(let offset=0;offset<15000;offset++){
    const ms=startMs+offset*DAY_MS;
    if(ms>stopMs){reachedEnd=true;break;}
    const weekday=new Date(ms).getUTCDay();
    const date=asDate(ms);
    if(weekdays.includes(weekday)&&eligible(date,parent)){
      eligibleDates.push(date);
      if(last===null&&eligibleDates.length===sessionCount)break;
    }
  }
  if(last!==null&&!reachedEnd && (startMs+15000*DAY_MS)<=stopMs)
    throw Error("SESSION_CALENDAR_SPAN_TOO_LONG");
  if(eligibleDates.length<sessionCount)
    throw Error("SESSION_CALENDAR_INSUFFICIENT_DAYS");
  if(last===null||sessionCount===1)return eligibleDates.slice(0,sessionCount);
  // Including both ends makes short plans and long, bounded projects predictable.
  return Array.from({length:sessionCount},(_,i)=>
    eligibleDates[Math.round(i*(eligibleDates.length-1)/(sessionCount-1))]!);
}
