import test from "node:test";
import assert from "node:assert/strict";
import {commandFingerprints,checkReceipt,executeReceiptCandidate} from "./receipt-bridge.mjs";
const keys=new Map([["k1",Buffer.alloc(32,1)],["k2",Buffer.alloc(32,2)]]);
const input=(overrides={})=>({owner:"synthetic-a",requestId:"req1",command:{type:"increment",delta:1},activeKeyId:"k1",keys,...overrides});
function fixture(){
 const states=new Map(),receipts=new Map();
 const getOwner=o=>states.get(o)??{existed:false,revision:0,state:{counter:0}};
 const id=(o,r)=>JSON.stringify([o,r]);
 const adapter={
  async lookup(o,r){return receipts.get(id(o,r))??null},
  async load(o){return structuredClone(getOwner(o))},
  async commitAtomic(x){
   const prior=receipts.get(id(x.owner,x.requestId));
   if(prior){checkReceipt(prior,x.fingerprints);return {kind:"replay",receipt:prior}}
   const current=getOwner(x.owner);
   if(current.existed!==x.existed||current.revision!==x.expectedRevision)return {kind:"conflict"};
   if(x.changed)states.set(x.owner,{existed:true,revision:x.receipt.revision,state:structuredClone(x.candidate)});
   receipts.set(id(x.owner,x.requestId),structuredClone(x.receipt));
   return {kind:"committed",receipt:x.receipt};
  }
 };
 let evaluations=0;
 const execute=(overrides={},evaluator=s=>({...s,counter:s.counter+1}))=>executeReceiptCandidate(input({adapter,evaluate:s=>{evaluations++;return evaluator(s)},...overrides}));
 return {states,receipts,adapter,execute,evaluations:()=>evaluations};
}
test("keyed canonical fingerprints isolate owners and request IDs, support rotation, reject invalid keys",()=>{
 const a=commandFingerprints(input()),b=commandFingerprints(input({command:{delta:1,type:"increment"},activeKeyId:"k2"}));
 assert.equal(a.active.digest,b.fingerprints.get("k1"));assert.notEqual(a.active.digest,b.active.digest);
 assert.notEqual(a.active.digest,commandFingerprints(input({owner:"synthetic-b"})).active.digest);
 assert.notEqual(a.active.digest,commandFingerprints(input({requestId:"req2"})).active.digest);
 assert.throws(()=>commandFingerprints(input({keys:new Map([["k1",Buffer.alloc(8)]])})),/R386_RECEIPT_KEY/);
 assert.throws(()=>commandFingerprints(input({requestId:"bad id"})),/R386_RECEIPT_INPUT/);
 assert.throws(()=>commandFingerprints(input({command:{body:"x".repeat(262145)}})),/R386_RECEIPT_TOO_LARGE/);
});
test("late replays return old revision and no stale snapshot or business re-evaluation, even after key rotation",async()=>{
 const f=fixture();assert.deepEqual(await f.execute(),{kind:"acknowledged",status:204,revision:1});
 assert.equal((await f.execute({requestId:"req2"})).revision,2);
 assert.deepEqual(await f.execute({activeKeyId:"k2"}),{kind:"acknowledged",status:204,revision:1});
 assert.equal(f.evaluations(),2);assert.equal(f.states.get("synthetic-a").state.counter,2);
 await assert.rejects(f.execute({command:{type:"increment",delta:2}}),/R386_RECEIPT_COLLISION/);
 await assert.rejects(f.execute({activeKeyId:"k2",keys:new Map([["k2",keys.get("k2")]])}),/R386_RECEIPT_KEY_UNAVAILABLE/);
 assert.equal((await f.execute({owner:"synthetic-b"})).revision,1);
 assert.deepEqual(Object.keys([...f.receipts.values()][0]).sort(),["digest","keyId","revision"]);
});
test("no-op receipt at revision zero prevents a late mutation and does not create state",async()=>{
 const f=fixture(),noop={requestId:"noop",command:{type:"set",value:0}};
 assert.equal((await f.execute(noop,s=>s)).revision,0);
 assert.equal(f.states.size,0);assert.equal(f.receipts.size,1);
 await f.execute();assert.equal((await f.execute(noop,s=>({...s,counter:0}))).revision,0);
 assert.equal(f.states.get("synthetic-a").state.counter,1);assert.equal(f.evaluations(),2);
});
test("lost acknowledgement after commit resolves through receipt without executing twice",async()=>{
 const f=fixture(),original=f.adapter.commitAtomic;f.adapter.commitAtomic=async x=>{await original(x);throw Error("lost ack")};
 assert.equal((await f.execute()).revision,1);assert.equal(f.evaluations(),1);assert.equal(f.receipts.size,1);
});
test("ambiguous failure before commit is not blindly retried; same request can be retried later",async()=>{
 const f=fixture(),original=f.adapter.commitAtomic;f.adapter.commitAtomic=async()=>{throw Error("network")};
 assert.deepEqual(await f.execute(),{kind:"retry-required",status:503});assert.equal(f.evaluations(),1);assert.equal(f.receipts.size,0);
 f.adapter.commitAtomic=original;assert.equal((await f.execute()).revision,1);assert.equal(f.evaluations(),2);
});
test("definitive stale revision may retry from latest state; maximum two evaluations",async()=>{
 const f=fixture(),original=f.adapter.commitAtomic;let first=true;
 f.adapter.commitAtomic=async x=>{if(first){first=false;await original({...x,requestId:"other",candidate:{counter:4}});return {kind:"conflict"}}return original(x)};
 assert.equal((await f.execute()).revision,2);assert.equal(f.states.get("synthetic-a").state.counter,5);assert.equal(f.evaluations(),2);
 const g=fixture();g.adapter.commitAtomic=async()=>({kind:"conflict"});assert.deepEqual(await g.execute(),{kind:"conflict",status:409});assert.equal(g.evaluations(),2);
});
test("concurrent same request converges on one committed revision",async()=>{
 const f=fixture();const outcomes=await Promise.all([f.execute(),f.execute()]);
 assert.deepEqual(outcomes,[{kind:"acknowledged",status:204,revision:1},{kind:"acknowledged",status:204,revision:1}]);
 assert.equal(f.states.get("synthetic-a").state.counter,1);assert.equal(f.receipts.size,1);
});
test("bad receipt or wrong acknowledged revision fails closed",async()=>{
 const f=fixture();f.adapter.commitAtomic=async x=>({kind:"committed",receipt:{...x.receipt,revision:9}});
 await assert.rejects(f.execute(),/R386_RECEIPT_REVISION_MISMATCH/);
 const g=fixture();g.adapter.lookup=async()=>({keyId:"k1",digest:"bad",revision:1});await assert.rejects(g.execute(),/R386_RECEIPT_CORRUPT/);assert.equal(g.evaluations(),0);
});


test("a concurrent receipt wins over an obsolete initialization/deletion precondition",async()=>{
 const f=fixture();
 let completed=false;
 const originalLoad=f.adapter.load;
 f.adapter.load=async owner=>{
  if(!completed){completed=true;await f.execute();}
  return originalLoad(owner);
 };
 const result=await f.execute({},()=>{throw Error("PRECONDITION_ALREADY_CONSUMED");});
 assert.deepEqual(result,{kind:"acknowledged",status:204,revision:1});
 assert.equal(f.states.get("synthetic-a").state.counter,1);
 assert.equal(f.receipts.size,1);
});
test("a genuine failed precondition without a durable receipt stays failed",async()=>{
 const f=fixture();
 await assert.rejects(f.execute({},()=>{throw Error("PRECONDITION_FAILED");}),/PRECONDITION_FAILED/);
 assert.equal(f.receipts.size,0);
 assert.equal(f.states.size,0);
});
