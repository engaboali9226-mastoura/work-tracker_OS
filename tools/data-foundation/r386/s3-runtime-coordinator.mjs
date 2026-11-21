// Real application evaluation + S1/S2/S3 persistent SQL, isolated candidate only.
// Not imported by the production composition; no Auth fixture or managed RPC.
import {randomUUID} from "node:crypto";
import {evaluateR386PersonalFoundationCandidate,evaluateR386InitializationCandidate} from "../../../apps/noor-personal/dist/index.js";
import {executeReceiptCandidate} from "./receipt-bridge.mjs";
import {createPersistentSaveAdapter} from "./s3-persistent-adapter.mjs";
import {canonicalJson} from "./shadow-transition.mjs";
const readOnly=scope=>Object.freeze({snapshot:scope.snapshot,locations:scope.locations,prayerPolicies:scope.prayerPolicies,transaction:{async runInTransaction(){throw Error("R386_READ_SCOPE_WRITE");}}});

export function createR386RuntimeSaveCandidate({database,keys,activeKeyId,clock}){
 const execute=async({ownerId,requestId,command,deletedDefinitionId=null,evaluate})=>{
  const result=await executeReceiptCandidate({owner:ownerId,requestId,command,keys,activeKeyId,evaluate,
   adapter:createPersistentSaveAdapter({database,deletedDefinitionId})});
  return {status:result.status};
 };
 return Object.freeze({
  run(input){
   return execute({...input,evaluate:state=>evaluateR386PersonalFoundationCandidate(input.ownerId,state,input.evaluate)});
  },
  async reconcile({ownerId,instant,evaluate}){
   // A Today read may materialize state. Compute on an authorized private clone
   // first; commit changes through the same receipt transaction, then rebuild
   // the projection from a confirmed fresh source, never from a stored receipt.
   if(typeof instant!=="string"||!Number.isFinite(Date.parse(instant)))throw Error("R386_TODAY_INSTANT");
   const slot=new Date(instant).toISOString().slice(0,16).replace(/[-:T]/g,"");
   const inspect=async state=>{
    let value,scope;
    const next=await evaluateR386PersonalFoundationCandidate(ownerId,state,async operation=>{
     value=await evaluate(operation);scope=readOnly(operation);
    });
    return {value,scope,next};
   };
   for(let attempt=0;attempt<3;attempt++){
    const observed=await database.load(ownerId);
    const inspected=await inspect(observed.state);
    if(canonicalJson(inspected.next)===canonicalJson(observed.state)){
     const confirmed=await database.load(ownerId);
     if(confirmed.revision===observed.revision&&confirmed.existed===observed.existed&&canonicalJson(confirmed.state)===canonicalJson(observed.state))
      return {status:200,value:inspected.value,scope:inspected.scope};
     continue;
    }
    const result=await execute({ownerId,requestId:"today-"+slot+"-r"+observed.revision,
     command:{type:"ensure-today-r386",slot,observedRevision:observed.revision},
     evaluate:async state=>(await inspect(state)).next});
    if(result.status!==204)return result;
   }
   return {status:503};
  },
  initialize({ownerId,requestId,city,calculationMethod}){
   return execute({ownerId,requestId,command:{type:"initialize-personal-profile-r321",city,calculationMethod},
    evaluate:state=>{
     const candidate=evaluateR386InitializationCandidate(ownerId,state,city,calculationMethod,clock.now(),
      "location-revision:r321:"+randomUUID(),"prayer-policy:r321:"+randomUUID());
     if(candidate===null)throw Error("R386_INITIALIZATION_ALREADY_CONFIGURED");
     return candidate;
    }});
  },
 });
}

// Read the old authoritative source after ACK. Fail if a caller tries to use
// this read scope to write outside the candidate transaction.
export async function openR386CandidateReadScope(database,ownerId){
 const {state}=await database.load(ownerId);
 let read;
 await evaluateR386PersonalFoundationCandidate(ownerId,state,async scope=>{
  read=readOnly(scope);
 });
 return read;
}
