import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";
import { NoorPrivateJournalOperationR185 } from "../src/noor-private-journal-r185.js";
import { makeTrustedPrivateJournalHttpHandlerR221 } from "../src/noor-private-journal-http-r221.js";

const SITE="https://noor.example.test";
const DAY="2026-11-04";
const NOTE={kind:"ideas" as const,title:"Synthetic",body:"NOT_REAL_PRIVATE_CONTENT",
 precedingEvent:"",helpful:"",category:"",mood:null,shareApproved:false,localDate:DAY};

async function withJournal(run:(origin:string,rows:any[])=>Promise<void>){
 const rows:any[]=[];
 const operation=new NoorPrivateJournalOperationR185({
  trust:{
   async resolveAuthorizedUser(sid){
    if(sid==="r221-session-a")return {status:200 as const,userId:"r221_fake_user_a"};
    if(sid==="r221-session-b")return {status:200 as const,userId:"r221_fake_user_b"};
    return {status:401 as const};
   },
   async resolveAuthorizedPersonalDay(sid){
    if(sid==="r221-session-a")return {status:200 as const,userId:"r221_fake_user_a",localDate:DAY};
    if(sid==="r221-session-b")return {status:200 as const,userId:"r221_fake_user_b",localDate:DAY};
    return {status:401 as const};
   },
  },
  store:{
   async insert(row){rows.push(row);return true;},
   async list(owner){return rows.filter(r=>r.ownerUserId===owner);},
   async remove(owner,id){const i=rows.findIndex(r=>r.ownerUserId===owner&&r.id===id);if(i<0)return false;rows.splice(i,1);return true;},
  },
  keyRing:{activeVersion:1,keys:new Map([[1,randomBytes(32)]])},
 });
 const handler=makeTrustedPrivateJournalHttpHandlerR221(operation,SITE);
 const server=createServer((req,res)=>{void handler(req,res);});
 await new Promise<void>((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
 const address=server.address();if(!address||typeof address==="string")throw Error("NO_TEST_SOCKET");
 try{await run("http://127.0.0.1:"+address.port,rows);}
 finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
function request(origin:string,action:string,data:unknown={},cookie="",headers:Record<string,string>={}){
 return fetch(origin+"/api/noor/personal/journal/"+action,{
  method:"POST",
  headers:{"Origin":SITE,"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",...(cookie?{Cookie:"noor_session="+cookie}:{}),...headers},
  body:JSON.stringify(data),
 });
}
test("R221 trusted route rejects non-HTTPS origin at construction",()=>{
 const dummy={} as never;
 assert.throws(()=>makeTrustedPrivateJournalHttpHandlerR221(dummy,"http://127.0.0.1:19847"),/R221_HTTPS_ORIGIN_REQUIRED/);
 assert.throws(()=>makeTrustedPrivateJournalHttpHandlerR221(dummy,"https://noor.example.test/path"),/R221_HTTPS_ORIGIN_REQUIRED/);
});

test("R221 separate opaque cookies, strict origin, AES rows and cross-user denial",async()=>{
 await withJournal(async (origin,rows)=>{
  assert.equal((await request(origin,"status",{},"r221-session-a")).status,204);
  assert.equal((await request(origin,"status")).status,401);
  assert.equal((await request(origin,"status",{},"r221-session-a",{Origin:"https://evil.example"})).status,403);
  assert.equal((await request(origin,"status",{},"r221-session-a",{"Sec-Fetch-Site":"cross-site"})).status,403);
  const response=await request(origin,"create",{note:NOTE},"r221-session-a");
  assert.equal(response.status,201);
  const id=(await response.json()).id;assert.match(id,/^[0-9a-f-]{36}$/i);
  assert.equal(rows.length,1);
  assert.ok(!JSON.stringify(rows).includes(NOTE.body),"database must contain ciphertext only");
  const mine=await request(origin,"list",{},"r221-session-a");
  assert.equal(mine.status,200);
  const body=await mine.json();assert.equal(body.entries.length,1);
  assert.equal(body.entries[0].body,NOTE.body);
  assert.equal(mine.headers.get("cache-control"),"no-store");
  const other=await request(origin,"list",{},"r221-session-b");
  assert.equal((await other.json()).entries.length,0);
  assert.equal((await request(origin,"remove",{id},"r221-session-b")).status,404);
  assert.equal((await request(origin,"list",{ownerUserId:"r221_fake_user_a"},"r221-session-b")).status,400);
  assert.equal((await request(origin,"create",{note:{...NOTE,localDate:"2026-11-03"}},"r221-session-a")).status,409);
  assert.equal((await request(origin,"remove",{id},"r221-session-a")).status,204);
  assert.equal(rows.length,0);
 });
});
