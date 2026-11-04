import assert from 'node:assert/strict';
import test from 'node:test';
import {correlation,dailyMood,formatMinutes,isValidLocalDate,numberOrNull,riyadhDate,validateReflection} from '../src/noor-wellbeing-data-r165.js';
const day = (n: number) => `2026-11-${String(n).padStart(2,'0')}`;
const reflection = (n:number,mood:number) => ({id:`r-${n}`,date:day(n),mood,energy:3,emotions:['هادئ'],text:'',trigger:'',helpful:''});
const metric = (n:number,screenMinutes:number | null) => ({date:day(n),steps:1000*n,sleepMinutes:400+n,screenMinutes,pickups:3,apps:[],source:'manual' as const});
test('R165 local date accepts leap day and rejects impossible days',()=>{
  assert.equal(isValidLocalDate('2028-02-29'),true);
  assert.equal(isValidLocalDate('2027-02-29'),false);
  assert.equal(isValidLocalDate('2026-13-01'),false);
  assert.equal(riyadhDate(new Date('2026-11-02T22:00:00Z')),'2026-11-03');
});
test('R165 mood validation and freeform length bounds',()=>{
  assert.equal(validateReflection(reflection(1,5)),null);
  assert.match(validateReflection(reflection(1,0))!,/المزاجية/);
  assert.match(validateReflection({...reflection(1,3),text:'x'.repeat(5001)})!,/النص/);
  assert.equal(numberOrNull('0',1440),0);
  assert.equal(numberOrNull('',1440),null);
  assert.equal(numberOrNull('-1',1440),null);
  assert.equal(numberOrNull('1441',1440),null);
});
test('R165 multiple entries in one local date aggregate rather than double count',()=>{
  const mood=dailyMood([reflection(1,3),reflection(1,5)]);
  assert.equal(mood.size,1);assert.equal(mood.get(day(1)),4);
});
test('R165 insufficient paired days do not produce a misleading correlation',()=>{
  const refs=Array.from({length:6},(_,i)=>reflection(i+1,i%5+1));
  const metrics=Array.from({length:6},(_,i)=>metric(i+1,30*i));
  assert.deepEqual(correlation(refs,metrics,'screenMinutes'),{n:6,value:null,status:'insufficient'});
});
test('R165 seven valid paired days produce signed coefficients',()=>{
  const refs=Array.from({length:7},(_,i)=>reflection(i+1,i+1>5?5:i+1));
  const metrics=Array.from({length:7},(_,i)=>metric(i+1,700-i*40));
  const result=correlation(refs,metrics,'screenMinutes');
  assert.equal(result.status,'ok');assert.ok(result.value! < 0);
});
test('R165 constant measurements and missing data do not invent relationships',()=>{
  const refs=Array.from({length:7},(_,i)=>reflection(i+1,i%5+1));
  const metrics=Array.from({length:7},(_,i)=>metric(i+1,100));
  assert.deepEqual(correlation(refs,metrics,'screenMinutes'),{n:7,value:null,status:'no-variance'});
  assert.equal(correlation(refs,metrics.map(m=>({...m,sleepMinutes:null})),'sleepMinutes').status,'insufficient');
});
test('R165 unvalidated duplicate metric date contributes at most once',()=>{
  const refs=Array.from({length:7},(_,i)=>reflection(i+1,i%5+1));
  const metrics=Array.from({length:7},(_,i)=>metric(i+1,100+i*10));
  assert.equal(correlation(refs,[metrics[0]!,metrics[0]!,...metrics.slice(1)],'screenMinutes').n,7);
  assert.equal(formatMinutes(130),'2 س 10 د');
  assert.equal(formatMinutes(null),'غير مسجل');
});
