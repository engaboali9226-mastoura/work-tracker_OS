import assert from 'node:assert/strict';
import test from 'node:test';
import {createNoorPrivateJournalClientR193, NoorJournalHttpErrorR193, type NoorJournalFetchR193} from '../src/noor-private-journal-client-r193.js';

test('R193 client: sends no credential header, never caches, refuses invalid responses',async()=>{
  const seen:RequestInit[]=[];
  const transport:NoorJournalFetchR193=async(_path,init)=>{
    seen.push(init);
    return new Response(JSON.stringify({entries:[]}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  };
  const client=createNoorPrivateJournalClientR193(transport);
  assert.deepEqual(await client.list(),[]);
  assert.equal(seen.length,1);
  const request=seen[0]!;
  assert.equal(request.credentials,'same-origin');
  assert.equal(request.mode,'same-origin');
  assert.equal(request.cache,'no-store');
  assert.equal(request.redirect,'error');
  assert.deepEqual(request.headers,{'Content-Type':'application/json'});
  await assert.rejects(createNoorPrivateJournalClientR193(async()=>new Response('{}',{status:401})).list(),
    (error:unknown)=>error instanceof NoorJournalHttpErrorR193&&error.status===401);
  await assert.rejects(createNoorPrivateJournalClientR193(async()=>new Response('NOT_JSON',{status:200,headers:{'Content-Type':'application/json'}})).list());
  await assert.rejects(createNoorPrivateJournalClientR193(async()=>new Response('{"entries":[{"ownerUserId":"forged"}]}',{status:200,headers:{'Content-Type':'application/json'}})).list());
  await assert.rejects(client.remove('forged-id'));
});
