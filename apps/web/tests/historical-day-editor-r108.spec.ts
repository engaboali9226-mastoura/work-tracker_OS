import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const server=readFileSync(new URL('../../noor-personal/src/application/personal-control.ts',import.meta.url),'utf8');
test('R108: dashboard offers historical dates, old-day corrections and notes',()=>{
 assert.doesNotMatch(source,/data-testid="inpage-history-banner-r110"/);
 assert.match(source,/data-week-navigation="r109"/);
 assert.match(source,/data-testid="week-history-previous"/);
 assert.doesNotMatch(source,/<HistoryDayEditor workspace=/);
 assert.doesNotMatch(source,/<details className="np-history-editor"/);
 assert.match(source,/correct-historical-execution/);
 assert.match(source,/record-historical-progress/);
 assert.match(source,/type:"edit-activity-note"/);
 assert.match(source,/onHistoryCommand=\{fastCommand\}/);
});
test('R108: past commands never bypass active-day protection or fabricate occurrences',()=>{
 assert.match(server,/instance\.scheduleOccurrenceKey!==parsed\.localDate/);
 assert.match(server,/parsed\.localDate>=civilToday/);
 assert.match(server,/at:now,note:parsed\.note,amount:parsed\.amount/);
 assert.match(server,/enqueueExecutionStatusEvent/);
 assert.match(server,/transaction\.findDailyExecutionById\(userId,parsed\.executionId\)/);
 assert.match(server,/if\(!instance \|\| instance\.userId!==userId\) throw new PersonalControlError\("EXECUTION_NOT_FOUND"\)/);
});
