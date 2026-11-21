import test from "node:test";
import assert from "node:assert/strict";
import { projectLegacyFacts } from "./legacy-analytics-facts.mjs";

const owner = "synthetic-r386-fact-owner";

function fixture() {
  const execution = {
    id: "execution", userId: owner, kind: "Task", status: "Completed",
    definitionId: "definition", definitionRevisionId: "old-revision",
    personalDayId: "day", scheduleOccurrenceKey: "2026-11-18",
    title: "synthetic-private-title", updatedAt: "2026-11-20T10:00:00Z",
    eligibility: { weight: 43 },
  };
  return {
    owner, sourceRevision: 7, state: {
      definitions: [{
        userId: owner, id: "definition", revisionId: "new-revision", kind: "Task", weight: 85,
        activityLog: [{
          id: "activity", executionId: execution.id, taskSessionId: "session", localDate: "2026-11-18",
          at: "2026-11-20T10:00:00Z", note: "synthetic-private-note", amount: 50,
          sessionDayCredit: 0.3, sessionAchievementShare: 0.5,
        }],
      }],
      dailyExecution: [execution],
      personalDays: [{ id: "day", userId: owner, boundary: { localDate: "2026-11-18", timeZone: "Asia/Riyadh" } }],
      finance: "synthetic-private-finance", journal: "synthetic-private-journal", work: "synthetic-private-students",
    },
  };
}

test("legacy facts preserve unknown dates and weights and keep activity separate from achievement", () => {
  const input = fixture();
  const before = structuredClone(input);
  const facts = projectLegacyFacts(input);
  assert.deepEqual(input, before);
  assert.equal(facts.sourceRevision, 7);
  assert.deepEqual(facts.executions[0], {
    executionId: "execution", definitionId: "definition", definitionRevisionId: "old-revision",
    kind: "Task", status: "Completed", dueDate: "2026-11-18", dueTimeZone: "Asia/Riyadh",
    dueDateSource: "PersonalDayBoundary", performedDate: null, performedTimeZone: null, performanceSource: "Unknown",
    legacyRecoveryDate: null, activityLocalDate: null, transition: "Unknown",
    historicalWeight: null, scoringPolicyVersion: null,
  });
  assert.equal(facts.activities.length, 1);
  assert.equal(facts.activities[0].activityLocalDate, "2026-11-18");
  assert.equal(facts.activities[0].performedDate, null);
  assert.equal(facts.activities[0].recordedSessionDayCredit, 0.3);
  assert.equal(facts.activities[0].recordedSessionAchievementShare, 0.5);
  assert.doesNotMatch(JSON.stringify(facts), /synthetic-private|updatedAt|new-revision|amount/);
});

test("explicit and legacy dates retain their distinct provenance", () => {
  const input = fixture();
  const row = input.state.dailyExecution[0];
  row.recoveredOnR331 = "2026-11-20";
  let fact = projectLegacyFacts(input).executions[0];
  assert.equal(fact.performedDate, null);
  assert.equal(fact.legacyRecoveryDate, "2026-11-20");
  assert.equal(fact.transition, "LegacyRecoveryRecorded");

  row.completionDateR367 = "2026-11-19";
  const activity = input.state.definitions[0].activityLog[0];
  activity.achievementDateR367 = "2026-11-19";
  activity.performedOnR331 = "2026-11-19";
  const facts = projectLegacyFacts(input);
  fact = facts.executions[0];
  assert.equal(fact.performedDate, "2026-11-19");
  assert.equal(fact.performanceSource, "completionDateR367");
  assert.equal(fact.transition, "DifferentDateRecorded");
  assert.equal(fact.performedTimeZone, null);
  assert.equal(facts.activities[0].performanceSource, "achievementDateR367");
});

test("rejects mismatched owners, missing links, impossible dates and duplicate activities", () => {
  let input = fixture();
  input.state.personalDays[0].userId = "other-owner";
  assert.throws(() => projectLegacyFacts(input), /R386_FACT_IDENTITY/);
  input = fixture();
  input.state.dailyExecution[0].personalDayId = "unknown";
  assert.throws(() => projectLegacyFacts(input), /R386_FACT_EXECUTION_LINK/);
  input = fixture();
  input.state.dailyExecution[0].completionDateR367 = "2026-02-30";
  assert.throws(() => projectLegacyFacts(input), /R386_FACT_DATE/);
  input = fixture();
  const log = input.state.definitions[0].activityLog;
  log.push(structuredClone(log[0]));
  assert.throws(() => projectLegacyFacts(input), /R386_FACT_ACTIVITY_DUPLICATE/);
});
