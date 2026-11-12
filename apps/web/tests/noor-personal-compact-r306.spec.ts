import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {NOOR_R306_ACTION_STYLES} from "../src/noor-personal-action-r306.js";

const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
const css=NOOR_R306_ACTION_STYLES;

test("R306 compact preference: no oversized hero; work before summaries and independent drink counters",()=>{
 assert.doesNotMatch(source,/data-testid="r305-daily-intro"/);
 const position=(marker:string)=>source.indexOf(marker);
 assert.ok(position('data-testid="r304-activity-view"')>0);
 assert.ok(position('data-testid="r304-activity-view"')<position('data-testid="today-summary"'));
 assert.ok(position('data-testid="today-summary"')<position('<NoorBeverageTrackerR294'));
 assert.match(source,/data-testid="r306-open-activity-editor"/);
 assert.ok(source.includes('data-testid={`r306-filter-${mode}`}'));
 assert.match(source,/view\.tasks\.filter\(visibleForFilter\)/);
 assert.match(source,/filteredGrouped\.map/);
 assert.match(source,/filteredUnifiedGroups\.map/);
});

test("R306 compact preference: card paddings, minimum heights and footprint strictly under the previous design",()=>{
 const compact=css.slice(css.indexOf("NOOR_R306_COMPACT_NO_GROWTH_BEGIN"));
 assert.ok(compact.length>1500);
 assert.match(compact,/\.np-prayer-times \.np-prayer\s*\{[^}]*min-height:103px/s);
 assert.match(compact,/@media\(max-width:700px\)[\s\S]*?min-height:100px/);
 assert.match(compact,/\.np-prayer-card\s*\{[^}]*padding:7px 4px 5px/);
 assert.match(compact,/\.np-day-ring\{width:55px;height:55px\}/);
 assert.match(compact,/\.np-week-day\{min-height:57px/);
 assert.match(compact,/\.np-habit-category \.np-habit-row\{min-height:48px/);
 assert.match(compact,/\.np-execution-stack \.np-item\{min-height:48px/);
 assert.match(compact,/\.np-habit-category>\.np-category-head,[\s\S]*?padding:9px 12px/);
 assert.match(compact,/\.np-habit-category \.np-list,[\s\S]*?padding:5px 8px 8px/);
 assert.doesNotMatch(compact,/\bmax-height\s*:/,"Do not hide long Arabic names, notes or session controls");
 assert.doesNotMatch(compact,/(?:^|[;{])\s*height\s*:\s*(?:10[0-9]|12[0-9]|15[0-9])px/m,"No fixed 100px+ card height");
});

test("R306 compact preference: desktop and mobile keep accessible controls and the same action source",()=>{
 assert.match(css,/\.np-r306-add-button,[\s\S]*?\.np-activity-switch-options-r304 button\{min-height:44px\}/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/data-appearance=dark/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(source,/onCommand=\{historyDate\?historicalCommand:onCommand\}/);
 assert.match(source,/data-testid="prayer-card"/);
 assert.match(source,/data-testid="today-summary"/);
 assert.match(source,/<TaskSessionListR254/);
});
