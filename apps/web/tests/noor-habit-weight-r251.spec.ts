import assert from "node:assert/strict";
import test from "node:test";
import {proposedHabitWeight,NoorHabitWeightManagerR251} from "../src/noor-habit-weight-manager-r251.js";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
const h=(title,importance="Supporting")=>({title,category:"عام",importance});
test("R251 prioritizes the five individual obligatory prayers",()=>{
 for(const name of ["الفجر","الظهر","العصر","المغرب","العشاء","صلاة الفجر","Fajr","Isha"])
   assert.equal(proposedHabitWeight(h(name)),25,name);
 assert.equal(proposedHabitWeight(h("صلاة الضحى")),4);
 assert.equal(proposedHabitWeight(h("سنة الفجر")),4);
});
test("R251 Qur'an and dhikr outrank extra habits without category guessing",()=>{
 assert.equal(proposedHabitWeight(h("القرآن")),12);
 assert.equal(proposedHabitWeight(h("أذكار الصباح")),10);
 assert.equal(proposedHabitWeight(h("Gym")),6);
 assert.equal(proposedHabitWeight(h("Mobility")),5);
 assert.equal(proposedHabitWeight(h("English")),4);
 assert.equal(proposedHabitWeight(h("تعلم جديد","Essential")),14);
 assert.equal(proposedHabitWeight(h("تعلم جديد","Optional")),1);
});
test("R251 review is read-only until authenticated confirmation",()=>{
 const defs=[{id:"f",revisionId:"rev-f",kind:"Habit",title:"الفجر",category:"العبادات",importance:"Essential",weight:1,state:"Active"}] as const;
 const html=renderToStaticMarkup(createElement(NoorHabitWeightManagerR251,{definitions:defs,executions:[{definitionId:"f",kind:"Habit",weight:1,status:"Completed"}],busy:false,onCommand:async()=>false}));
 assert.match(html,/noor-habit-weight-manager-r251/);
 assert.match(html,/إنجاز العادات الحالي: 100٪/);
 assert.match(html,/بعد التطبيق: 100٪/);
 assert.match(html,/مراجعة واعتماد الأوزان/);
 assert.match(html,/value="25"/);
});
