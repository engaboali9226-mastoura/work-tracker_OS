import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const r108=readFileSync(new URL('../../noor-personal/src/application/personal-control.ts',import.meta.url),'utf8');
test('R109: history navigates from weekly achievement strip with bounded previous/next arrows',()=>{
 assert.match(ui,/data-week-navigation="r109"/);
 assert.match(ui,/data-testid="week-history-previous"/);
 assert.match(ui,/data-testid="week-history-next"/);
 assert.match(ui,/disabled=\{!canGoOlder\}/);
 assert.match(ui,/disabled=\{weekShift===0\}/);
 assert.match(ui,/shiftStatisticDate\(day\.date,weekShift\*7\)/);
 assert.match(ui,/data-week-date=\{day\.date\}/);
});
test('R109: selected historical day opens editor without independent legacy card or date picker',()=>{
 assert.match(ui,/setHistoryDate\(day\.date\)/);
 assert.match(ui,/data-testid="inpage-history-banner-r110"/);
 assert.match(ui,/data-history-page=\{historyDate\?"historical":"current"\}/);
 assert.match(ui,/setHistoryDate\(null\)/);
 assert.doesNotMatch(ui,/<details className="np-history-editor"/);
 assert.doesNotMatch(ui,/<input id="np-history-date"/);
 assert.match(ui,/record-historical-progress/);
 assert.match(ui,/correct-historical-execution/);
 assert.match(r108,/instance\.scheduleOccurrenceKey!==parsed\.localDate/);
});
test('R109: future days are disabled and current day uses existing live controls',()=>{
 assert.match(ui,/disabled=\{day\.future\}/);
 assert.match(ui,/scrollIntoView\?\./);
 assert.match(ui,/data-week-state=\{day\.future\?"future":day\.current\?"today":"past"\}/);
});
