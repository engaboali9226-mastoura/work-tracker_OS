// Isolated S3 adapter connecting the real receipt coordinator and the S1/S2
// persistent candidate transaction. Transport must use authoritative reads and
// the restricted S3 SQL functions; this module is not a live NOOR RPC binding.
import {planOwnerShadow} from "./shadow-transition.mjs";
import {validIdentifier} from "./legacy-event-contract.mjs";

export function createPersistentSaveAdapter({database,deletedDefinitionId=null}){
 if(!database||["lookup","load","commit"].some(k=>typeof database[k]!=="function")
 ||(deletedDefinitionId!==null&&!validIdentifier(deletedDefinitionId)))throw new Error("R386_S3_ADAPTER_INPUT");
 return {
  lookup(owner,requestId){return database.lookup(owner,requestId);},
  load(owner){return database.load(owner);},
  async commitAtomic({owner,requestId,expectedRevision,existed,before,candidate,changed,receipt,fingerprints}){
   let refs=[];
   if(changed){
    // The deletion marker must be provided by the authorized server command,
    // not taken directly from an HTTP body, and is checked against old state.
    planOwnerShadow({owner,oldRevision:expectedRevision,newRevision:receipt.revision,before,after:candidate,deletedDefinitionId});
    if(deletedDefinitionId!==null){
     const definition=before.definitions.find(d=>d.id===deletedDefinitionId);
     refs=[definition.id,definition.revisionId,...before.dailyExecution.filter(e=>e.definitionId===deletedDefinitionId).flatMap(e=>[e.id,e.definitionRevisionId])];
     refs=[...new Set(refs)];
    }
   } else if(deletedDefinitionId!==null){
    // A deletion command that evaluates to an authorized no-op must not
    // erase historical events or accept a fabricated deletion reference.
    refs=[];
   }
   return database.commit({owner,requestId,expectedRevision,existed,before,after:candidate,
    keyId:receipt.keyId,digest:receipt.digest,fingerprints:Object.fromEntries(fingerprints),deleteRefs:refs});
  },
 };
}
