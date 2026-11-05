import assert from "node:assert/strict";
import test from "node:test";
import {r232DailyWindows,r232FridayFiveHours,r232FastingCountdownEnabled,r232IsRamadan,r232Countdown} from "../src/noor-islamic-daylight-r232.js";
const z="Asia/Riyadh";
const prayers=[
 {key:"fajr",at:"2026-11-06T02:30:00.000Z"},
 {key:"sunrise",at:"2026-11-06T03:50:00.000Z"},
 {key:"dhuhr",at:"2026-11-06T08:35:00.000Z"},
 {key:"maghrib",at:"2026-11-06T14:10:00.000Z"},
];
test("R232 fasting day uses Fajr-to-Maghrib and duha has safety margins",()=>{
 const w=r232DailyWindows(prayers,"2026-11-07T02:31:00.000Z");
 assert.equal(w.fastingDay?.startMs,Date.parse(prayers[0]!.at));
 assert.equal(w.fastingDay?.endMs,Date.parse(prayers[3]!.at));
 assert.equal(w.duha?.startMs,Date.parse(prayers[1]!.at)+20*60000);
 assert.equal(w.duha?.endMs,Date.parse(prayers[2]!.at)-10*60000);
 assert.equal(w.islamicNight?.endMs,Date.parse("2026-11-07T02:31:00.000Z"));
});
test("R232 fasting timer automatic in Ramadan, optional and off by default outside Ramadan",()=>{
 const rajab=Date.parse("2026-11-06T02:30:00.000Z");
 const ramadan=Date.parse("2026-03-01T02:30:00.000Z");
 assert.equal(r232IsRamadan(rajab,z),false);
 assert.equal(r232IsRamadan(ramadan,z),true);
 assert.deepEqual(r232FastingCountdownEnabled({fastingStartMs:rajab,timeZone:z,outsideRamadanEnabled:false}),{ramadan:false,enabled:false});
 assert.deepEqual(r232FastingCountdownEnabled({fastingStartMs:rajab,timeZone:z,outsideRamadanEnabled:true}),{ramadan:false,enabled:true});
 assert.deepEqual(r232FastingCountdownEnabled({fastingStartMs:ramadan,timeZone:z,outsideRamadanEnabled:false}),{ramadan:true,enabled:true});
});
test("R232 Friday five periods do not appear outside Friday",()=>{
 const hours=r232FridayFiveHours({nowMs:Date.parse("2026-11-06T07:00:00Z"),timeZone:z,prayers,fridayAdhanClock:"12:00"});
 assert.equal(hours?.length,5);
 for(let i=1;i<5;i++)assert.equal(hours?.[i]?.startMs,hours?.[i-1]?.endMs);
 assert.equal(r232FridayFiveHours({nowMs:Date.parse("2026-11-05T07:00:00Z"),timeZone:z,prayers,fridayAdhanClock:"12:00"}),null);
 assert.equal(r232FridayFiveHours({nowMs:Date.parse("2026-11-06T07:00:00Z"),timeZone:z,prayers,fridayAdhanClock:"bad"}),null);
});
test("R232 countdown never becomes negative",()=>{
 const w=r232DailyWindows(prayers)?.fastingDay;
 assert.ok(w);
 assert.equal(r232Countdown(w,w.endMs+1).remainingSeconds,0);
 assert.equal(r232Countdown(w,w.startMs-1).phase,"upcoming");
});
