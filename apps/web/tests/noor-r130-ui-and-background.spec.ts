import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
test('R130 historical writes use R83 queue without page-wide busy',()=>{
 assert.match(s,/onHistoryCommand=\{fastCommand\}/);
 assert.match(s,/runCommand\(change\.command,true\)/);
 assert.match(s,/if\(!background\)setBusy\(true\)/);
 assert.match(s,/correct-historical-execution/);
 assert.match(s,/record-historical-progress/);
 assert.match(s,/row\.date===cmd\.localDate/);
});
test('R130 habit edit modal has fixed accessible submit footer and scrollable content',()=>{
 assert.match(s,/id="np-definition-edit-form"/);
 assert.match(s,/form="np-definition-edit-form"/);
 assert.match(s,/data-testid="np-definition-save-r130"/);
 assert.match(s,/\.np-cc-modal-body\{[^}]*overflow-y:auto;/);
 assert.match(s,/NOOR_R130_MODAL_SCROLL_SAVE/);
});
test('R130 habit category filter preserves one card per category and all-default',()=>{
 assert.match(s,/data-testid="habit-category-filter-r130"/);
 assert.match(s,/const visibleGroups=activeCategory==="all"\?grouped:/);
 assert.match(s,/visibleGroups\.map\(\(\[category,items\]\)/);
 assert.match(s,/data-testid="habit-category-card"/);
});
test('R130 finance people list has repayment-state filtering, separate from debt detail',()=>{
 assert.match(s,/data-testid="people-payment-filter-r130"/);
 assert.match(s,/personPaymentStatus==="all"\|\|allRows\.some/);
 assert.match(s,/aria-label="حالة السداد"/);
 assert.match(s,/data-testid="debt-register-r77"/);
});
