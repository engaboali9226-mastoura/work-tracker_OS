import test from "node:test";
import assert from "node:assert/strict";
import {compareG0Catalogs} from "./g0-catalog-compare.mjs";
const categories=["table","column","constraint","index","policy","table_grant","rpc","rpc_grant","migration","extension","auth_relation"];
const baseline=()=>Object.fromEntries(categories.map(k=>[k,{synthetic:"hash"}]));
test("exact metadata parity is not proof of recovery, auth, or G0 closure",()=>{
 const a=baseline();assert.deepEqual(compareG0Catalogs(a,structuredClone(a)),{catalogMatches:true,differences:{},gateClosed:false});
});
test("missing target categories, changed fingerprints and additional objects cannot pass",()=>{
 const a=baseline(),b=structuredClone(a);delete b.rpc;b.policy.synthetic="changed";b.table.extra="hash";
 const result=compareG0Catalogs(a,b);
 assert.equal(result.catalogMatches,false);assert.equal(result.gateClosed,false);
 assert.deepEqual(result.differences.rpc,{missing:["synthetic"],additional:[],changed:[]});
 assert.deepEqual(result.differences.policy.changed,["synthetic"]);
 assert.deepEqual(result.differences.table.additional,["extra"]);
});
test("empty, truncated or malformed source fails closed",()=>{
 assert.throws(()=>compareG0Catalogs({},{}),/INCOMPLETE_SOURCE/);
 const a=baseline();delete a.auth_relation;assert.throws(()=>compareG0Catalogs(a,baseline()),/INCOMPLETE_SOURCE/);
 const b=baseline();b.rpc={};assert.throws(()=>compareG0Catalogs(b,b),/INCOMPLETE_SOURCE/);
 const c=baseline();c.table.synthetic=null;assert.throws(()=>compareG0Catalogs(c,baseline()),/INVALID_INVENTORY/);
});
test("reports names not fingerprints or values, leaves inputs unchanged",()=>{
 const a=baseline(),b=baseline();b.table.synthetic="different";const before=JSON.stringify(b);
 const result=compareG0Catalogs(a,b);assert.equal(JSON.stringify(b),before);assert.ok(!JSON.stringify(result).includes("different"));assert.ok(!JSON.stringify(result).includes("hash"));
});
