// Metadata only: compare the output of read-only-staging-parity.sql.
// Exact catalog equality is necessary for a faithful restore, NOT sufficient for G0.
// Differences must be resolved or independently justified, never silently ignored.
export function compareG0Catalogs(source,target){
 const categories=["table","column","constraint","index","policy","table_grant","rpc","rpc_grant","migration","extension","auth_relation"];
 const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
 const valid=x=>plain(x)&&categories.every(k=>Object.hasOwn(x,k)?plain(x[k])&&Object.values(x[k]).every(v=>typeof v==="string"&&v.length>0):true);
 if(!valid(source)||!valid(target))throw Error("R386_G0_INVALID_INVENTORY");
 for(const k of categories)if(!Object.hasOwn(source,k)||Object.keys(source[k]).length===0)throw Error("R386_G0_INCOMPLETE_SOURCE:"+k);
 const differences={};
 for(const k of categories){
  const a=source[k],b=Object.hasOwn(target,k)?target[k]:{};
  const missing=Object.keys(a).filter(id=>!Object.hasOwn(b,id)).sort();
  const additional=Object.keys(b).filter(id=>!Object.hasOwn(a,id)).sort();
  const changed=Object.keys(a).filter(id=>Object.hasOwn(b,id)&&a[id]!==b[id]).sort();
  if(missing.length||additional.length||changed.length)differences[k]={missing,additional,changed};
 }
 return {catalogMatches:Object.keys(differences).length===0,differences,gateClosed:false};
}
