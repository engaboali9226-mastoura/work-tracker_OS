import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const server=readFileSync(new URL('../../noor-personal/src/application/personal-control.ts',import.meta.url),'utf8');
test('R129 historical corrections use R83 optimistic queue and never engage page-wide busy',()=>{
 assert.match(source,/onHistoryCommand=\{fastCommand\}/);
 assert.match(source,/runCommand\(change\.command,true\)/);
 assert.match(source,/if\(!background\)setBusy\(true\)/);
 assert.match(source,/row\.date===cmd\.localDate/);
 assert.match(source,/status=cmd\.completed\?'Completed':'Missed'/);
 assert.match(source,/fastQueue\.current\.filter/);
 assert.match(source,/setFailedChanges/);
 assert.match(source,/fastFailureKey\(change\)/);
});
test('R129 preserved R108 server-side historical date, ownership and occurrence guards',()=>{
 assert.match(server,/instance\.scheduleOccurrenceKey!==parsed\.localDate/);
 assert.match(server,/parsed\.localDate>=civilToday/);
 assert.match(server,/instance\.userId!==userId/);
 assert.match(source,/historyDate>=todayDate/);
 assert.match(source,/cmd\.endReason!==null/);
});
