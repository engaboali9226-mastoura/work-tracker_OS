import assert from "node:assert/strict";
import {
  createServer,
} from "node:http";
import test from "node:test";

import {
  AuthenticationUnavailableError,
  InvalidCredentialsError,
  SessionUnavailableError,
} from "@worktracker/core";

import {
  createSessionEstablishmentHttpHandler,
} from "../src/session-establishment-http-handler.js";

import type {
  SessionEstablishmentExecutor,
} from "../src/session-establishment-http-handler.js";

const PUBLIC_ORIGIN =
  "https://shell.noor.test";

const session =
  Object.freeze({
    id:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    accountId:
      "account-0001",
    createdAtEpochMs:
      1_900_000_000_000,
    expiresAtEpochMs:
      1_900_000_060_000,
    revokedAtEpochMs:
      null,
  }) as never;

async function withHandler(
  executor:
    SessionEstablishmentExecutor,
  body:
    (
      origin:
        string,
    ) => Promise<void>,
): Promise<void> {
  const handler =
    createSessionEstablishmentHttpHandler({
      executor,
      publicOrigin:
        PUBLIC_ORIGIN,
      secureCookie:
        true,
    });

  const server =
    createServer(
      (
        request,
        response,
      ) => {
        void handler
          .handle(
            request,
            response,
          );
      },
    );

  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      server.once(
        "error",
        reject,
      );

      server.listen(
        0,
        "127.0.0.1",
        resolve,
      );
    },
  );

  const address =
    server.address();

  assert.ok(
    address
    && typeof address !== "string",
  );

  if (
    !address
    || typeof address === "string"
  ) {
    throw new Error(
      "HTTP test listener unavailable.",
    );
  }

  try {
    await body(
      `http://127.0.0.1:${address.port}`,
    );
  } finally {
    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
        server.close(
          error => {
            if (error) {
              reject(
                error,
              );

              return;
            }

            resolve();
          },
        );
      },
    );
  }
}

function post(
  origin:
    string,
  body:
    unknown,
  requestOrigin:
    string = PUBLIC_ORIGIN,
) {
  return fetch(
    origin,
    {
      method:
        "POST",
      headers: {
        "Content-Type":
          "application/json",
        Origin:
          requestOrigin,
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
  "valid proof produces empty 204 with canonical session cookie only after executor success",
  async () => {
    let seen:
      unknown;

    await withHandler(
      {
        async execute(
          input,
        ) {
          seen =
            input;

          return session;
        },
      },
      async origin => {
        const response =
          await post(
            origin,
            {
              proof:
                "provider-proof",
            },
          );

        assert.equal(
          response.status,
          204,
        );

        assert.deepEqual(
          seen,
          {
            proof:
              "provider-proof",
          },
        );

        const cookie =
          response.headers.get(
            "set-cookie",
          );

        assert.ok(
          cookie,
        );

        assert.match(
          cookie,
          /^noor_session=/u,
        );

        assert.equal(
          await response.text(),
          "",
        );
      },
    );
  },
);

test(
  "missing foreign malformed authority and hostile body fields fail before privileged execution",
  async () => {
    let calls =
      0;

    await withHandler(
      {
        async execute() {
          calls +=
            1;

          return session;
        },
      },
      async origin => {
        const foreign =
          await post(
            origin,
            {
              proof:
                "proof",
            },
            "https://evil.example",
          );

        assert.equal(
          foreign.status,
          403,
        );

        const noOrigin =
          await fetch(
            origin,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  proof:
                    "proof",
                }),
            },
          );

        assert.equal(
          noOrigin.status,
          403,
        );

        for (
          const body
          of [
            {
              proof:
                "proof",
              accountId:
                "browser-account",
            },
            {
              proof:
                "proof",
              userId:
                "browser-user",
            },
            {
              proof:
                "proof",
              sessionId:
                "browser-session",
            },
            {},
          ]
        ) {
          const response =
            await post(
              origin,
              body,
            );

          assert.equal(
            response.status,
            400,
          );
        }

        assert.equal(
          calls,
          0,
        );
      },
    );
  },
);

test(
  "authentication failures are sanitized to 401 and infrastructure/session failures to 503 without cookies",
  async () => {
    const failures:
      readonly [
        Error,
        number,
      ][] = [
      [
        new InvalidCredentialsError(),
        401,
      ],
      [
        new AuthenticationUnavailableError(),
        503,
      ],
      [
        new SessionUnavailableError(),
        503,
      ],
    ];

    for (
      const [failure, status]
      of failures
    ) {
      await withHandler(
        {
          async execute() {
            throw failure;
          },
        },
        async origin => {
          const response =
            await post(
              origin,
              {
                proof:
                  "proof",
              },
            );

          assert.equal(
            response.status,
            status,
          );

          assert.equal(
            response.headers.get(
              "set-cookie",
            ),
            null,
          );

          assert.equal(
            await response.text(),
            "",
          );
        },
      );
    }
  },
);
