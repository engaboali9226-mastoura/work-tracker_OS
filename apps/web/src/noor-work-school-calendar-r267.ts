// NOOR Work R267: school weeks are relative to the teacher's configured first
// academic Sunday. We never guess ministry calendar dates or count ISO weeks.
const DAY_MS=86_400_000;
export function validCivilDateR267(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const n=Date.parse(value+"T00:00:00.000Z");
 return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value;
}
export function addCivilDaysR267(iso:string,days:number):string{
 if(!validCivilDateR267(iso)||!Number.isSafeInteger(days)||Math.abs(days)>2000)throw Error("INVALID_SCHOOL_DATE");
 return new Date(Date.parse(iso+"T00:00:00.000Z")+days*DAY_MS).toISOString().slice(0,10);
}
export function sundayOfR267(iso:string):string{
 if(!validCivilDateR267(iso))throw Error("INVALID_SCHOOL_DATE");
 const day=new Date(iso+"T00:00:00.000Z").getUTCDay();
 return addCivilDaysR267(iso,-day);
}

// The teaching timetable runs Sunday–Thursday. On Friday and Saturday,
// show the upcoming Sunday by default, not a week whose lessons already ended.
// This only chooses the default displayed week; historical week navigation and
// the per-lesson true date/time remain unchanged.
export function visibleTeachingSundayR270(riyadhCivilDate:string):string{
 if(!validCivilDateR267(riyadhCivilDate))throw Error("INVALID_SCHOOL_DATE");
 const day=new Date(riyadhCivilDate+"T00:00:00.000Z").getUTCDay();
 const sunday=sundayOfR267(riyadhCivilDate);
 return day===5||day===6?addCivilDaysR267(sunday,7):sunday;
}
export function schoolWeekNumberR267(firstSunday:string|undefined,selectedSunday:string):number|null{
 if(!firstSunday)return null;
 if(!validCivilDateR267(firstSunday)||!validCivilDateR267(selectedSunday)||
   sundayOfR267(firstSunday)!==firstSunday||sundayOfR267(selectedSunday)!==selectedSunday)return null;
 const delta=(Date.parse(selectedSunday+"T00:00:00.000Z")-Date.parse(firstSunday+"T00:00:00.000Z"))/DAY_MS;
 const week=delta/7+1;
 return Number.isSafeInteger(week)&&week>=1?week:null;
}
const ordinals=["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر",
 "الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر","السادس عشر","السابع عشر",
 "الثامن عشر","التاسع عشر","العشرون"];
export function schoolWeekTitleR267(week:number|null):string{
 if(week===null)return "الأسبوع الدراسي —";
 return "الأسبوع "+(ordinals[week-1]??week.toLocaleString("ar-SA-u-nu-latn"));
}
export function riyadhDayR267(now:Date):string{
 const parts=new Intl.DateTimeFormat("en-GB-u-ca-gregory",{
  timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit",
 }).formatToParts(now);
 const get=(part:string)=>parts.find(p=>p.type===part)?.value??"";
 return get("year")+"-"+get("month")+"-"+get("day");
}
export function dayLabelR267(iso:string):string{
 const date=new Date(iso+"T12:00:00.000Z");
 return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{day:"numeric",month:"short",timeZone:"UTC"}).format(date);
}
export function schoolClockR267(now:Date):{time:string;gregorian:string;hijri:string}{
 const options={timeZone:"Asia/Riyadh"} as const;
 const time=new Intl.DateTimeFormat("ar-SA-u-nu-latn",{...options,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}).format(now);
 const gregorian=new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{...options,weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(now);
 let hijri="";
 try{hijri=new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn",{...options,day:"numeric",month:"long",year:"numeric"}).format(now);}
 catch{hijri="";} // Keep Gregorian calendar usable even if an older browser lacks this calendar.
 return {time,gregorian,hijri};
}
