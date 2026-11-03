import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.NOOR_PERSONAL_BUILD_DIR;
if (!root) throw new Error("NOOR_PERSONAL_BUILD_DIR must be set for R152 tests.");
const { buildPersonalWorkspace } = await import(pathToFileURL(path.join(root, "index.js")).href);
const userId = "r152-fixture-user";

const day = (id, date, civil) => ({
  id, userId,
  boundary: {
    key: `${civil ? "personal-day-civil:" : "personal-day:"}${userId}:${date}`,
    localDate: date,
    startAt: civil ? `${date}T00:00:00.000Z` : `${date}T02:00:00.000Z`,
    endAt: `${date}T23:59:59.000Z`,
    timeZone: "Asia/Riyadh",
  },
  state: "Closed", version: 1,
  createdAt: `${date}T05:00:00.000Z`,
  updatedAt: `${date}T05:00:00.000Z`,
});
const occurrence = (id, personalDayId, date, definitionId, status) => ({
  id, userId, personalDayId, definitionId, definitionRevisionId: "rev1",
  kind: "Habit", title: definitionId, materializationKey: id,
  scheduleOccurrenceKey: date, status,
  eligibility: { definitionRevisionId: "rev1", importance: "Supporting", weight: 1, gatePolicy: "NonBlocking", targets: {} },
  version: 1, createdAt: `${date}T05:00:00.000Z`, updatedAt: `${date}T06:00:00.000Z`,
});
const oldDay = day("legacy-2", "2026-11-02", false);
const newDay = day("civil-2", "2026-11-02", true);
const today = day("civil-3", "2026-11-03", true);
const yesterday = day("legacy-1", "2026-11-01", false);
const records = [
  occurrence("old-a", "legacy-2", "2026-11-02", "a", "Completed"),
  occurrence("old-b", "legacy-2", "2026-11-02", "b", "Pending"),
  occurrence("new-a", "civil-2", "2026-11-02", "a", "Completed"),
  occurrence("new-b", "civil-2", "2026-11-02", "b", "Pending"),
  occurrence("today-a", "civil-3", "2026-11-03", "a", "Pending"),
  occurrence("today-b", "civil-3", "2026-11-03", "b", "Pending"),
  occurrence("prior-a", "legacy-1", "2026-11-01", "a", "Completed"),
];
const snapshot = (days, executions) => ({
  listDefinitions: () => [],
  listPersonalDays: () => days,
  listDailyExecutionForUser: () => executions,
});

test("R152: civil day wins duplicate local date without double-counting the 43+43 migration pattern", () => {
  const source = snapshot([oldDay, newDay, today, yesterday], records);
  const result = buildPersonalWorkspace(userId, source);
  assert.equal(result.statistics.currentDate, "2026-11-03");
  assert.deepEqual(result.statistics.rows.filter(r => r.date === "2026-11-02").map(r => r.id).sort(), ["new-a", "new-b"]);
  assert.equal(result.statistics.rows.length, 5);
  assert.equal(result.insights.periods.week.scheduled, 5);
  assert.equal(result.insights.periods.week.completed, 2);
  assert.equal(result.insights.periods.week.completionRate, 40);
  assert.equal(result.insights.bestStreakDays, 1);
  assert.equal(records.length, 7, "the source records must not be modified");
});

test("R152: projection selection independent of snapshot ordering", () => {
  const forward = buildPersonalWorkspace(userId, snapshot([oldDay, newDay, today, yesterday], records));
  const reverse = buildPersonalWorkspace(userId, snapshot([yesterday, today, newDay, oldDay], [...records].reverse()));
  assert.deepEqual(forward.statistics.rows, reverse.statistics.rows);
  assert.deepEqual(forward.insights, reverse.insights);
});

test("R152: retains a legacy day without a civil replacement", () => {
  const result = buildPersonalWorkspace(userId, snapshot([yesterday], [records.at(-1)]));
  assert.equal(result.statistics.rows.length, 1);
  assert.equal(result.statistics.rows[0].id, "prior-a");
  assert.equal(result.insights.currentStreakDays, 1);
});

test("R152: an orphan historical execution remains visible", () => {
  const orphan = occurrence("orphan-a", "missing-day", "2026-11-02", "a", "Completed");
  const result = buildPersonalWorkspace(userId, snapshot([today], [orphan]));
  assert.equal(result.statistics.rows.length, 1);
  assert.equal(result.statistics.rows[0].id, "orphan-a");
});
