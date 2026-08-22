import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchNoorPersonalToday,
} from "../src/noor-personal-today-client.js";

test(
  "Today client sends no user authority and returns the real dashboard",
  async () => {
    let seen:
      Readonly<{
        input:
          RequestInfo | URL;
        init?:
          RequestInit;
      }>
      | undefined;

    const fetcher:
      typeof fetch =
      async (
        input,
        init,
      ) => {
        seen = {
          input,
          init,
        };

        return new Response(
          JSON.stringify({
            personalDay: {
              id:
                "day-1",
            },
            islamicContext: {},
            nextPrayer:
              null,
            tasks:
              [],
            habits:
              [],
            automationPending:
              0,
          }),
          {
            status:
              200,
            headers: {
              "Content-Type":
                "application/json; charset=utf-8",
            },
          },
        );
      };

    const result =
      await fetchNoorPersonalToday(
        fetcher,
      );

    assert.equal(
      seen?.input,
      "/api/noor/personal/today",
    );

    assert.equal(
      seen?.init?.credentials,
      "same-origin",
    );

    assert.equal(
      seen?.init?.body,
      "{}",
    );

    assert.deepEqual(
      result,
      {
        kind:
          "success",
        today: {
          personalDay: {
            id:
              "day-1",
          },
          islamicContext: {},
          nextPrayer:
            null,
          tasks:
            [],
          habits:
            [],
          automationPending:
            0,
        },
      },
    );
  },
);

test(
  "Today client distinguishes setup-required from unavailable",
  async () => {
    assert.deepEqual(
      await fetchNoorPersonalToday(
        async () =>
          new Response(
            null,
            {
              status:
                409,
            },
          ),
      ),
      {
        kind:
          "setup-required",
      },
    );

    assert.deepEqual(
      await fetchNoorPersonalToday(
        async () =>
          new Response(
            null,
            {
              status:
                503,
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
  "Today client rejects malformed 200 payloads instead of rendering untrusted shape",
  async () => {
    assert.deepEqual(
      await fetchNoorPersonalToday(
        async () =>
          new Response(
            JSON.stringify({
              personalDay: {
                id:
                  "day-1",
              },
            }),
            {
              status:
                200,
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
