import assert from "node:assert/strict";
import test from "node:test";

import {
  UserId,
} from "@worktracker/core";

import {
  PersonalControlOperation,
} from "../src/personal-control-operation.js";

function dependencies() {
  const state = {
    definitions: [] as any[],
    execution: [] as any[],
    outbox: [] as any[],
  };

  const personalDay = {
    id: "day-1",
    userId: "user-1",
    boundary: {
      key: "day-key",
      localDate: "2026-10-24",
      startAt: "2026-10-24T01:37:00.000Z",
      endAt: "2026-10-25T01:37:00.000Z",
      calculatedFajrAt: "2026-10-24T01:37:00.000Z",
      nextCalculatedFajrAt: "2026-10-25T01:37:00.000Z",
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
    createdAt: "2026-10-24T02:00:00.000Z",
    updatedAt: "2026-10-24T02:00:00.000Z",
  } as const;

  const transaction = {
    findOpenPersonalDayContaining() {
      return personalDay;
    },
    findPersonalDayByKey() {
      return null;
    },
    savePersonalDay() {},
    findDailyIslamicContextByKey() {
      return null;
    },
    findDailyIslamicContextByPersonalDayId() {
      return null;
    },
    saveDailyIslamicContext() {},
    listDefinitions() {
      return state.definitions;
    },
    findDefinitionById(
      _userId: string,
      definitionId: string,
    ) {
      return state.definitions.find(
        value => value.id === definitionId,
      ) ?? null;
    },
    saveDefinition(value: any) {
      const index =
        state.definitions.findIndex(
          existing => existing.id === value.id,
        );

      if (index < 0) {
        state.definitions.push(
          structuredClone(value),
        );
      } else {
        state.definitions[index] =
          structuredClone(value);
      }
    },
    listDailyExecution() {
      return state.execution;
    },
    findDailyExecutionById(
      _userId: string,
      executionId: string,
    ) {
      return state.execution.find(
        value => value.id === executionId,
      ) ?? null;
    },
    saveDailyExecution(value: any) {
      const index =
        state.execution.findIndex(
          existing => existing.id === value.id,
        );

      if (index < 0) {
        state.execution.push(
          structuredClone(value),
        );
      } else {
        state.execution[index] =
          structuredClone(value);
      }
    },
    findOutboxByIdempotencyKey() {
      return null;
    },
    saveOutbox(value: any) {
      state.outbox.push(
        structuredClone(value),
      );
    },
    countPendingOutbox() {
      return state.outbox.length;
    },
  };

  const scope = {
    locations: {},
    prayerPolicies: {},
    transaction: {
      async runInTransaction(work: any) {
        return work(transaction);
      },
    },
    snapshot: {
      listDefinitions() {
        return structuredClone(
          state.definitions,
        );
      },
      listPersonalDays() {
        return [
          structuredClone(
            personalDay,
          ),
        ];
      },
      listDailyExecutionForUser() {
        return structuredClone(
          state.execution,
        );
      },
    },
  };

  let id = 0;

  return {
    state,
    value: {
      isRuntimeRunning:
        () => true,
      resolveSession: {
        async execute() {
          return {
            accountId: "account-1",
          };
        },
      },
      authorize: {
        async execute() {},
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
          return scope as never;
        },
      },
      clock: {
        now() {
          return "2026-10-24T12:00:00.000Z";
        },
      },
      idGenerator: {
        next(prefix: string) {
          id += 1;
          return `${prefix}-${id}`;
        },
      },
    },
  };
}

test(
  "Personal control rejects missing session for workspace",
  async () => {
    const fixture =
      dependencies();

    const operation =
      new PersonalControlOperation(
        fixture.value,
      );

    assert.deepEqual(
      await operation.readWorkspace({
        sessionId: null,
      }),
      {
        status: 401,
      },
    );
  },
);

test(
  "Personal control returns workspace from the trusted user's Foundation snapshot",
  async () => {
    const fixture =
      dependencies();

    const operation =
      new PersonalControlOperation(
        fixture.value,
      );

    const result =
      await operation.readWorkspace({
        sessionId: "session-1",
      });

    assert.equal(
      result.status,
      200,
    );

    assert.deepEqual(
      (result.body as any)
        .definitions,
      [],
    );

    assert.equal(
      (result.body as any)
        .insights
        .periods.week.scheduled,
      0,
    );
  },
);

test(
  "Personal control rejects malformed command before privileged identity resolution",
  async () => {
    const fixture =
      dependencies();

    let sessionCalls =
      0;

    fixture.value.resolveSession = {
      async execute() {
        sessionCalls += 1;
        return {
          accountId: "account-1",
        };
      },
    };

    const operation =
      new PersonalControlOperation(
        fixture.value,
      );

    assert.deepEqual(
      await operation.executeCommand({
        sessionId: "session-1",
        command: {
          type: "create-definition",
          kind: "Habit",
          title: "المشي",
          userId: "caller-controlled",
        },
      }),
      {
        status: 400,
      },
    );

    assert.equal(
      sessionCalls,
      0,
    );
  },
);

test(
  "Personal control creates a definition only under the trusted resolved user",
  async () => {
    const fixture =
      dependencies();

    const operation =
      new PersonalControlOperation(
        fixture.value,
      );

    const result = await operation.executeCommand({
        sessionId: "session-1",
        command: {
          type: "create-definition",
          kind: "Habit",
          title: "المشي",
          category: "الصحة والرياضة",
          startDate: "2026-10-24",
          endDate: null,
          scheduleKind: "Daily",
          weekdays: [],
          importance: "Supporting",
        },
      });
    assert.equal(result.status,200);
    const reply=result.body as any;
    assert.equal(reply.materializationRequired,true);
    assert.equal(reply.personalDayId,"day-1");
    assert.deepEqual(reply.executions,[]);
    assert.equal(reply.workspace.definitions.length,1);
    assert.equal(reply.workspace.definitions[0].userId,"user-1");

    assert.equal(
      fixture.state
        .definitions.length,
      1,
    );

    assert.equal(
      fixture.state
        .definitions[0]
        .userId,
      "user-1",
    );

    assert.equal(
      fixture.state
        .definitions[0]
        .schedule.kind,
      "Daily",
    );

    assert.equal(
      fixture.state
        .definitions[0]
        .category,
      "الصحة والرياضة",
    );
  },
);
