import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {financeVisibleNote} from '../src/noor-personal-application-view.js';
const source=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
test('R142 imported file names in source metadata are omitted from presentation only',()=>{
  assert.equal(financeVisibleNote('سداد جزئي\nمصدر البيانات: السلف 2.numbers'),'سداد جزئي');
  assert.equal(financeVisibleNote('مصدر البيانات: المالية - نور.xlsx'),'');
  assert.equal(financeVisibleNote('ملاحظة مهمة\nاسم الملف: backup.csv\nسبب التأخير'),'ملاحظة مهمة\nسبب التأخير');
  assert.equal(financeVisibleNote('تواصلت معه بخصوص ملف السلف 2.numbers'),'تواصلت معه بخصوص ملف السلف 2.numbers');
  assert.equal(financeVisibleNote('مدفوعات نوفمبر'),'مدفوعات نوفمبر');
  assert.equal(financeVisibleNote(''), '');
});
test('R142 notes are collapsed by default in finance and no raw debt note renders',()=>{
  assert.match(source,/function FinanceNote\(/);
  assert.match(source,/<details className="nf-note-disclosure-r140"/);
  assert.doesNotMatch(source,/<details className="nf-note-disclosure-r140"[^>]*\sopen=/);
  assert.match(source,/<summary>الملاحظات<\/summary>/);
  assert.match(source,/<FinanceNote note=\{r\.debt\.note\}\/>/);
  assert.match(source,/<FinanceNote note=\{person\.note\}\/>/);
  assert.match(source,/<FinanceNote note=\{e\.note\}\/>/);
  assert.match(source,/<FinanceNote note=\{c\.note\}\/>/);
  // The third e.note belongs to the habits/activity history, not finance.
  assert.match(source,/data-note-entry=\{e\.id\}/);
  assert.match(source,/\{e\.note\?<p>\{e\.note\}<\/p>:null\}/);
  assert.equal((source.match(/\{e\.note\?<FinanceNote note=\{e\.note\}\/>:null\}/g)??[]).length,2);
  assert.doesNotMatch(source,/<p>\{r\.debt\.note\|\|'بدون ملاحظات'\}<\/p>/);
});
test('R142 finance presentation remains independent of previous habit/history work',()=>{
  assert.match(source,/NOOR_R139_SELECTED_DAY_SHADOW_ONLY/);
  assert.match(source,/data-testid="control-category-filter-r135"/);
  assert.match(source,/data-testid="people-payment-filter-r130"/);
  assert.match(source,/onHistoryCommand=\{fastCommand\}/);
  assert.match(source,/NOOR_R141_FINANCE_COMPACT_NOTES/);
});

test('R142 definition editing is saved in background without global busy',()=>{
 assert.match(source,/if\(command\.type==='update-definition'\)return runCommand\(command,true\)/);
 assert.match(source,/if\(!background\)setBusy\(true\)/);
 assert.match(source,/definitionSaveLock=useRef\(false\)/);
 assert.match(source,/if\(busy\|\|definitionSaveLock\.current\)return/);
 assert.match(source,/onSavingChange=\{setDefinitionSaving\}/);
 assert.match(source,/disabled=\{busy\|\|definitionSaving\}/);
 assert.match(source,/expectedRevisionId:initial\.revisionId/);
 assert.match(source,/if\(!ok\)setError\("تعذر تأكيد الحفظ/);
});
