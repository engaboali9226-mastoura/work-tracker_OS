import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {resolveNoorJournalReleaseModeR202} from '../src/noor-journal-release-gate-r202.js';
const component=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const application=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
test('R202 production without trusted port denies legacy browser storage, while lab keeps its original mode',()=>{
 assert.equal(resolveNoorJournalReleaseModeR202({production:true,trustedJournalPresent:false}),'blocked');
 assert.equal(resolveNoorJournalReleaseModeR202({production:true,trustedJournalPresent:true}),'trusted');
 assert.equal(resolveNoorJournalReleaseModeR202({production:false,trustedJournalPresent:false}),'legacy-lab');
 assert.equal(resolveNoorJournalReleaseModeR202({production:false,trustedJournalPresent:true}),'trusted');
});
test('R202 deployed UI keeps 3 journal entry points but closes local reads, writes, deletes and exports',()=>{
 assert.match(component,/NOOR_R202_PRIVACY_FAIL_CLOSED/u);
 assert.match(component,/\.env\?\.PROD/u);
 assert.match(component,/if\(closed\)\{setNotes\(\[\]\);setReady\(false\);setStorageError\(false\);return;\}/u);
 assert.match(component,/if\(closed\)\{setError\('حفظ التدوينات/u);
 assert.match(component,/if\(closed\)\{setError\('إدارة التدوينات/u);
 assert.match(component,/if\(closed\)\{setError\('تصدير التدوينات/u);
 assert.match(component,/view==='add'\?\(closed\?/u);
 assert.match(component,/closed\?<p className="nr171-info" role="status">السجل غير متاح/u);
 assert.match(application,/<NoorThreeSpacesR171 personalDate=\{view\.localDate\?\?undefined\} \/>/u);
 assert.doesNotMatch(application,/trustedJournal=\{/u);
});
test('R202 maintains trusted opt-in route with no silent IndexedDB import or fallback',()=>{
 assert.match(component,/trustedJournal \? trustedJournal\.read\(\) : storage\.read\(\)/u);
 assert.match(component,/await trustedJournal\.create\(note\)/u);
 assert.match(component,/await trustedJournal\.remove\(id\)/u);
 assert.doesNotMatch(component,/localStorage|sessionStorage|document\.cookie|SUPABASE_SERVICE_ROLE_KEY/u);
});
