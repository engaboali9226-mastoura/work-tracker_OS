import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { makePrivateJournalHttpHandlerR186 } from "../src/noor-private-journal-http-r186.js";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PersonalControlOperation } from "../src/personal-control-operation.js";
import { createTrustedPrivateJournalR186 } from "../src/noor-private-journal-trusted-r186.js";
import { NoorPrivateJournalSqliteStoreR186 } from "../src/noor-private-journal-sqlite-r186.js";

const note = {kind:"feelings" as const,title:"Synthetic journal",body:"R186_SENTINEL_NEVER_PLAINTEXT_ON_DISK",
  precedingEvent:"synthetic event",helpful:"",category:"",mood:3,shareApproved:false};

test("R186 trusted Noor session and durable encrypted per-user SQLite lab gate", async t => {
  const root = mkdtempSync(join(tmpdir(), "noor-r186-synthetic-"));
  const file = join(root,"encrypted.sqlite");
  const key = randomBytes(32);
  let runtimeRunning = true;
  const observed = {authentication: 0, authorization: 0, accountResolution: 0};
  const personalControl = new PersonalControlOperation({
    isRuntimeRunning: () => runtimeRunning,
    resolveSession: {async execute({sessionId}: {sessionId:string}) {
      observed.authentication++;
      if (sessionId === "synthetic-session-A") return {accountId:"synthetic-account-A"};
      if (sessionId === "synthetic-session-B") return {accountId:"synthetic-account-B"};
      if (sessionId === "synthetic-denied") return {accountId:"synthetic-account-denied"};
      throw new Error("invalid session");
    }},
    authorize: {async execute({accountId}: {accountId: string}) {
      observed.authorization++;
      if (accountId === "synthetic-account-denied") throw new Error("denied");
      return {kind:"authorized"};
    }},
    accountUserResolver: {async resolve(accountId: string) {
      observed.accountResolution++;
      if (accountId === "synthetic-account-A") return {toString:()=>"internal-user-A"};
      if (accountId === "synthetic-account-B") return {toString:()=>"internal-user-B"};
      return null;
    }},
    foundation: {openOperation: async()=>{throw Error("unused");}},
    clock: {now:()=>new Date().toISOString()},
    idGenerator: {next:()=>"unused"},
  } as unknown as ConstructorParameters<typeof PersonalControlOperation>[0]);
  let store: NoorPrivateJournalSqliteStoreR186 | null = null;
  try {
    store = new NoorPrivateJournalSqliteStoreR186(file);
    let api = createTrustedPrivateJournalR186(personalControl,store,key);
    await t.test("reject missing, invalid and unauthorized session, fail closed",async()=>{
      assert.equal((await api.list(null)).status,401);
      assert.equal((await api.list("invalid-session")).status,503);
      assert.equal((await api.list("synthetic-denied")).status,503);
      runtimeRunning=false;
      assert.equal((await api.list("synthetic-session-A")).status,503);
      runtimeRunning=true;
    });
    await t.test("create user A; user B cannot read or remove A's entry",async()=>{
      const created=await api.create("synthetic-session-A",note);
      assert.equal(created.status,201);
      const id=(created.body as {id:string}).id;
      assert.equal((await api.list("synthetic-session-A")).status,200);
      const readB=await api.list("synthetic-session-B");
      assert.equal(readB.status,200);
      assert.deepEqual((readB.body as {entries:unknown[]}).entries,[]);
      assert.equal((await api.remove("synthetic-session-B",id)).status,404);
      assert.equal((await api.list("synthetic-session-A")).status,200);
    });
    await t.test("encrypted persistent file never contains plaintext and survives reopen",async()=>{
      store!.close();store=null;
      const bytes=readFileSync(file);
      assert.equal(bytes.includes(Buffer.from(note.body,"utf8")),false);
      store=new NoorPrivateJournalSqliteStoreR186(file);
      api=createTrustedPrivateJournalR186(personalControl,store,key);
      const result=await api.list("synthetic-session-A");
      assert.equal(result.status,200);
      assert.equal((result.body as {entries:{body:string}[]}).entries[0]?.body,note.body);
    });
    await t.test("real loopback HTTP: NOOR cookie parser, CSRF origin, user isolation, schema rejection",async()=>{
      let handler: ((req:IncomingMessage,res:ServerResponse)=>Promise<void>)|null=null;
      const server=createServer((req,res)=>{if (!handler) {res.writeHead(503);res.end();return;}void handler(req,res);});
      await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
      const address=server.address();assert.ok(address&&typeof address!=="string");
      const origin=`http://127.0.0.1:${address.port}`;
      handler=makePrivateJournalHttpHandlerR186(api,origin);
      const req=async(action:string,payload:unknown,cookie:string|null,site=origin)=>{
        const headers:Record<string,string>={"Content-Type":"application/json","Origin":site};
        if(cookie)headers.Cookie=cookie;
        const response=await fetch(`${origin}/api/noor/personal/journal/${action}`,{
          method:"POST",headers,body:JSON.stringify(payload)});
        const result=response.status===200||response.status===201?await response.json():null;
        return {status:response.status,data:result,headers:response.headers};
      };
      try {
        assert.equal((await req("list",{},null)).status,401);
        assert.equal((await req("list",{},"noor_session=synthetic-session-A; noor_session=synthetic-session-B")).status,401);
        assert.equal((await req("list",{},"noor_session=synthetic-session-A","https://evil.example")).status,403);
        assert.equal((await req("create",{note:{...note,userId:"internal-user-B"}},"noor_session=synthetic-session-A")).status,400);
        const c=await req("create",{note:{...note,title:"from HTTP"}},"noor_session=synthetic-session-A");
        assert.equal(c.status,201);
        assert.equal((await req("remove",{id:c.data.id},"noor_session=synthetic-session-B")).status,404);
        const read=await req("list",{},"noor_session=synthetic-session-A");
        assert.equal(read.status,200);
        assert.equal(read.headers.get("cache-control"),"no-store");
        assert.ok(read.data.entries.some((r:{title:string})=>r.title==="from HTTP"));
        const other=await req("list",{},"noor_session=synthetic-session-B");
        assert.equal(other.status,200);
        assert.deepEqual(other.data.entries,[]);
        assert.equal((await req("remove",{id:c.data.id},"noor_session=synthetic-session-A")).status,204);
      } finally {await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
    });
    await t.test("key mismatch fails closed after restart",async()=>{
      const wrong=createTrustedPrivateJournalR186(personalControl,store!,randomBytes(32));
      assert.equal((await wrong.list("synthetic-session-A")).status,503);
    });
    await t.test("reject client owner injection; private journal never exported",async()=>{
      assert.equal((await api.create("synthetic-session-A",{...note,ownerUserId:"internal-user-B"})).status,400);
      assert.deepEqual((await api.exportApproved("synthetic-session-A")).body,{entries:[]});
    });
    assert.ok(observed.authentication>0);
    assert.ok(observed.authorization>0);
    assert.ok(observed.accountResolution>0);
  } finally {store?.close();rmSync(root,{recursive:true,force:true});}
});
