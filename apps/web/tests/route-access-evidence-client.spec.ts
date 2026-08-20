import assert from "node:assert/strict";
import test from "node:test";

import {
  createBrowserRouteAccessEvidenceClient,
} from "../src/route-access-evidence-client.js";

import type {
  RouteAccessEvidenceFetch,
} from "../src/route-access-evidence-client.js";

test(
  "browser client POSTs only appKey and pathname using same-origin credentials and no-store cache",
  async () => {
    let capturedInput:
      RequestInfo | URL | undefined;

    let capturedInit:
      RequestInit | undefined;

    const fetchImplementation:
      RouteAccessEvidenceFetch =
      async (
        input,
        init,
      ) => {
        capturedInput =
          input;

        capturedInit =
          init;

        return new Response(
          JSON.stringify({
            kind:
              "authentication-required",
            appKey:
              "noor-personal",
            pathname:
              "/personal",
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

    const client =
      createBrowserRouteAccessEvidenceClient(
        fetchImplementation,
      );

    const abortController =
      new AbortController();

    const result =
      await client(
        {
          appKey:
            "noor-personal" as never,
          pathname:
            "/personal",
        },
        abortController.signal,
      );

    assert.equal(
      String(
        capturedInput,
      ),
      "/api/noor/route-access-evidence",
    );

    assert.equal(
      capturedInit?.method,
      "POST",
    );

    assert.equal(
      capturedInit?.credentials,
      "same-origin",
    );

    assert.equal(
      capturedInit?.cache,
      "no-store",
    );

    assert.equal(
      capturedInit?.signal,
      abortController.signal,
    );

    const headers =
      capturedInit?.headers as
        Record<string, string>;

    assert.equal(
      headers["Content-Type"],
      "application/json",
    );

    assert.equal(
      headers.Accept,
      "application/json",
    );

    assert.equal(
      Object.hasOwn(
        headers,
        "Authorization",
      ),
      false,
    );

    assert.deepEqual(
      JSON.parse(
        String(
          capturedInit?.body,
        ),
      ),
      {
        appKey:
          "noor-personal",
        pathname:
          "/personal",
      },
    );

    assert.deepEqual(
      result,
      {
        kind:
          "authentication-required",
        appKey:
          "noor-personal",
        pathname:
          "/personal",
      },
    );
  },
);

test(
  "non-success non-JSON and malformed JSON responses fail closed",
  async () => {
    const responses =
      [
        new Response(
          "",
          {
            status:
              500,
          },
        ),

        new Response(
          "{}",
          {
            status:
              200,
            headers: {
              "Content-Type":
                "text/plain",
            },
          },
        ),

        new Response(
          "{malformed",
          {
            status:
              200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      ];

    for (
      const response
      of responses
    ) {
      const client =
        createBrowserRouteAccessEvidenceClient(
          async () =>
            response,
        );

      await assert.rejects(
        client({
          appKey:
            "noor-personal" as never,
          pathname:
            "/personal",
        }),
      );
    }
  },
);
