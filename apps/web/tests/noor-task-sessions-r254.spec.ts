import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TaskSessionPlannerR254,TaskSessionListR254,equalSessionTargetsR254,isWholePageUnitR254,sessionProgressR254,sessionFinishedR254,type StoredTaskSessionR254} from "../src/noor-task-sessions-r254.js";

const s:StoredTaskSessionR254={id:"s1",title:"فهم الموضوع الأول",objective:"استيعاب المقصود",target:15,rangeStart:1,rangeEnd:15,order:1,note:"ملاحظتي محفوظة",revision:1,createdAt:"2026-11-05T10:00:00Z",updatedAt:"2026-11-05T10:00:00Z",completedAt:null};
test("R254: fractional equal split conserves exactly the requested total",()=>{
 assert.deepEqual(equalSessionTargetsR254(300,18).map(n=>Math.round(n*1e6)).reduce((a,b)=>a+b,0),300e6);
 assert.deepEqual(equalSessionTargetsR254(1,3),[0.333334,0.333333,0.333333]);
 assert.throws(()=>equalSessionTargetsR254(0,2));
 assert.equal(isWholePageUnitR254("صفحة"),true);
 assert.equal(isWholePageUnitR254("صفحات"),true);
 assert.equal(isWholePageUnitR254("pages"),true);
 assert.equal(isWholePageUnitR254("دقائق"),false);
 const pages=equalSessionTargetsR254(300,18,true);
 assert.equal(pages.reduce((sum,n)=>sum+n,0),300);
 assert.deepEqual(pages.slice(0,3),[17,17,17]);
 assert.deepEqual(pages.slice(-3),[16,16,16]);
 assert.ok(pages.every(Number.isSafeInteger));
 assert.throws(()=>equalSessionTargetsR254(15.5,4,true));
});
test("R254: client progress and session-completion projection remain independent",()=>{
 const log=[{id:"entry-1",executionId:"today",localDate:"2026-11-05",at:"2026-11-05T10:00:00Z",note:"فهمت الدرس",amount:5,taskSessionId:"s1"}];
 assert.equal(sessionProgressR254(log,"s1"),5);
 assert.equal(sessionFinishedR254(s,log),false);
 assert.equal(sessionFinishedR254({...s,completedAt:"2026-11-05T11:00:00Z"},log),true);
});
test("R254: task form shows optional session toggle and custom mode without forcing sessions",()=>{
 const markup=renderToStaticMarkup(React.createElement(TaskSessionPlannerR254,{enabled:false,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},sessions:[],setSessions:()=>{},target:null,unit:"صفحة",busy:false}));
 assert.match(markup,/تقسيم المهمة إلى جلسات/);
 assert.doesNotMatch(markup,/جلسة 1/);
 const enabled=renderToStaticMarkup(React.createElement(TaskSessionPlannerR254,{enabled:true,setEnabled:()=>{},distribution:"custom",setDistribution:()=>{},sessions:[s],setSessions:()=>{},target:300,unit:"صفحة",busy:false}));
 assert.match(enabled,/فهم الموضوع الأول/);assert.match(enabled,/إضافة جلسة/);
});
test("R254: main task exposes succinct expandable sessions, individual notes and history",()=>{
 const markup=renderToStaticMarkup(React.createElement(TaskSessionListR254,{plan:{distribution:"custom",sessions:[s]},log:[],definitionId:"task",executionId:"today",busy:false,onCommand:async()=>true,title:"قراءة كتاب"}));
 assert.match(markup,/الجلسات: 0 \/ 1 مكتملة/);
 assert.match(markup,/الملاحظات والإنجازات/);
 assert.match(markup,/ملاحظتي محفوظة/);
 assert.match(markup,/قالب تلخيص اختياري/);
});
