import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {DefinitionForm} from "../src/noor-personal-application-view.js";
import {TaskSessionPlannerR254,sessionCompletionDayR293} from "../src/noor-task-sessions-r254.js";
import {quranQuarterForDateR289} from "../src/noor-quran-quarters-r289.js";

const noop=async()=>true;
test("R293: both task and habit forms offer optional saved description and date starts in current era",()=>{
 for(const kind of ["Habit","Task"] as const){
   const html=renderToStaticMarkup(createElement(DefinitionForm,{
     busy:false,onCommand:noop,defaultStartDate:"2026-11-11",defaultKind:kind,categories:["القراءة"],
   }));
   assert.match(html,/name="description"/);
   assert.match(html,/علامة الاستفهام/);
   assert.match(html,/name="startDate" type="hidden" value="2026-11-11"/);
   assert.doesNotMatch(html,/value="1900"/);
   assert.ok(html.indexOf(">2026</option>")>=0,"current year is a selectable year");
 }
});
test("R293: editing each Quran habit suggests its original first use date, with independent quarter choice",()=>{
 for(const title of ["الورد اليومي","التسميع","المراجعة"]){
  const initial={
   id:"habit-"+title,revisionId:"rev",title,description:"ربع حزب",kind:"Habit" as const,
   state:"Active",weight:5,category:"القرآن",startDate:"2026-11-01",endDate:null,
   scheduleKind:"Daily" as const,weekdays:[],importance:"Supporting",activityLog:[]
  };
  const html=renderToStaticMarkup(createElement(DefinitionForm,{
    busy:false,onCommand:noop,initial,defaultStartDate:"2026-11-11",defaultKind:"Habit",categories:["القرآن"],
  }));
  assert.match(html,/data-testid="r289-quran-anchor-date"/);
  assert.match(html,/value="2026-11-01"/);
  assert.match(html,/data-testid="r289-first-quarter"/);
  assert.match(html,/name="description"/);
  assert.match(html,/ربع حزب/);
 }
 const plan={anchorDate:"2026-11-01",firstQuarter:239,repeatOccurrences:1};
 assert.equal(quranQuarterForDateR289(plan,"2026-11-01","2026-11-01","Daily",[])?.number,239);
 assert.equal(quranQuarterForDateR289(plan,"2026-11-01","2026-11-02","Daily",[])?.number,240);
 assert.equal(quranQuarterForDateR289(plan,"2026-11-01","2026-11-03","Daily",[])?.number,1);
});
test("R293: blank optional scheduled session date opens through a contemporary seeded chooser, never an empty native date field",()=>{
 const html=renderToStaticMarkup(createElement(TaskSessionPlannerR254,{
   enabled:true,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},
   sessions:[{id:"s1",title:"جلسة 1",objective:"",target:5,rangeStart:1,rangeEnd:5,scheduledDate:null}],
   setSessions:()=>{},target:5,unit:"صفحة",busy:false,
   parentStartDate:"2026-11-11",parentEndDate:null,parentScheduleKind:"Daily",parentWeekdays:[],
 }));
 assert.match(html,/data-testid="r286-session-date-s1-choose"/);
 assert.match(html,/اختيار موعد/);
 assert.doesNotMatch(html,/data-testid="r286-session-date-s1" value=""/);
});
test("R293: session completion is displayed using the persisted civil day, not the UTC instant",()=>{
 const when="2026-11-10T22:10:00.000Z";
 const session={id:"s1",title:"ورد القراءة",objective:"",target:5,rangeStart:1,rangeEnd:5,
  order:1,note:"",revision:1,createdAt:when,updatedAt:when,completedAt:when};
 const log=[{id:"e1",executionId:"day11",taskSessionId:"s1",localDate:"2026-11-11",
  at:when,amount:5,note:"",sessionDayCredit:0.5}];
 assert.equal(sessionCompletionDayR293(session,log),"2026-11-11");
 assert.equal(sessionCompletionDayR293({...session,completedAt:null,target:8},log),null);
});
test("R293: rhythm labels fit in the same card, and task/habit details include the saved owner description",()=>{
 const rhythm=readFileSync(new URL("../src/noor-time-windows-r232.tsx",import.meta.url),"utf8");
 const view=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(rhythm,/"ساعات الليل"/);
 assert.match(rhythm,/"ساعات النهار"/);
 assert.doesNotMatch(rhythm,/"إجمالي ساعات الليل"|"إجمالي ساعات النهار"/);
 assert.match(view,/data-testid="r293-definition-description"/);
 assert.match(view,/r293-task-help-/);
 assert.match(view,/description:text\("description"\)/);
});
