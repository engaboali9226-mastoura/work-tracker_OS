// Actual PostgreSQL transaction + JS receipt protocol. Synthetic CI only.
// No Supabase credentials, managed calls, linked-session fixture or auth bypass.
import assert from "node:assert/strict";
import {createS3CiPostgres} from "./s3-ci-postgres.mjs";
import {executeReceiptCandidate} from "./receipt-bridge.mjs";
import {createPersistentSaveAdapter} from "./s3-persistent-adapter.mjs";
const {database,psql,literal}=createS3CiPostgres(process.argv[2]);
const a="synthetic-r386-s3-node-a",b="synthetic-r386-s3-node-b",c="synthetic-r386-s3-node-c";
const keys=new Map([["k1",Buffer.alloc(32,71)],["k2",Buffer.alloc(32,72)]]);
const activeKeyId="k2";
function run(owner,requestId,command,evaluate,db=database,deletedDefinitionId=null){
 return executeReceiptCandidate({owner,requestId,command,evaluate,keys,activeKeyId,
 adapter:createPersistentSaveAdapter({database:db,deletedDefinitionId})});
}
function event(owner,id){
 return {id:"event-"+id,idempotencyKey:"key-"+id,userId:owner,eventVersion:1,aggregateVersion:1,
 eventType:"PersonalDayCreated",aggregateType:"PersonalDay",aggregateId:"day-"+id,personalDayId:"day-"+id,
 correlationId:"corr-"+id,occurredAt:"2026-11-20T10:00:00.000Z",deliveryState:"Pending",
 privacyClassification:"PersonalOperationalData",payload:{boundaryKey:"boundary-"+id,localDate:"2026-11-20"}};
}
function increment(owner,id){return state=>({...state,counter:(state.counter??0)+1,outbox:[...state.outbox,event(owner,id)]});}
function gate(n){let count=0;let open;const ready=new Promise(resolve=>open=resolve);return async()=>{count++;if(count===n)open();await ready;};}
await psql("INSERT INTO noor_r386_candidate.s3_enrollment(owner_id,shadow_enabled) VALUES ("+literal(a)+",true),("+literal(b)+",true),("+literal(c)+",true)");
try{
 assert.deepEqual(await run(a,"noop",{type:"noop"},s=>s),{kind:"acknowledged",status:204,revision:0});
 assert.equal((await database.load(a)).existed,false);
 let lost=0;
 const lostAck={...database,commit:async x=>{const value=await database.commit(x);lost++;throw Error("SYNTHETIC_ACK_LOST");}};
 assert.deepEqual(await run(a,"first",{type:"increment"},increment(a,"first"),lostAck),{kind:"acknowledged",status:204,revision:1});
 assert.equal(lost,1);
 assert.deepEqual(await run(a,"first",{type:"increment"},()=>{throw Error("REPLAY_EVALUATED");}),{kind:"acknowledged",status:204,revision:1});
 await assert.rejects(()=>run(a,"first",{type:"different"},()=>{throw Error("COLLISION_EVALUATED");}),/R386_RECEIPT_COLLISION/);
 assert.equal((await run(b,"first",{type:"noop"},s=>s)).revision,0);
 console.log("R386_S3_HMAC_AND_LOST_ACK_PASS");

 const barrier=gate(2);
 let ea=0,eb=0;
 const results=await Promise.all([
  run(a,"race-a",{type:"increment"},async s=>{if(++ea===1)await barrier();return increment(a,"race-a")(s);}),
  run(a,"race-b",{type:"increment"},async s=>{if(++eb===1)await barrier();return increment(a,"race-b")(s);})
 ]);
 assert.deepEqual(results.map(x=>x.revision).sort((x,y)=>x-y),[2,3]);
 assert.equal(ea+eb,3);
 const sameBarrier=gate(2);
 const duplicates=await Promise.all([1,2].map(()=>run(a,"duplicate",{type:"increment"},async s=>{await sameBarrier();return increment(a,"duplicate")(s);})));
 assert.deepEqual(duplicates.map(x=>x.revision),[4,4]);
 const persisted=await database.load(a);
 assert.equal(persisted.state.counter,4);
 assert.equal(persisted.state.outbox.length,4);
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id="+literal(a)),"4");
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.delivery_outbox WHERE owner_id="+literal(a)),"4");
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.command_receipt WHERE owner_id="+literal(a)),"5");
 console.log("R386_S3_CONCURRENT_CAS_AND_DUPLICATE_PASS");

 // Competing first creates share the enrollment lock even before a source
 // or a receipt exists. Both logical commands must survive exactly once.
 const firstBarrier=gate(2);
 let ec=0,ed=0;
 assert.equal((await database.load(c)).existed,false);
 const firstResults=await Promise.all([
  run(c,"first-c",{type:"increment"},async s=>{if(++ec===1)await firstBarrier();return increment(c,"first-c")(s);}),
  run(c,"first-d",{type:"increment"},async s=>{if(++ed===1)await firstBarrier();return increment(c,"first-d")(s);})
 ]);
 assert.deepEqual(firstResults.map(x=>x.revision).sort((x,y)=>x-y),[1,2]);
 assert.equal(ec+ed,3);
 assert.equal((await database.load(c)).state.counter,2);
 assert.equal((await database.load(c)).state.outbox.length,2);
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.command_receipt WHERE owner_id="+literal(c)),"2");
 console.log("R386_S3_CONCURRENT_FIRST_INSERT_PASS");

 // Simulate shadow-only drift. Rollback reads/writes the old authoritative
 // state and retains receipts even when the shadow no longer matches it.
 await psql("UPDATE noor_r386_candidate.delivery_outbox SET state='Failed' WHERE owner_id="+literal(c)+" AND event_id='event-first-c'");
 const priorSource=await database.load(c);
 assert.equal(await psql("SELECT noor_r386_candidate.s3_enter_rollback("+literal(c)+")"),"t");
 assert.deepEqual(await database.load(c),priorSource);
 assert.equal((await run(c,"first-c",{type:"increment"},()=>{throw Error("REPLAY_EVALUATED");})).revision,firstResults[0].revision);
 assert.equal((await run(c,"post-rollback",{type:"increment"},increment(c,"post-rollback"))).revision,3);
 assert.equal((await database.load(c)).state.counter,3);
 assert.equal(await psql("SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id="+literal(c)),"2");
 console.log("R386_S3_ROLLBACK_ON_SHADOW_DRIFT_PASS");

 // Old authority remains readable and writable after disabling shadow. Replay
 // still resolves its receipt, but new requests are refused by this adapter.
 await psql("UPDATE noor_r386_candidate.s3_enrollment SET shadow_enabled=false WHERE owner_id="+literal(a));
 assert.equal((await run(a,"first",{type:"increment"},()=>{throw Error("REPLAY_EVALUATED");})).revision,1);
 await assert.rejects(()=>run(a,"off",{type:"increment"},increment(a,"off")),/R386_S3_SHADOW_DISABLED/);
 await psql("UPDATE noor_r386_lab.synthetic_source SET revision=revision+1,state=jsonb_set(state,'{counter}','5') WHERE owner_id="+literal(a));
 await psql("UPDATE noor_r386_candidate.s3_enrollment SET shadow_enabled=true WHERE owner_id="+literal(a));
 assert.deepEqual(await run(a,"after-drift",{type:"increment"},increment(a,"after-drift")),{kind:"retry-required",status:503});
 assert.equal((await database.load(a)).state.counter,5);
 assert.equal(await database.lookup(a,"after-drift"),null);
 console.log("R386_S3_DEFAULT_OFF_AND_LEGACY_DRIFT_PASS");

 assert.equal(await psql("SELECT noor_r386_candidate.s3_erase_owner("+literal(a)+")"),"t");
 await assert.rejects(()=>database.lookup(a,"first"),/R386_S3_NOT_ENROLLED/);
 assert.equal((await database.lookup(b,"first")).revision,0);
 console.log("R386_S3_ACCOUNT_ERASURE_AND_OWNER_SCOPE_PASS");
}finally{
 await psql("SELECT noor_r386_candidate.s3_erase_owner("+literal(a)+"); SELECT noor_r386_candidate.s3_erase_owner("+literal(b)+"); SELECT noor_r386_candidate.s3_erase_owner("+literal(c)+")");
}
