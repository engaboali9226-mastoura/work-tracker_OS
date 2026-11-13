/**
 * R314: owner-scoped, definition-bound reminders.
 * Persisted with the definition through its existing owner-scoped revision/CAS
 * transaction. There is intentionally NO browser storage or push subscription.
 */
export type NoorReminderPlanR314 = Readonly<{
  enabled:boolean;
  time:string; // local HH:MM in authoritative account IANA timezone
  leadMinutes:0|5|15|30|60|120;
  graceMinutes:0|15|30|60|120;
  minStreak:number; // 0..365 scheduled completions for streak-risk emphasis
  quietStart:string|null;
  quietEnd:string|null;
}>;

export const NOOR_REMINDER_DEFAULT_R314:NoorReminderPlanR314 = Object.freeze({
  enabled:false,time:"19:00",leadMinutes:0,graceMinutes:30,
  minStreak:1,quietStart:"22:00",quietEnd:"06:00",
});

const record=(x:unknown):x is Record<string,unknown> =>
  typeof x==="object"&&x!==null&&!Array.isArray(x);
const hhmm=(x:unknown):x is string=>typeof x==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/u.test(x);
export function parseNoorReminderPlanR314(value:unknown):NoorReminderPlanR314|null {
  if(!record(value))return null;
  const keys=Object.keys(value).sort();
  if(JSON.stringify(keys)!==JSON.stringify(["enabled","time","leadMinutes","graceMinutes","minStreak","quietStart","quietEnd"].sort()))return null;
  if(typeof value.enabled!=="boolean"||!hhmm(value.time)
    ||![0,5,15,30,60,120].includes(Number(value.leadMinutes))
    ||![0,15,30,60,120].includes(Number(value.graceMinutes))
    ||!Number.isInteger(value.minStreak)||Number(value.minStreak)<0||Number(value.minStreak)>365
    ||!((value.quietStart===null&&value.quietEnd===null)
       ||(hhmm(value.quietStart)&&hhmm(value.quietEnd))))return null;
  return Object.freeze({
    enabled:value.enabled,time:value.time,
    leadMinutes:value.leadMinutes as NoorReminderPlanR314["leadMinutes"],
    graceMinutes:value.graceMinutes as NoorReminderPlanR314["graceMinutes"],
    minStreak:value.minStreak as number,
    quietStart:value.quietStart as string|null,
    quietEnd:value.quietEnd as string|null,
  });
}
