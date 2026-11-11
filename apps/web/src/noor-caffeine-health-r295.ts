/** R295 caffeine advisory: owner-defined count/time thresholds, NOT a medical risk assessment.
 * Uses the existing owner's append-only beverage activity log. Corrections undo the
 * most recent serving without altering audit timestamps or past data. */
export type CaffeineKindR295="coffee"|"tea"|"other";
export type DrinkEventR295=Readonly<{id:string;executionId:string;at:string;amount:number;beverageTime?:string}>;
export type DrinkRowR295=Readonly<{id:string;title:string;executionId:string;
 plan:Readonly<{targetServings:number;kind?:CaffeineKindR295;sleepTime?:string}>;
 log:readonly DrinkEventR295[]}>;
export const DEFAULT_SLEEP_R295="00:00";
export function validClockR295(v:unknown):v is string{
 return typeof v==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}
export function kindForDrinkR295(row:DrinkRowR295):CaffeineKindR295{
 if(row.plan.kind)return row.plan.kind;
 const name=row.title.trim().toLocaleLowerCase("ar");
 if(/قهو|إسبريسو|اسبريسو|لاتيه|كابتشينو|coffee|espresso|latte|cappuccino/.test(name))return "coffee";
 if(/شاي|ماتشا|كرك|tea|matcha/.test(name))return "tea";
 return "other";
}
export function localClockR295(instant:string,timeZone:string):string|null{
 const n=Date.parse(instant);if(!Number.isFinite(n))return null;
 try{
  const parts=new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn",{
   timeZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(new Date(n));
  const hour=parts.find(p=>p.type==="hour")?.value,minute=parts.find(p=>p.type==="minute")?.value;
  return validClockR295(`${hour}:${minute}`)?`${hour}:${minute}`:null;
 }catch{return null;}
}
export function activeServingsR295(log:readonly DrinkEventR295[],executionId:string,timeZone:string){
 const cups:Array<Readonly<{id:string;time:string|null;recordedAt:string}>>=[];
 for(const e of log){
  if(e.executionId!==executionId||!Number.isSafeInteger(e.amount))continue;
  if(e.amount>0){
   const time=validClockR295(e.beverageTime)?e.beverageTime:localClockR295(e.at,timeZone);
   for(let i=0;i<Math.min(e.amount,60);i++)cups.push({id:e.id,time,recordedAt:e.at});
  }else if(e.amount<0){
   for(let i=0;i<Math.min(-e.amount,60);i++)cups.pop();
  }
 }
 return cups;
}
/** Difference to the next ordinary bedtime in a 24-hour clock; defaults are
 * owner-facing heuristics, not estimates of actual caffeine dose. */
export function hoursBeforeSleepR295(drink:string,bed:string):number|null{
 if(!validClockR295(drink)||!validClockR295(bed))return null;
 const toMinutes=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3));
 return ((toMinutes(bed)-toMinutes(drink)+1440)%1440)/60;
}
export function classifyCaffeineR295(rows:readonly DrinkRowR295[],timeZone:string,sleepTime?:string){
 const bedtime=validClockR295(sleepTime)?sleepTime:DEFAULT_SLEEP_R295;
 let coffee=0,tea=0,other=0,closest=Number.POSITIVE_INFINITY;
 const recent:Array<Readonly<{kind:CaffeineKindR295;title:string;time:string|null;id:string}>>=[];
 for(const row of rows){
  const kind=kindForDrinkR295(row),events=activeServingsR295(row.log,row.executionId,timeZone);
  if(kind==="coffee")coffee+=events.length;else if(kind==="tea")tea+=events.length;else other+=events.length;
  for(const e of events){
   recent.push({kind,title:row.title,time:e.time,id:e.id});
   if(kind!=="other"&&e.time!==null){
    const delay=hoursBeforeSleepR295(e.time,bedtime);
    if(delay!==null)closest=Math.min(closest,delay);
   }
  }
 }
 const total=coffee+tea,threshold=coffee>=4||tea>=4?"red":coffee===3||tea===3?"yellow":"green";
 const timing=closest<4?"red":closest<=6?"yellow":"green";
 const level=threshold==="red"||timing==="red"?"red":threshold==="yellow"||timing==="yellow"?"yellow":"green";
 const reason=level==="red"
  ?closest<4?"سُجل مشروب منبّه قبل موعد النوم بأقل من 4 ساعات.":"تجاوز عدد القهوة أو الشاي 3 أكواب اليوم."
  :level==="yellow"
  ?closest<=6?"هناك مشروب منبّه قبل النوم بنحو 4–6 ساعات.":"وصل عدد القهوة أو الشاي إلى 3 أكواب."
  :"لا توجد تنبيهات حسب قواعد العدد وموعد النوم المختارين.";
 return {coffee,tea,other,total,level,reason,bedtime,recent:recent.slice(-8).reverse()};
}
