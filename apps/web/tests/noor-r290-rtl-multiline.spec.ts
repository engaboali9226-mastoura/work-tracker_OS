import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const paths=[
 "../src/noor-personal-application-view.tsx",
 "../src/noor-task-sessions-r254.tsx",
 "../src/noor-wellbeing-lab-r165.tsx",
 "../src/noor-three-spaces-r171.tsx",
];
test("R290 all Personal/Work-independent Arabic multiline input surfaces have right-to-left caret",()=>{
 for(const path of paths){
  const src=readFileSync(new URL(path,import.meta.url),"utf8");
  assert.match(src,/<textarea dir="rtl"/);
  assert.doesNotMatch(src,/<textarea(?! dir="rtl")/,"no uncontrolled LTR textarea in "+path);
 }
 const css=readFileSync(new URL(paths[0],import.meta.url),"utf8");
 assert.match(css,/NOOR_R290_ARABIC_MULTILINE_INPUTS/);
 assert.match(css,/\.np-page textarea,\.np-cc-modal-backdrop textarea,\.np-activity-dialog textarea/);
 assert.match(css,/\.nw165-dialog textarea,\.nr171-modal textarea/);
 assert.match(css,/direction:rtl;\s*text-align:start;\s*unicode-bidi:normal;/);
});
