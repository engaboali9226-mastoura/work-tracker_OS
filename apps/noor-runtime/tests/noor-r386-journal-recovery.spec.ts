import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {NoorPrivateJournalOperationR185} from '../src/noor-private-journal-r185.js';
import {parseJournalServerKeyRingR198} from '../src/noor-private-journal-release-guard-r198.js';
import {verifyJournalRows} from '../../../tools/data-foundation/r386/g0-journal-recovery.mjs';

test('R386 actual R185 recovery path checks every row, old versions and negative cases', async () => {
  const keys = [randomBytes(32), randomBytes(32)];
  const pairs = keys.map((key,i)=>String(i+1)+'='+key.toString('base64')).join(',');
  const ring = (active:number) => parseJournalServerKeyRingR198({
    NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION:String(active),
    NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64:pairs
  });
  const rows:any[] = [];
  const note = {kind:'ideas', title:'synthetic note', body:'synthetic body', precedingEvent:'',
    helpful:'', category:'', mood:null, shareApproved:false};
  for (const [owner,version] of [['r386_synthetic_a',1],['r386_synthetic_b',2]] as const) {
    const writer = new NoorPrivateJournalOperationR185({
      trust:{resolveAuthorizedUser:async()=>({status:200,userId:owner})},
      store:{list:async()=>rows.filter(r=>r.ownerUserId===owner),
        insert:async row=>{rows.push(row);return true;},remove:async()=>false},
      keyRing:ring(version)
    });
    assert.equal((await writer.create('synthetic',note)).status,201);
  }
  assert.deepEqual(await verifyJournalRows(rows,ring(2),2),{
    decrypted:2,versions:[{version:1,count:1},{version:2,count:1}],
    wrongKeyRejected:true,missingVersionRejected:true,tamperedTagRejected:true,foreignOwnerRejected:true
  });
  await assert.rejects(verifyJournalRows(rows.slice(0,1),ring(2),2),/RECOVERY_REJECTED/);
  const partial = {activeVersion:2,keys:new Map([[2,keys[1]]])};
  await assert.rejects(verifyJournalRows(rows,partial,2),/RECOVERY_REJECTED/);
  const corrupted = [{...rows[0],ciphertext:Buffer.from('synthetic tampered ciphertext').toString('base64')},rows[1]];
  await assert.rejects(verifyJournalRows(corrupted,ring(2),2),/RECOVERY_REJECTED/);
});
