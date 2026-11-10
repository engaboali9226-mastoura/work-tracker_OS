import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {sessionRemainingR285,TaskSessionListR254,type StoredTaskSessionR254} from "../src/noor-task-sessions-r254.js";
import {parseStatisticRows,summarizeProgress,wholeWeekAchievement,statisticDays,type StatisticRow} from "../src/progress-statistics.js";

const session:StoredTaskSessionR254={
 id:"reading-1",title:"الجلسة الأولى",objective:"قراءة تمهيدية",
 target:15,rangeStart:1,rangeEnd:15,order:1,note:"",
 revision:0,createdAt:"2026-11-10T08:00:00Z",
 updatedAt:"2026-11-10T08:00:00Z",completedAt:null,
};
const log=[{id:"entry",executionId:"today",localDate:"2026-11-10",at:"2026-11-10T10:00:00Z",note:"",amount:5,taskSessionId:"reading-1",sessionDayCredit:5/300}];
const row=(extra:Partial<StatisticRow>={}):StatisticRow=>({
 id:"today",definitionId:"book",kind:"Task",title:"قراءة كتاب",date:"2026-11-10",
 weight:12,status:"InProgress",amount:5,unit:"صفحة",...extra,
});

test("R285 reading session remaining target and checkbox quantity never double count",()=>{
 assert.equal(sessionRemainingR285(session,log),10);
 assert.equal(sessionRemainingR285(session,[]),15);
 assert.equal(sessionRemainingR285({...session,target:null},log),null);
 assert.equal(sessionRemainingR285(session,[{...log[0]!,amount:15}]),0);
 const html=renderToStaticMarkup(React.createElement(TaskSessionListR254,{
  plan:{distribution:"custom",sessions:[session]},log,definitionId:"book",executionId:"today",
  busy:false,title:"قراءة كتاب",unit:"صفحة",onCommand:async()=>true,
 }));
 assert.match(html,/data-testid="r285-session-complete-reading-1"/u);
 assert.match(html,/type="checkbox"/u);
 assert.match(html,/جلسة القراءة \(10 صفحة\)/u);
 assert.match(html,/كل تقدم يدخل في إنجاز يوم تسجيله/u);
});
test("R285 week and history agree on frozen partial share instead of all-or-nothing",()=>{
 const rows=[row({credit:0.25}),row({id:"pray",kind:"Habit",status:"Completed",weight:20,credit:1})];
 const sum=summarizeProgress(rows);
 assert.equal(sum.completedWeight,23);
 assert.equal(sum.weight,32);
 assert.equal(sum.rate,72);
 const parsed=parseStatisticRows(rows);
 assert.equal(parsed.length,2);
 const calendar=wholeWeekAchievement(rows,"2026-11-10");
 assert.equal(calendar.find(day=>day.date==="2026-11-10")!.rate,72);
 assert.equal(statisticDays(rows,"2026-11-10",1)[0]!.rate,72);
});
test("R285 full task weight is never added on top of session event credit",()=>{
 const completed=row({status:"Completed",credit:.2});
 assert.equal(summarizeProgress([completed]).completedWeight,2.4000000000000004);
 assert.equal(summarizeProgress([completed]).rate,20);
 assert.equal(summarizeProgress([row({status:"Completed"})]).rate,100,
  "pre-R285 historical rows without credit retain the old reading semantics");
});
test("R285 rejects malformed forged credit while retaining legacy rows",()=>{
 assert.deepEqual(parseStatisticRows([row({credit:1.01}),row({credit:-.001}),row({credit:Number.NaN})]),[]);
 assert.equal(parseStatisticRows([row({status:"Completed",credit:1})]).length,1);
});
