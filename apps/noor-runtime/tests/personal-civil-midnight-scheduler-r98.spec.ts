import assert from "node:assert/strict";
import test from "node:test";
import {PersonalDailyMaterializationScheduler} from "../src/personal-daily-materialization-scheduler.js";

test("R98: scheduler does not accept yesterday's overlapping Fajr day after civil midnight",async()=>{
 let locationReads=0;
 const scheduler=new PersonalDailyMaterializationScheduler({
  clock:{now(){return "2026-10-31T21:00:00.000Z";}},
  idGenerator:{next(prefix:string){return `${prefix}-1`; }},
  foundation:{
   async listKnownUserIds(){return ["u"];},
   async openOperation(){return {
    locations:{async getEffective(){locationReads++;return null;}},
    prayerPolicies:{async getEffective(){return null;}},
    snapshot:{listPersonalDays(){return [{userId:"u",state:"Open",boundary:{localDate:"2026-10-31",timeZone:"Asia/Riyadh",startAt:"2026-10-31T02:00:00.000Z",endAt:"2026-11-01T02:00:00.000Z"}}];},listDailyExecutionForUser(){return [];},listDefinitions(){return [];}},
    transaction:{async runInTransaction(){throw new Error("not reached");}}
   } as never;}
  }
 });
 await scheduler.tick();
 assert.equal(locationReads,1);
});
