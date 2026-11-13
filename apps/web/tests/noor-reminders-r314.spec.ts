import assert from "node:assert/strict";
import test from "node:test";
import {noorDueRemindersR314,noorLocalClockR314} from "../src/noor-reminders-r314.js";
import {parseNoorReminderPlanR314,NOOR_REMINDER_DEFAULT_R314} from "../../noor-personal/src/domain/reminder-plan-r314.js";
import type {StatisticRow} from "../src/progress-statistics.js";
const plan={...NOOR_REMINDER_DEFAULT_R314,enabled:true,time:"09:00",quietStart:"22:00",quietEnd:"06:00"};
const definition=(id="habit",extras:Record<string,unknown>={})=>({id,title:"قراءة يومية",state:"Active",reminderPlan:plan,...extras});
const row=(date:string,status:string,extras:Partial<StatisticRow>={}):StatisticRow=>({
 id:"x"+date,definitionId:"habit",title:"قراءة يومية",kind:"Habit",date,
 weight:2,status,amount:0,unit:"",...extras,
});
const ms=(time:string)=>Date.parse(time);
test("strict reminder plans reject untrusted properties, invalid local times and partial quiet hours",()=>{
 assert.ok(parseNoorReminderPlanR314(plan));
 assert.equal(parseNoorReminderPlanR314({...plan,evil:true}),null);
 assert.equal(parseNoorReminderPlanR314({...plan,time:"25:99"}),null);
 assert.equal(parseNoorReminderPlanR314({...plan,minStreak:-1}),null);
 assert.equal(parseNoorReminderPlanR314({...plan,quietEnd:null}),null);
 assert.equal(parseNoorReminderPlanR314(null),null);
});
test("only today's scheduled pending occurrence can alert, no old or future rows",()=>{
 const rows=[row("2026-11-10","Completed"),row("2026-11-13","Pending"),row("2026-11-14","Completed")];
 assert.equal(noorDueRemindersR314(rows,[definition()],"2026-11-13",ms("2026-11-13T07:00:00Z"),"Asia/Riyadh").length,1);
 assert.deepEqual(noorDueRemindersR314(rows,[definition()],"2026-11-14",ms("2026-11-13T07:00:00Z"),"Asia/Riyadh"),[]);
 assert.deepEqual(noorDueRemindersR314(rows,[definition()],"2026-11-13",ms("2026-11-13T05:00:00Z"),"Asia/Riyadh"),[]);
});
test("owner quiet hours, completion and paused definitions suppress reminders",()=>{
 const rows=[row("2026-11-13","Pending")];
 const at=ms("2026-11-13T21:30:00Z");
 assert.deepEqual(noorDueRemindersR314(rows,[definition()],"2026-11-14",at,"Asia/Riyadh"),[]);
 assert.deepEqual(noorDueRemindersR314([row("2026-11-13","Completed")],[definition()],"2026-11-13",ms("2026-11-13T08:00:00Z"),"Asia/Riyadh"),[]);
 assert.deepEqual(noorDueRemindersR314(rows,[definition("habit",{state:"Paused"})],"2026-11-13",ms("2026-11-13T08:00:00Z"),"Asia/Riyadh"),[]);
 assert.deepEqual(noorDueRemindersR314(rows,[definition("habit",{reminderPlan:{...plan,enabled:false}})],"2026-11-13",ms("2026-11-13T08:00:00Z"),"Asia/Riyadh"),[]);
});
test("cross-zone local day is authoritative, DST zones use IANA not fixed offsets",()=>{
 assert.deepEqual(noorLocalClockR314(ms("2026-11-13T08:30:00Z"),"Asia/Riyadh"),{date:"2026-11-13",minute:690});
 assert.deepEqual(noorLocalClockR314(ms("2026-11-13T08:30:00Z"),"Africa/Cairo"),{date:"2026-11-13",minute:630});
 assert.equal(noorLocalClockR314(ms("2026-03-29T00:30:00Z"),"Europe/London")?.minute,30);
 assert.equal(noorLocalClockR314(ms("2026-03-29T01:30:00Z"),"Europe/London")?.minute,150);
 assert.equal(noorLocalClockR314(ms("2026-11-13T08:30:00Z"),"Mars/Fake"),null);
});
test("streak risk vs overdue, partial task credit does not suppress",()=>{
 const rows=[row("2026-11-12","Completed"),row("2026-11-13","Pending",{kind:"Task",credit:0.4})];
 const defs=[definition()];
 assert.equal(noorDueRemindersR314(rows,defs,"2026-11-13",ms("2026-11-13T06:00:00Z"),"Asia/Riyadh")[0]?.kind,"streak-risk");
 assert.equal(noorDueRemindersR314(rows,defs,"2026-11-13",ms("2026-11-13T08:00:00Z"),"Asia/Riyadh")[0]?.kind,"overdue");
});
