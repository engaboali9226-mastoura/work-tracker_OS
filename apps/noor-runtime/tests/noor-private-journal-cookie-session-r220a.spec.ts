import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { AuthorizationDeniedError, InvalidCredentialsError, InvalidSessionError, UserId } from '@worktracker/core';
import { PersonalControlOperation } from '../src/personal-control-operation.js';
import { PrivilegedSessionEstablishmentOperation } from '../src/privileged-session-establishment-operation.js';
import { createRouteAccessHttpServer } from '../src/route-access-http-server.js';
import { NoorPrivateJournalOperationR185 } from '../src/noor-private-journal-r185.js';
import type { JournalRowR185, JournalEncryptedStoreR185 } from '../src/noor-private-journal-r185.js';

const DAY = '2026-11-04';
const NOW = '2026-11-04T12:00:00.000Z';
const A = 'synthetic_user_r220_a', B = 'synthetic_user_r220_b';
const ACCOUNT_A = 'synthetic_account_r220_a', ACCOUNT_B = 'synthetic_account_r220_b';
const note = {kind:'ideas',title:'Synthetic private entry',body:'R220_FAKE_PRIVATE_TEXT_ONLY',
  category:'',precedingEvent:'',helpful:'',mood:null,shareApproved:false,localDate:DAY};

async function availablePort(): Promise<number> {
  const probe=createServer();
  await new Promise<void>((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
  const address=probe.address();
  assert.ok(address && typeof address !== 'string');
  await new Promise<void>(resolve=>probe.close(()=>resolve()));
  if(!address || typeof address==='string')throw Error('NO_FREE_PORT');
  return address.port===8787 ? availablePort() : address.port;
}

test('R220A real NOOR session-cookie and journal HTTP chain (synthetic auth ports, no production)', async t=>{
  const sessions = new Map<string,{accountId:string,expires:number,revoked:boolean}>();
  const rows:JournalRowR185[]=[];
  const events={sessionResolve:0,authorization:0,accountResolve:0,dayResolve:0,storeRead:0};
  let permissionDenied=false,ambiguousDay=false;
  const store:JournalEncryptedStoreR185={
    async insert(row){rows.push(row);return true;},
    async list(owner){events.storeRead++;return rows.filter(row=>row.ownerUserId===owner);},
    async remove(owner,id){const index=rows.findIndex(row=>row.ownerUserId===owner&&row.id===id);
      if(index<0)return false;rows.splice(index,1);return true;},
  };
  const actualControl=new PersonalControlOperation({
    isRuntimeRunning:()=>true,
    resolveSession:{async execute({sessionId}:{sessionId:string}){
      events.sessionResolve++;
      const session=sessions.get(sessionId);
      if(!session || session.revoked || Date.now()>=session.expires)throw new InvalidSessionError();
      return {accountId:session.accountId};
    }},
    authorize:{async execute({accountId}:{accountId:string}){
      events.authorization++;
      if(permissionDenied || (accountId!==ACCOUNT_A && accountId!==ACCOUNT_B))throw new AuthorizationDeniedError();
    }},
    accountUserResolver:{async resolve(accountId:string){
      events.accountResolve++;
      if(accountId===ACCOUNT_A)return new UserId(A);
      if(accountId===ACCOUNT_B)return new UserId(B);
      return null;
    }},
    foundation:{async openOperation(userId:string){
      events.dayResolve++;
      const day={state:'Open',userId,boundary:{localDate:DAY,startAt:'2026-11-04T00:00:00.000Z',
        endAt:'2026-11-05T00:00:00.000Z'}};
      return {snapshot:{listPersonalDays(){return ambiguousDay?[day,day]:[day];}}};
    }},
    clock:{now:()=>NOW},
    idGenerator:{next:()=>{throw Error('R220_NO_ID_GENERATOR');}},
  } as never);
  const sessionOperation=new PrivilegedSessionEstablishmentOperation({
    isRuntimeRunning:()=>true,
    authenticate:{async execute({proof}:{proof:string}){
      if(proof==='R220-A-TEST-PROOF')return {accountId:ACCOUNT_A,userId:new UserId(A)} as never;
      if(proof==='R220-B-TEST-PROOF')return {accountId:ACCOUNT_B,userId:new UserId(B)} as never;
      throw new InvalidCredentialsError();
    }},
    createSession:{async execute({authentication}:{authentication:{accountId:string}}){
      const id='R220-'+randomBytes(24).toString('hex');
      const expires=Date.now()+120_000;
      sessions.set(id,{accountId:authentication.accountId,expires,revoked:false});
      return {id,accountId:authentication.accountId,createdAtEpochMs:Date.now(),
        expiresAtEpochMs:expires,revokedAtEpochMs:null} as never;
    }},
  });
  const operation=new NoorPrivateJournalOperationR185({
    trust:{
      async resolveAuthorizedUser(sessionId:string){
        const r=await actualControl.resolveAuthorizedJournalUser(sessionId);
        return r.kind==='ok'?{status:200 as const,userId:r.userId}:{status:r.status};
      },
      async resolveAuthorizedPersonalDay(sessionId:string){
        const r=await actualControl.resolveAuthorizedJournalPersonalDay(sessionId);
        return r.kind==='ok'?{status:200 as const,userId:r.userId,localDate:r.localDate}:{status:r.status};
      },
    },
    store,
    keyRing:{activeVersion:2,keys:new Map([[1,randomBytes(32)],[2,randomBytes(32)]])},
  });
  const port=await availablePort(),origin='http://127.0.0.1:'+port;
  const server=createRouteAccessHttpServer({
    async execute({request}){return {kind:'authentication-required',appKey:request.appKey,pathname:request.pathname};}
  },{sessionEstablishment:{executor:sessionOperation,publicOrigin:origin,secureCookie:false},
    labPrivateJournalR193:{operation,expectedOrigin:origin}});
  let serverStarted=false;
  async function post(path:string,body:unknown,headers:Record<string,string>={}){
    return fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,
      'Sec-Fetch-Site':'same-origin',...headers},body:JSON.stringify(body)});
  }
  async function establish(proof:string){
    const response=await post('/api/noor/session',{proof});
    assert.equal(response.status,204);
    const setCookie=response.headers.get('set-cookie');
    assert.ok(setCookie && /^noor_session=/.test(setCookie));
    assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);
    assert.equal(response.headers.get('cache-control'),'no-store');
    return setCookie.split(';')[0]!;
  }
  const list=(cookie?:string)=>post('/api/noor/personal/journal/list',{},cookie?{Cookie:cookie}:{});
  const create=(cookie:string,n:unknown=note)=>post('/api/noor/personal/journal/create',{note:n},{Cookie:cookie});
  const remove=(cookie:string,id:string)=>post('/api/noor/personal/journal/remove',{id},{Cookie:cookie});
  try {
    await server.listen({host:'127.0.0.1',port});serverStarted=true;
    const cookieA=await establish('R220-A-TEST-PROOF');
    const cookieB=await establish('R220-B-TEST-PROOF');
    const sidA=cookieA.slice('noor_session='.length);
    await t.test('real session establishment produces separate HttpOnly SameSite cookies',async()=>{
      assert.notEqual(cookieA,cookieB);
      assert.equal(sessions.size,2);
      assert.equal((await list(cookieA)).status,200);
      assert.equal((await list(cookieB)).status,200);
    });
    let id='';
    await t.test('A writes through real cookie->PersonalControl->PersonalDay->AES-GCM store',async()=>{
      const r=await create(cookieA);assert.equal(r.status,201);id=(await r.json()).id;
      assert.ok(id);
      assert.equal(rows.length,1);
      assert.equal(rows[0]?.ownerUserId,A);
      assert.ok(!JSON.stringify(rows).includes(note.body),'plaintext must not reach store');
      const listA=await list(cookieA);assert.equal(listA.status,200);
      const body=await listA.json();assert.equal(body.entries.length,1);
      assert.equal(body.entries[0].body,note.body);
      assert.ok(events.authorization>0 && events.accountResolve>0 && events.dayResolve>0);
    });
    await t.test('B sees no A entries, cannot delete A, and can own an independent row',async()=>{
      const listed=await list(cookieB);assert.equal(listed.status,200);
      assert.equal((await listed.json()).entries.length,0);
      assert.equal((await remove(cookieB,id)).status,404);
      const own=await create(cookieB);assert.equal(own.status,201);
      assert.equal(rows.length,2);
      assert.equal(rows.filter(row=>row.ownerUserId===B).length,1);
      const check=await list(cookieA);assert.equal((await check.json()).entries.length,1);
    });
    await t.test('invalid proof, no cookie, forged cookie and duplicate cookies are denied',async()=>{
      assert.equal((await post('/api/noor/session',{proof:'WRONG'})).status,401);
      assert.equal((await list()).status,401);
      assert.equal((await list('noor_session=not-a-session')).status,401);
      assert.equal((await list(cookieA+'; '+cookieB)).status,401);
    });
    await t.test('revoked and expired Noor session cookies deny journal access',async()=>{
      sessions.get(sidA)!.revoked=true;
      assert.equal((await list(cookieA)).status,401);
      sessions.get(sidA)!.revoked=false;
      sessions.get(sidA)!.expires=Date.now()-1;
      assert.equal((await list(cookieA)).status,401);
      sessions.get(sidA)!.expires=Date.now()+120_000;
    });
    await t.test('wrong Personal Day and authorization denial reject writes before storage',async()=>{
      const before=rows.length;
      assert.equal((await create(cookieA,{...note,localDate:'2026-11-03'})).status,409);
      ambiguousDay=true;
      try{assert.equal((await create(cookieA)).status,409);}finally{ambiguousDay=false;}
      permissionDenied=true;
      try{assert.equal((await create(cookieA)).status,403);}finally{permissionDenied=false;}
      assert.equal(rows.length,before);
    });
    await t.test('HTTP Origin and cross-site metadata fail before trusted session handling',async()=>{
      const before=events.sessionResolve;
      const path='/api/noor/personal/journal/list';
      const without=await fetch(origin+path,{method:'POST',headers:{Cookie:cookieA,'Content-Type':'application/json'},body:'{}'});
      assert.equal(without.status,403);
      const foreign=await post(path,{}, {Cookie:cookieA,Origin:'https://untrusted.example'});
      assert.equal(foreign.status,403);
      const cross=await post(path,{}, {Cookie:cookieA,'Sec-Fetch-Site':'cross-site'});
      assert.equal(cross.status,403);
      assert.equal(events.sessionResolve,before);
    });
    await t.test('caller-provided owner and identity cannot select a different user',async()=>{
      assert.equal((await create(cookieB,{...note,ownerUserId:A})).status,400);
      const r=await post('/api/noor/personal/journal/list',{ownerUserId:A},{Cookie:cookieB});
      assert.equal(r.status,400);
    });
    await t.test('unregistered production journal route fails closed',async()=>{
      const productionLike=createRouteAccessHttpServer({
        async execute({request}){return {kind:'authentication-required',appKey:request.appKey,pathname:request.pathname};}
      },{});
      await productionLike.listen({host:'127.0.0.1',port:0});
      try {
        const address=productionLike.address();assert.ok(address && typeof address!=='string');
        if(!address || typeof address==='string')throw Error('NO_TEST_LISTENER');
        const r=await fetch('http://127.0.0.1:'+address.port+'/api/noor/personal/journal/list',{
          method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
        assert.equal(r.status,404);
      } finally {await productionLike.close();}
    });
    await t.test('A may delete its own entry; sensitive response values never include keys',async()=>{
      assert.equal((await remove(cookieA,id)).status,204);
      assert.equal(rows.filter(r=>r.ownerUserId===A).length,0);
      assert.equal(rows.filter(r=>r.ownerUserId===B).length,1);
      const r=await list(cookieB);const response=await r.text();
      assert.ok(!response.includes('keyVersion')&&!response.includes('ciphertext')&&!response.includes('tag'));
    });
  } finally {
    if(serverStarted)await server.close();
    sessions.clear();rows.length=0;
  }
});
