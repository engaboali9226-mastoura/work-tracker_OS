import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
const three=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/noor-wellbeing-lab-r165.tsx',import.meta.url),'utf8');
test('R181A abstract personal-space glyph is centered, accessible, and not a user portrait',()=>{
 assert.equal((panel.match(/data-glyph="NOOR_R181A_PERSONAL_SPACE"/gu)??[]).length,1);
 assert.match(panel,/className="nr180-wellbeing-symbol"[^>]*strokeWidth="1\.7"/u);
 assert.match(panel,/<circle cx="12" cy="12" r="8\.3"\/>/u);
 assert.match(panel,/<circle cx="12" cy="12" r="1\.15" fill="currentColor" stroke="none"\/>/u);
 assert.match(panel,/<path d="M15\.9 12a3\.9/);
 assert.doesNotMatch(panel,/NOOR_R181_PERSONAL_GLYPH|M6\.7 17\.7/);
 assert.match(panel,/aria-label="فتح مساحتي: مؤشرات اليوم وتحليل التغيرات"/u);
 assert.equal((three.match(/className="nr180-wellbeing-slot"/gu)??[]).length,1);
 assert.match(panel,/createPortal\(launcher,spaceSlot\)/u);
});
test('R181A fourth icon uses the existing navy/ivory family, responsive and focusable',()=>{
 assert.match(three,/NOOR_R180_VECTOR_ICONS_BEGIN/u);
 assert.match(three,/focus-visible/u);
 assert.match(three,/prefers-reduced-motion/u);
 assert.match(three,/data-appearance=dark/u);
 assert.match(three,/data-appearance=light/u);
 assert.match(three,/indexedNotesR173/u);
 assert.match(three,/developerExportR171/u);
});
