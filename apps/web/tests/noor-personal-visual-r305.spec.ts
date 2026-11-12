import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {NOOR_R305_VISUAL_STYLES} from "../src/noor-personal-visual-r305.js";

const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");

test("R306: actionable tasks precede statistics and the redundant R305 information card is gone",()=>{
  assert.doesNotMatch(source,/data-testid="r305-daily-intro"/);
  assert.ok(source.indexOf('data-testid="r304-activity-view"')<source.indexOf('data-testid="today-summary"'),
    "The active task workspace must precede the analytics summary");
  assert.ok(source.indexOf('data-testid="today-summary"')<source.indexOf('<NoorBeverageTrackerR294'),
    "The separate beverage counter stays below core work");
  for(const marker of ['data-testid="r306-open-activity-editor"','r306-filter-','setActivityFilter(mode)',
    'filteredGrouped','filteredUnifiedGroups','view.tasks.filter(visibleForFilter)',
    'data-testid="r304-unified-groups"','id="noor-r305-weekly"']){
    assert.ok(source.includes(marker),`R306 missing action control: ${marker}`);
  }
});

test("R305 theme remains available as a foundation for R306 action-first workspace",()=>{
  const css=NOOR_R305_VISUAL_STYLES;
  assert.ok(css.length>8500,"A real system of responsive surfaces, not a one-line recolor");
  assert.ok(css.includes("NOOR_R305_VISUAL_REDESIGN_BEGIN"));
  for(const selector of [".np-r305-intro",".np-day-achievement",".np-prayer-card",".np-topbar",
    ".np-habit-category",".np-tasks-card",".np-unified-group-r304",".np-activity-switch-r304",
    ".np-week-day",".np-r305-intro-links"]){
    assert.ok(css.includes(selector),`visual redesign missing ${selector}`);
  }
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/@media\(max-width:380px\)/);
  assert.match(css,/data-appearance=dark/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.ok(!css.includes("position:fixed"),"No new fixed overlay obscuring Personal controls");
});

test("R305: existing actions, historical navigation, privacy and domain ownership are unchanged",()=>{
  for(const marker of ['data-testid="prayer-card"','data-testid="prayer-times-strip"',
    'data-testid="today-summary"','data-testid="r286-remaining-trigger"',
    'data-testid="r304-activity-view"','data-testid="habit-category-grid"',
    'data-testid="r304-unified-groups"','<NoorR232TimeWindows','<NoorBeverageTrackerR294',
    '<NoorThreeSpacesR171','<NoorWellbeingLabR165','<TaskSessionListR254']){
    assert.ok(source.includes(marker),`missing legacy flow: ${marker}`);
  }
  assert.doesNotMatch(NOOR_R305_VISUAL_STYLES,/\b(?:localStorage|sessionStorage|fetch)\b/);
  assert.doesNotMatch(source,/data-testid="r305-daily-intro"/);
});
