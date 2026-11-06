import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {pathToFileURL} from "node:url";

const root=path.resolve(process.env.NOOR_PERSONAL_BUILD_DIR??"dist");
const {PersonalCommandService,SequenceIdGenerator,SupabasePostgresPersonalFoundationPersistence,buildPersonalWorkspace}=
  await import(pathToFileURL(path.join(root,"index.js")).href);

const instant="2026-11-06T09:00:00.000Z",localDate="2026-11-06";
const users=["r255-owner-a","r255-owner-b"];
function fixture(userId,definitionId){
 const boundary={key:"test-day:"+userId,localDate,startAt:"2026-11-05T21:00:00.000Z",endAt:"2026-11-06T21:00:00.000Z",timeZone:"Asia/Riyadh"};
 const day={id:"day:"+userId,userId,boundary,state:"Open",version:1,createdAt:instant,updatedAt:instant};
 const definition={id:definitionId,userId,kind:"Task",revisionId:"revision-initial:"+userId,title:"Book test",category:"learning",
   state:"Active",schedule:{kind:"Daily"},effectiveFromDate:localDate,importance:"Important",
   weight:8,gatePolicy:"NonBlocking",targets:{},measurement:{target:20,unit:"صفحة"}};
 const execution={id:"execution:"+userId,userId,personalDayId:day.id,definitionId,definitionRevisionId:definition.revisionId,
   kind:"Task",title:definition.title,materializationKey:"exec:"+userId,scheduleOccurrenceKey:localDate,status:"Planned",
   eligibility:{definitionRevisionId:definition.revisionId,importance:"Important",weight:8,gatePolicy:"NonBlocking",targets:{}},
   version:1,createdAt:instant,updatedAt:instant};
 return {locations:[],prayerPolicies:[],personalDays:[day],islamicContexts:[],definitions:[definition],dailyExecution:[execution],outbox:[]};
}
function fakePostgres(){
 const rows=new Map(users.map((user,i)=>[user,{user_id:user,schema_version:1,revision:1,state:fixture(user,i===0?"task-a":"task-b")}]));
 const clone=v=>structuredClone(v);
 return {
  client:{from(name){
   assert.equal(name,"noor_personal_foundations");
   let filter={},operation=null,payload=null;
   const query={
    select(){
      if(operation==="update"){
       const old=rows.get(filter.user_id);
       if(!old||old.revision!==filter.revision)return Promise.resolve({data:[],error:null});
       rows.set(filter.user_id,{...clone(old),...clone(payload)});
       return Promise.resolve({data:[{revision:payload.revision}],error:null});
      }
      if(operation==="insert"){
       if(rows.has(payload.user_id))return Promise.resolve({data:null,error:{code:"23505"}});
       rows.set(payload.user_id,clone(payload));
       return Promise.resolve({data:[{revision:payload.revision}],error:null});
      }
      return query;
    },
    eq(key,value){filter[key]=value;return query;},
    async limit(count){
     const row=rows.get(filter.user_id);
     return {data:row?[clone(row)].slice(0,count):[],error:null};
    },
    update(value){operation="update";payload=value;return query;},
    insert(value){operation="insert";payload=value;return query;},
   };
   return query;
  }},
  snapshot(owner){return clone(rows.get(owner));},
 };
}
const entries=[
 {id:"section-1",title:"pages 1-10",objective:"Read",target:10,rangeStart:1,rangeEnd:10},
 {id:"section-2",title:"pages 11-20",objective:"Summarize",target:10,rangeStart:11,rangeEnd:20},
];
function service(scope){
 return new PersonalCommandService({clock:{now:()=>instant},idGenerator:new SequenceIdGenerator(),transaction:scope.transaction});
}
test("R255: two independent devices reload sessions and notes from same persisted owner-scoped Foundation row",async()=>{
 const db=fakePostgres();
 const mac=new SupabasePostgresPersonalFoundationPersistence(db.client);
 const phone=new SupabasePostgresPersonalFoundationPersistence(db.client);
 const other=new SupabasePostgresPersonalFoundationPersistence(db.client);
 await Promise.all([mac.initialize(),phone.initialize(),other.initialize()]);
 const owner=users[0],stranger=users[1];

 // Both devices start from the same revision, before one of them writes.
 const macBefore=await mac.openOperation(owner);
 const stalePhone=await phone.openOperation(owner);
 const oldRevision=macBefore.snapshot.listDefinitions(owner)[0].revisionId;
 await service(macBefore).execute(owner,{type:"configure-task-sessions",definitionId:"task-a",
   expectedRevisionId:oldRevision,plan:{distribution:"custom",sessions:entries}});
 assert.equal(db.snapshot(owner).revision,2);

 await assert.rejects(()=>service(stalePhone).execute(owner,{
   type:"edit-task-general-note",definitionId:"task-a",expectedRevisionId:oldRevision,note:"stale phone text",
 }),error=>error.code==="PersistenceConflict");
 assert.equal(db.snapshot(owner).revision,2);
 assert.equal(db.snapshot(owner).state.definitions[0].taskGeneralNote,undefined);

 // Phone reload resolves the conflict, saves a general note and individual session note.
 const phoneReload=await phone.openOperation(owner);
 const current=phoneReload.snapshot.listDefinitions(owner)[0];
 await service(phoneReload).execute(owner,{type:"edit-task-general-note",definitionId:"task-a",
   expectedRevisionId:current.revisionId,note:"Cross-device parent overview"});
 const macReload=await mac.openOperation(owner);
 const current2=macReload.snapshot.listDefinitions(owner)[0];
 assert.equal(current2.taskGeneralNote,"Cross-device parent overview");
 assert.equal(current2.sessionPlan.sessions[0].note,"");
 await service(macReload).execute(owner,{type:"edit-task-session-note",definitionId:"task-a",
   taskSessionId:"section-1",expectedRevision:0,note:"Learned the first section"});
 const phoneAgain=await phone.openOperation(owner);
 assert.equal(phoneAgain.snapshot.listDefinitions(owner)[0].sessionPlan.sessions[0].note,"Learned the first section");

 // A subsequent phone progress command is reflected on the Mac after reload.
 await service(phoneAgain).execute(owner,{type:"record-task-session-progress",
   executionId:"execution:"+owner,taskSessionId:"section-1",entryId:"progress-cross-device",
   amount:5,note:"Five pages completed"});
 const macAgain=await mac.openOperation(owner);
 const persisted=macAgain.snapshot.listDefinitions(owner)[0];
 assert.equal(persisted.activityLog.length,1);
 assert.equal(persisted.activityLog[0].amount,5);
 assert.equal(persisted.activityLog[0].localDate,localDate);
 assert.equal(persisted.taskGeneralNote,"Cross-device parent overview");
 assert.equal(persisted.sessionPlan.sessions[0].note,"Learned the first section");

 // Owner B sees only B's data; guessed identifiers for A cannot cross accounts.
 const secondUser=await other.openOperation(stranger);
 assert.deepEqual(secondUser.snapshot.listDefinitions(stranger).map(d=>d.id),["task-b"]);
 await assert.rejects(()=>service(secondUser).execute(stranger,{
   type:"edit-task-session-note",definitionId:"task-a",taskSessionId:"section-1",expectedRevision:0,note:"attack",
 }));
 assert.equal(db.snapshot(stranger).revision,1);
 assert.equal(db.snapshot(stranger).state.definitions[0].sessionPlan,undefined);
 assert.equal(db.snapshot(owner).state.definitions[0].sessionPlan.sessions[0].note,"Learned the first section");

 // No leaked notes or partial accomplishment from stale or unauthorized operations.
 const aggregate=buildPersonalWorkspace(owner,macAgain.snapshot);
 assert.equal(aggregate.definitions[0].taskGeneralNote,"Cross-device parent overview");
 assert.equal(db.snapshot(owner).revision,5);
});
