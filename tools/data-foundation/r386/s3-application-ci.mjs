// Real browser transport helper, HTTP handler, PersonalControlOperation,
// production transaction evaluator, scheduler and PostgreSQL on a disposable
// CI database. Session/entitlement resolver ports are existing-style test
// doubles only: this creates no actual linked Auth/RPC identities.
import assert from "node:assert/strict";
import {proveS4Application} from "./s4-application-proof.mjs";
import {createS3CiPostgres} from "./s3-ci-postgres.mjs";
import {createR386RuntimeSaveCandidate,openR386CandidateReadScope} from "./s3-runtime-coordinator.mjs";
import {PersonalControlOperation} from "../../../apps/noor-runtime/dist/personal-control-operation.js";
import {PersonalTodayOperation} from "../../../apps/noor-runtime/dist/personal-today-operation.js";
import {PersonalDailyMaterializationScheduler} from "../../../apps/noor-runtime/dist/personal-daily-materialization-scheduler.js";
import {createRouteAccessHttpServer,PERSONAL_COMMAND_HTTP_PATH,PERSONAL_WORKSPACE_HTTP_PATH,PERSONAL_TODAY_HTTP_PATH} from "../../../apps/noor-runtime/dist/route-access-http-server.js";
import {CryptographicIdGenerator,IntlTimeZoneAdapter,AdhanPrayerTimeCalculator,IntlUmmAlQuraHijriDateCalculator,VersionedApprovedIslamicHistoryCatalog} from "../../../apps/noor-personal/dist/index.js";
import {prepareR386NoorPersonalCommand,sendNoorPersonalCommandDetailed,createR386CommandIntent,sendR386CommandIntent} from "../../../apps/web/src/noor-personal-today-client.ts";
const {database,psql,literal}=createS3CiPostgres(process.argv[2]);
const a="synthetic-r386-s3-app-a",b="synthetic-r386-s3-app-b";
let now="2026-11-20T12:00:00.000Z";
const clock={now:()=>now};
const idGenerator=new CryptographicIdGenerator();
const atomicSaveCandidate=createR386RuntimeSaveCandidate({database,keys:new Map([["ci-key",Buffer.alloc(32,91)]]),activeKeyId:"ci-key",clock});
const foundation={
 openOperation:owner=>openR386CandidateReadScope(database,owner),
 listKnownUserIds:async()=>[a],
};
const dependencies={
 isRuntimeRunning:()=>true,
 resolveSession:{async execute({sessionId}){if(!["fixture-a","fixture-b"].includes(sessionId))throw Error("INVALID_FIXTURE");return{accountId:sessionId};}},
 authorize:{async execute({accountId,action,resourceType,resourceId}){assert.ok(["fixture-a","fixture-b"].includes(accountId));assert.equal(action,"access");assert.equal(resourceType,"application");assert.equal(resourceId,"noor-personal");}},
 accountUserResolver:{async resolve(accountId){return{toString:()=>accountId==="fixture-a"?a:b};}},
 foundation,clock,idGenerator,atomicSaveCandidate,
};
const operation=new PersonalControlOperation(dependencies);
const todayOperation=new PersonalTodayOperation({...dependencies,ensureToday:{clock,idGenerator,timeZone:new IntlTimeZoneAdapter(),prayerCalculator:new AdhanPrayerTimeCalculator(),hijriCalculator:new IntlUmmAlQuraHijriDateCalculator(),historyCatalog:new VersionedApprovedIslamicHistoryCatalog()}});
const routeExecutor={async execute(){return{kind:"authentication-required",appKey:"noor-personal",pathname:"/personal"};}};
const server=createRouteAccessHttpServer(routeExecutor,{personalControl:operation,personalToday:todayOperation});
const scheduler=new PersonalDailyMaterializationScheduler({foundation,clock,idGenerator,atomicSaveCandidate});
await psql("INSERT INTO noor_r386_candidate.s3_enrollment(owner_id,shadow_enabled) VALUES ("+literal(a)+",true),("+literal(b)+",true)");
await server.listen({host:"127.0.0.1",port:0});
const address=server.address();
assert.ok(address&&typeof address!=="string");
const origin="http://127.0.0.1:"+address.port;
const seen=[];
function transport(session,loseFirst=false){
 let lost=false;
 return async(path,init)=>{
  const headers=new Headers(init.headers);
  if(session)headers.set("Cookie","noor_session="+session);
  seen.push([session,headers.get("X-Noor-Request-Id"),init.body]);
  const response=await fetch(origin+path,{...init,headers});
  if(loseFirst&&!lost){lost=true;assert.equal(response.status,204);await response.arrayBuffer();throw Error("SYNTHETIC_HTTP_ACK_LOST");}
  return response;
 };
}
const sendRaw=(session,requestId,command)=>{
 const headers={"Content-Type":"application/json"};
 if(session)headers.Cookie="noor_session="+session;
 if(requestId)headers["X-Noor-Request-Id"]=requestId;
 return fetch(origin+PERSONAL_COMMAND_HTTP_PATH,{method:"POST",headers,body:JSON.stringify(command)});
};
try{
 const initial={type:"initialize-personal-profile-r321",city:"riyadh",calculationMethod:"UmmAlQura"};
 const prepared=prepareR386NoorPersonalCommand(initial,transport("fixture-a",true));
 assert.equal((await prepared.send()).kind,"unavailable");
 assert.equal((await prepared.send()).kind,"success");
 assert.deepEqual(seen[0],seen[1]);
 const first=await database.load(a);
 assert.equal(first.revision,1);
 assert.equal(first.state.locations[0].userId,a);
 assert.equal(first.state.locations[0].timeZone,"Asia/Riyadh");
 assert.equal(first.state.prayerPolicies[0].calculationMethod,"UmmAlQura");
 assert.equal((await database.lookup(a,prepared.requestId)).revision,1);
 assert.equal((await sendRaw("fixture-a",prepared.requestId,{...initial,city:"cairo"})).status,409);
 assert.equal((await prepareR386NoorPersonalCommand(initial,transport("fixture-a")).send()).kind,"conflict");
 assert.equal((await sendRaw("fixture-a",null,initial)).status,400);
 assert.equal((await sendRaw(null,prepared.requestId,initial)).status,401);
 // Same ID / same logical command, a distinct trusted owner.
 assert.equal((await sendRaw("fixture-b",prepared.requestId,initial)).status,204);
 assert.equal((await database.load(b)).state.locations[0].userId,b);
 console.log("R386_S3_REAL_HTTP_INITIALIZATION_AND_STABLE_ACK_PASS");

 await scheduler.tick();
 const createdDay=await database.load(a);
 assert.equal(createdDay.state.personalDays.length,1);
 assert.ok(createdDay.state.outbox.length>0);
 assert.ok(await database.lookup(a,"scheduler-202611201200"));
 const schedulerRevision=createdDay.revision;
 await scheduler.tick();
 assert.equal((await database.load(a)).revision,schedulerRevision);
 console.log("R386_S3_REAL_SCHEDULER_ATOMIC_PASS");

 const create={type:"create-definition",requestId:"11111111-1111-4111-8111-111111111111",kind:"Habit",title:"Synthetic habit",category:"الصحة والرياضة",startDate:"2026-11-20",endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Supporting"};
 assert.equal((await prepareR386NoorPersonalCommand(create,transport("fixture-a")).send()).kind,"success");
 const defined=await database.load(a);
 assert.equal(defined.state.definitions.length,1);
 const definitionId=defined.state.definitions[0].id;
 const noop=prepareR386NoorPersonalCommand(create,transport("fixture-a"));
 assert.equal((await noop.send()).kind,"success");
 assert.equal((await database.load(a)).revision,defined.revision);
 assert.equal((await database.lookup(a,noop.requestId)).revision,defined.revision);
 console.log("R386_S3_REAL_COMMAND_AND_NOOP_PASS");
 const getToday=()=>fetch(origin+PERSONAL_TODAY_HTTP_PATH,{method:"POST",headers:{"Content-Type":"application/json",Cookie:"noor_session=fixture-a"},body:"{}"});
 const todayReply=await getToday();
 assert.equal(todayReply.status,200);
 assert.equal(todayReply.headers.get("X-Noor-Atomic-Save"),"r386");
 const todayBody=await todayReply.json();
 assert.ok(todayBody.habits.some(row=>row.definitionId===definitionId));
 const afterToday=await database.load(a);
 assert.ok(afterToday.state.dailyExecution.some(row=>row.definitionId===definitionId));
 assert.ok(afterToday.revision>defined.revision);
 assert.equal((await getToday()).status,200);
 assert.equal((await database.load(a)).revision,afterToday.revision);
 console.log("R386_S3_REAL_TODAY_MATERIALIZATION_AND_FRESH_PROJECTION_PASS");

 now="2026-11-21T12:00:00.000Z";
 await scheduler.tick();
 const materialized=await database.load(a);
 assert.ok(materialized.state.dailyExecution.some(row=>row.definitionId===definitionId));
 const beforeErase=materialized.state.outbox.length;
 assert.equal((await prepareR386NoorPersonalCommand({type:"delete-definition",definitionId,confirm:true},transport("fixture-a")).send()).kind,"success");
 const deleted=await database.load(a);
 assert.ok(!deleted.state.definitions.some(row=>row.id===definitionId));
 assert.ok(!deleted.state.dailyExecution.some(row=>row.definitionId===definitionId));
 assert.ok(deleted.state.outbox.length<beforeErase);
 assert.ok(deleted.state.outbox.length>0);
 assert.ok(!deleted.state.outbox.some(event=>event.payload.definitionId===definitionId));
 assert.equal((await database.load(b)).revision,1);
 await psql("SELECT noor_r386_candidate.s3_matches("+literal(a)+",(SELECT state->'outbox' FROM noor_r386_lab.synthetic_source WHERE owner_id="+literal(a)+"))");
 console.log("R386_S3_REAL_DEFINITION_ERASURE_PASS");
 const workspace=await fetch(origin+PERSONAL_WORKSPACE_HTTP_PATH,{method:"POST",headers:{"Content-Type":"application/json",Cookie:"noor_session=fixture-a"},body:"{}"});
 assert.equal(workspace.status,200);
 assert.equal(workspace.headers.get("X-Noor-Atomic-Save"),"r386");
 assert.ok(!(await workspace.json()).definitions.some(row=>row.id===definitionId));
 console.log("R386_S3_FRESH_AUTHORITATIVE_WORKSPACE_PASS");

 // Real application path after a deliberate operator rollback. Same HMAC
 // receipt identity, old JSONB authority, no new shadow event writes.
 const beforeRollback=await database.load(a);
 const historyCount=await psql("SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id="+literal(a));
 assert.equal(await psql("SELECT noor_r386_candidate.s3_enter_rollback("+literal(a)+")"),"t");
 assert.equal(await psql("SELECT noor_r386_candidate.s3_enter_rollback("+literal(a)+")"),"f");
 await assert.rejects(()=>psql("UPDATE noor_r386_candidate.s3_enrollment SET rollback_only=false,shadow_enabled=true WHERE owner_id="+literal(a)),/R386_S3_ROLLBACK_RECONCILIATION_REQUIRED/);
 assert.equal((await prepared.send()).kind,"success"); // late retry, no re-execution
 assert.deepEqual(await database.load(a),beforeRollback);
 const rollbackCreate={...create,requestId:"22222222-2222-4222-8222-222222222222",title:"Rollback habit",startDate:"2026-11-21"};
 const intent=createR386CommandIntent(rollbackCreate);
 const lostTransport=transport("fixture-a",true);
 assert.equal((await sendR386CommandIntent(intent,lostTransport)).kind,"unavailable");
 assert.equal((await sendR386CommandIntent(intent,lostTransport)).kind,"success");
 const rollbackState=await database.load(a);
 assert.equal(rollbackState.revision,beforeRollback.revision+1);
 assert.equal(rollbackState.state.definitions.length,1);
 assert.equal((await database.lookup(a,intent.requestId)).revision,rollbackState.revision);
 assert.equal((await getToday()).status,200);
 const afterRollbackToday=await database.load(a);
 assert.ok(afterRollbackToday.state.outbox.length>beforeRollback.state.outbox.length);
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id="+literal(a)),historyCount);
 assert.equal((await database.lookup(a,intent.requestId)).revision,rollbackState.revision);
 assert.equal((await database.load(b)).revision,1);
 console.log("R386_S3_REAL_ROLLBACK_AND_RECEIPT_FENCE_PASS");
 // Existing normal command sender must carry a new identity for each separate
 // intent and use a stable identity on explicit retry of the same object.
 const ordinary={...create,requestId:"33333333-3333-4333-8333-333333333333",title:"Ordinary sender",startDate:"2026-11-21"};
 const ordinaryTransport=transport("fixture-a",true);
 assert.equal((await sendNoorPersonalCommandDetailed(ordinary,ordinaryTransport)).kind,"unavailable");
 assert.equal((await sendNoorPersonalCommandDetailed(ordinary,ordinaryTransport)).kind,"success");
 assert.deepEqual(seen.at(-1),seen.at(-2));
 const previousRequest=seen.at(-1)[1];
 assert.equal((await sendNoorPersonalCommandDetailed({...ordinary},ordinaryTransport)).kind,"success");
 assert.notEqual(seen.at(-1)[1],previousRequest);
 assert.equal((await database.load(a)).state.definitions.length,2);
 console.log("R386_S3_EXISTING_BROWSER_SENDER_INTENT_PASS");
 // A stale candidate client must not reach a legacy executor when its
 // previous request could have committed. Also prove ordinary default-off
 // transport still reaches the old executor.
 let legacyCalls=0;
 const legacy=createRouteAccessHttpServer(routeExecutor,{personalControl:{
   async executeCommand(){legacyCalls++;return {status:204};},
   async readWorkspace(){return {status:200,body:{}};},
 }});
 await legacy.listen({host:"127.0.0.1",port:0});
 try{
   const legacyAddress=legacy.address();
   assert.ok(legacyAddress&&typeof legacyAddress!=="string");
   const legacyFetcher=(path,init)=>fetch("http://127.0.0.1:"+legacyAddress.port+path,init);
   const mustAtomic=createR386CommandIntent(ordinary,legacyFetcher,true);
   assert.equal((await sendR386CommandIntent(mustAtomic,legacyFetcher)).kind,"unavailable");
   assert.equal(legacyCalls,0);
   assert.equal((await sendNoorPersonalCommandDetailed({...ordinary},legacyFetcher)).kind,"success");
   assert.equal(legacyCalls,1);
 }finally{await legacy.close();}
 console.log("R386_S3_NO_SILENT_LEGACY_DOWNGRADE_PASS");
 await proveS4Application({database,psql,literal,owner:b,otherOwner:a,setNow:value=>{now=value;},
  send:c=>sendRaw("fixture-b",createR386CommandIntent(c).requestId,c),
  readToday:()=>fetch(origin+PERSONAL_TODAY_HTTP_PATH,{method:"POST",headers:{"Content-Type":"application/json",Cookie:"noor_session=fixture-b"},body:"{}"}),
  readWorkspace:()=>fetch(origin+PERSONAL_WORKSPACE_HTTP_PATH,{method:"POST",headers:{"Content-Type":"application/json",Cookie:"noor_session=fixture-b"},body:"{}"})});
}finally{
 await scheduler.stop();
 await server.close();
 await psql("SELECT noor_r386_candidate.s3_erase_owner("+literal(a)+"); SELECT noor_r386_candidate.s3_erase_owner("+literal(b)+")");
}
