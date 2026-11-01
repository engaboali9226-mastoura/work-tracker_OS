import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const buildDirectory=process.env.NOOR_PERSONAL_BUILD_DIR;
if(!buildDirectory)throw new Error("NOOR_PERSONAL_BUILD_DIR is required.");
const noor=await import(pathToFileURL(path.join(buildDirectory,"index.js")).href);
const {EnsureTodayService,InMemoryFoundationStore,InMemoryPrayerPolicyRepository,IntlTimeZoneAdapter,SequenceIdGenerator,resolveCivilBoundary}=noor;
const userId="user-r98";
class Clock { constructor(at){this.at=at;} now(){return this.at;} }
class Prayer {
  async calculate(_location,_policy,date){
    const at=(hour)=>`${date}T${hour}:00:00.000Z`;
    return {localDate:date,fajr:at("02"),sunrise:at("03"),dhuhr:at("09"),asr:at("12"),maghrib:at("15"),isha:at("17"),source:"r98-fixture",engineVersion:"1"};
  }
}
const location={id:"riyadh-r98",userId,name:"Riyadh",latitude:24.7,longitude:46.6,timeZone:"Asia/Riyadh",effectiveFrom:"2020-01-01T00:00:00.000Z"};
const policy={id:"policy-r98",userId,calculationMethod:"R98Fixture",fajrAdjustmentMinutes:5,personalDayOffsetMinutes:15,effectiveFrom:"2020-01-01T00:00:00.000Z"};
const def={id:"walk-r98",userId,kind:"Habit",revisionId:"walk-r1",title:"Walk",category:"Health",state:"Active",schedule:{kind:"Daily"},effectiveFromDate:"2026-01-01",importance:"Supporting",weight:10,gatePolicy:"NonBlocking",targets:{}};
const legacy={id:"legacy-day",userId,boundary:{key:"personal-day:legacy",localDate:"2026-10-31",startAt:"2026-10-31T02:15:00.000Z",endAt:"2026-11-01T02:15:00.000Z",calculatedFajrAt:"2026-10-31T02:05:00.000Z",nextCalculatedFajrAt:"2026-11-01T02:05:00.000Z",fajrAdjustmentMinutes:5,personalDayOffsetMinutes:15,locationRevisionId:location.id,prayerPolicyRevisionId:policy.id,timeZone:location.timeZone,calculationMethod:policy.calculationMethod,calculationSource:"r98-fixture",calculationEngineVersion:"1"},state:"Open",version:1,createdAt:"2026-10-31T02:15:00.000Z",updatedAt:"2026-10-31T02:15:00.000Z"};
const oldExecution={id:"legacy-execution",userId,personalDayId:legacy.id,definitionId:def.id,definitionRevisionId:def.revisionId,kind:"Habit",title:def.title,materializationKey:"legacy-r98-key",scheduleOccurrenceKey:"2026-10-31",status:"Completed",eligibility:{definitionRevisionId:def.revisionId,importance:def.importance,weight:def.weight,gatePolicy:def.gatePolicy,targets:{}},version:2,createdAt:"2026-10-31T03:00:00.000Z",updatedAt:"2026-10-31T05:00:00.000Z"};
function system(at,seed={}){
 const clock=new Clock(at),store=new InMemoryFoundationStore({locations:[location],prayerPolicies:[policy],definitions:[def],...seed});
 const service=new EnsureTodayService({clock,idGenerator:new SequenceIdGenerator(),timeZone:new IntlTimeZoneAdapter(),locations:store,prayerPolicies:new InMemoryPrayerPolicyRepository(store),prayerCalculator:new Prayer(),hijriCalculator:{async calculate(date,_zone,now){return {day:1,month:1,monthName:"Muharram",year:1448,source:"r98",method:"r98",adjustmentDays:0,calculatedAt:now};}},historyCatalog:{async findApprovedForHijriDate(){return [];}},transaction:store});
 return {clock,store,service};
}
test("R98: civil midnight in Riyadh rolls a new unchecked occurrence and preserves old completed history",async()=>{
 const s=system("2026-10-31T20:59:59.000Z",{personalDays:[legacy],dailyExecution:[oldExecution]});
 const before=await s.service.execute(userId);
 assert.equal(before.personalDay.id,legacy.id);
 assert.equal(before.habits[0].status,"Completed");
 s.clock.at="2026-10-31T21:00:00.000Z";
 const after=await s.service.execute(userId);
 assert.equal(after.personalDay.boundary.localDate,"2026-11-01");
 assert.equal(after.personalDay.boundary.startAt,"2026-10-31T21:00:00.000Z");
 assert.equal(after.personalDay.boundary.endAt,"2026-11-01T21:00:00.000Z");
 assert.equal(after.habits.length,1);
 assert.equal(after.habits[0].status,"Pending");
 assert.notEqual(after.habits[0].id,oldExecution.id);
 assert.equal(after.islamicContext.prayerTimes.fajr,"2026-11-01T02:05:00.000Z");
 const state=s.store.snapshot();
 assert.equal(state.personalDays.length,2);
 assert.equal(state.personalDays.filter(d=>d.state==="Open").length,1,"never persist overlapping open days");
 assert.equal(state.personalDays.find(d=>d.id===legacy.id).state,"Closed");
 assert.equal(state.dailyExecution.find(e=>e.id===oldExecution.id).status,"Completed");
 assert.equal(state.dailyExecution.length,2);
 await s.service.execute(userId);
 const repeated=s.store.snapshot();
 assert.equal(repeated.personalDays.length,2);
 assert.equal(repeated.dailyExecution.length,2);
});
test("R98: stale prior-day checkbox cannot be modified after midnight before EnsureToday",async()=>{
 const s=system("2026-10-31T21:00:00.000Z",{personalDays:[legacy],dailyExecution:[oldExecution]});
 const command=new noor.PersonalCommandService({clock:s.clock,idGenerator:new SequenceIdGenerator(),transaction:s.store});
 await assert.rejects(()=>command.execute(userId,{type:"set-execution-completed",executionId:oldExecution.id,completed:false}),e=>e.code==="CURRENT_PERSONAL_DAY_REQUIRED");
 assert.equal(s.store.snapshot().dailyExecution[0].status,"Completed");
});
test("R98: new installation before Fajr starts at civil midnight, not adjusted Fajr",async()=>{
 const s=system("2026-10-31T21:00:00.000Z");
 const today=await s.service.execute(userId);
 assert.equal(today.personalDay.boundary.localDate,"2026-11-01");
 assert.equal(today.personalDay.boundary.startAt,"2026-10-31T21:00:00.000Z");
 assert.equal(today.nextPrayer.name,"Fajr");
 assert.equal(today.habits[0].status,"Pending");
});
test("R98: IANA spring-forward DST creates a 23-hour civil day",async()=>{
 const today=await resolveCivilBoundary({userId,now:"2026-03-08T12:00:00.000Z",location:{...location,timeZone:"America/New_York"},policy,timeZone:new IntlTimeZoneAdapter(),prayerCalculator:new Prayer()});
 assert.equal(today.boundary.startAt,"2026-03-08T05:00:00.000Z");
 assert.equal(today.boundary.endAt,"2026-03-09T04:00:00.000Z");
});
test("R98: IANA fall-back DST creates a 25-hour civil day and preserves prayer adjustments",async()=>{
 const today=await resolveCivilBoundary({userId,now:"2026-11-01T12:00:00.000Z",location:{...location,timeZone:"America/New_York"},policy,timeZone:new IntlTimeZoneAdapter(),prayerCalculator:new Prayer()});
 assert.equal(today.boundary.startAt,"2026-11-01T04:00:00.000Z");
 assert.equal(today.boundary.endAt,"2026-11-02T05:00:00.000Z");
 assert.equal(today.prayerTimes.fajr,"2026-11-01T02:05:00.000Z");
});
