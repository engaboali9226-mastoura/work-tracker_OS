import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/noor-personal-application-view.tsx", import.meta.url), "utf8");
const journal = readFileSync(new URL("../src/noor-three-spaces-r171.tsx", import.meta.url), "utf8");
const wellbeing = readFileSync(new URL("../src/noor-wellbeing-lab-r165.tsx", import.meta.url), "utf8");

test("R205 live personal view mounts fourth personal-space icon beside three journal actions", () => {
  const importLine = 'import { NoorWellbeingLabR165 } from "./noor-wellbeing-lab-r165.js";';
  const exactCurrentDayMount = '{!historyDate?<><NoorThreeSpacesR171 personalDate={view.localDate??undefined} /><NoorWellbeingLabR165 /></>:null}';
  assert.equal(app.split(importLine).length - 1, 1, "wellbeing component must be imported exactly once by the live app");
  assert.equal(app.split(exactCurrentDayMount).length - 1, 1, "live daily achievement must mount both components together");
  assert.equal((app.match(/<NoorWellbeingLabR165\s*\/>/gu) ?? []).length, 1, "fourth component must be mounted exactly once");
  assert.equal((app.match(/<NoorThreeSpacesR171 personalDate=\{view\.localDate\?\?undefined\} \/>/gu) ?? []).length, 1, "existing three journal actions remain exactly once");
});

test("R205 fourth icon remains an accessible touch target in the same achievement row", () => {
  assert.match(journal, /data-testid="nr180-wellbeing-slot"/u);
  assert.match(journal, /className="nr180-wellbeing-slot"/u);
  assert.match(journal, /min-height:44px/u);
  assert.match(wellbeing, /createPortal\(launcher,spaceSlot\)/u);
  assert.match(wellbeing, /data-testid="noor-wellbeing-launch-r165"/u);
  assert.match(wellbeing, /NOOR_R181A_PERSONAL_SPACE/u);
  assert.match(wellbeing, /aria-label="إغلاق مساحتي"/u);
});
