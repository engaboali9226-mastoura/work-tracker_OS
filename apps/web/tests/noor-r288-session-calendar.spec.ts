import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {spreadTaskSessionsR288} from "../src/noor-session-calendar-r288.js";
import {TaskSessionPlannerR254} from "../src/noor-task-sessions-r254.js";

const daily={kind:"Daily" as const,startDate:"2026-11-11",endDate:null,weekdays:[]};
const drafts=Array.from({length:5},(_,i)=>({id:"session-"+i,target:10,scheduledDate:null as string|null,note:"preserved"}));
test("R288: share 5 independent sessions across 3 distinct daily dates without editing their quantities",()=>{
  const result=spreadTaskSessionsR288(drafts,{firstDate:"2026-11-11",days:3,cadence:"daily",parent:daily});
  assert.deepEqual(result.map(s=>s.scheduledDate),["2026-11-11","2026-11-11","2026-11-12","2026-11-12","2026-11-13"]);
  assert.equal(result[0]?.id,drafts[0]?.id);
  assert.equal(result[0]?.target,10);
  assert.equal(result[0]?.note,"preserved");
  assert.equal(drafts[0]?.scheduledDate,null,"calendar is a proposal, not an implicit write");
});
test("R288: daily dates skip parent task's ineligible weekdays",()=>{
  const result=spreadTaskSessionsR288(drafts.slice(0,3),{firstDate:"2026-11-15",days:3,cadence:"daily",
    parent:{kind:"Weekdays",startDate:"2026-11-15",endDate:null,weekdays:[1,3]}});
  assert.deepEqual(result.map(s=>s.scheduledDate),["2026-11-16","2026-11-18","2026-11-23"]);
});
test("R288: weekly uses the same weekday; monthly clamps to month end without drift",()=>{
  const weekly=spreadTaskSessionsR288(drafts.slice(0,3),{firstDate:"2026-11-16",days:3,cadence:"weekly",
    parent:{kind:"Weekdays",startDate:"2026-11-11",endDate:null,weekdays:[1]}});
  assert.deepEqual(weekly.map(s=>s.scheduledDate),["2026-11-16","2026-11-23","2026-11-30"]);
  const monthly=spreadTaskSessionsR288(drafts.slice(0,3),{firstDate:"2028-01-31",days:3,cadence:"monthly",
    parent:{...daily,startDate:"2028-01-01"}});
  assert.deepEqual(monthly.map(s=>s.scheduledDate),["2028-01-31","2028-02-29","2028-03-31"]);
});
test("R288: reject impossible schedules before changing any draft",()=>{
  const bad=(options:Parameters<typeof spreadTaskSessionsR288>[1])=>assert.throws(()=>spreadTaskSessionsR288(drafts,options),/SESSION_CALENDAR_/);
  bad({firstDate:"2026-11-11",days:6,cadence:"daily",parent:daily});
  bad({firstDate:"2026-02-30",days:2,cadence:"daily",parent:daily});
  bad({firstDate:"2026-11-12",days:3,cadence:"daily",parent:{...daily,endDate:"2026-11-13"}});
  bad({firstDate:"2026-11-11",days:2,cadence:"weekly",parent:{kind:"Weekdays",startDate:"2026-11-11",endDate:null,weekdays:[1]}});
  bad({firstDate:"2026-11-11",days:2,cadence:"daily",parent:{kind:"OneTime",startDate:"2026-11-11",endDate:null,weekdays:[]}});
  assert.ok(drafts.every(s=>s.scheduledDate===null));
});
test("R288: planner displays explicit bulk schedule controls, leaving manual session dates intact",()=>{
  const html=renderToStaticMarkup(createElement(TaskSessionPlannerR254,{
    enabled:true,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},
    sessions:[],setSessions:()=>{},target:20,unit:"صفحة",busy:false,
    parentStartDate:"2026-11-11",parentEndDate:null,parentScheduleKind:"Daily",parentWeekdays:[],
  }));
  assert.match(html,/data-testid="r288-calendar-days"/);
  assert.match(html,/data-testid="r288-calendar-cadence"/);
  assert.match(html,/data-testid="r288-calendar-apply"/);
});
