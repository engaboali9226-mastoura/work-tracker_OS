import test from "node:test";
import assert from "node:assert/strict";
import {workdayCountdownR268,clockRemainingR268} from "../src/noor-work-day-countdown-r268.js";
const slots=[
 {id:"science_sunday",day:0,period:3,subject:"علوم",group:"خامس ج",start:"08:30",end:"09:10"},
 {id:"math_sunday",day:0,period:4,subject:"رياضيات",group:"رابع ج",start:"09:15",end:"09:55"},
 {id:"science_monday",day:1,period:1,subject:"SCIENCE",group:"رابع ج",start:"07:00",end:"07:40"},
];

test("R268 clock observes Riyadh day boundaries and 06:30 start",()=>{
 assert.equal(workdayCountdownR268(new Date("2026-11-07T06:00:00Z"),slots).stage,"day_off");
 const before=workdayCountdownR268(new Date("2026-11-08T03:29:59Z"),slots);
 assert.equal(before.stage,"before_work");
 assert.equal(before.target,"00:00:01");
 const start=workdayCountdownR268(new Date("2026-11-08T03:30:00Z"),slots);
 assert.equal(start.stage,"next_lesson");
 assert.equal(start.target,"02:00:00");
 assert.match(start.description,/08:30/);
});

test("R268 countdown transitions automatically on lesson start and end",()=>{
 const start=workdayCountdownR268(new Date("2026-11-08T05:30:00Z"),slots);
 assert.equal(start.stage,"in_lesson");
 assert.equal(start.target,"00:40:00");
 assert.equal(start.slot?.subject,"علوم");
 const oneSecLeft=workdayCountdownR268(new Date("2026-11-08T06:09:59Z"),slots);
 assert.equal(oneSecLeft.target,"00:00:01");
 const breakTime=workdayCountdownR268(new Date("2026-11-08T06:10:00Z"),slots);
 assert.equal(breakTime.stage,"next_lesson");
 assert.equal(breakTime.target,"00:05:00");
 assert.equal(breakTime.slot?.period,4);
 const second=workdayCountdownR268(new Date("2026-11-08T06:15:00Z"),slots);
 assert.equal(second.stage,"in_lesson");
 assert.equal(second.target,"00:40:00");
});

test("R268 no class after last period: count down until 12:30, then finish",()=>{
 const remaining=workdayCountdownR268(new Date("2026-11-08T09:10:00Z"),slots);
 assert.equal(remaining.stage,"after_lessons");
 assert.equal(remaining.target,"00:20:00");
 const done=workdayCountdownR268(new Date("2026-11-08T09:30:00Z"),slots);
 assert.equal(done.stage,"finished");
 assert.equal(done.target,"00:00:00");
});

test("R268 uses exact imported SCIENCE/MATH subjects without translation",()=>{
 const monday=workdayCountdownR268(new Date("2026-11-09T04:05:00Z"),slots);
 assert.equal(monday.stage,"in_lesson");
 assert.equal(monday.slot?.subject,"SCIENCE");
 assert.match(monday.description,/SCIENCE/);
 assert.equal(monday.target,"00:35:00");
 assert.equal(clockRemainingR268(3675),"01:01:15");
});
