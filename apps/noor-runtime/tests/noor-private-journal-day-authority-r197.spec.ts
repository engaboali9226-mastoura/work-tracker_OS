import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { PersonalControlOperation } from "../src/personal-control-operation.js";
import { NoorPrivateJournalOperationR185 } from "../src/noor-private-journal-r185.js";
import { assembleLabPrivateJournalR196 } from "../src/noor-private-journal-assembly-r196.js";
import type { JournalRowR185, JournalNoteR185 } from "../src/noor-private-journal-r185.js";

const DAY = "2026-11-04";
const NOW = "2026-11-04T12:00:00.000Z";
function fakeDay(userId="user_197", start="2026-11-04T00:12:00.000Z", end="2026-11-05T00:12:00.000Z", localDate=DAY) {
  return { state:"Open", userId, boundary:{startAt:start,endAt:end,localDate} };
}
function fixture() {
  const state = { days:[fakeDay()] as ReturnType<typeof fakeDay>[], now: NOW, authorized:true,
    openCalls:0, permissionCalls:0, identityCalls:0, sessionCalls:0 };
  const operation = new PersonalControlOperation({
    isRuntimeRunning:()=>true,
    resolveSession:{async execute({sessionId}:{sessionId:string}){
      state.sessionCalls++;
      if(sessionId !== "session-197")throw new Error("INVALID_SESSION");
      return {accountId:"account_197"};
    }},
    authorize:{async execute(){state.permissionCalls++;if(!state.authorized)throw new Error("NOT_AUTHORIZED");}},
    accountUserResolver:{async resolve(){state.identityCalls++;return {toString:()=>"user_197"};}},
    foundation:{async openOperation(){state.openCalls++;return {
      snapshot:{listPersonalDays(){return state.days;}}
    };}},
    clock:{now:()=>state.now},
    idGenerator:{next:()=>"unused"},
  } as never);
  return {state,operation};
}

test("R197 uses NOOR session, authorized internal user and active Personal Day",async()=>{
  const f=fixture();
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay("session-197"),
    {kind:"ok",userId:"user_197",localDate:DAY});
  assert.equal(f.state.openCalls,1);
  assert.equal(f.state.permissionCalls,1);
});
test("R197 refuses absent and invalid session before reading any Personal Day",async()=>{
  const f=fixture();
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay(null), {kind:"error",status:401});
  assert.equal(f.state.openCalls,0);
  assert.equal((await f.operation.resolveAuthorizedJournalPersonalDay("bad-session")).kind,"error");
  assert.equal(f.state.openCalls,0);
});
test("R197 refuses missing, stale, future, or ambiguous open days",async()=>{
  const f=fixture();
  f.state.days=[];
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay("session-197"),{kind:"error",status:409});
  f.state.days=[fakeDay("user_197","2026-11-03T00:00:00Z","2026-11-04T00:00:00Z")];
  assert.equal((await f.operation.resolveAuthorizedJournalPersonalDay("session-197")).kind,"error");
  f.state.days=[fakeDay(),fakeDay()];
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay("session-197"),{kind:"error",status:409});
});
test("R197 refuses a day owned by someone else or malformed date",async()=>{
  const f=fixture();
  f.state.days=[fakeDay("user_oth")];
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay("session-197"),{kind:"error",status:409});
  f.state.days=[fakeDay("user_197",undefined,undefined,"2026-02-30")];
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay("session-197"),{kind:"error",status:503});
});
test("R197 boundary instant is inclusive at start, exclusive at end",async()=>{
  const f=fixture();
  f.state.now="2026-11-04T00:12:00.000Z";
  assert.equal((await f.operation.resolveAuthorizedJournalPersonalDay("session-197")).kind,"ok");
  f.state.now="2026-11-05T00:12:00.000Z";
  assert.deepEqual(await f.operation.resolveAuthorizedJournalPersonalDay("session-197"),{kind:"error",status:409});
});
test("R197 privilege or persistence failure cannot silently return a date",async()=>{
  const f=fixture();
  f.state.authorized=false;
  assert.equal((await f.operation.resolveAuthorizedJournalPersonalDay("session-197")).kind,"error");
  assert.equal(f.state.openCalls,0);
});

function validNote(localDate?: string):JournalNoteR185 {
  return {kind:"ideas",title:"Synthetic",body:"PRIVATE_DUMMY_TEXT",category:"",helpful:"",precedingEvent:"",mood:null,shareApproved:false,...(localDate?{localDate}:{})};
}
function memoryJournal() {
  let writes=0,lists=0;
  const rows:JournalRowR185[]=[];
  const store={
    async insert(row:JournalRowR185){writes++;rows.push(row);return true;},
    async list(owner:string){lists++;return rows.filter(row=>row.ownerUserId===owner);},
    async remove(owner:string,id:string){const index=rows.findIndex(row=>row.ownerUserId===owner&&row.id===id);if(index<0)return false;rows.splice(index,1);return true;},
  };
  let currentDate=DAY, currentOwner="user_197";let available=true;
  const operation=new NoorPrivateJournalOperationR185({
    trust:{
      async resolveAuthorizedUser(sessionId:string){return sessionId==="session-197"?{status:200 as const,userId:"user_197"}:{status:401 as const};},
      async resolveAuthorizedPersonalDay(sessionId:string){
        if(!available) return {status:503 as const};
        return sessionId==="session-197"?{status:200 as const,userId:currentOwner,localDate:currentDate}:{status:401 as const};
      },
    },
    store,
    keyRing:{activeVersion:1,keys:new Map([[1,randomBytes(32)]])},
  });
  return {operation,rows,writes:()=>writes,lists:()=>lists,setDate(v:string){currentDate=v;},setOwner(v:string){currentOwner=v;},setAvailable(v:boolean){available=v;}};
}
test("R197 rejects absent and forged personal dates before any DB query",async()=>{
  const f=memoryJournal();
  assert.equal((await f.operation.create("session-197",validNote())).status,400);
  assert.equal((await f.operation.create("session-197",validNote("2026-11-03"))).status,409);
  assert.equal(f.writes(),0);
  assert.equal(f.lists(),0);
});
test("R197 accepts the authenticated Personal Day and stores only ciphertext",async()=>{
  const f=memoryJournal();
  assert.equal((await f.operation.create("session-197",validNote(DAY))).status,201);
  assert.equal(f.writes(),1);
  assert.ok(!JSON.stringify(f.rows).includes("PRIVATE_DUMMY_TEXT"));
  const fetched=await f.operation.list("session-197");
  assert.equal(fetched.status,200);
  assert.equal((fetched.body as {entries:JournalNoteR185[]}).entries[0]?.localDate,DAY);
});
test("R197 refuses an identity mismatch between session and day authority",async()=>{
  const f=memoryJournal();f.setOwner("user_oth");
  assert.equal((await f.operation.create("session-197",validNote(DAY))).status,409);
  assert.equal(f.writes(),0);
});
test("R197 rejects writes when Personal Day authority is unavailable",async()=>{
  const f=memoryJournal();f.setAvailable(false);
  assert.equal((await f.operation.create("session-197",validNote(DAY))).status,503);
  assert.equal(f.writes(),0);
});
test("R197 does not let a date valid earlier authorize a later write",async()=>{
  const f=memoryJournal();
  f.setDate("2026-11-05");
  assert.equal((await f.operation.create("session-197",validNote(DAY))).status,409);
  assert.equal(f.writes(),0);
});
test("R197 assembly refuses absent server Personal Day resolver",()=>{
  const pool={async connect(){throw Error("SYNTHETIC_DB_ONLY");}};
  const d={acknowledgement:"R196_ISOLATED_LOOPBACK_ONLY" as const,pool,keyRing:{activeVersion:1,keys:new Map([[1,randomBytes(32)]])}};
  assert.throws(()=>assembleLabPrivateJournalR196({resolveAuthorizedJournalUser:async()=>({kind:"ok",userId:"user_197"})} as never,d,"http://127.0.0.1:19496"));
});
