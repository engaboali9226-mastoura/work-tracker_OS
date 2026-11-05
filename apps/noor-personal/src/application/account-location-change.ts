import type {ClockPort,TimeZonePort,PrayerTimeCalculatorPort,HijriDateCalculatorPort,IslamicHistoryCatalogPort} from "../ports.js";
import type {PersonalFoundationOperation} from "./production-adapter-contracts.js";
import type {PersonalCommand} from "./personal-control.js";
import type {LocationProfileRevision} from "../domain/model.js";
import {differenceMinutes} from "../domain/model.js";
import {resolveCivilBoundary} from "../domain/time.js";

export class AccountLocationChangeConflict extends Error {
  constructor(message:string){super(message);this.name="AccountLocationChangeConflict";}
}
type ChangeCommand=Extract<PersonalCommand,{type:"set-account-location"}>;
type Dependencies=Readonly<{
  userId:string;command:ChangeCommand;scope:PersonalFoundationOperation;
  clock:ClockPort;timeZone:TimeZonePort;prayerCalculator:PrayerTimeCalculatorPort;
  hijriCalculator:HijriDateCalculatorPort;historyCatalog:IslamicHistoryCatalogPort;
}>;

/** R241: one-owner guarded cutover of the OPEN civil day.
 * The day id and all execution ids/statuses remain stable; closed days are untouched.
 * Cross-date moves fail closed pending a dedicated, non-duplicating rollover policy.
 */
export async function applyAccountLocationChange(d:Dependencies):Promise<void>{
  const {userId,command,scope}=d;
  const now=d.clock.now();
  if(!Number.isFinite(Date.parse(now)))throw new AccountLocationChangeConflict("INVALID_TRUSTED_INSTANT");
  const old=await scope.locations.getEffective(userId,now);
  if(!old)throw new AccountLocationChangeConflict("LOCATION_NOT_CONFIGURED");
  const locationId=`location-revision:${command.requestId}`;
  const newName=`${command.city.name}، ${command.city.country}`;
  const latitude=Math.round(command.city.latitude*100)/100;
  const longitude=Math.round(command.city.longitude*100)/100;
  // A retry of an acknowledged request must not create a second revision/day.
  if(old.id===locationId){
    if(old.userId===userId&&old.name===newName&&old.timeZone===command.city.timeZone
      &&old.latitude===latitude&&old.longitude===longitude)return;
    throw new AccountLocationChangeConflict("REQUEST_ID_REUSED");
  }
  if(old.id!==command.expectedRevisionId)throw new AccountLocationChangeConflict("STALE_LOCATION_REVISION");
  if(old.name===newName&&old.timeZone===command.city.timeZone
    &&old.latitude===latitude&&old.longitude===longitude)return;
  const policy=await scope.prayerPolicies.getEffective(userId,now);
  if(!policy)throw new AccountLocationChangeConflict("PRAYER_POLICY_REQUIRED");
  const current=scope.snapshot.listPersonalDays(userId);
  const open=current.filter(day=>day.state==="Open" &&day.boundary.startAt<=now&&now<day.boundary.endAt);
  if(open.length!==1 &&current.length>0)throw new AccountLocationChangeConflict("UNSAFE_DAY_STATE");
  const day=open[0]??null;
  if(day &&(day.userId!==userId||day.boundary.locationRevisionId!==old.id
    ||day.boundary.localDate!==d.timeZone.localDateForInstant(now,old.timeZone)))
    throw new AccountLocationChangeConflict("UNSAFE_OLD_DAY");
  if(day &&current.some(other=>other.id!==day.id&&other.boundary.localDate===
      d.timeZone.localDateForInstant(now,command.city.timeZone)))
    throw new AccountLocationChangeConflict("DUPLICATE_LOCAL_DATE");
  const next:LocationProfileRevision={
    id:locationId,userId,name:newName,latitude,longitude,
    timeZone:command.city.timeZone,effectiveFrom:now,
  };
  const resolved=await resolveCivilBoundary({
    userId,now,location:next,policy,timeZone:d.timeZone,
    prayerCalculator:d.prayerCalculator,
  });
  if(day && day.boundary.localDate!==resolved.boundary.localDate)
    throw new AccountLocationChangeConflict("DIFFERENT_CIVIL_DATE");
  const hijri=day?await d.hijriCalculator.calculate(resolved.boundary.localDate,next.timeZone,now):null;
  const approved=hijri?await d.historyCatalog.findApprovedForHijriDate(hijri):[];
  await scope.transaction.runInTransaction(tx=>{
    if(!tx.replaceLocationRevision)throw new AccountLocationChangeConflict("LOCATION_WRITE_UNAVAILABLE");
    const active=tx.findOpenPersonalDayContaining(userId,now);
    if(day &&(!active||active.id!==day.id||active.version!==day.version))
      throw new AccountLocationChangeConflict("DAY_VERSION_CHANGED");
    if(!day && active)throw new AccountLocationChangeConflict("DAY_ADDED_CONCURRENTLY");
    const context=day?tx.findDailyIslamicContextByPersonalDayId(day.id):null;
    if(day &&(!context||context.personalDayId!==day.id))
      throw new AccountLocationChangeConflict("DAY_CONTEXT_MISSING");
    tx.replaceLocationRevision(userId,old.id,next,now);
    if(day && context && hijri){
      // Retain original personal-day identity/key and start (historical
      // provenance); roll over on the new timezone's next civil midnight.
      // No completion, task, habit, or closed Personal Day is rewritten.
      tx.savePersonalDay({...day,boundary:{
        ...resolved.boundary,key:day.boundary.key,startAt:day.boundary.startAt,
      },version:day.version+1,updatedAt:now});
      tx.saveDailyIslamicContext({...context,
        key:`daily-islamic-context:${day.id}:${next.id}:${policy.id}`,
        prayerTimes:resolved.prayerTimes,hijriDate:hijri,
        approvedHistoryEventIds:approved.map(event=>event.id),
        fastingWindowMinutes:differenceMinutes(resolved.prayerTimes.fajr,resolved.prayerTimes.maghrib),
        ishaToNextFajrMinutes:differenceMinutes(resolved.prayerTimes.isha,resolved.prayerTimes.nextFajr),
        version:context.version+1,
      });
    }
    const eventId=`location-change:${command.requestId}`;
    if(!tx.findOutboxByIdempotencyKey(eventId)){
      tx.saveOutbox({
        id:eventId,idempotencyKey:eventId,eventType:"LocationProfileChanged",
        eventVersion:1,aggregateType:"LocationProfile",aggregateId:next.id,
        aggregateVersion:1,userId,...(day?{personalDayId:day.id}:{}),occurredAt:now,
        correlationId:eventId,privacyClassification:"PersonalOperationalData",
        payload:{previousLocationRevisionId:old.id,newLocationRevisionId:next.id,
          previousTimeZone:old.timeZone,newTimeZone:next.timeZone},
        deliveryState:"Pending",
      });
    }
  });
}
