import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
const begin="/* NOOR_COLLAPSIBLE_HABIT_CARDS_R107_BEGIN */";
const end="/* NOOR_COLLAPSIBLE_HABIT_CARDS_R107_END */";
const css=source.split(begin)[1]?.split(end)[0]??"";

test("R107: card summaries are closed by default and retain visible progress",()=>{
  assert.equal(source.split(begin).length,2);
  assert.equal(source.split(end).length,2);
  assert.equal(source.split('data-testid="habit-category-card"').length-1,1);
  assert.ok(source.includes('return <details aria-label={`عادات ${displayCategory}`}'));
  assert.ok(source.includes('data-habit-layout="tracker-r76"'));
  assert.ok(source.includes('<summary className="np-category-head"'));
  assert.ok(source.includes('</summary>'));
  assert.ok(source.includes('</details>;'));
  assert.ok(source.includes('role="progressbar"'));
  assert.ok(source.includes('aria-valuenow={rate}'));
  assert.ok(css.includes('summary.np-category-head::after'));
  assert.ok(source.includes('<h3 className="np-category-title">{displayCategory}</h3>')); // R106 compatibility
  assert.ok(!source.includes('<details open='),"No forced-open cards on first load");
});

test("R107: grid aligns collapsed cards; list reveals without internal scrolling",()=>{
  assert.match(css,/grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,320px\),1fr\)\);/);
  assert.match(css,/align-items:start;/);
  assert.match(css,/gap:12px;/);
  assert.match(css,/details\.np-habit-category:not\(\[open\]\)>\.np-list\{display:none;\}/);
  assert.match(css,/details\.np-habit-category\[open\]>\.np-list\{display:grid;\}/);
  assert.match(css,/grid-template-columns:1fr;/);
  assert.doesNotMatch(css,/max-height:|overflow-y:auto|grid-auto-rows:|height:100%;/);
});

test("R107: full existing completion and note controls remain mounted inside expanded card",()=>{
  assert.ok(source.includes('className="np-list">{items.map(({execution:item,definition})=><ActivityCard'));
  assert.ok(source.includes('busy={busy||lockedIds.includes(item.id)}'));
  assert.ok(source.includes('pending={pendingIds.includes(item.id)}'));
  assert.ok(source.includes('onCommand={historyDate?historicalCommand:onCommand} historicalDate={historyDate} todayDate={view.localDate??undefined}/>)}</div>'));
  assert.ok(source.includes('data-habit-layout="tracker-r76"'));
  assert.ok(source.includes('habitCardDisplayTitle(category)'));
  assert.ok(!source.includes('np-card-scroll-hint'));
});

test("R107: native summary click opens and closes, with body controls remaining in place",()=>{
  const dom=new JSDOM('<!doctype html><details><summary>الصلوات، 20%</summary><div><label><input type="checkbox">صلاة الفجر</label><button type="button">ملاحظة</button></div></details>');
  try {
    const details=dom.window.document.querySelector('details')!;
    const summary=details.querySelector('summary')!;
    const checkbox=details.querySelector('input')!;
    const note=details.querySelector('button')!;
    assert.equal(details.open,false);
    summary.click();
    assert.equal(details.open,true);
    checkbox.click();
    note.click();
    assert.equal(details.open,true,"Checkbox and note buttons do not close their parent");
    assert.equal(checkbox.checked,true);
    summary.click();
    assert.equal(details.open,false);
    assert.ok(details.contains(checkbox),"Habit controls must not be discarded on close");
  } finally {dom.window.close();}
});
