import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchNoorPersonalToday,
  fetchNoorPersonalWorkspace,
  sendNoorPersonalCommand,
  sendNoorPersonalCommandDetailed,
} from "../src/noor-personal-today-client.js";

function successfulTodayResponse() {
  return new Response(
    JSON.stringify({
      personalDay: {
        id: "day-1",
      },
      islamicContext: {},
      nextPrayer: null,
      tasks: [],
      habits: [],
      automationPending: 0,
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

function successfulWorkspaceResponse() {
  return new Response(
    JSON.stringify({
      definitions: [],
      insights: {
        currentLocalDate:
          "2026-10-24",
        currentStreakDays:
          0,
        bestStreakDays:
          0,
        periods: {
          week: {
            windowDays: 7,
            scheduled: 0,
            completed: 0,
            completionRate: 0,
            successfulDays: 0,
          },
          month: {
            windowDays: 30,
            scheduled: 0,
            completed: 0,
            completionRate: 0,
            successfulDays: 0,
          },
          quarter: {
            windowDays: 90,
            scheduled: 0,
            completed: 0,
            completionRate: 0,
            successfulDays: 0,
          },
          year: {
            windowDays: 365,
            scheduled: 0,
            completed: 0,
            completionRate: 0,
            successfulDays: 0,
          },
        },
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

test(
  "Today client sends no user authority, coalesces concurrent requests, and releases after completion",
  async () => {
    let calls = 0;
    let release:
      (() => void)
      | undefined;

    const gate =
      new Promise<void>(
        resolve => {
          release = resolve;
        },
      );

    const fetcher:
      typeof fetch =
      async (
        input,
        init,
      ) => {
        calls += 1;

        assert.equal(
          input,
          "/api/noor/personal/today",
        );
        assert.equal(
          init?.credentials,
          "same-origin",
        );
        assert.equal(
          init?.body,
          "{}",
        );

        await gate;

        return successfulTodayResponse();
      };

    const first =
      fetchNoorPersonalToday(
        fetcher,
      );

    const second =
      fetchNoorPersonalToday(
        fetcher,
      );

    assert.equal(
      first,
      second,
    );
    assert.equal(
      calls,
      1,
    );

    release?.();

    const [
      firstResult,
      secondResult,
    ] =
      await Promise.all([
        first,
        second,
      ]);

    assert.deepEqual(
      firstResult,
      secondResult,
    );
    assert.equal(
      firstResult.kind,
      "success",
    );

    await fetchNoorPersonalToday(
      fetcher,
    );

    assert.equal(
      calls,
      2,
    );
  },
);

test(
  "Workspace client is same-origin, read-only at the transport boundary, and coalesces concurrent reads",
  async () => {
    let calls = 0;
    let release:
      (() => void)
      | undefined;

    const gate =
      new Promise<void>(
        resolve => {
          release = resolve;
        },
      );

    const fetcher:
      typeof fetch =
      async (
        input,
        init,
      ) => {
        calls += 1;

        assert.equal(
          input,
          "/api/noor/personal/workspace",
        );
        assert.equal(
          init?.credentials,
          "same-origin",
        );
        assert.equal(
          init?.body,
          "{}",
        );

        await gate;

        return successfulWorkspaceResponse();
      };

    const first =
      fetchNoorPersonalWorkspace(
        fetcher,
      );
    const second =
      fetchNoorPersonalWorkspace(
        fetcher,
      );

    assert.equal(
      first,
      second,
    );
    assert.equal(
      calls,
      1,
    );

    release?.();

    const result =
      await first;

    assert.equal(
      result.kind,
      "success",
    );

    await second;
    await fetchNoorPersonalWorkspace(
      fetcher,
    );

    assert.equal(
      calls,
      2,
    );
  },
);

test(
  "Command client sends only the requested command and maps public statuses",
  async () => {
    const seen:
      unknown[] =
      [];

    const success =
      await sendNoorPersonalCommand(
        {
          type:
            "create-definition",
          kind:
            "Task",
          title:
            "إنهاء التقرير",
          category:
            "العمل",
          startDate:
            "2026-10-25",
          endDate:
            null,
          scheduleKind:
            "OneTime",
          weekdays:
            [],
          importance:
            "Important",
        },
        async (
          input,
          init,
        ) => {
          seen.push({
            input,
            credentials:
              init?.credentials,
            body:
              init?.body,
          });

          return new Response(
            null,
            {
              status: 204,
            },
          );
        },
      );

    assert.equal(
      success,
      "success",
    );

    assert.deepEqual(
      seen,
      [
        {
          input:
            "/api/noor/personal/command",
          credentials:
            "same-origin",
          body:
            JSON.stringify({
              type:
                "create-definition",
              kind:
                "Task",
              title:
                "إنهاء التقرير",
              category:
                "العمل",
              startDate:
                "2026-10-25",
              endDate:
                null,
              scheduleKind:
                "OneTime",
              weekdays:
                [],
              importance:
                "Important",
            }),
        },
      ],
    );

    assert.equal(
      await sendNoorPersonalCommand(
        {
          type:
            "set-definition-state",
          definitionId:
            "definition-1",
          state:
            "Paused",
        },
        async () =>
          new Response(
            null,
            {
              status: 409,
            },
          ),
      ),
      "conflict",
    );

    assert.equal(
      await sendNoorPersonalCommand(
        {
          type:
            "set-execution-completed",
          executionId:
            "execution-1",
          completed:
            true,
        },
        async () =>
          new Response(
            null,
            {
              status: 503,
            },
          ),
      ),
      "unavailable",
    );
  },
);

test(
  "Today and Workspace clients reject malformed successful payloads",
  async () => {
    assert.deepEqual(
      await fetchNoorPersonalToday(
        async () =>
          new Response(
            JSON.stringify({
              personalDay: {
                id: "day-1",
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          ),
      ),
      {
        kind:
          "unavailable",
      },
    );

    assert.deepEqual(
      await fetchNoorPersonalWorkspace(
        async () =>
          new Response(
            JSON.stringify({
              definitions: [],
            }),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          ),
      ),
      {
        kind:
          "unavailable",
      },
    );
  },
);

test(
  "R243 acknowledged account location save invalidates a pre-save in-flight Today read",
  async () => {
    let releaseOld: (() => void) | undefined;
    let todayCalls=0;
    const pendingOld=new Promise<void>(resolve=>{releaseOld=resolve;});
    const fetcher:typeof fetch=async(input,init)=>{
      assert.equal(init?.credentials,"same-origin");
      if(input==="/api/noor/personal/command"){
        assert.match(String(init?.body),/"set-account-location"/);
        return new Response(null,{status:204});
      }
      assert.equal(input,"/api/noor/personal/today");
      todayCalls+=1;
      if(todayCalls===1)await pendingOld;
      return successfulTodayResponse();
    };
    const stale=fetchNoorPersonalToday(fetcher);
    assert.equal(todayCalls,1);
    const command=await sendNoorPersonalCommandDetailed({
      type:"set-account-location",
      requestId:"c70ad6d5-a90d-4e16-97ce-20539aecdb07",
      expectedRevisionId:"location-old",
      city:{name:"القاهرة",country:"مصر",latitude:30.04,longitude:31.24,timeZone:"Africa/Cairo"},
    },fetcher);
    assert.equal(command.kind,"success");
    const fresh=fetchNoorPersonalToday(fetcher);
    assert.notEqual(fresh,stale);
    assert.equal(todayCalls,2);
    assert.equal((await fresh).kind,"success");
    releaseOld?.();
    assert.equal((await stale).kind,"success");
    await fetchNoorPersonalToday(fetcher);
    assert.equal(todayCalls,3);
  },
);
