import test from "node:test";
import assert from "node:assert/strict";
import {quranQuarterR289,quranQuarterForDateR289,validQuranPlanR289,TOTAL_QURAN_QUARTERS_R289} from "../src/noor-quran-quarters-r289.js";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import {DefinitionForm} from "../src/noor-personal-application-view.js";

test("R289: 240 independent quarter-of-Hizb opening references and provenance boundaries",()=>{
 assert.equal(TOTAL_QURAN_QUARTERS_R289,240);
 const rows=Array.from({length:240},(_,i)=>quranQuarterR289(i+1));
 assert.ok(rows.every(Boolean));
 assert.deepEqual(rows[0]&&[rows[0].surah,rows[0].ayah,rows[0].verseIndex],[1,1,1]);
 assert.deepEqual(rows[1]&&[rows[1].surah,rows[1].ayah,rows[1].verseIndex],[2,26,33]);
 assert.deepEqual(rows[239]&&[rows[239].surah,rows[239].ayah,rows[239].verseIndex],[100,9,6155]);
 assert.equal(new Set(rows.map(r=>r.verseIndex)).size,240);
 assert.ok(rows.every((q,i)=>q.opening&&q.opening.length>=1&&(i===0||q.verseIndex>rows[i-1].verseIndex)));
 assert.equal(quranQuarterR289(0),null);
 assert.equal(quranQuarterR289(241),null);
});
test("R289: owner-selected quarter advances on eligible scheduled days, not daily calendar when weekly",()=>{
 const p={anchorDate:"2026-11-11",firstQuarter:1,repeatOccurrences:2};
 assert.equal(quranQuarterForDateR289(p,"2026-11-11","2026-11-11","Daily",[])?.number,1);
 assert.equal(quranQuarterForDateR289(p,"2026-11-11","2026-11-12","Daily",[])?.number,1);
 assert.equal(quranQuarterForDateR289(p,"2026-11-11","2026-11-13","Daily",[])?.number,2);
 assert.equal(quranQuarterForDateR289({...p,repeatOccurrences:1},"2026-11-11","2026-11-13","Weekdays",[3,5])?.number,2);
 assert.equal(quranQuarterForDateR289({...p,repeatOccurrences:1},"2026-11-11","2026-11-18","Weekdays",[3,5])?.number,3);
 assert.equal(quranQuarterForDateR289({...p,repeatOccurrences:1},"2026-11-11","2026-11-14","Weekdays",[3,5]),null);
 assert.equal(quranQuarterForDateR289({anchorDate:"2026-11-11",firstQuarter:240,repeatOccurrences:1},"2026-11-11","2026-11-12","Daily",[])?.number,1);
 assert.equal(quranQuarterForDateR289(p,"2026-11-11","2026-11-10","Daily",[]),null);
 assert.equal(quranQuarterForDateR289(p,"2026-11-11","2026-11-12","OneTime",[]),null);
});
test("R289: reject malformed plans and invalid civil dates, no guessing",()=>{
 for(const plan of [null,{}, {anchorDate:"2026-11-11",firstQuarter:0,repeatOccurrences:1},{anchorDate:"2026-11-11",firstQuarter:241,repeatOccurrences:1},{anchorDate:"2026-11-11",firstQuarter:1,repeatOccurrences:0},{anchorDate:"2026-11-11",firstQuarter:1,repeatOccurrences:1,token:"sensitive"}]){
   assert.equal(validQuranPlanR289(plan),false);
 }
 assert.equal(quranQuarterForDateR289({anchorDate:"2026-11-11",firstQuarter:1,repeatOccurrences:1},"2026-11-11","2026-02-30","Daily",[]),null);
});
test("R289: habit form offers a separate owner-specific quarter selector and preview",()=>{
 const html=renderToStaticMarkup(createElement(DefinitionForm,{busy:false,onCommand:async()=>true,defaultStartDate:"2026-11-11",defaultKind:"Habit",categories:["العبادات"]}));
 assert.match(html,/data-testid="r289-quran-plan-editor"/);
 assert.match(html,/ورد قرآني متتابع: ربع حزب كل يوم استحقاق/);
});
