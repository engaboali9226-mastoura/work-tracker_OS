import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationDeniedError,
  InvalidSessionError,
  UserId,
} from "@worktracker/core";

import {
  PersonalTodayOperation,
} from "../src/personal-today-operation.js";

function prototypeError<
  ErrorType extends Error,
>(
  prototype:
    object,
):
ErrorType {
  const error =
    new Error(
      "test",
    ) as ErrorType;

  Object.setPrototypeOf(
    error,
    prototype,
  );

  return error;
}

function baseDependencies() {
  return {
    isRuntimeRunning:
      () =>
        true,

    resolveSession: {
      async execute() {
        return {
          accountId:
            "account-1",
        };
      },
    },

    authorize: {
      async execute() {
      },
    },

    accountUserResolver: {
      async resolve() {
        return new UserId(
          "user-1",
        );
      },
    },

    foundation: {
      async openOperation() {
        return {
          locations: {
            async getEffective() {
              return null;
            },
          },

          prayerPolicies: {
            async getEffective() {
              throw new Error(
                "should not be reached",
              );
            },
          },

          transaction: {
            async runInTransaction() {
              throw new Error(
                "should not be reached",
              );
            },
          },
        };
      },
    },

    ensureToday: {
      clock: {
        now() {
          return "2026-08-22T09:00:00.000Z";
        },
      },

      idGenerator: {
        next(
          prefix:
            string,
        ) {
          return `${prefix}-1`;
        },
      },

      timeZone: {
        localDateForInstant() {
          return "2026-08-22";
        },

        addLocalDays(
          date:
            string,
        ) {
          return date;
        },

        weekday() {
          return 6;
        },
      },

      prayerCalculator: {
        async calculate() {
          throw new Error(
            "should not be reached",
          );
        },
      },

      hijriCalculator: {
        async calculate() {
          throw new Error(
            "should not be reached",
          );
        },
      },

      historyCatalog: {
        async findApprovedForHijriDate() {
          return [];
        },
      },
    },
  };
}

test(
  "Personal Today rejects missing session before any browser identity can participate",
  async () => {
    const operation =
      new PersonalTodayOperation(
        baseDependencies(),
      );

    assert.deepEqual(
      await operation.execute({
        sessionId:
          null,
      }),
      {
        status:
          401,
      },
    );
  },
);

test(
  "Personal Today maps invalid trusted session evidence to 401",
  async () => {
    const dependencies =
      baseDependencies();

    dependencies.resolveSession = {
      async execute() {
        throw prototypeError(
          InvalidSessionError.prototype,
        );
      },
    };

    assert.deepEqual(
      await new PersonalTodayOperation(
        dependencies,
      ).execute({
        sessionId: "invalid-session",
      }),
      {
        status: 401,
      },
    );
  },
);

test(
  "Personal Today maps entitlement denial to 403",
  async () => {
    const dependencies =
      baseDependencies();

    dependencies.authorize = {
      async execute() {
        throw prototypeError(
          AuthorizationDeniedError
            .prototype,
        );
      },
    };

    const operation =
      new PersonalTodayOperation(
        dependencies,
      );

    assert.deepEqual(
      await operation.execute({
        sessionId:
          "session-1",
      }),
      {
        status:
          403,
      },
    );
  },
);

test(
  "Personal Today maps missing real Personal setup to 409",
  async () => {
    const operation =
      new PersonalTodayOperation(
        baseDependencies(),
      );

    assert.deepEqual(
      await operation.execute({
        sessionId:
          "session-1",
      }),
      {
        status:
          409,
      },
    );
  },
);

test(
  "Personal Today uses only the trusted session account and exact authorization tuple",
  async () => {
    const dependencies =
      baseDependencies();
    const calls: unknown[] = [];

    dependencies.resolveSession = {
      async execute() {
        return {
          accountId: "trusted-account",
        };
      },
    };
    dependencies.authorize = {
      async execute(input) {
        calls.push(input);
      },
    };
    dependencies.accountUserResolver = {
      async resolve(accountId) {
        calls.push(accountId);
        return new UserId(
          "canonical-user",
        );
      },
    };
    dependencies.foundation = {
      async openOperation(userId) {
        calls.push(userId);
        return {
          locations: {
            async getEffective() {
              return null;
            },
          },
          prayerPolicies: {},
          transaction: {},
        };
      },
    } as never;

    const result =
      await new PersonalTodayOperation(
        dependencies,
      ).execute({
        sessionId: "trusted-session",
        accountId: "caller-account",
        userId: "caller-user",
      } as never);

    assert.deepEqual(
      result,
      {
        status: 409,
      },
    );
    assert.deepEqual(
      calls,
      [
        {
          accountId: "trusted-account",
          action: "access",
          resourceType: "application",
          resourceId: "noor-personal",
        },
        "trusted-account",
        "canonical-user",
      ],
    );
  },
);

test(
  "Personal Today maps resolver and downstream failures without leaking exception text",
  async () => {
    for (
      const configure
      of [
        dependencies => {
          dependencies.accountUserResolver = {
            async resolve() {
              return null;
            },
          };
        },
        dependencies => {
          dependencies.accountUserResolver = {
            async resolve() {
              throw new Error(
                "resolver secret",
              );
            },
          };
        },
        dependencies => {
          dependencies.foundation = {
            async openOperation() {
              throw new Error(
                "persistence secret",
              );
            },
          } as never;
        },
      ]
    ) {
      const dependencies =
        baseDependencies();

      configure(dependencies);

      const result =
        await new PersonalTodayOperation(
          dependencies,
        ).execute({
          sessionId: "session-1",
        });

      assert.deepEqual(
        result,
        {
          status: 503,
        },
      );
      assert.equal(
        "body" in result,
        false,
      );
      assert.doesNotMatch(
        JSON.stringify(result),
        /secret/u,
      );
    }
  },
);

test(
  "Personal Today maps missing prayer policy and provider failure through public statuses",
  async () => {
    const missingPolicy =
      baseDependencies();

    missingPolicy.foundation = {
      async openOperation() {
        return {
          locations: {
            async getEffective() {
              return {
                id: "location-1",
                userId: "user-1",
                name: "Riyadh",
                latitude: 24.7,
                longitude: 46.7,
                timeZone: "Asia/Riyadh",
                effectiveFrom: "2026-08-01T00:00:00.000Z",
              };
            },
          },
          prayerPolicies: {
            async getEffective() {
              return null;
            },
          },
          transaction: {},
        };
      },
    } as never;

    assert.deepEqual(
      await new PersonalTodayOperation(
        missingPolicy,
      ).execute({ sessionId: "session-1" }),
      { status: 409 },
    );

    const providerFailure =
      baseDependencies();

    providerFailure.foundation = {
      async openOperation() {
        return {
          locations: {
            async getEffective() {
              return {
                id: "location-1",
                userId: "user-1",
                name: "Riyadh",
                latitude: 24.7,
                longitude: 46.7,
                timeZone: "Asia/Riyadh",
                effectiveFrom: "2026-08-01T00:00:00.000Z",
              };
            },
          },
          prayerPolicies: {
            async getEffective() {
              return {
                id: "policy-1",
                userId: "user-1",
                calculationMethod: "MuslimWorldLeague",
                fajrAdjustmentMinutes: 0,
                personalDayOffsetMinutes: 0,
                effectiveFrom: "2026-08-01T00:00:00.000Z",
              };
            },
          },
          transaction: {},
        };
      },
    } as never;
    providerFailure.ensureToday.prayerCalculator = {
      async calculate() {
        throw new Error(
          "provider secret",
        );
      },
    };

    assert.deepEqual(
      await new PersonalTodayOperation(
        providerFailure,
      ).execute({ sessionId: "session-1" }),
      { status: 503 },
    );
  },
);

test(
  "Personal Today returns the canonical dashboard for a successful trusted orchestration",
  async () => {
    const dependencies =
      baseDependencies();
    const personalDay = {
      id: "day-1",
      userId: "user-1",
      boundary: {
        key: "personal-day:user-1:2026-08-22T05:00:00.000Z",
        localDate: "2026-08-22",
        startAt: "2026-08-22T05:00:00.000Z",
        endAt: "2026-08-23T05:00:00.000Z",
        calculatedFajrAt: "2026-08-22T05:00:00.000Z",
        nextCalculatedFajrAt: "2026-08-23T05:00:00.000Z",
        fajrAdjustmentMinutes: 0,
        personalDayOffsetMinutes: 0,
        locationRevisionId: "location-1",
        prayerPolicyRevisionId: "policy-1",
        timeZone: "Asia/Riyadh",
        calculationMethod: "MuslimWorldLeague",
        calculationSource: "test",
        calculationEngineVersion: "test-1",
      },
      state: "Closed",
      version: 1,
      createdAt: "2026-08-22T05:00:00.000Z",
      updatedAt: "2026-08-22T05:00:00.000Z",
    };
    const context = {
      id: "context-1",
      key: "context-key",
      personalDayId: "day-1",
      prayerTimes: {
        localDate: "2026-08-22",
        fajr: "2026-08-22T05:00:00.000Z",
        sunrise: "2026-08-22T06:00:00.000Z",
        dhuhr: "2026-08-22T12:00:00.000Z",
        asr: "2026-08-22T15:00:00.000Z",
        maghrib: "2026-08-22T18:00:00.000Z",
        isha: "2026-08-22T19:00:00.000Z",
        nextFajr: "2026-08-23T05:00:00.000Z",
        source: "test",
        engineVersion: "test-1",
      },
      hijriDate: {
        day: 9,
        month: 3,
        monthName: "Umm al-Qura month 3",
        year: 1448,
        source: "test",
        method: "UmmAlQura",
        adjustmentDays: 0,
        calculatedAt: "2026-08-22T09:00:00.000Z",
      },
      approvedHistoryEventIds: [],
      fastingWindowMinutes: 780,
      ishaToNextFajrMinutes: 600,
      version: 1,
      createdAt: "2026-08-22T05:00:00.000Z",
    };

    dependencies.foundation = {
      async openOperation() {
        return {
          locations: {
            async getEffective() {
              return {
                id: "location-1",
                userId: "user-1",
                name: "Riyadh",
                latitude: 24.7,
                longitude: 46.7,
                timeZone: "Asia/Riyadh",
                effectiveFrom: "2026-08-01T00:00:00.000Z",
              };
            },
          },
          prayerPolicies: {
            async getEffective() {
              return {
                id: "policy-1",
                userId: "user-1",
                calculationMethod: "MuslimWorldLeague",
                fajrAdjustmentMinutes: 0,
                personalDayOffsetMinutes: 0,
                effectiveFrom: "2026-08-01T00:00:00.000Z",
              };
            },
          },
          transaction: {
            async runInTransaction(operation) {
              return operation({
                findOpenPersonalDayContaining() {
                  return null;
                },
                findPersonalDayByKey() {
                  return personalDay;
                },
                findDailyIslamicContextByPersonalDayId() {
                  return context;
                },
                listDailyExecution() {
                  return [];
                },
                countPendingOutbox() {
                  return 0;
                },
              });
            },
          },
        };
      },
    } as never;
    dependencies.ensureToday.prayerCalculator = {
      async calculate(
        _location,
        _policy,
        localDate,
      ) {
        return {
          ...context.prayerTimes,
          localDate,
          fajr: `${localDate}T05:00:00.000Z`,
          sunrise: `${localDate}T06:00:00.000Z`,
          dhuhr: `${localDate}T12:00:00.000Z`,
          asr: `${localDate}T15:00:00.000Z`,
          maghrib: `${localDate}T18:00:00.000Z`,
          isha: `${localDate}T19:00:00.000Z`,
        };
      },
    };
    dependencies.ensureToday.timeZone = {
      localDateForInstant() {
        return "2026-08-22";
      },
      addLocalDays(
        localDate,
        days,
      ) {
        const value =
          new Date(
            `${localDate}T12:00:00.000Z`,
          );

        value.setUTCDate(
          value.getUTCDate()
          + days,
        );

        return value.toISOString().slice(0, 10);
      },
      weekday() {
        return 6;
      },
    };

    const result =
      await new PersonalTodayOperation(
        dependencies,
      ).execute({
        sessionId: "session-1",
      });

    assert.equal(
      result.status,
      200,
    );
    assert.deepEqual(
      result.body,
      {
        personalDay,
        islamicContext: context,
        nextPrayer: {
          name: "Dhuhr",
          at: "2026-08-22T12:00:00.000Z",
          secondsRemaining: 10_800,
        },
        tasks: [],
        habits: [],
        automationPending: 0,
      },
    );
  },
);
