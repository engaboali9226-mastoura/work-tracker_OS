import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidRouteAccessEvidenceRequestError,
} from "../src/privileged-route-access-evidence-operation.js";

import {
  MAX_ROUTE_ACCESS_REQUEST_BODY_BYTES,
  createRouteAccessHttpServer,
} from "../src/route-access-http-server.js";

import type {
  RouteAccessEvidenceExecutor,
} from "../src/route-access-http-server.js";

function evidence(
  kind:
    | "authenticated-authorized"
    | "authentication-required"
    | "session-access-unavailable"
    | "authorization-denied"
    | "authorization-unavailable" =
      "authentication-required",
) {
  return Object.freeze({
    kind,
    appKey:
      "noor-personal",
    pathname:
      "/personal",
  });
}

async function withServer(
  executor:
    RouteAccessEvidenceExecutor,
  body:
    (
      origin:
        string,
    ) => Promise<void>,
): Promise<void> {
  const server =
    createRouteAccessHttpServer(
      executor,
    );

  await server.listen({
    host:
      "127.0.0.1",
    port:
      0,
  });

  const address =
    server.address();

  assert.ok(
    address,
  );

  assert.notEqual(
    typeof address,
    "string",
  );

  if (
    !address
    || typeof address === "string"
  ) {
    throw new Error(
      "HTTP test listener address is unavailable.",
    );
  }

  try {
    await body(
      `http://127.0.0.1:${address.port}`,
    );
  } finally {
    await server.close();
  }
}

function post(
  origin:
    string,
  body:
    unknown,
  headers:
    Record<string, string> = {},
) {
  return fetch(
    `${origin}/api/noor/route-access-evidence`,
    {
      method:
        "POST",
      headers: {
        "Content-Type":
          "application/json",
        ...headers,
      },
      body:
        typeof body === "string"
          ? body
          : JSON.stringify(
              body,
            ),
    },
  );
}

test(
  "canonical request without session cookie reaches privileged operation with null session context",
  async () => {
    const contexts:
      Array<string | null> =
        [];

    const executor:
      RouteAccessEvidenceExecutor =
      {
        async execute(input) {
          contexts.push(
            input.context
              .sessionId,
          );

          return evidence();
        },
      };

    await withServer(
      executor,
      async origin => {
        const response =
          await post(
            origin,
            {
              appKey:
                "noor-personal",
              pathname:
                "/personal",
            },
          );

        assert.equal(
          response.status,
          200,
        );

        assert.deepEqual(
          await response.json(),
          evidence(),
        );
      },
    );

    assert.deepEqual(
      contexts,
      [
        null,
      ],
    );
  },
);

test(
  "exactly one valid opaque session cookie becomes trusted invocation context",
  async () => {
    const contexts:
      Array<string | null> =
        [];

    const executor:
      RouteAccessEvidenceExecutor =
      {
        async execute(input) {
          contexts.push(
            input.context
              .sessionId,
          );

          return evidence(
            "authenticated-authorized",
          );
        },
      };

    await withServer(
      executor,
      async origin => {
        const response =
          await post(
            origin,
            {
              appKey:
                "noor-personal",
              pathname:
                "/personal",
            },
            {
              Cookie:
                "theme=dark; noor_session=session-opaque-0001; locale=en",
            },
          );

        assert.equal(
          response.status,
          200,
        );
      },
    );

    assert.deepEqual(
      contexts,
      [
        "session-opaque-0001",
      ],
    );
  },
);

test(
  "empty malformed and duplicate session cookies fail closed to null without arbitrary selection",
  async () => {
    const contexts:
      Array<string | null> =
        [];

    const executor:
      RouteAccessEvidenceExecutor =
      {
        async execute(input) {
          contexts.push(
            input.context
              .sessionId,
          );

          return evidence();
        },
      };

    const cookieHeaders =
      [
        "noor_session=",
        "noor_session=\"quoted-value\"",
        "noor_session=session-a; noor_session=session-a",
        "noor_session=session-a; noor_session=session-b",
        "noor_session =session-a",
      ];

    await withServer(
      executor,
      async origin => {
        for (
          const cookie
          of cookieHeaders
        ) {
          const response =
            await post(
              origin,
              {
                appKey:
                  "noor-personal",
                pathname:
                  "/personal",
              },
              {
                Cookie:
                  cookie,
              },
            );

          assert.equal(
            response.status,
            200,
          );
        }
      },
    );

    assert.deepEqual(
      contexts,
      cookieHeaders.map(
        () =>
          null,
      ),
    );
  },
);

test(
  "caller-controlled security authority fields are rejected before privileged execution",
  async () => {
    let calls =
      0;

    const executor:
      RouteAccessEvidenceExecutor =
      {
        async execute() {
          calls +=
            1;

          return evidence();
        },
      };

    const hostileBodies =
      [
        {
          appKey:
            "noor-personal",
          pathname:
            "/personal",
          sessionId:
            "browser-session",
        },
        {
          appKey:
            "noor-personal",
          pathname:
            "/personal",
          accountId:
            "browser-account",
        },
        {
          appKey:
            "noor-personal",
          pathname:
            "/personal",
          entitlement:
            "allow",
        },
        {
          appKey:
            "noor-personal",
          pathname:
            "/personal",
          authorization:
            {
              action:
                "access",
            },
        },
      ];

    await withServer(
      executor,
      async origin => {
        for (
          const hostile
          of hostileBodies
        ) {
          const response =
            await post(
              origin,
              hostile,
            );

          assert.equal(
            response.status,
            400,
          );
        }
      },
    );

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "transport rejects wrong route method media type malformed JSON and oversized bodies before privileged execution",
  async () => {
    let calls =
      0;

    const executor:
      RouteAccessEvidenceExecutor =
      {
        async execute() {
          calls +=
            1;

          return evidence();
        },
      };

    await withServer(
      executor,
      async origin => {
        const wrongRoute =
          await fetch(
            `${origin}/api/noor/not-route-access`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                "{}",
            },
          );

        assert.equal(
          wrongRoute.status,
          404,
        );

        const wrongMethod =
          await fetch(
            `${origin}/api/noor/route-access-evidence`,
            {
              method:
                "GET",
            },
          );

        assert.equal(
          wrongMethod.status,
          405,
        );

        assert.equal(
          wrongMethod.headers.get(
            "allow",
          ),
          "POST",
        );

        const wrongMedia =
          await fetch(
            `${origin}/api/noor/route-access-evidence`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "text/plain",
              },
              body:
                "{}",
            },
          );

        assert.equal(
          wrongMedia.status,
          415,
        );

        const malformed =
          await post(
            origin,
            "{not-json",
          );

        assert.equal(
          malformed.status,
          400,
        );

        const oversized =
          await post(
            origin,
            {
              appKey:
                "noor-personal",
              pathname:
                "/personal",
              padding:
                "x".repeat(
                  MAX_ROUTE_ACCESS_REQUEST_BODY_BYTES,
                ),
            },
          );

        assert.equal(
          oversized.status,
          413,
        );
      },
    );

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "invalid canonical route error is sanitized to 400 and internal failure to empty 500",
  async () => {
    let mode:
      "invalid"
      | "internal" =
        "invalid";

    const executor:
      RouteAccessEvidenceExecutor =
      {
        async execute() {
          if (
            mode ===
            "invalid"
          ) {
            throw new InvalidRouteAccessEvidenceRequestError();
          }

          throw new Error(
            "secret internal detail",
          );
        },
      };

    await withServer(
      executor,
      async origin => {
        const invalid =
          await post(
            origin,
            {
              appKey:
                "unknown",
              pathname:
                "/unknown",
            },
          );

        assert.equal(
          invalid.status,
          400,
        );

        assert.equal(
          await invalid.text(),
          "",
        );

        mode =
          "internal";

        const internal =
          await post(
            origin,
            {
              appKey:
                "noor-personal",
              pathname:
                "/personal",
            },
          );

        assert.equal(
          internal.status,
          500,
        );

        assert.equal(
          await internal.text(),
          "",
        );
      },
    );
  },
);

test(
  "successful response serializes only canonical evidence fields and emits no CORS authority",
  async () => {
    const executor =
      {
        async execute() {
          return {
            ...evidence(
              "authenticated-authorized",
            ),
            sessionId:
              "must-not-cross-boundary",
            accountId:
              "must-not-cross-boundary",
            secret:
              "must-not-cross-boundary",
          } as never;
        },
      };

    await withServer(
      executor,
      async origin => {
        const response =
          await post(
            origin,
            {
              appKey:
                "noor-personal",
              pathname:
                "/personal",
            },
          );

        assert.equal(
          response.status,
          200,
        );

        assert.equal(
          response.headers.get(
            "cache-control",
          ),
          "no-store",
        );

        assert.equal(
          response.headers.get(
            "access-control-allow-origin",
          ),
          null,
        );

        assert.deepEqual(
          await response.json(),
          evidence(
            "authenticated-authorized",
          ),
        );
      },
    );
  },
);
