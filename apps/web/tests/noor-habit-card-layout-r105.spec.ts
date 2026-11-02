import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/noor-personal-application-view.tsx", import.meta.url), "utf8");
const start = "/* NOOR_NATURAL_MASONRY_R105_BEGIN */";
const end = "/* NOOR_NATURAL_MASONRY_R105_END */";
function css():string {
  assert.equal(source.split(start).length,2,"R105 must be inserted exactly once");
  assert.equal(source.split(end).length,2,"R105 closing marker must occur exactly once");
  return source.split(start)[1]!.split(end)[0]!;
}

test("R105: natural sized cards pack in responsive RTL columns without fixed row height",()=>{
  const styles=css();
  assert.match(styles,/\.np-page \.np-habits-section \.np-category-grid\s*\{[^}]*display:block;[^}]*columns:300px;[^}]*column-gap:14px;[^}]*direction:rtl;/u);
  assert.match(styles,/\.np-page \.np-habits-section \.np-habit-category\s*\{[^}]*display:inline-block;[^}]*width:100%;[^}]*margin:0 0 14px;[^}]*break-inside:avoid;/u);
  assert.match(styles,/-webkit-column-break-inside:avoid;/u);
  assert.doesNotMatch(styles,/grid-auto-rows:|overflow-y:auto;|height:100%;|max-height:|scrollbar-width:/u);
});

test("R105: phones remain one column with full natural-height content",()=>{
  const styles=css();
  assert.match(styles,/@media \(max-width:600px\)\s*\{[^}]*\.np-page \.np-habits-section \.np-category-grid\s*\{[^}]*columns:1;/u);
  assert.match(styles,/\.np-page \.np-habits-section \.np-habit-category\s*\{[^}]*margin-bottom:12px;/u);
});

test("R105: R76 original card and habit controls are restored, R104 scroll removed",()=>{
  assert.match(source,/data-habit-layout="tracker-r76"/u);
  assert.doesNotMatch(source,/data-habit-layout="balanced-r104"|NOOR_CARD_LAYOUT_R104_BEGIN|np-card-scroll-hint/u);
  assert.match(source,/data-testid="habit-category-card"/u);
  assert.ok(source.includes('className="np-list">{items.map(({execution:item,definition})=><ActivityCard'), "Original R76 list markup must remain intact");
  assert.match(source,/busy=\{busy\|\|lockedIds\.includes\(item\.id\)\}/u);
  assert.match(source,/pending=\{pendingIds\.includes\(item\.id\)\}/u);
});
