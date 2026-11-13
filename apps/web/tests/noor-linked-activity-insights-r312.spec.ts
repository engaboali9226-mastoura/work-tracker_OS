import assert from "node:assert/strict";
import test from "node:test";
import { noorLinkedActivityInsightsR312 } from "../src/noor-linked-activity-insights-r312.js";
import type { StatisticRow } from "../src/progress-statistics.js";

const row = (date: string, status: string, definitionId = "a", extra: Partial<StatisticRow> = {}): StatisticRow => ({
  id: definitionId + ":" + date,
  definitionId,
  title: definitionId === "a" ? "القراءة" : "الصلاة",
  kind: "Habit",
  date,
  weight: 3,
  status,
  amount: 0,
  unit: "",
  ...extra,
});

test("a pending scheduled day alerts without breaking a completed streak, including skipped days", () => {
  const result = noorLinkedActivityInsightsR312([
    row("2026-11-09", "Completed"),
    row("2026-11-11", "Completed"),
    row("2026-11-13", "Pending"),
  ], "2026-11-13");
  assert.deepEqual(result.map(({ current, best, todayDue, status }) =>
    ({ current, best, todayDue, status })),
    [{ current: 2, best: 2, todayDue: true, status: "at-risk" }]);
});

test("a missed previous due date resets streak; future rows do not count", () => {
  const result = noorLinkedActivityInsightsR312([
    row("2026-11-10", "Completed"),
    row("2026-11-11", "Pending"),
    row("2026-11-12", "Completed"),
    row("2026-11-14", "Completed"),
  ], "2026-11-13");
  assert.equal(result[0]?.current, 1);
  assert.equal(result[0]?.best, 1);
  assert.equal(result[0]?.status, "not-due");
  assert.equal(result[0]?.scheduledDays, 3);
});

test("multiple executions per definition on the same day need all completions", () => {
  const result = noorLinkedActivityInsightsR312([
    row("2026-11-12", "Completed"),
    row("2026-11-12", "Pending", "a", { id: "second" }),
    row("2026-11-13", "Completed"),
  ], "2026-11-13");
  assert.equal(result[0]?.current, 1);
  assert.equal(result[0]?.best, 1);
});

test("partial task session credit is not a completed day, one full credit is", () => {
  const result = noorLinkedActivityInsightsR312([
    row("2026-11-12", "Pending", "a", { credit: 0.6 }),
    row("2026-11-13", "Pending", "a", { credit: 1 }),
  ], "2026-11-13");
  assert.equal(result[0]?.current, 1);
  assert.equal(result[0]?.status, "complete");
});

test("excluded, invalid, and future rows never create streaks", () => {
  assert.deepEqual(noorLinkedActivityInsightsR312([
    row("2026-11-12", "Cancelled"),
    row("2026-11-15", "Completed"),
    row("2026-11-12", "Completed", "b", { nonAchievement: true }),
  ], "2026-11-13"), []);
  assert.deepEqual(noorLinkedActivityInsightsR312([row("2026-11-13", "Completed")], null), []);
});
