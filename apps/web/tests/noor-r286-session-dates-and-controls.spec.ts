import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TaskSessionPlannerR254,TaskSessionListR254} from "../src/noor-task-sessions-r254.js";
import type {StoredTaskSessionR254} from "../src/noor-task-sessions-r254.js";
const session:StoredTaskSessionR254={id:"reading-1",title:"قراءة الفصل الأول",objective:"الفهم والتلخيص",
 target:12,rangeStart:1,rangeEnd:12,scheduledDate:"2026-11-11",order:1,note:"",revision:0,
 createdAt:"2026-11-10T18:00:00Z",updatedAt:"2026-11-10T18:00:00Z",completedAt:null};
const plan={distribution:"custom" as const,sessions:[session]};
const display=(todayDate:string)=>renderToStaticMarkup(createElement(TaskSessionListR254,{
 plan,log:[],definitionId:"reading-task",executionId:"today-execution",
 busy:false,onCommand:async()=>true,title:"قراءة كتاب",unit:"صفحة",todayDate,
}));
test("R286 planner allows owner to assign a specific local date to each session",()=>{
 const html=renderToStaticMarkup(createElement(TaskSessionPlannerR254,{
 enabled:true,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},
 sessions:[session],setSessions:()=>{},target:12,unit:"صفحة",busy:false,
 }));
 assert.match(html,/data-testid="r286-session-date-reading-1"/);
 assert.match(html,/type="date"/);
 assert.match(html,/value="2026-11-11"/);
});
test("R286 wrong-day scheduled session shows the date but disables checkbox and progress commands",()=>{
 const html=display("2026-11-10");
 assert.match(html,/مجدولة: 2026-11-11/);
 assert.match(html,/لا يمكن تأكيدها في يوم آخر/);
 assert.match(html,/data-testid="r285-session-complete-reading-1"/);
 assert.match(html,/disabled=""/);
 assert.doesNotMatch(html,/حفظ التقدم/u);
});
test("R286 session's own date enables checkbox for async server persistence",()=>{
 const html=display("2026-11-11");
 assert.match(html,/تأكيد إنجاز قراءة الفصل الأول/);
 assert.match(html,/حفظ التقدم/);
 assert.doesNotMatch(html,/لا يمكن تأكيدها في يوم آخر/u);
});
test("R286 remaining modal and inline category editor remain scoped to NOOR Personal",()=>{
 const src=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(src,/data-testid="r286-remaining-trigger"/);
 assert.match(src,/aria-modal="true" aria-labelledby="r286-remaining-heading"/);
 assert.match(src,/view\.habits,\.\.\.view\.tasks/);
 assert.match(src,/data-testid="r286-category-row"/);
 assert.match(src,/np-r286-inline-category/);
 assert.match(src,/action:previous\?"rename":"add"/);
});
