import { statisticEligible, validStatisticDate } from "./progress-statistics.js";
import type { StatisticRow } from "./progress-statistics.js";

/**
 * Per-definition streaks are computed from frozen, account-owned execution
 * history. Unscheduled dates do not break a streak; a pending current day
 * is never treated as a failed day. Future records are not inspected.
 */
export type NoorLinkedActivityInsightR312 = Readonly<{
  definitionId: string;
  title: string;
  kind: "Habit" | "Task";
  current: number;
  best: number;
  scheduledDays: number;
  completedDays: number;
  todayDue: boolean;
  todayComplete: boolean;
  status: "at-risk" | "due" | "complete" | "not-due";
}>;

export function noorLinkedActivityInsightsR312(
  rows: readonly StatisticRow[],
  currentDate: string | null,
): readonly NoorLinkedActivityInsightR312[] {
  if (!validStatisticDate(currentDate)) return [];
  const grouped = new Map<string, {
    title: string;
    kind: "Habit" | "Task";
    dates: Map<string, StatisticRow[]>;
  }>();
  for (const row of rows) {
    if (!statisticEligible(row) || row.date > currentDate) continue;
    let item = grouped.get(row.definitionId);
    if (!item) {
      item = { title: row.title, kind: row.kind, dates: new Map() };
      grouped.set(row.definitionId, item);
    }
    const day = item.dates.get(row.date) ?? [];
    day.push(row);
    item.dates.set(row.date, day);
  }
  const insights: NoorLinkedActivityInsightR312[] = [];
  for (const [definitionId, item] of grouped) {
    let current = 0;
    let best = 0;
    let completedDays = 0;
    const entries = [...item.dates].sort(([a], [b]) => a.localeCompare(b));
    for (const [date, activities] of entries) {
      const completed = activities.every(row =>
        row.status === "Completed" || row.credit === 1,
      );
      if (completed) {
        completedDays++;
        current++;
        best = Math.max(best, current);
      } else if (date !== currentDate) {
        current = 0;
      }
    }
    const today = item.dates.get(currentDate);
    const todayDue = !!today?.length;
    const todayComplete = !!today?.length && today.every(row =>
      row.status === "Completed" || row.credit === 1,
    );
    insights.push({
      definitionId,
      title: item.title,
      kind: item.kind,
      current,
      best,
      scheduledDays: entries.length,
      completedDays,
      todayDue,
      todayComplete,
      status: todayDue
        ? todayComplete ? "complete" : current > 0 ? "at-risk" : "due"
        : "not-due",
    });
  }
  const rank = { "at-risk": 0, due: 1, complete: 2, "not-due": 3 };
  return insights.sort((a, b) =>
    rank[a.status] - rank[b.status]
    || b.current - a.current
    || a.title.localeCompare(b.title, "ar"),
  );
}
