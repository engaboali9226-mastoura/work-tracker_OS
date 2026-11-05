import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {createNoorWellbeingPortR227} from '../src/noor-wellbeing-journal-r227.js';
import type {Reflection,DailySignals} from '../src/noor-wellbeing-data-r165.js';
const DAY='2026-11-05';
const reflection:Reflection={id:'draft',date:'2026-11-04',mood:4,energy:2,emotions:['ممتن'],text:'Synthetic reflection',trigger:'Synthetic event',helpful:'Synthetic help'};
const signals:DailySignals={date:'2026-11-04',steps:7500,sleepMinutes:450,screenMinutes:120,pickups:12,apps:[{name:'Synthetic App',minutes:30,opens:2}],source:'manual'};
function fixture(){
 const rows:any[]=[];const calls:any[]=[];let createFails=false,deleteFails=false,tick=0;
 const transport=async(path:string,init:RequestInit)=>{
  const action=path.split('/').at(-1),data=JSON.parse(String(init.body));calls.push({action,data});
  if(action==='list')return new Response(JSON.stringify({entries:rows}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(action==='create'){
   if(createFails)return new Response(null,{status:503});
   assert.equal(data.note.kind,'wellbeing');assert.equal(data.note.shareApproved,false);assert.equal(data.note.localDate,DAY);
   const id=randomUUID();rows.push({...data.note,id,createdAt:new Date(Date.UTC(2026,10,5,0,0,tick++)).toISOString()});
   return new Response(JSON.stringify({id}),{status:201,headers:{'Content-Type':'application/json'}});
  }
  if(action==='remove'){
   if(deleteFails)return new Response(null,{status:503});
   const i=rows.findIndex(e=>e.id===data.id);if(i<0)return new Response(null,{status:404});rows.splice(i,1);return new Response(null,{status:204});
  }
  throw Error('Unexpected request');
 };
 return {rows,calls,port:()=>createNoorWellbeingPortR227(transport,DAY),failCreate:(v:boolean)=>{createFails=v;},failDelete:(v:boolean)=>{deleteFails=v;}};
}
test('R227 preserves every reflection and metric field across independent adapter instances',async()=>{
 const f=fixture();const saved=await f.port().addReflection(reflection);assert.notEqual(saved.id,'draft');
 await f.port().saveSignals(signals);
 assert.deepEqual(await f.port().read(),{reflections:[{...reflection,id:saved.id}],signals:[signals]});
 await f.port().removeReflection(saved.id);assert.deepEqual((await f.port().read()).reflections,[]);
 assert.deepEqual((await f.port().read()).signals,[signals]);
});
test('R227 failed replacement preserves prior metrics; failed old-version cleanup still reads latest revision',async()=>{
 const f=fixture();await f.port().saveSignals(signals);const oldId=f.rows[0].id;
 f.failCreate(true);await assert.rejects(()=>f.port().saveSignals({...signals,steps:8000}));assert.equal(f.rows[0].id,oldId);assert.equal(f.rows.length,1);
 f.failCreate(false);f.failDelete(true);await f.port().saveSignals({...signals,steps:9000});assert.equal(f.rows.length,2);
 assert.equal((await f.port().read()).signals[0].steps,9000);
 f.failDelete(false);await f.port().saveSignals({...signals,steps:10000});assert.equal(f.rows.length,1);assert.equal((await f.port().read()).signals[0].steps,10000);
 const writes=f.calls.filter(c=>c.action==='create'||c.action==='remove');assert.equal(writes[0].action,'create');
});
test('R227 unrelated journals remain untouched, and malformed known documents fail closed',async()=>{
 const f=fixture();const saved=await f.port().addReflection(reflection);const r=structuredClone(f.rows[0]);r.id=randomUUID();r.kind='ideas';r.category='';r.body='Unrelated synthetic idea';f.rows.push(r);
 await assert.rejects(()=>f.port().removeReflection(r.id));assert.equal(f.rows.length,2);
 f.rows[0].body=JSON.stringify({version:1,type:'reflection',value:{...reflection,energy:99}});
 await assert.rejects(()=>f.port().read());assert.equal(f.rows[0].id,saved.id);
});
test('R227 validates untrusted fields and request size before writing',async()=>{
 const f=fixture();
 await assert.rejects(()=>f.port().addReflection({...reflection,emotions:[123 as any]}));
 await assert.rejects(()=>f.port().saveSignals({...signals,steps:-1}));
 await assert.rejects(()=>f.port().saveSignals({...signals,apps:[{name:'x',minutes:null as any,opens:0}]}));
 await assert.rejects(()=>f.port().saveSignals({...signals,source:'synthetic'}));
 await assert.rejects(()=>f.port().addReflection({...reflection,text:'\u0000'.repeat(5000)}));
 assert.equal(f.rows.length,0);
 assert.throws(()=>createNoorWellbeingPortR227(async()=>{throw Error('not called');},'2026-02-30'));
});
