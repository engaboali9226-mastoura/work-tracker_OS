import test from "node:test";
import assert from "node:assert/strict";
import {sundayOfR267,addCivilDaysR267,validCivilDateR267,schoolWeekNumberR267,
 schoolWeekTitleR267,riyadhDayR267,schoolClockR267} from "../src/noor-work-school-calendar-r267.js";

test("school week numbering starts on first configured academic Sunday, not Gregorian ISO weeks",()=>{
 const start="2026-08-23";
 assert.equal(sundayOfR267("2026-08-25"),start);
 assert.equal(addCivilDaysR267(start,7),"2026-08-30");
 assert.equal(schoolWeekNumberR267(start,start),1);
 assert.equal(schoolWeekNumberR267(start,"2026-08-30"),2);
 assert.equal(schoolWeekNumberR267(start,"2026-11-08"),12);
 assert.equal(schoolWeekNumberR267(start,"2026-08-16"),null);
 assert.equal(schoolWeekNumberR267(undefined,start),null);
 assert.equal(schoolWeekNumberR267("2026-08-24",start),null);
 assert.equal(schoolWeekTitleR267(1),"الأسبوع الأول");
 assert.equal(schoolWeekTitleR267(2),"الأسبوع الثاني");
 assert.match(schoolWeekTitleR267(null),/الأسبوع الدراسي/);
});
test("civil-day computation is bounded, canonical, and timezone-independent",()=>{
 assert.equal(validCivilDateR267("2026-02-29"),false);
 assert.equal(validCivilDateR267("2028-02-29"),true);
 assert.equal(addCivilDaysR267("2026-12-27",7),"2027-01-03");
 assert.equal(sundayOfR267("2026-11-07"),"2026-11-01");
 assert.throws(()=>addCivilDaysR267("2026-11-07",2001));
});
test("clock displays Riyadh date and includes Islamic calendar when available",()=>{
 const at=new Date("2026-11-07T22:30:00.000Z");
 assert.equal(riyadhDayR267(at),"2026-11-08");
 const clock=schoolClockR267(at);
 assert.ok(clock.time);
 assert.ok(clock.gregorian);
 assert.match(clock.gregorian,/2026/);
 assert.doesNotMatch(clock.time,/[٠-٩۰-۹]/u,"digital clock uses Western digits");
 assert.doesNotMatch(clock.gregorian,/[٠-٩۰-۹]/u,"Gregorian date uses Western digits");
 assert.doesNotMatch(clock.hijri,/[٠-٩۰-۹]/u,"Hijri date uses Western digits");
 assert.equal(schoolWeekTitleR267(26),"الأسبوع 26");

});
