#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
function sortValue(v){
  if(Array.isArray(v)) return v.map(sortValue);
  if(v && typeof v === 'object'){
    const out={};
    for(const k of Object.keys(v).sort()) out[k]=sortValue(v[k]);
    return out;
  }
  if(typeof v === 'number' && !Number.isFinite(v)) throw new Error('non-finite number');
  return v;
}
function canonicalBytes(obj, excluded){
  const clone=structuredClone(obj);
  for(const k of excluded) delete clone[k];
  return Buffer.from(JSON.stringify(sortValue(clone)), 'utf8');
}
const file=process.argv[2] ?? new URL('./cohp1-test-vectors.json', import.meta.url);
const data=JSON.parse(fs.readFileSync(file,'utf8'));
let fail=0;
for(const v of data.vectors){
  const got=crypto.createHash('sha256').update(canonicalBytes(v.logical_object,v.excluded_fields)).digest('hex');
  const ok=got===v.expected_sha256;
  console.log(`${v.vector_id}=${ok?'PASS':'FAIL'} ${got}`);
  if(!ok) fail++;
}
console.log(`NOOR_COHP_1_NODE_VECTOR_RESULT=${fail===0?'PASS':'FAIL'}`);
process.exitCode=fail?1:0;
