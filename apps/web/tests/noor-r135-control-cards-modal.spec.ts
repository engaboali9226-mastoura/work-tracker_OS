import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");

test("R135: control-center category cards respect the existing status filter",()=>{
 assert.match(source,/data-testid="control-category-filter-r135"/);
 assert.match(source,/kind!=="Habit"\|\|categoryFilter==="all"/);
 assert.match(source,/stateMatch &&/);
 assert.match(source,/const habitGroups=categoryOptions\.map/);
 assert.match(source,/data-testid="control-habit-cards-r135"/);
 assert.match(source,/data-testid="control-habit-category-card-r135"/);
 assert.match(source,/items\.map\(renderControlRow\)/);
 assert.match(source,/matches\.map\(renderControlRow\)/);
 assert.match(source,/className="np-cc-expandable" key=\{item\.id\}/);
 assert.match(source,/setEditing\(selected\)/);
 assert.match(source,/setConfirmArchive\(selected\.id\)/);
 assert.match(source,/setDeleteId\(selected\.id\)/);
});

test("R135: definition editor is portaled outside clipped control center and animated wrapper",()=>{
 assert.match(source,/createPortal\(<div className="np-cc-modal-backdrop"/);
 assert.match(source,/document\.querySelector\("\.np-page"\)\?\.parentElement \?\? document\.body/);
 assert.match(source,/NOOR_R135_CONTROL_CARDS_AND_PORTAL_MODAL_BEGIN/);
 assert.match(source,/\.np-cc-modal-backdrop \.np-cc-modal-body\{[^}]*overflow-y:auto/);
 assert.match(source,/window\.visualViewport\?\.addEventListener\("resize",update\)/);
 assert.match(source,/window\.visualViewport\?\.addEventListener\("scroll",update\)/);
 assert.match(source,/form="np-definition-edit-form"/);
 assert.match(source,/data-testid="np-definition-save-r130"/);
 assert.match(source,/hidden=\{!creating\}/);
});

test("R139: selecting a historical day has shadow only, no ribbon, no reserved space or auto-scroll",()=>{
 assert.match(source,/NOOR_R139_SELECTED_DAY_SHADOW_ONLY/);
 assert.match(source,/\.np-page \.np-week-day\.is-selected\{box-shadow:/);
 assert.doesNotMatch(source,/inpage-history-banner-r110/);
 assert.doesNotMatch(source,/historical-date-stable-slot-r135/);
 assert.doesNotMatch(source,/np-inpage-history-slot-r135/);
 assert.doesNotMatch(source,/querySelector<HTMLElement>\('\.np-main-grid\.np-daily-only'\)\?\.scrollIntoView/);
 assert.match(source,/setHistoryDate\(day\.date\)/);
});

test("R135: historical quick saves, finance status filters and day guards remain",()=>{
 assert.match(source,/onHistoryCommand=\{fastCommand\}/);
 assert.match(source,/runCommand\(change\.command,true\)/);
 assert.match(source,/data-testid="people-payment-filter-r130"/);
 assert.doesNotMatch(source,/data-testid="habit-category-filter-r130"/);
 assert.match(source,/data-testid="control-category-filter-r135"/);
 assert.match(source,/historyDate>=todayDate/);
});
