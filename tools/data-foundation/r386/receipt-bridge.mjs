// R386 offline runtime bridge candidate. No production imports or database access.
import {createHmac,timingSafeEqual} from "node:crypto";
import {canonicalJson} from "./shadow-transition.mjs";
import {validIdentifier,validReceiptToken} from "./legacy-event-contract.mjs";
const fail=code=>{throw new Error(code)};
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const token=validReceiptToken;
const revision=x=>Number.isSafeInteger(x)&&x>=0;
const digest=x=>typeof x==="string"&&/^[0-9a-f]{64}$/.test(x);
// Keys are supplied by server-only configuration, not the browser or stored with receipts.
// Keep prior keys until the corresponding receipts expire under an approved retention policy.
export function commandFingerprints({owner,requestId,command,activeKeyId,keys}){
 if(!validIdentifier(owner)||!token(requestId)||!plain(command)||!token(activeKeyId)||!(keys instanceof Map)||keys.size<1||keys.size>8||!keys.has(activeKeyId))fail("R386_RECEIPT_INPUT");
 const encoded=canonicalJson({protocol:"noor-personal-command-v1",owner,requestId,command});
 if(Buffer.byteLength(encoded,"utf8")>262144)fail("R386_RECEIPT_TOO_LARGE");
 const fingerprints=new Map();
 for(const [keyId,key] of keys){
  if(!token(keyId)||!Buffer.isBuffer(key)||key.length<32)fail("R386_RECEIPT_KEY");
  fingerprints.set(keyId,createHmac("sha256",key).update(encoded,"utf8").digest("hex"));
 }
 return {active:{keyId:activeKeyId,digest:fingerprints.get(activeKeyId)},fingerprints};
}
export function checkReceipt(receipt,fingerprints){
 if(!plain(receipt)||Object.keys(receipt).sort().join(",")!=="digest,keyId,revision"||!token(receipt.keyId)||!digest(receipt.digest)||!revision(receipt.revision))fail("R386_RECEIPT_CORRUPT");
 const expected=fingerprints.get(receipt.keyId);
 if(!expected)fail("R386_RECEIPT_KEY_UNAVAILABLE");
 if(!timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(receipt.digest,"hex")))fail("R386_RECEIPT_COLLISION");
 return {kind:"acknowledged",status:204,revision:receipt.revision};
}
// Adapter contract:
// lookup(owner,requestId): authoritative receipt or null; never cached.
// load(owner): authoritative {existed,revision,state}; absent owner uses revision 0.
// evaluate(state): pure candidate computation, no I/O, owner already authenticated and command normalized.
// commitAtomic(input): in ONE DB transaction, lock owner (including first insert),
// check existing receipt against all supplied fingerprints BEFORE CAS, then atomically persist
// state/shadow/receipt (or receipt alone for a no-op). Return {kind:"committed"|"replay",receipt}
// or {kind:"conflict"} only for a definitively rejected CAS. Throw on unknown outcome.
// No stored snapshot is returned. Caller uses authoritative GET after 204.
// This interface is not wired into live NOOR. Real shadow/deletion authorization remains adapter work.
export async function executeReceiptCandidate({owner,requestId,command,activeKeyId,keys,adapter,evaluate}){
 const {active,fingerprints}=commandFingerprints({owner,requestId,command,activeKeyId,keys});
 const checked=receipt=>checkReceipt(receipt,fingerprints);
 for(let attempt=0;attempt<2;attempt++){
  const prior=await adapter.lookup(owner,requestId);
  if(prior!==null)return checked(prior);
  let loaded,candidate,changed,nextRevision;
  try{
   loaded=await adapter.load(owner);
   if(!plain(loaded)||typeof loaded.existed!=="boolean"||!revision(loaded.revision)||(!loaded.existed&&loaded.revision!==0)||!plain(loaded.state))fail("R386_RECEIPT_SOURCE");
   const before=canonicalJson(loaded.state);
   candidate=await evaluate(structuredClone(loaded.state));
   if(!plain(candidate))fail("R386_RECEIPT_CANDIDATE");
   changed=before!==canonicalJson(candidate);
   nextRevision=loaded.revision+(changed?1:0);
   if(!revision(nextRevision))fail("R386_RECEIPT_REVISION_OVERFLOW");
  }catch(error){
   // A competing identical command may commit between lookup and evaluation;
   // its now-obsolete business precondition must not hide a durable receipt.
   let raced;
   try{raced=await adapter.lookup(owner,requestId)}catch{throw error;}
   if(raced!==null)return checked(raced);
   throw error;
  }
  let result;
  try{
   result=await adapter.commitAtomic({owner,requestId,expectedRevision:loaded.revision,existed:loaded.existed,before:loaded.state,candidate,changed,receipt:{...active,revision:nextRevision},fingerprints});
  }catch{
   // Never retry a business mutation automatically on ambiguous commit outcome.
   // A successful authoritative receipt lookup is sufficient to acknowledge it.
   let recovered;
   try{recovered=await adapter.lookup(owner,requestId)}catch{return {kind:"retry-required",status:503}}
   return recovered===null?{kind:"retry-required",status:503}:checked(recovered);
  }
  if(result?.kind==="conflict")continue;
  if(result?.kind==="committed"){
   const ack=checked(result.receipt);
   if(ack.revision!==nextRevision)fail("R386_RECEIPT_REVISION_MISMATCH");
   return ack;
  }
  if(result?.kind==="replay")return checked(result.receipt);
  fail("R386_RECEIPT_ADAPTER_RESULT");
 }
 return {kind:"conflict",status:409};
}
