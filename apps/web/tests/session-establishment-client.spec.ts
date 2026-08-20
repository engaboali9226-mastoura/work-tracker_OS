import assert from "node:assert/strict";
import test from "node:test";

import {
  createBrowserSessionEstablishmentClient,
} from "../src/session-establishment-client.js";

test(
  "browser session client submits proof only with same-origin credentials",
  async () => {
    let input:
      RequestInfo | URL | undefined;

    let init:
      RequestInit | undefined;

    const client =
      createBrowserSessionEstablishmentClient(
        async (
          requestInput,
          requestInit,
        ) => {
          input =
            requestInput;

          init =
            requestInit;

          return new Response(
            null,
            {
              status:
                204,
            },
          );
        },
      );

    assert.equal(
      await client(
        "provider-proof",
      ),
      "authenticated",
    );

    assert.equal(
      String(
        input,
      ),
      "/api/noor/session",
    );

    assert.equal(
      init?.method,
      "POST",
    );

    assert.equal(
      init?.credentials,
      "same-origin",
    );

    assert.equal(
      init?.cache,
      "no-store",
    );

    assert.deepEqual(
      JSON.parse(
        String(
          init?.body,
        ),
      ),
      {
        proof:
          "provider-proof",
      },
    );
  },
);

test(
  "400 and 401 become generic credential failure while infrastructure and network failures become unavailable",
  async () => {
    for (
      const status
      of [
        400,
        401,
      ]
    ) {
      const client =
        createBrowserSessionEstablishmentClient(
          async () =>
            new Response(
              null,
              {
                status,
              },
            ),
        );

      assert.equal(
        await client(
          "proof",
        ),
        "invalid-credentials",
      );
    }

    const unavailable =
      createBrowserSessionEstablishmentClient(
        async () =>
          new Response(
            null,
            {
              status:
                503,
            },
          ),
      );

    assert.equal(
      await unavailable(
        "proof",
      ),
      "unavailable",
    );

    const network =
      createBrowserSessionEstablishmentClient(
        async () => {
          throw new Error(
            "network",
          );
        },
      );

    assert.equal(
      await network(
        "proof",
      ),
      "unavailable",
    );
  },
);
