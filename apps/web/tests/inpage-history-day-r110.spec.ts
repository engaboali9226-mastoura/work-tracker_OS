import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const core=readFileSync(new URL('../../noor-personal/src/application/personal-control.ts',import.meta.url),'utf8');
test('R110: week selection is in-page; no day overlay or history-day card is rendered',()=>{
 assert.match(s,/NOOR_INPAGE_HISTORY_R110/);
 assert.match(s,/data-week-navigation="r109"/);
 assert.match(s,/data-week-selected=\{historyDate===day\.date\?"true":"false"\}/);
 assert.match(s,/data-testid="inpage-history-banner-r110"/);
 assert.match(s,/data-history-page=\{historyDate\?"historical":"current"\}/);
 assert.doesNotMatch(s,/<HistoryDayEditor workspace=/);
 assert.doesNotMatch(s,/data-week-editor="r109"/);
 assert.match(s,/setHistoryDate\(day\.date\)/);
});
test('R110: historical tasks and habits reuse the real R107 layout and ActivityCard',()=>{
 assert.match(s,/historyDate\?historicalCommand:onCommand/);
 assert.match(s,/historicalDate=\{historyDate\}/);
 assert.match(s,/historicalDate\?\(completed\?"إلغاء الإتمام":"إتمام"\)/);
 assert.match(s,/className="np-habits-section np-history-page"/);
 assert.match(s,/data-testid="habit-category-card"/);
 assert.match(s,/data-testid="habit-category-grid"/);
 assert.match(s,/np-history-page/);
});
test('R110: mutations go through guarded R108 commands; historical rows are real recorded instances',()=>{
 assert.match(s,/workspace\?\.statistics\.rows\?\.filter\(row=>row.date===historyDate\)/);
 assert.match(s,/type:"correct-historical-execution"/);
 assert.match(s,/type:"record-historical-progress"/);
 assert.match(s,/type:"edit-activity-note"/);
 assert.match(s,/historyDate>=todayDate/);
 assert.match(s,/cmd\.endReason!==null/);
 assert.match(core,/instance\.scheduleOccurrenceKey!==parsed\.localDate/);
 assert.match(core,/parsed\.localDate>=civilToday/);
});
