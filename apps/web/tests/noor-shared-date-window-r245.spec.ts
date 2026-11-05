import assert from "node:assert/strict";
import test from "node:test";
import {noorSharedCivilDateWindow} from "../src/noor-shared-date-window-r245.js";
test("R245 Riyadh to Cairo after Riyadh midnight proposes first shared civil minute",()=>{
 const now=Date.parse("2026-11-05T21:30:00.000Z");
 assert.deepEqual(noorSharedCivilDateWindow("Asia/Riyadh","Africa/Cairo",now),{
   datesDiffer:true,nextAtMs:Date.parse("2026-11-05T22:00:00.000Z"),
 });
});
test("R245 already aligned IANA civil days need no speculative delay",()=>{
 const now=Date.parse("2026-11-05T22:30:00.000Z");
 assert.deepEqual(noorSharedCivilDateWindow("Asia/Riyadh","Africa/Cairo",now),{
   datesDiffer:false,nextAtMs:now,
 });
});
test("R245 returns null when date cannot align across UTC+14 and UTC-12",()=>{
 const x=noorSharedCivilDateWindow("Pacific/Kiritimati","Etc/GMT+12",Date.parse("2026-11-05T12:00:00Z"));
 assert.deepEqual(x,{datesDiffer:true,nextAtMs:null});
});
test("R245 DST does not use fixed 24-hour offsets",()=>{
 const now=Date.parse("2026-10-25T23:30:00.000Z");
 const x=noorSharedCivilDateWindow("Europe/London","Europe/Paris",now);
 assert.deepEqual(x,{datesDiffer:true,nextAtMs:Date.parse("2026-10-26T00:00:00.000Z")});
});
test("R245 invalid or non-finite inputs never fabricate an alignment",()=>{
 assert.deepEqual(noorSharedCivilDateWindow("Mars/Olympus_Mons","Asia/Riyadh",0),{datesDiffer:false,nextAtMs:null});
 assert.deepEqual(noorSharedCivilDateWindow("Asia/Riyadh","Africa/Cairo",Number.NaN),{datesDiffer:false,nextAtMs:null});
});
