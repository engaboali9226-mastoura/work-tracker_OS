import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const drinks=readFileSync(new URL("../src/noor-beverage-tracker-r294.tsx",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");

test("R297: beverage timing exposes explicit dawn, duha and after-Isha choices",()=>{
 for(const name of ["فجرًا","ضحى","ظهرًا","عصرًا","مساءً","بعد العشاء","تحديد الساعة يدويًا"])
  assert.ok(drinks.includes(name),name);
 assert.match(drinks,/ليست مواقيت الصلاة/);
 assert.match(drinks,/beverageTime:recordedTime/);
});
test("R297: first quick drink creates a protected habit instead of requiring full setup",()=>{
 assert.match(drinks,/setPendingFirstKind\(kind\)/);
 assert.match(drinks,/type:"create-definition",kind:"Habit"/);
 assert.match(drinks,/setQuickId\(matching.id\)/);
 assert.match(drinks,/جارٍ تأكيد الحفظ/);
});
test("R297: advisory uses restrained neutral design without old yellow-filled bar",()=>{
 assert.match(ui,/np-caffeine-yellow\{background:var\(--panel-soft\)/);
 assert.doesNotMatch(ui,/np-caffeine-yellow\{background:#fff5df/);
 assert.match(ui,/np-caffeine-time-hint-r297/);
});
