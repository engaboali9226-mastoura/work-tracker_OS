import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const home=s.slice(s.indexOf('function Dashboard('));
test('R139: main page has no extra category selector; existing category cards remain',()=>{
 assert.ok(home.startsWith('function Dashboard('));
 assert.doesNotMatch(home,/habit-category-filter-r130|np-category-filter-r130|activeCategory|visibleGroups/);
 assert.match(home,/grouped\.map\(\(\[category,items\]\)/);
 assert.match(home,/data-testid="habit-category-card"/);
 assert.match(s,/data-testid="control-category-filter-r135"/);
 assert.match(s,/data-testid="control-habit-cards-r135"/);
});
test('R139: past-day selection changes only shadow, not layout or scroll',()=>{
 assert.match(s,/NOOR_R139_SELECTED_DAY_SHADOW_ONLY/);
 assert.match(s,/\.np-page \.np-week-day\.is-selected\{box-shadow:/);
 assert.doesNotMatch(s,/inpage-history-banner-r110|historical-date-stable-slot-r135|np-inpage-history-slot-r135/);
 assert.doesNotMatch(s,/querySelector<HTMLElement>\('\.np-main-grid\.np-daily-only'\)\?\.scrollIntoView/);
 assert.match(s,/data-week-selected=\{historyDate===day\.date/);
 assert.match(s,/data-history-page=\{historyDate\?"historical":"current"\}/);
});
test('R139: R137 edit dialog and R132 finance/historical saving remain in place',()=>{
 assert.match(s,/createPortal\(<div className="np-cc-modal-backdrop"/);
 assert.match(s,/data-testid="np-definition-save-r130"/);
 assert.match(s,/onHistoryCommand=\{fastCommand\}/);
 assert.match(s,/data-testid="people-payment-filter-r130"/);
});
