import assert from "node:assert/strict";
import test from "node:test";
import {applyAccountLocationChange,AccountLocationChangeConflict,IntlTimeZoneAdapter,parsePersonalCommand} from "@noor/personal";

const now="2026-11-05T12:00:00.000Z";
const requestId="c70ad6d5-a90d-4e16-97ce-20539aecdb07";
const oldLocation={
 id:"location-old",userId:"owner-1",name:"الرياض، السعودية",
 latitude:24.71,longitude:46.67,timeZone:"Asia/Riyadh",effectiveFrom:"2026-10-01T00:00:00.000Z",
};
const policy={
 id:"policy-1",userId:"owner-1",calculationMethod:"UmmAlQura",
 fajrAdjustmentMinutes:0,personalDayOffsetMinutes:0,effectiveFrom:"2026-10-01T00:00:00.000Z",
};
const originalDay={
 id:"personal-day-1",userId:"owner-1",state:"Open",version:1,
 boundary:{
  key:"personal-day-civil:owner-1:2026-11-04T21:00:00.000Z",
  localDate:"2026-11-05",startAt:"2026-11-04T21:00:00.000Z",endAt:"2026-11-05T21:00:00.000Z",
  calculatedFajrAt:"2026-11-05T02:00:00.000Z",
  nextCalculatedFajrAt:"2026-11-06T02:00:00.000Z",
  fajrAdjustmentMinutes:0,personalDayOffsetMinutes:0,
  locationRevisionId:oldLocation.id,prayerPolicyRevisionId:policy.id,
  timeZone:"Asia/Riyadh",calculationMethod:"UmmAlQura",
  calculationSource:"fixture",calculationEngineVersion:"test",
 },createdAt:"2026-11-04T21:00:00.000Z",updatedAt:now,
} as const;
const pastDay={...originalDay,id:"past-day",state:"Closed",boundary:{
 ...originalDay.boundary,key:"previous",localDate:"2026-11-04",
 startAt:"2026-11-03T21:00:00.000Z",endAt:"2026-11-04T21:00:00.000Z",
}};
const context={
 id:"context-1",key:"old-context",personalDayId:originalDay.id,
 prayerTimes:{localDate:"2026-11-05",fajr:"2026-11-05T02:00:00Z",
 sunrise:"2026-11-05T03:20:00Z",dhuhr:"2026-11-05T09:00:00Z",
 asr:"2026-11-05T12:00:00Z",maghrib:"2026-11-05T15:00:00Z",
 isha:"2026-11-05T16:00:00Z",nextFajr:"2026-11-06T02:00:00Z",
 source:"fixture",engineVersion:"test"},
 hijriDate:{day:1,month:1,monthName:"Muharram",year:1448,source:"fixture",
 method:"UmmAlQura",adjustmentDays:0,calculatedAt:now},
 approvedHistoryEventIds:[],fastingWindowMinutes:780,ishaToNextFajrMinutes:600,
 version:1,createdAt:now,
};
const command=(timeZone="Africa/Cairo")=>({
 type:"set-account-location" as const,expectedRevisionId:oldLocation.id,requestId,
 city:{name:"القاهرة",country:"مصر",latitude:30.04443,longitude:31.23577,timeZone},
});
function fixtures(){
 let location={...oldLocation},day={...originalDay} as any,ctx={...context} as any;
 const historical=structuredClone(pastDay);
 const execution={id:"execution-1",status:"Completed",personalDayId:day.id,userId:"owner-1"};
 const events:any[]=[];let writes=0;
 const scope={
  locations:{async getEffective(userId:string){assert.equal(userId,"owner-1");return structuredClone(location);}},
  prayerPolicies:{async getEffective(userId:string){assert.equal(userId,"owner-1");return policy;}},
  snapshot:{listPersonalDays(userId:string){assert.equal(userId,"owner-1");return [structuredClone(historical),structuredClone(day)];}},
  transaction:{async runInTransaction(work:(tx:any)=>Promise<any>){
   return work({
    replaceLocationRevision:(userId:string,expected:string,next:typeof oldLocation)=>{
      assert.equal(userId,"owner-1");assert.equal(expected,location.id);
      location=structuredClone(next);
      writes++;
    },
    findOpenPersonalDayContaining:()=>day,
    findDailyIslamicContextByPersonalDayId:()=>ctx,
    savePersonalDay:(d:any)=>{assert.equal(d.id,day.id);day=structuredClone(d);},
    saveDailyIslamicContext:(c:any)=>{assert.equal(c.id,ctx.id);ctx=structuredClone(c);},
    findOutboxByIdempotencyKey:()=>null,
    saveOutbox:(e:any)=>{events.push(structuredClone(e));},
   });
  }},
 };
 const deps={
   userId:"owner-1",scope:scope as never,command:command(),
   clock:{now:()=>now},timeZone:new IntlTimeZoneAdapter(),
   prayerCalculator:{async calculate(_location:any,_policy:any,date:string){
    const at=(clock:string)=>`${date}T${clock}:00.000Z`;
    return {localDate:date,fajr:at("02:00"),sunrise:at("03:20"),
      dhuhr:at("09:00"),asr:at("12:00"),maghrib:at("15:00"),
      isha:at("16:00"),source:"test",engineVersion:"test"};
   }},
   hijriCalculator:{async calculate(){return context.hijriDate;}},
   historyCatalog:{async findApprovedForHijriDate(){return [];}},
 } as any;
 return {deps,location:()=>location,day:()=>day,ctx:()=>ctx,events,writes:()=>writes,historical,execution};
}
test("R241 accepts a verified city and rejects forged identity, invalid IANA and unsafe coordinates",()=>{
 const valid=parsePersonalCommand(command());assert.ok(valid);assert.equal(valid.type,"set-account-location");
 assert.equal(parsePersonalCommand({...command(),userId:"other"}),null);
 assert.equal(parsePersonalCommand(command("Mars/Olympus_Mons")),null);
 assert.equal(parsePersonalCommand({...command(),city:{...command().city,latitude:91}}),null);
 assert.equal(parsePersonalCommand({...command(),city:{...command().city,longitude:Number.NaN}}),null);
 assert.equal(parsePersonalCommand({...command(),requestId:"unsafe"}),null);
});
test("R241 preserves the current execution and all closed historical data during Cairo cutover",async()=>{
 const fx=fixtures();
 await applyAccountLocationChange(fx.deps);
 assert.equal(fx.writes(),1);
 assert.equal(fx.location().timeZone,"Africa/Cairo");
 assert.equal(fx.location().latitude,30.04);
 assert.equal(fx.location().longitude,31.24);
 assert.equal(fx.day().id,originalDay.id);
 assert.equal(fx.day().boundary.localDate,originalDay.boundary.localDate);
 assert.equal(fx.day().boundary.key,originalDay.boundary.key);
 assert.equal(fx.day().boundary.startAt,originalDay.boundary.startAt);
 assert.equal(fx.day().boundary.timeZone,"Africa/Cairo");
 assert.equal(fx.day().boundary.locationRevisionId,`location-revision:${requestId}`);
 assert.equal(fx.ctx().id,context.id);
 assert.equal(fx.ctx().prayerTimes.nextFajr,"2026-11-06T02:00:00.000Z");
 assert.equal(fx.execution.status,"Completed");
 assert.deepEqual(fx.historical,structuredClone(pastDay));
 assert.equal(fx.events.length,1);
 assert.deepEqual(Object.keys(fx.events[0]!.payload).sort(),[
  "newLocationRevisionId","newTimeZone","previousLocationRevisionId","previousTimeZone",
 ]);
 await applyAccountLocationChange(fx.deps);
 assert.equal(fx.writes(),1);
 assert.equal(fx.events.length,1);
});
test("R241 cross-civil-date jump is denied with zero writes or history mutation",async()=>{
 const fx=fixtures();fx.deps.command=command("Pacific/Auckland");
 await assert.rejects(()=>applyAccountLocationChange(fx.deps),AccountLocationChangeConflict);
 assert.equal(fx.writes(),0);assert.equal(fx.events.length,0);
 assert.equal(fx.day().boundary.timeZone,"Asia/Riyadh");
});
test("R241 optimistic concurrency denies stale revision without state changes",async()=>{
 const fx=fixtures();fx.deps.command={...command(),expectedRevisionId:"stale"};
 await assert.rejects(()=>applyAccountLocationChange(fx.deps),AccountLocationChangeConflict);
 assert.equal(fx.writes(),0);
});
