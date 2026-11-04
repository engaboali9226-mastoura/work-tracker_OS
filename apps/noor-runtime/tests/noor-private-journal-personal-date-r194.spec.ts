import assert from 'node:assert/strict';
import test from 'node:test';
import {parseJournalNoteR185,NoorPrivateJournalOperationR185,type JournalRowR185} from '../src/noor-private-journal-r185.js';
import {randomBytes} from 'node:crypto';
const old={kind:'feelings',title:'test',body:'FAKE',precedingEvent:'',helpful:'',category:'',mood:3,shareApproved:false};
test('R194 old encrypted records still parse, new records securely preserve personal day',()=>{
 assert.deepEqual(parseJournalNoteR185(old),old);
 assert.equal(parseJournalNoteR185({...old,localDate:'2026-11-03'})?.localDate,'2026-11-03');
 for(const date of ['2026-02-30','2026-13-01','2026-11-00','wrong','2026-11-04T00:00:00Z']){
  assert.equal(parseJournalNoteR185({...old,localDate:date}),null);
 }
 assert.equal(parseJournalNoteR185({...old,ownerUserId:'fake'}),null);
});
test('R194 encrypted owner-bound row carries personal-day metadata inside ciphertext only',async()=>{
 const rows:JournalRowR185[]=[];
 const service=new NoorPrivateJournalOperationR185({
  trust:{resolveAuthorizedUser:async id=>id==='fake-session'?{status:200 as const,userId:'fake-user-1'}:{status:401 as const}},
  store:{insert:async row=>{rows.push(row);return true;},list:async user=>rows.filter(x=>x.ownerUserId===user),remove:async()=>false},
  encryptionKey:randomBytes(32),
 });
 const result=await service.create('fake-session',{...old,localDate:'2026-11-03'});
 assert.equal(result.status,201);
 assert.equal(rows.length,1);
 assert.equal(JSON.stringify(rows[0]).includes('2026-11-03'),false);
 const list=await service.list('fake-session');
 assert.equal(list.status,200);
 assert.equal((list.body as {entries:{localDate:string}[]}).entries[0]?.localDate,'2026-11-03');
 assert.equal((await service.list('wrong')).status,401);
});
