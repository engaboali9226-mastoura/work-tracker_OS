import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateLegacyEvent,validIdentifier,validReceiptToken} from "./legacy-event-contract.mjs";
import {commandFingerprints} from "./receipt-bridge.mjs";
const sql=readFileSync(new URL("./s1-persistent-regression.sql",import.meta.url),"utf8");
const cases=JSON.parse(sql.split("$vectors$")[1]);
for(const c of cases)test("S1 shared contract: "+c.label,()=>{
 if(c.ok)assert.equal(validateLegacyEvent("synthetic-s1-a",c.event),true);
 else assert.throws(()=>validateLegacyEvent("synthetic-s1-a",c.event),/^Error: R386_/);
});
test("UTF-8 and receipt boundaries",()=>{
 assert.equal(validIdentifier("😀".repeat(128)),true);
 for(const v of ["😀".repeat(129),"\ud800","\0"," ","\ufeff"])assert.equal(validIdentifier(v),false);
 assert.equal(validReceiptToken("x".repeat(128)),true);
 assert.equal(validReceiptToken("x".repeat(129)),false);
 assert.throws(()=>commandFingerprints({owner:"ع".repeat(257),requestId:"a",command:{},activeKeyId:"k",keys:new Map([["k",Buffer.alloc(32)]])}),/R386_RECEIPT_INPUT/);
});
