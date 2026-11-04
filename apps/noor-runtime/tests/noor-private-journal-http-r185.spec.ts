import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {createServer} from "node:http";
import test from "node:test";
import {
  NoorPrivateJournalOperationR185,
  parseJournalNoteR185,
  type JournalEncryptedStoreR185,
  type JournalRowR185,
  type JournalTrustR185,
} from "../src/noor-private-journal-r185.js";

const input = {kind:"feelings", title:"Synthetic feeling", body:"SYNTHETIC_PRIVATE_SENTINEL",precedingEvent:"synthetic",helpful:"",category:"",mood:3,shareApproved:false};
const records = new Map<string, JournalRowR185>();
const db: JournalEncryptedStoreR185 = {
  async insert(row) {const key=`${row.ownerUserId}:${row.id}`;if(records.has(key))return false;records.set(key,row);return true;},
  async list(owner) {return [...records.values()].filter(row=>row.ownerUserId === owner);},
  async remove(owner,id) {return records.delete(`${owner}:${id}`);},
};
const trust: JournalTrustR185 = {
  async resolveSession(sessionId) {return sessionId==="synthetic-session-A"?{accountId:"account-A"}:sessionId==="synthetic-session-B"?{accountId:"account-B"}:sessionId==="synthetic-session-denied"?{accountId:"account-denied"}:null;},
  async authorizePersonal(accountId) {return accountId!=="account-denied";},
  async resolveUserId(accountId) {return accountId==="account-A"?"internal-user-A":accountId==="account-B"?"internal-user-B":null;},
};
const operation = new NoorPrivateJournalOperationR185({trust,store:db,encryptionKey:randomBytes(32)});
function readSession(rawCookie: string | undefined): string | null {
  const parts = String(rawCookie??"").split(";").map(x=>x.trim()).filter(x=>x.startsWith("noor_session="));
  return parts.length===1?parts[0]!.slice("noor_session=".length):null;
}

test("R185 synthetic HTTP: authentication, ownership, AES-GCM, consent, input validation, fail-closed", async () => {
  const api = createServer(async (req,res) => {
    try {
      if(req.method!=="POST" || !req.url?.startsWith("/r185/")){res.writeHead(404);res.end();return;}
      if(!String(req.headers["content-type"]??"").startsWith("application/json")){res.writeHead(415);res.end();return;}
      let body="";
      for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>65536){res.writeHead(413);res.end();return;}}
      let parsed:unknown;
      try {parsed=JSON.parse(body);}catch{res.writeHead(400);res.end();return;}
      if(!parsed || typeof parsed!=="object" || Array.isArray(parsed)){res.writeHead(400);res.end();return;}
      const params=parsed as Record<string,unknown>;
      const session=readSession(req.headers.cookie);
      let result;
      if(req.url==="/r185/create") result=await operation.create(session,params.note);
      else if(req.url==="/r185/list" && Object.keys(params).length===0) result=await operation.list(session);
      else if(req.url==="/r185/remove" && Object.keys(params).length===1) result=await operation.remove(session,params.id);
      else if(req.url==="/r185/export" && Object.keys(params).length===0) result=await operation.exportApproved(session);
      else {res.writeHead(400);res.end();return;}
      if(result.body===undefined){res.writeHead(result.status,{"Cache-Control":"no-store"});res.end();return;}
      const data=JSON.stringify(result.body);
      res.writeHead(result.status,{"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"});res.end(data);
    } catch{res.writeHead(503,{"Cache-Control":"no-store"});res.end();}
  });
  await new Promise<void>(resolve=>api.listen(0,"127.0.0.1",resolve));
  const address=api.address();
  assert.ok(address && typeof address!=="string");
  const url=`http://127.0.0.1:${address.port}`;
  const http=async(endpoint:string,body:unknown,session?:string)=>{
    const headers:Record<string,string>={"Content-Type":"application/json"};
    if(session)headers.Cookie=`noor_session=${session}`;
    const response=await fetch(url+endpoint,{method:"POST",headers,body:JSON.stringify(body)});
    return {status:response.status, body:response.status===200||response.status===201?await response.json():null};
  };
  try{
    await test("invalid and missing Noor session are denied",async()=>{
      assert.equal((await http("/r185/list",{})).status,401);
      assert.equal((await http("/r185/create",{note:input},"synthetic-unknown")).status,401);
      assert.equal((await http("/r185/list",{},"synthetic-session-denied")).status,403);
    });
    await test("Noor server-derived owner scopes writes and reads across two fake users",async()=>{
      const a=await http("/r185/create",{note:input},"synthetic-session-A");
      assert.equal(a.status,201);
      assert.equal((await http("/r185/list",{},"synthetic-session-B")).body.entries.length,0);
      const b=await http("/r185/create",{note:{...input,title:"User B's journal"}},"synthetic-session-B");
      assert.equal(b.status,201);
      const alist=await http("/r185/list",{},"synthetic-session-A");
      const blist=await http("/r185/list",{},"synthetic-session-B");
      assert.equal(alist.body.entries.length,1);assert.equal(blist.body.entries.length,1);
      assert.equal(alist.body.entries[0].title,"Synthetic feeling");
      assert.equal(blist.body.entries[0].title,"User B's journal");
      assert.equal((await http("/r185/remove",{id:a.body.id},"synthetic-session-B")).status,404);
      assert.equal((await http("/r185/list",{},"synthetic-session-A")).body.entries.length,1);
      assert.equal((await http("/r185/remove",{id:a.body.id},"synthetic-session-A")).status,204);
    });
    await test("server encrypts note and binds ciphertext to internal owner and ID",()=>{
      const stored=[...records.values()][0];assert.ok(stored);
      assert.equal(stored.ownerUserId,"internal-user-B");
      assert.ok(!stored.ciphertext.includes("SYNTHETIC_PRIVATE_SENTINEL"));
      assert.ok(!JSON.stringify(stored).includes("SYNTHETIC_PRIVATE_SENTINEL"));
      assert.equal(stored.nonce.length>8,true);
    });
    await test("client-supplied owner and hostile data are rejected",async()=>{
      const owner={...input,ownerUserId:"internal-user-B"};
      assert.equal((await http("/r185/create",{note:owner},"synthetic-session-A")).status,400);
      assert.equal((await http("/r185/create",{note:{...input,body:"x".repeat(12001)}},"synthetic-session-A")).status,400);
      assert.equal(parseJournalNoteR185({...input,shareApproved:true}),null);
      assert.equal((await http("/r185/list",{ownerUserId:"internal-user-A"},"synthetic-session-A")).status,400);
    });
    await test("developer export includes opt-in suggestions only, never private reflections",async()=>{
      await http("/r185/create",{note:{...input,kind:"developer",shareApproved:false,title:"Hidden suggestion"}},"synthetic-session-A");
      await http("/r185/create",{note:{...input,kind:"developer",shareApproved:true,title:"Approved suggestion"}},"synthetic-session-A");
      await http("/r185/create",{note:input},"synthetic-session-A");
      const ex=await http("/r185/export",{},"synthetic-session-A");
      assert.equal(ex.status,200);assert.equal(ex.body.entries.length,1);
      assert.equal(ex.body.entries[0].title,"Approved suggestion");
      assert.deepEqual(Object.keys(ex.body.entries[0]).sort(),["body","category","createdAt","title"]);
    });
    await test("ciphertext corruption fails closed; no partial plaintext release",async()=>{
      const row=[...records.values()].find(x=>x.ownerUserId==="internal-user-A");assert.ok(row);
      const damaged={...row,tag:Buffer.alloc(16).toString("base64")};
      records.set(`${row.ownerUserId}:${row.id}`,damaged);
      const result=await http("/r185/list",{},"synthetic-session-A");
      assert.equal(result.status,503);assert.equal(result.body,null);
    });
  } finally {await new Promise<void>((resolve,reject)=>api.close(e=>e?reject(e):resolve()));}
});
