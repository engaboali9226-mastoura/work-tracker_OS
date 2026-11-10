/** NOOR R232 — pure, fail-closed civil/Islamic time windows.
 * All inputs are verified instants from the same prayer-time authority.
 * Do not silently infer tomorrow's Fajr from today's time.
 */
export type R232Prayer = Readonly<{key:string;at:string}>;
export type R232Window = Readonly<{startMs:number;endMs:number;durationMs:number}>;
export type R232FridayHour = R232Window & Readonly<{number:1|2|3|4|5}>;
export type R232DailyWindows = Readonly<{
  fastingDay:R232Window|null;
  islamicNight:R232Window|null;
  duha:R232Window|null;
}>;

const MINUTE=60000;
const MAX_DAY=30*60*MINUTE;
const MAX_NIGHT=30*60*MINUTE;
function time(p:readonly R232Prayer[],key:string):number{
  const raw=p.find(item=>item.key===key)?.at;
  return raw===undefined?NaN:Date.parse(raw);
}
function windowFrom(startMs:number,endMs:number,max=MAX_DAY):R232Window|null{
  if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||endMs<=startMs||
    endMs-startMs>max)return null;
  return Object.freeze({startMs,endMs,durationMs:endMs-startMs});
}
export function r232DailyWindows(prayers:readonly R232Prayer[],nextFajrAt?:string,
  sunriseOffsetMinutes=20,duhaBeforeDhuhrMinutes=10):R232DailyWindows{
  if(!Number.isSafeInteger(sunriseOffsetMinutes)||sunriseOffsetMinutes<15||
    sunriseOffsetMinutes>30||!Number.isSafeInteger(duhaBeforeDhuhrMinutes)||
    duhaBeforeDhuhrMinutes<5||duhaBeforeDhuhrMinutes>30)throw Error("R232_INVALID_DUHA_POLICY");
  const fajr=time(prayers,"fajr"),sunrise=time(prayers,"sunrise"),dhuhr=time(prayers,"dhuhr"),maghrib=time(prayers,"maghrib");
  const nextFajr=nextFajrAt?Date.parse(nextFajrAt):NaN;
  // Never publish misleading windows from a contradictory prayer snapshot.
  // Missing independent boundaries remain independently unavailable.
  const dayOrdered=!Number.isFinite(fajr)||!Number.isFinite(sunrise)||sunrise>fajr;
  const noonOrdered=!Number.isFinite(sunrise)||!Number.isFinite(dhuhr)||dhuhr>sunrise;
  const eveningOrdered=!Number.isFinite(dhuhr)||!Number.isFinite(maghrib)||maghrib>dhuhr;
  return Object.freeze({
    fastingDay:dayOrdered&&noonOrdered&&eveningOrdered?windowFrom(fajr,maghrib):null,
    islamicNight:eveningOrdered?windowFrom(maghrib,nextFajr,MAX_NIGHT):null,
    duha:dayOrdered&&noonOrdered&&eveningOrdered
      ?windowFrom(sunrise+sunriseOffsetMinutes*MINUTE,
        dhuhr-duhaBeforeDhuhrMinutes*MINUTE):null,
  });
}
export function r232LocalWeekday(nowMs:number,timeZone:string):number{
  const name=new Intl.DateTimeFormat("en-US",{weekday:"short",timeZone}).format(new Date(nowMs));
  const index=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(name);
  if(index<0)throw Error("R232_BAD_WEEKDAY");
  return index;
}
export function r232LocalClockMinutes(atMs:number,timeZone:string):number {
  const parts=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone}).formatToParts(new Date(atMs));
  const hour=Number(parts.find(p=>p.type==="hour")?.value),minute=Number(parts.find(p=>p.type==="minute")?.value);
  if(!Number.isInteger(hour)||!Number.isInteger(minute))throw Error("R232_BAD_CLOCK");
  return hour*60+minute;
}
export function r232ParseFridayClock(input:string):number|null {
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input))return null;
  const [hour,minute]=input.split(":").map(Number);
  return hour!*60+minute!;
}
export function r232FridayFiveHours(input:Readonly<{
  nowMs:number;timeZone:string;prayers:readonly R232Prayer[];
  fridayAdhanClock:string;sunriseOffsetMinutes?:number;
}>):readonly R232FridayHour[]|null {
  if(r232LocalWeekday(input.nowMs,input.timeZone)!==5)return null;
  const minute=r232ParseFridayClock(input.fridayAdhanClock);
  if(minute===null)return null;
  const sunrise=time(input.prayers,"sunrise"),dhuhr=time(input.prayers,"dhuhr");
  if(!Number.isFinite(sunrise)||!Number.isFinite(dhuhr))return null;
  const offset=input.sunriseOffsetMinutes??20;
  if(!Number.isSafeInteger(offset)||offset<15||offset>30)return null;
  // Anchor the local civil prayer date to the actual Dhuhr instant.
  // This permits a mosque Friday adhan before/after astronomical Dhuhr.
  const adhanMs=dhuhr+(minute-r232LocalClockMinutes(dhuhr,input.timeZone))*MINUTE;
  const startMs=sunrise+offset*MINUTE;
  const window=windowFrom(startMs,adhanMs,16*60*MINUTE);
  if(!window||window.durationMs<5*MINUTE||
    r232LocalWeekday(startMs,input.timeZone)!==5||
    r232LocalWeekday(adhanMs,input.timeZone)!==5)return null;
  const result: R232FridayHour[]=[];
  for(let k=0;k<5;k++){
    const a=Math.round(startMs+(window.durationMs*k)/5);
    const b=k===4?adhanMs:Math.round(startMs+(window.durationMs*(k+1))/5);
    result.push(Object.freeze({number:(k+1) as R232FridayHour["number"],
      startMs:a,endMs:b,durationMs:b-a}));
  }
  return Object.freeze(result);
}
/** R283: user-requested Friday rule: end the five Friday windows at the exact
 * authenticated Dhuhr instant of *this same civil Friday*. The old mosque-
 * clock helper is retained only for backward-compatibility with older callers.
 */
export function r283FridayHoursAtDhuhr(input:Readonly<{
 nowMs:number;timeZone:string;prayers:readonly R232Prayer[];
 sunriseOffsetMinutes?:number;
}>):readonly R232FridayHour[]|null {
 if(!Number.isFinite(input.nowMs)||r232LocalWeekday(input.nowMs,input.timeZone)!==5)return null;
 const sunrise=time(input.prayers,"sunrise"),dhuhr=time(input.prayers,"dhuhr");
 if(!Number.isFinite(sunrise)||!Number.isFinite(dhuhr))return null;
 const offset=input.sunriseOffsetMinutes??20;
 if(!Number.isSafeInteger(offset)||offset<15||offset>30)return null;
 const localDate=(ms:number)=>new Intl.DateTimeFormat("en-CA",{
   year:"numeric",month:"2-digit",day:"2-digit",timeZone:input.timeZone,
 }).format(new Date(ms));
 const fridayDate=localDate(input.nowMs);
 if(localDate(sunrise)!==fridayDate||localDate(dhuhr)!==fridayDate)return null;
 const startMs=sunrise+offset*MINUTE;
 const full=windowFrom(startMs,dhuhr,16*60*MINUTE);
 if(!full||full.durationMs<5*MINUTE)return null;
 const result:R232FridayHour[]=[];
 for(let k=0;k<5;k++){
  const a=Math.round(startMs+full.durationMs*k/5);
  const b=k===4?dhuhr:Math.round(startMs+full.durationMs*(k+1)/5);
  result.push(Object.freeze({number:(k+1) as R232FridayHour["number"],startMs:a,endMs:b,durationMs:b-a}));
 }
 return Object.freeze(result);
}

/** R283: authenticated previous-night endpoints returned by NOOR's Today service.
 * Never infer prior Maghrib from today's date or from a fixed 24-hour offset.
 */
export type R283PrecedingNight=Readonly<{maghribAt:string;ishaAt:string;fajrAt:string}>;
export function r283CarriedNightWindow(nowMs:number,prior:R283PrecedingNight|null|undefined):R232Window|null{
 if(!prior||!Number.isFinite(nowMs))return null;
 const start=Date.parse(prior.maghribAt),isha=Date.parse(prior.ishaAt),end=Date.parse(prior.fajrAt);
 if(![start,isha,end].every(Number.isFinite)||!(start<isha&&isha<end)||
  nowMs<start||nowMs>=end)return null;
 return windowFrom(start,end,MAX_NIGHT);
}

export function r232Countdown(window:R232Window,nowMs:number):Readonly<{
  phase:"upcoming"|"active"|"finished";
  remainingSeconds:number;elapsedSeconds:number;progress:number;
}>{
  if(!Number.isFinite(nowMs))throw Error("R232_INVALID_NOW");
  const phase=nowMs<window.startMs?"upcoming":nowMs>=window.endMs?"finished":"active";
  return Object.freeze({
    phase,
    remainingSeconds:Math.max(0,Math.ceil((window.endMs-Math.max(nowMs,window.startMs))/1000)),
    elapsedSeconds:Math.max(0,Math.floor((Math.min(nowMs,window.endMs)-window.startMs)/1000)),
    progress:Math.max(0,Math.min(100,100*(nowMs-window.startMs)/window.durationMs)),
  });
}

/** Ramadan by configured account timezone and Umm al-Qura civil date.
 * The reference instant is the fasting day's Fajr (not arbitrary UTC midnight).
 * Official announced start/end may differ by jurisdiction; label the basis.
 */
export function r232IsRamadan(atMs:number,timeZone:string):boolean{
 if(!Number.isFinite(atMs))return false;
 try{
  const parts=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura",{
    month:"numeric",year:"numeric",timeZone,
  }).formatToParts(new Date(atMs));
  const month=parts.find(p=>p.type==="month")?.value;
  return Number(month)===9;
 }catch{return false;}
}
export function r232FastingCountdownEnabled(input:Readonly<{
  fastingStartMs:number;timeZone:string;outsideRamadanEnabled:boolean;
}>):Readonly<{enabled:boolean;ramadan:boolean}>{
 const ramadan=r232IsRamadan(input.fastingStartMs,input.timeZone);
 return Object.freeze({ramadan,enabled:ramadan||input.outsideRamadanEnabled});
}
