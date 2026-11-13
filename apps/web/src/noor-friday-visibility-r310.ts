import {r232LocalWeekday} from "./noor-islamic-daylight-r232.js";

/** R310: Thursday's reminder is activated by the authenticated, current-day
 * Asr time. Friday timers are computed separately using Friday prayer data.
 * Do not infer tomorrow's prayer times from Thursday's schedule.
 */
export type NoorFridayPresentationR310="hidden"|"thursday-reminder"|"friday";
type Prayer=Readonly<{key:string;at:string}>;
const civilDate=(ms:number,timeZone:string):string=>new Intl.DateTimeFormat("en-CA",{
 year:"numeric",month:"2-digit",day:"2-digit",timeZone,
}).format(new Date(ms));
export function noorFridayPresentationR310(nowMs:number,timeZone:string,prayers:readonly Prayer[]):NoorFridayPresentationR310{
 if(!Number.isFinite(nowMs))return "hidden";
 const weekday=r232LocalWeekday(nowMs,timeZone);
 if(weekday===5)return "friday";
 if(weekday!==4)return "hidden";
 const asrAt=prayers.find(p=>p.key==="asr")?.at;
 if(!asrAt)return "hidden";
 const asrMs=Date.parse(asrAt);
 if(!Number.isFinite(asrMs)||asrMs>nowMs||r232LocalWeekday(asrMs,timeZone)!==4)return "hidden";
 // A previous Thursday's cached prayer time must never unlock this week.
 return civilDate(nowMs,timeZone)===civilDate(asrMs,timeZone)?"thursday-reminder":"hidden";
}
