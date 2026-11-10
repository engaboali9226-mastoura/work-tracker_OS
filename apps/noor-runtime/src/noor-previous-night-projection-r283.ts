/** R283 — previous Islamic night projection for the short interval after CIVIL midnight
 * and before today's Fajr. No localStorage, approximated UTC subtraction, or new
 * persisted record. Every instant is derived from server-authorized versions.
 */
import type {
 TodayDashboard,LocationProfileRepository,PrayerTimePolicyRepository,
 TimeZonePort,PrayerTimeCalculatorPort,
} from "@noor/personal";

export type NoorPreviousNightR283=Readonly<{maghribAt:string;ishaAt:string;fajrAt:string}>;

export async function resolveNoorPreviousNightR283(input:Readonly<{
 userId:string;now:string;today:Pick<TodayDashboard,"personalDay"|"islamicContext">;
 locations:LocationProfileRepository;prayerPolicies:PrayerTimePolicyRepository;
 timeZone:TimeZonePort;prayerCalculator:PrayerTimeCalculatorPort;
}>):Promise<NoorPreviousNightR283|null>{
 try{
  const todayFajr=input.today.islamicContext.prayerTimes.fajr;
  const fajrMs=Date.parse(todayFajr),nowMs=Date.parse(input.now);
  const boundary=input.today.personalDay.boundary,startMs=Date.parse(boundary.startAt);
  if(![fajrMs,nowMs,startMs].every(Number.isFinite) ||
     nowMs<startMs||nowMs>=fajrMs||fajrMs-startMs>30*3600000)return null;
  const priorInstant=new Date(startMs-1).toISOString();
  const priorDate=input.timeZone.localDateForInstant(priorInstant,boundary.timeZone);
  const expectedPriorDate=input.timeZone.addLocalDays(boundary.localDate,-1);
  if(priorDate!==expectedPriorDate)return null;
  const [priorLocation,priorPolicy]=await Promise.all([
   input.locations.getEffective(input.userId,priorInstant),
   input.prayerPolicies.getEffective(input.userId,priorInstant),
  ]);
  // If the user switched city or prayer policy at midnight, do not silently
  // recalculate last night's prayer instants using today's settings.
  if(!priorLocation || !priorPolicy ||
    priorLocation.userId!==input.userId ||
    priorLocation.id!==boundary.locationRevisionId ||
    priorLocation.timeZone!==boundary.timeZone ||
    priorPolicy.id!==boundary.prayerPolicyRevisionId)return null;
  const previous=await input.prayerCalculator.calculate(priorLocation,priorPolicy,priorDate);
  const maghribMs=Date.parse(previous.maghrib),ishaMs=Date.parse(previous.isha);
  if(![maghribMs,ishaMs].every(Number.isFinite)||
    !(maghribMs<ishaMs&&ishaMs<fajrMs)||
    fajrMs-maghribMs>30*3600000 ||
    maghribMs>=startMs || ishaMs>=startMs)return null;
  return Object.freeze({maghribAt:previous.maghrib,ishaAt:previous.isha,fajrAt:todayFajr});
 }catch{
  // Stale or unavailable upstream prayer authority: omit this optional
  // projection without making authenticated tasks and journals unavailable.
  return null;
 }
}
