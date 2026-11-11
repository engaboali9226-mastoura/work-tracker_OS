import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');

test('R139: history selection shows a shadow without a yellow ribbon or layout spacer',()=>{
  assert.match(s,/NOOR_R139_SELECTED_DAY_SHADOW_ONLY/);
  assert.match(s,/\.np-page \.np-week-day\.is-selected\{box-shadow:/);
  assert.doesNotMatch(s,/data-testid="inpage-history-banner-r110"/);
  assert.doesNotMatch(s,/data-testid="historical-date-stable-slot-r135"/);
  assert.match(s,/data-week-selected=\{historyDate===day\.date/);
});

test('R111 keeps navigation and history mutation guards, removes weekly help text',()=>{
  assert.match(s,/data-testid="week-history-previous"/);
  assert.match(s,/data-testid="week-history-next"/);
  assert.match(s,/setHistoryDate\(day\.date\)/);
  assert.match(s,/setHistoryDate\(null\)/);
  assert.match(s,/data-history-page=\{historyDate\?"historical":"current"\}/);
  assert.match(s,/type:"correct-historical-execution"/);
  assert.match(s,/type:"record-historical-progress"/);
  assert.doesNotMatch(s,/<p className="np-week-navigation-hint">/);
  assert.doesNotMatch(s,/لا يمكن إنشاء سجلات ماضية افتراضيًا/);
});

test('R111 preserves original daily views and R107 accordion cards',()=>{
  assert.match(s,/NOOR_COLLAPSIBLE_HABIT_CARDS_R107_BEGIN/);
  assert.match(s,/data-testid="habit-category-grid"/);
  assert.match(s,/data-testid="habit-category-card"/);
  assert.doesNotMatch(s,/<span>كل قسم، خطوة للأمام<\/span>/);
  assert.match(s,/historyDate\?historicalCommand:onCommand/);
  assert.match(s,/NOOR_INPAGE_HISTORY_R110/);
  assert.doesNotMatch(s,/np-inpage-history-banner button\{/);
});
