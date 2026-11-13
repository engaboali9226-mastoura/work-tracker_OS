import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";
const api=await import(pathToFileURL(path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist","index.js")).href);
const {parsePersonalCommand,PersonalCommandService,InMemoryFoundationStore,SequenceIdGenerator,
 SupabasePostgresPersonalFoundationPersistence,buildPersonalWorkspace}=api;
const friday="2026-11-13T08:00:00.000Z";
const save=(hour,expectedHour)=>({type:"set-friday-mosque-hour",hour,expectedHour});
const fixture=(userId="u")=>{
 let clock=friday;
 const store=new InMemoryFoundationStore();
 const service=new PersonalCommandService({clock:{now:()=>clock},idGenerator:new SequenceIdGenerator(),
  transaction:store,accountTimeZone:"Asia/Riyadh"});
 return {store,service,userId,setClock:(v)=>{clock=v}};
};
test("R311 command contract rejects untrusted dates, foreign ids, empty payloads and out-of-range hours",()=>{
 assert.deepEqual(parsePersonalCommand(save(3,null)),save(3,null));
 assert.deepEqual(parsePersonalCommand(save(null,3)),save(null,3));
 for(const cmd of [save(0,null),save(6,null),save(-1,null),save(3,9),save("2",null),
  {...save(1,null),date:"2026-11-20"},{...save(1,null),userId:"other"},
  {type:"set-friday-mosque-hour",hour:1},save(undefined,null)]){
   assert.equal(parsePersonalCommand(cmd),null,JSON.stringify(cmd));
 }
});
test("R311 saves exactly one Friday choice, edits, unselects, and never affects tasks or daily achievement",async()=>{
 const f=fixture();
 const baseline=f.store.snapshot();
 await f.service.execute("u",save(2,null));
 assert.deepEqual(f.store.snapshot().fridayMosqueVisits,[{userId:"u",localDate:"2026-11-13",hour:2}]);
 await f.service.execute("u",save(4,2));
 assert.deepEqual(f.store.snapshot().fridayMosqueVisits,[{userId:"u",localDate:"2026-11-13",hour:4}]);
 assert.deepEqual(f.store.snapshot().definitions,baseline.definitions);
 assert.deepEqual(f.store.snapshot().dailyExecution,baseline.dailyExecution);
 await assert.rejects(()=>f.service.execute("u",save(1,2)),error=>error.code==="FRIDAY_VISIT_CONFLICT");
 assert.equal(f.store.snapshot().fridayMosqueVisits[0].hour,4);
 await f.service.execute("u",save(null,4));
 assert.deepEqual(f.store.snapshot().fridayMosqueVisits,[]);
 await f.service.execute("u",save(5,null));
 f.setClock("2026-11-20T08:00:00.000Z");
 await f.service.execute("u",save(1,null));
 assert.deepEqual(f.store.snapshot().fridayMosqueVisits.map(x=>x.localDate),
  ["2026-11-13","2026-11-20"]);
 assert.deepEqual(f.store.snapshot().fridayMosqueVisits.map(x=>x.hour),[5,1]);
});
test("R311 refuses selection on Thursday/Saturday or without the trusted account timezone",async()=>{
 for(const time of ["2026-11-12T08:00:00.000Z","2026-11-14T08:00:00.000Z"]){
   const f=fixture();f.setClock(time);
   await assert.rejects(()=>f.service.execute("u",save(2,null)),error=>error.code==="FRIDAY_VISIT_NOT_AVAILABLE");
   assert.deepEqual(f.store.snapshot().fridayMosqueVisits,[]);
 }
 const store=new InMemoryFoundationStore();
 const service=new PersonalCommandService({clock:{now:()=>friday},idGenerator:new SequenceIdGenerator(),transaction:store});
 await assert.rejects(()=>service.execute("u",save(1,null)),error=>error.code==="FRIDAY_VISIT_NOT_AVAILABLE");
 assert.deepEqual(store.snapshot().fridayMosqueVisits,[]);
});
test("R311 per-user records remain isolated in simulated transaction and workspace snapshot",async()=>{
 const f=fixture();
 await f.service.execute("alice",save(2,null));
 await f.service.execute("bob",save(4,null));
 const records=f.store.snapshot().fridayMosqueVisits;
 assert.equal(records.length,2);
 assert.deepEqual(records.map(x=>[x.userId,x.hour]),[["alice",2],["bob",4]]);
 const before=[...records];
 await assert.rejects(()=>f.service.execute("alice",save(1,4)));
 assert.deepEqual(f.store.snapshot().fridayMosqueVisits,before);
});
test("R311 Supabase JSON foundation persists selection across adapter reloads with owner-scoped projection",async()=>{
 let row={user_id:"alice",schema_version:1,revision:1,
  state:{locations:[],prayerPolicies:[],personalDays:[],islamicContexts:[],
   definitions:[],dailyExecution:[],outbox:[]}};
 const client={from(){return {
  select(){return {eq(){return {limit:async()=>({data:[structuredClone(row)],error:null})}}}},
  update(value){const filters={};const query={
   eq(key,value){filters[key]=value;return query;},
   async select(){if(filters.user_id!==row.user_id||filters.revision!==row.revision)return {data:[],error:null};
    row={...row,...structuredClone(value)};return {data:[{revision:row.revision}],error:null};
   }};
   return query;
  },
 }}};
 const adapter=new SupabasePostgresPersonalFoundationPersistence(client);
 await adapter.initialize();
 const scope=await adapter.openOperation("alice");
 const service=new PersonalCommandService({clock:{now:()=>friday},idGenerator:new SequenceIdGenerator(),
  transaction:scope.transaction,accountTimeZone:"Asia/Riyadh"});
 await service.execute("alice",save(3,null));
 assert.equal(row.schema_version,1);
 assert.deepEqual(row.state.fridayMosqueVisits,[{localDate:"2026-11-13",hour:3}]);
 const fresh=new SupabasePostgresPersonalFoundationPersistence(client);
 await fresh.initialize();
 const loaded=await fresh.openOperation("alice");
 assert.deepEqual(loaded.snapshot.listFridayMosqueVisits("alice"),[{localDate:"2026-11-13",hour:3}]);
 assert.throws(()=>loaded.snapshot.listFridayMosqueVisits("other"));
 const workspace=buildPersonalWorkspace("alice",loaded.snapshot);
 assert.deepEqual(workspace.fridayMosqueVisits,[{localDate:"2026-11-13",hour:3}]);
 assert.deepEqual(workspace.statistics.rows,[]);
 assert.equal(workspace.insights.currentStreakDays,0);
});
