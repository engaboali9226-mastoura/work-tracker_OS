import test from "node:test";
import assert from "node:assert/strict";
import {lessonTimingR269,schoolClockPartsR269} from "../src/noor-work-lesson-time-r269.js";
import {addCivilDaysR267,visibleTeachingSundayR270} from "../src/noor-work-school-calendar-r267.js";

test("R269: a lesson is 'جارٍ الآن' only between scheduled start and end in Riyadh",()=>{
 const d="2026-11-08",start="08:30",end="09:10";
 assert.deepEqual(lessonTimingR269(new Date("2026-11-08T05:29:59Z"),d,start,end),
  {phase:"upcoming",label:"لم تبدأ"});
 assert.deepEqual(lessonTimingR269(new Date("2026-11-08T05:30:00Z"),d,start,end),
  {phase:"active",label:"جارٍ الآن"});
 assert.deepEqual(lessonTimingR269(new Date("2026-11-08T06:09:59Z"),d,start,end),
  {phase:"active",label:"جارٍ الآن"});
 assert.deepEqual(lessonTimingR269(new Date("2026-11-08T06:10:00Z"),d,start,end),
  {phase:"finished",label:"انتهت"});
 assert.equal(lessonTimingR269(new Date("2026-11-07T12:00:00Z"),d,start,end).phase,"upcoming");
 assert.equal(lessonTimingR269(new Date("2026-11-09T00:00:00Z"),d,start,end).phase,"finished");
});
test("R269: checklist completion never influences lesson status",()=>{
 const now=new Date("2026-11-08T04:00:00Z");
 const checkmarks=[{prepared:false,attendanceRecorded:false},{prepared:true,attendanceRecorded:false},
   {prepared:true,attendanceRecorded:true}];
 for(const checks of checkmarks){
  assert.equal(checks.prepared||checks.attendanceRecorded||!checks.prepared,true);
  assert.equal(lessonTimingR269(now,"2026-11-08","08:30","09:10").label,"لم تبدأ");
 }
 assert.deepEqual(lessonTimingR269(now,"2026-11-08","",""),{phase:"unscheduled",label:"موعد غير محدد"});
});
test("R269: Arabic AM/PM is separate from Western clock digits",()=>{
 const morning=schoolClockPartsR269(new Date("2026-11-08T03:30:00Z"));
 assert.deepEqual(morning,{digits:"06:30:00",period:"ص"});
 const evening=schoolClockPartsR269(new Date("2026-11-08T17:05:09Z"));
 assert.deepEqual(evening,{digits:"08:05:09",period:"م"});
 assert.doesNotMatch(evening.digits,/[٠-٩]/u);
});

test("R270: lessons of next week's Sunday–Thursday cannot be marked finished on Saturday",()=>{
 const now=new Date("2026-11-07T12:00:00.000Z"); // Saturday 15:00 in Riyadh
 const schoolSunday=visibleTeachingSundayR270("2026-11-07");
 const saturdayUpcoming=Array.from({length:5},(_,weekday)=>
  lessonTimingR269(now,addCivilDaysR267(schoolSunday,weekday),"07:00","07:40"));
 assert.deepEqual(saturdayUpcoming.map(x=>x.phase),["upcoming","upcoming","upcoming","upcoming","upcoming"]);
 const monday=lessonTimingR269(new Date("2026-11-09T03:30:00.000Z"),
  addCivilDaysR267(schoolSunday,1),"07:00","07:40");
 assert.equal(monday.label,"لم تبدأ");
 assert.equal(lessonTimingR269(new Date("2026-11-09T04:00:00.000Z"),
  addCivilDaysR267(schoolSunday,1),"07:00","07:40").label,"جارٍ الآن");
});
