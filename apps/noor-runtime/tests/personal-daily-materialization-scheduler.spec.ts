import assert from "node:assert/strict";
import test from "node:test";

import {
  PersonalDailyMaterializationScheduler,
} from "../src/personal-daily-materialization-scheduler.js";

function personalDay(
  startAt = "2026-10-24T01:37:00.000Z",
  endAt = "2026-10-25T01:37:00.000Z",
) {
  return {
    id: "day-1",
    userId: "user-1",
    boundary: {
      key: "day-key",
      localDate: "2026-10-24",
      startAt,
      endAt,
      calculatedFajrAt: startAt,
      nextCalculatedFajrAt: endAt,
      fajrAdjustmentMinutes: 0,
      personalDayOffsetMinutes: 0,
      locationRevisionId: "location-1",
      prayerPolicyRevisionId: "policy-1",
      timeZone: "Asia/Riyadh",
      calculationMethod: "UmmAlQura",
      calculationSource: "adhan",
      calculationEngineVersion: "4.4.4",
    },
    state: "Open",
    version: 1,
    createdAt: startAt,
    updatedAt: startAt,
  } as const;
}

test(
  "daily scheduler does not open a transaction while any current Personal Day still contains now",
  async () => {
    let transactionRuns = 0;

    const scheduler =
      new PersonalDailyMaterializationScheduler({
        clock: {
          now() {
            return "2026-10-24T12:00:00.000Z";
          },
        },
        idGenerator: {
          next(prefix: string) {
            return `${prefix}-1`;
          },
        },
        foundation: {
          async listKnownUserIds() {
            return ["user-1"];
          },
          async openOperation() {
            return {
              locations: {
                async getEffective() {
                  throw new Error("must not be called");
                },
              },
              prayerPolicies: {
                async getEffective() {
                  throw new Error("must not be called");
                },
              },
              snapshot: {
                listDefinitions() {
                  return [];
                },
                listPersonalDays() {
                  return [personalDay()];
                },
                listDailyExecutionForUser() {
                  return [];
                },
              },
              transaction: {
                async runInTransaction() {
                  transactionRuns += 1;
                  throw new Error("must not run");
                },
              },
            } as never;
          },
        },
      });

    await scheduler.tick();

    assert.equal(transactionRuns, 0);
  },
);

test(
  "daily scheduler catches up after the Personal Day boundary passes",
  async () => {
    let locationReads = 0;

    const scheduler =
      new PersonalDailyMaterializationScheduler({
        clock: {
          now() {
            return "2026-10-25T02:00:00.000Z";
          },
        },
        idGenerator: {
          next(prefix: string) {
            return `${prefix}-1`;
          },
        },
        foundation: {
          async listKnownUserIds() {
            return ["user-1"];
          },
          async openOperation() {
            return {
              locations: {
                async getEffective() {
                  locationReads += 1;
                  return null;
                },
              },
              prayerPolicies: {
                async getEffective() {
                  return null;
                },
              },
              snapshot: {
                listDefinitions() {
                  return [];
                },
                listPersonalDays() {
                  return [personalDay()];
                },
                listDailyExecutionForUser() {
                  return [];
                },
              },
              transaction: {
                async runInTransaction() {
                  throw new Error("not reached without location");
                },
              },
            } as never;
          },
        },
      });

    await scheduler.tick();

    assert.equal(locationReads, 1);
  },
);
