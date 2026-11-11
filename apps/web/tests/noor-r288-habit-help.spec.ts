import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
test("R288 habit contextual help is an accessible disclosure, not a new journal or write action",()=>{
  assert.match(src,/className="np-habit-title-with-help-r288"/);
  assert.match(src,/className="np-habit-help-r288"/);
  assert.ok(src.includes('aria-label={`تفاصيل ${task?"مهمة":"عادة"} ${displayTitle}`}'),"habit and task detail disclosures have separate accessible labels");
  assert.match(src,/بيانات \{task\?"المهمة":"العادة"\} المسجلة/);
  assert.match(src,/التكرار: {scheduleLabel\(definition\)}/);
  assert.match(src,/وزن الإنجاز: {definition.weight}/);
  assert.ok(src.includes('data-testid={task?`r293-task-help-${definition.id}`:`r288-habit-help-${definition.id}`}'));
  assert.ok(!src.includes('NOOR_R288_HABIT_AUTOSAVE'),"help alone must not save or fabricate details");
});
