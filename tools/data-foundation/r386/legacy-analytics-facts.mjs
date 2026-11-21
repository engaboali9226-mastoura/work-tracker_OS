// Candidate for restricted, owner-scoped legacy facts. No runtime or network I/O.
const executionStatuses = new Set([
  "Planned", "InProgress", "Pending", "Completed", "Deferred",
  "Cancelled", "Skipped", "Missed", "Suppressed",
]);

function requireFact(condition, code) {
  if (!condition) throw new Error(code);
}

function isIdentity(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 4096;
}

function isCivilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const midnight = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(midnight) && new Date(midnight).toISOString().slice(0, 10) === value;
}

function indexOwned(rows, owner) {
  requireFact(Array.isArray(rows), "R386_FACT_COLLECTION");
  const indexed = new Map();
  for (const row of rows) {
    requireFact(row?.userId === owner && isIdentity(row.id), "R386_FACT_IDENTITY");
    requireFact(!indexed.has(row.id), "R386_FACT_DUPLICATE");
    indexed.set(row.id, row);
  }
  return indexed;
}

function dateEvidence(explicitDate, explicitField, legacyRecoveryDate, localDate) {
  for (const date of [explicitDate, legacyRecoveryDate, localDate]) {
    requireFact(date === undefined || isCivilDate(date), "R386_FACT_DATE");
  }
  return {
    performedDate: explicitDate ?? null,
    performedTimeZone: null,
    performanceSource: explicitDate !== undefined ? explicitField : "Unknown",
    legacyRecoveryDate: legacyRecoveryDate ?? null,
    activityLocalDate: localDate ?? null,
  };
}

function recordedShare(value) {
  requireFact(value === undefined || (Number.isFinite(value) && value >= 0 && value <= 1), "R386_FACT_SHARE");
  return value ?? null;
}

export function projectLegacyFacts({ owner, sourceRevision, state }) {
  requireFact(isIdentity(owner) && Number.isSafeInteger(sourceRevision) && sourceRevision >= 0, "R386_FACT_SOURCE");
  const definitions = indexOwned(state?.definitions, owner);
  const days = indexOwned(state?.personalDays, owner);
  const executions = indexOwned(state?.dailyExecution, owner);
  const executionFacts = new Map();
  for (const row of executions.values()) {
    const definition = definitions.get(row.definitionId);
    const boundary = days.get(row.personalDayId)?.boundary;
    requireFact(definition && boundary && isCivilDate(row.scheduleOccurrenceKey)
      && row.scheduleOccurrenceKey === boundary.localDate && isIdentity(boundary.timeZone)
      && isIdentity(row.definitionRevisionId)
      && ["Task", "Habit"].includes(row.kind) && definition.kind === row.kind
      && executionStatuses.has(row.status), "R386_FACT_EXECUTION_LINK");

    const evidence = dateEvidence(row.completionDateR367, "completionDateR367", row.recoveredOnR331);
    const transition = evidence.performedDate
      ? evidence.performedDate === row.scheduleOccurrenceKey ? "DueDateRecorded" : "DifferentDateRecorded"
      : evidence.legacyRecoveryDate ? "LegacyRecoveryRecorded" : "Unknown";
    executionFacts.set(row.id, {
      executionId: row.id,
      definitionId: row.definitionId,
      definitionRevisionId: row.definitionRevisionId,
      kind: row.kind,
      status: row.status,
      dueDate: row.scheduleOccurrenceKey,
      dueTimeZone: boundary.timeZone,
      dueDateSource: "PersonalDayBoundary",
      ...evidence,
      transition,
      historicalWeight: null,
      scoringPolicyVersion: null,
    });
  }

  const activityFacts = [];
  for (const definition of definitions.values()) {
    const activities = definition.activityLog ?? [];
    requireFact(Array.isArray(activities), "R386_FACT_ACTIVITY_COLLECTION");
    const activityIds = new Set();
    for (const activity of activities) {
      const execution = executionFacts.get(activity?.executionId);
      requireFact(execution?.definitionId === definition.id && isIdentity(activity.id)
        && isCivilDate(activity.localDate)
        && (activity.taskSessionId === undefined || (execution.kind === "Task" && isIdentity(activity.taskSessionId))),
      "R386_FACT_ACTIVITY_LINK");
      requireFact(!activityIds.has(activity.id), "R386_FACT_ACTIVITY_DUPLICATE");
      activityIds.add(activity.id);
      activityFacts.push({
        activityId: activity.id,
        executionId: execution.executionId,
        definitionId: definition.id,
        sessionId: activity.taskSessionId ?? null,
        ...dateEvidence(activity.achievementDateR367, "achievementDateR367", activity.performedOnR331, activity.localDate),
        recordedSessionDayCredit: recordedShare(activity.sessionDayCredit),
        recordedSessionAchievementShare: recordedShare(activity.sessionAchievementShare),
      });
    }
  }
  return { factVersion: 1, owner, sourceRevision, executions: [...executionFacts.values()], activities: activityFacts };
}
