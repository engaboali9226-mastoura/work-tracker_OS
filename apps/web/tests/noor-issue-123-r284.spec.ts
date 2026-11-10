import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
import {NOOR_FRIDAY_VIRTUES_R284,fridayVirtueR284,NOOR_FRIDAY_VIRTUES_SOURCE_R284} from "../src/noor-friday-virtues-r284.js";

const prayers=[
 {key:"fajr",at:"2026-11-06T02:40:00Z"},
 {key:"sunrise",at:"2026-11-06T03:50:00Z"},
 {key:"dhuhr",at:"2026-11-06T08:35:00Z"},
 {key:"maghrib",at:"2026-11-06T14:20:00Z"},
];
const render=(instant:string)=>renderToStaticMarkup(createElement(NoorR232TimeWindows,{
 prayers,nowMs:Date.parse(instant),timeZone:"Asia/Riyadh",preferences:NOOR_R232_DEFAULT,
}));
test("R284 five merit images/texts exactly follow Bukhari 881 and Muslim 850",()=>{
 assert.deepEqual(NOOR_FRIDAY_VIRTUES_R284.map(x=>x.label),["بدنة","بقرة","كبشًا أقرن","دجاجة","بيضة"]);
 assert.deepEqual(NOOR_FRIDAY_VIRTUES_R284.map(x=>x.number),[1,2,3,4,5]);
 assert.match(NOOR_FRIDAY_VIRTUES_SOURCE_R284,/البخاري \(881\).*مسلم \(850\)/u);
 assert.throws(()=>fridayVirtueR284(0),/INVALID/);
 assert.throws(()=>fridayVirtueR284(6),/INVALID/);
});
test("R284 Friday visual badges keep one-to-one linkage to five authenticated intervals",()=>{
 const html=render("2026-11-06T05:00:00Z");
 assert.match(html,/data-testid="friday-five-hours-r232"/u);
 for(let i=1;i<=5;i++){
  assert.match(html,new RegExp('data-testid="friday-virtue-'+i+'"'));
  assert.match(html,new RegExp(NOOR_FRIDAY_VIRTUES_R284[i-1]!.description));
  assert.equal(html.split('data-testid="friday-virtue-'+i+'"').length-1,1);
 }
 assert.match(html,/صحيح البخاري \(881\)/u);
 assert.match(html,/وقد تختلف بداية ساعات التبكير/u);
 assert.equal((html.match(/class="np-r284-friday-virtue"/gu)||[]).length,5);
});
test("R284 non-Friday renders no virtue timing labels",()=>{
 const html=render("2026-11-07T05:00:00Z");
 assert.doesNotMatch(html,/data-testid="friday-virtue-/u);
 assert.doesNotMatch(html,/data-testid="friday-five-hours-r232"/u);
});
test("R284 both feeling journals describe distinct roles without migrating records",()=>{
 const personal=readFileSync(new URL("../src/noor-three-spaces-r171.tsx",import.meta.url),"utf8");
 const wellbeing=readFileSync(new URL("../src/noor-wellbeing-lab-r165.tsx",import.meta.url),"utf8");
 assert.match(personal,/سجل تأملي|تدوين شعور محدد/u);
 assert.match(wellbeing,/data-testid="r284-emotion-journal-distinction"/u);
 assert.match(wellbeing,/لا تُدمج التدوينات أو تُنقل/u);
 assert.match(personal,/trustedJournal\.read\(\)/u);
 assert.match(wellbeing,/cloudMode/u);
});
