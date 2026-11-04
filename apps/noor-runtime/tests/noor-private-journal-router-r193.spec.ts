import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import test from 'node:test';
import {createRouteAccessHttpServer} from '../src/route-access-http-server.js';
import {NoorPrivateJournalOperationR185, type JournalRowR185} from '../src/noor-private-journal-r185.js';
import {createNoorPrivateJournalClientR193, NoorJournalHttpErrorR193, type NoorJournalFetchR193} from '../../web/src/noor-private-journal-client-r193.js';

async function availablePort():Promise<number> {
  const probe=createServer();
  await new Promise<void>((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
  const address=probe.address();assert.ok(address&&typeof address!=='string');
  await new Promise<void>((resolve,reject)=>probe.close(error=>error?reject(error):resolve()));
  if(address.port===8787) return availablePort();
  return address.port;
}

const syntheticNote={kind:'feelings' as const,title:'Test diary',body:'FAKE_R193_NOT_PRIVATE_DATA',precedingEvent:'',helpful:'',category:'',mood:3,shareApproved:false};

test('R193 optional Noor router + same-origin browser client: synthetic end-to-end',async()=>{
  const rows=new Map<string,JournalRowR185>();
  const store={
    async insert(row:JournalRowR185){rows.set(row.id,row);return true;},
    async list(owner:string){return [...rows.values()].filter(row=>row.ownerUserId===owner);},
    async remove(owner:string,id:string){const row=rows.get(id);return !!row&&row.ownerUserId===owner&&rows.delete(id);},
  };
  const journal=new NoorPrivateJournalOperationR185({
    trust:{resolveAuthorizedUser:async sessionId=>{
      if(sessionId==='synthetic-A')return {status:200 as const,userId:'fake-user-A'};
      if(sessionId==='synthetic-B')return {status:200 as const,userId:'fake-user-B'};
      return {status:401 as const};
    }},
    store,encryptionKey:randomBytes(32),
  });
  const evidence={execute:async({request}:{request:{appKey:string;pathname:string}})=>({kind:'authentication-required' as const,appKey:request.appKey,pathname:request.pathname})};
  const port=await availablePort();
  const origin=`http://127.0.0.1:${port}`;
  const inactive=createRouteAccessHttpServer(evidence);
  await inactive.listen({host:'127.0.0.1',port});
  try{
    const res=await fetch(origin+'/api/noor/personal/journal/list',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
    assert.equal(res.status,404,'disabled router must not expose journal route');
  }finally{await inactive.close();}
  const server=createRouteAccessHttpServer(evidence,{labPrivateJournalR193:{operation:journal,expectedOrigin:origin}});
  await server.listen({host:'127.0.0.1',port});
  try {
    const calls:RequestInit[]=[];
    const browser=(session:string):NoorJournalFetchR193=>async(path,init)=>{
      assert.equal(path.startsWith('/api/noor/personal/journal/'),true);
      calls.push(init);
      assert.equal(init.credentials,'same-origin');
      assert.equal(init.mode,'same-origin');
      assert.equal(init.cache,'no-store');
      assert.equal(init.redirect,'error');
      assert.equal(typeof init.headers,'object');
      assert.equal(JSON.stringify(init.headers).includes('Authorization'),false);
      assert.equal(JSON.stringify(init.headers).includes('Cookie'),false);
      assert.equal(JSON.stringify(init.headers).includes('Origin'),false);
      // Test-only browser stand-in. A real browser sends Origin + HttpOnly cookie automatically.
      return fetch(origin+path,{...init,headers:{...init.headers,Origin:origin,Cookie:`noor_session=${session}`,'Sec-Fetch-Site':'same-origin'}});
    };
    const a=createNoorPrivateJournalClientR193(browser('synthetic-A'));
    const b=createNoorPrivateJournalClientR193(browser('synthetic-B'));
    assert.deepEqual(await a.list(),[]);
    const id=await a.create(syntheticNote);
    assert.equal((await a.list())[0]?.body,syntheticNote.body);
    assert.deepEqual(await b.list(),[]);
    await assert.rejects(b.remove(id),(error:unknown)=>error instanceof NoorJournalHttpErrorR193&&error.status===404);
    const stored=[...rows.values()];assert.equal(stored.length,1);
    assert.equal(stored[0]?.ciphertext.includes(syntheticNote.body),false);
    assert.equal(stored[0]?.ownerUserId,'fake-user-A');
    assert.deepEqual(await a.exportApproved(),[]);
    await a.remove(id);
    assert.deepEqual(await a.list(),[]);
    const forged=await fetch(origin+'/api/noor/personal/journal/list',{method:'POST',headers:{'Content-Type':'application/json',Cookie:'noor_session=synthetic-A'},body:'{}'});
    assert.equal(forged.status,403,'missing Origin is denied');
    assert.equal(calls.length>0,true);
  }finally{await server.close();}
});
