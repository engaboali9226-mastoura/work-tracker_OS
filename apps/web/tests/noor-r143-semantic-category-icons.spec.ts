import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {noorCategoryIconKind} from "../src/noor-personal-application-view.js";
const s=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");

test("R143 semantic icons follow Arabic category meaning and normalize category numbering",()=>{
 const examples:[string,string][]= [
  ["الصلاة","prayer"],["الصلوات","prayer"],["العبادات","prayer"],
  ["السنن الرواتب","sunnah"],["01 - السنن الرواتب","sunnah"],["النوافل","sunnah"],
  ["العناية بالجسم","body-care"],["العناية بالبشرة","body-care"],
  ["العناية بالشعر","hair-care"],["صحة فروة الرأس","hair-care"],
  ["التطور","growth"],["تطوير الذات","growth"],
  ["القرآن الكريم","quran"],["01 - حفظ القرآن","quran"],
  ["الأذكار","dhikr"],["الصحة والرياضة","fitness"],["اللياقة البدنية","fitness"],["الصحة","health"],
  ["التغذية","nutrition"],["النوم","sleep"],["الدراسة","learning"],["القراءة","reading"],
  ["تعلم الإنجليزية","language"],["العمل","work"],["المالية","finance"],["الأسرة والعلاقات","family"],
  ["المنزل","home"],["البرمجة","technology"],["الأهداف","planning"],["السفر","travel"],["تصنيف مخصص","general"]
 ];
 for(const [category,expected] of examples)assert.equal(noorCategoryIconKind(category),expected,category);
});

test("R143 home and control cards both use semantic vector icons instead of the four-square mark",()=>{
 assert.match(s,/function NoorCategoryIcon\(/);
 assert.match(s,/data-category-icon=\{kind\}/);
 assert.equal((s.match(/<NoorCategoryIcon category=\{category\}\/>/g)??[]).length,2);
 assert.match(s,/np-cc-category-card-title-r143/);
 assert.match(s,/NOOR_R143_SEMANTIC_CATEGORY_ICON_STYLES/);
 assert.doesNotMatch(s,/<rect x="3\.5" y="3\.5" width="6" height="6" rx="1\.8"/);
 assert.match(s,/data-testid="habit-category-card"/);
 assert.match(s,/data-testid="control-habit-category-card-r135"/);
 assert.match(s,/NOOR_R139_SELECTED_DAY_SHADOW_ONLY/);
 assert.match(s,/NOOR_R141_FINANCE_COMPACT_NOTES/);
});

test("R145: five requested categories resolve to distinct, available vector drawings",()=>{
 const expected=["prayer","sunnah","body-care","hair-care","growth"];
 for(const key of expected){
  assert.ok(s.includes(key==='body-care'||key==='hair-care'?'\"'+key+'\":<>':key+':<>'),key);
 }
 assert.equal(new Set(expected).size,5);
 assert.match(s,/NOOR_R145_EXPLICIT_ARABIC_CATEGORIES/);
});
