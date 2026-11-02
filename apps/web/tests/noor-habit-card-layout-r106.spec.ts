import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { habitCardDisplayTitle } from "../src/noor-personal-application-view.js";

const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
const start="/* NOOR_COMPACT_ALIGNED_CARDS_R106_BEGIN */";
const end="/* NOOR_COMPACT_ALIGNED_CARDS_R106_END */";
function styles():string {
  assert.equal(source.split(start).length,2,"R106 start marker must occur once");
  assert.equal(source.split(end).length,2,"R106 end marker must occur once");
  return source.split(start)[1]!.split(end)[0]!;
}

test("R106: numeric Notion category prefixes disappear from display only",()=>{
  assert.equal(habitCardDisplayTitle("1 - عبادة"),"عبادة");
  assert.equal(habitCardDisplayTitle("4 - غذاء"),"غذاء");
  assert.equal(habitCardDisplayTitle("٢ - الأذكار"),"الأذكار");
  assert.equal(habitCardDisplayTitle("۸ – مهني"),"مهني");
  assert.equal(habitCardDisplayTitle("8 — تطور"),"تطور");
  assert.equal(habitCardDisplayTitle("الصلوات"),"الصلوات");
  assert.equal(habitCardDisplayTitle("القرآن - الورد اليومي"),"القرآن - الورد اليومي");
  assert.ok(source.includes('const displayCategory=habitCardDisplayTitle(category);'));
  assert.ok(source.includes('<h3 className="np-category-title">{displayCategory}</h3>'));
  assert.ok(source.includes('aria-label={`عادات ${displayCategory}`}'));
  assert.ok(source.includes('aria-label={`إنجاز قسم ${displayCategory}`}'));
  assert.ok(source.includes('key={category}'),"Keep original source category as stable grouping key");
});

test("R106: column start alignment and natural heights without forcing card heights",()=>{
  const css=styles();
  assert.ok(css.includes('column-gap:12px;'));
  assert.ok(css.includes('display:block;'));
  assert.ok(css.includes('margin:0 0 12px;'));
  assert.ok(css.includes('break-inside:avoid;'));
  assert.ok(css.includes('min-height:68px;'));
  assert.ok(css.includes('min-height:50px;'));
  assert.ok(css.includes('min-height:54px;'));
  assert.doesNotMatch(css,/grid-auto-rows:|overflow-y:auto;|height:100%;|max-height:|scrollbar-width:/u);
});

test("R106: preserve R105 natural masonry and original activity controls",()=>{
  assert.ok(source.includes('/* NOOR_NATURAL_MASONRY_R105_BEGIN */'));
  assert.ok(source.includes('columns:300px;'));
  assert.ok(source.includes('data-habit-layout="tracker-r76"'));
  assert.ok(source.includes('className="np-list">{items.map(({execution:item,definition})=><ActivityCard'));
  assert.ok(source.includes('busy={busy||lockedIds.includes(item.id)}'));
  assert.ok(source.includes('pending={pendingIds.includes(item.id)}'));
  assert.ok(!source.includes('data-habit-layout="balanced-r104"'));
  assert.ok(!source.includes('np-card-scroll-hint'));
});
