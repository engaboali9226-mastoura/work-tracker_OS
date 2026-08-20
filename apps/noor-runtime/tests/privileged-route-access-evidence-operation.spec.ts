import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  InvalidAuthorizationRequestError,
  InvalidSessionError,
  InvalidSessionRequestError,
  SessionUnavailableError,
  applicationCatalog,
  createAuthenticationAccountId,
  createSessionId,
  createSessionSnapshot,
} from "@worktracker/core";

import type {
  AuthenticationAccountId,
  AuthorizationAction,
  AuthorizationResourceId,
  AuthorizationResourceType,
  SessionSnapshot,
} from "@worktracker/core";

import {
  InvalidRouteAccessEvidenceRequestError,
  PrivilegedRouteAccessEvidenceOperation,
  PrivilegedRouteAccessInvariantError,
} from "../src/privileged-route-access-evidence-operation.js";

type Scope =
  Readonly<{
    accountId:
      AuthenticationAccountId;
    action:
      AuthorizationAction;
    resourceType:
      AuthorizationResourceType;
    resourceId:
      AuthorizationResourceId;
  }>;

const accountId =
  createAuthenticationAccountId(
    "account-0000000000000001",
  );

const session:
  SessionSnapshot =
  createSessionSnapshot({
    id:
      createSessionId(
        "session-id-0000000001",
      ),
    accountId,
    createdAtEpochMs:
      1_000,
    expiresAtEpochMs:
      100_000,
    revokedAtEpochMs:
      null,
  });

function validInput(
  sessionId:
    string | null =
      session.id,
) {
  return {
    request: {
      appKey:
        "noor-personal",
      pathname:
        "/personal",
    },
    context: {
      sessionId,
    },
  } as const;
}

function candidate(
  options:
    Readonly<{
      running?: boolean;
      resolve?: (
        sessionId: string,
      ) => Promise<SessionSnapshot>;
      authorize?: (
        scope: Scope,
      ) => Promise<void>;
    }> = {},
) {
  let sessionCalls =
    0;

  let authorizationCalls =
    0;

  const scopes:
    Scope[] =
      [];

  const operation =
    new PrivilegedRouteAccessEvidenceOperation({
      applicationCatalog,

      isRuntimeRunning:
        () =>
          options.running
          ?? true,

      resolveSession:
        async sessionId => {
          sessionCalls += 1;

          return options.resolve
            ? options.resolve(
                sessionId,
              )
            : session;
        },

      authorize:
        async scope => {
          authorizationCalls += 1;

          scopes.push(
            scope,
          );

          if (options.authorize) {
            await options.authorize(
              scope,
            );
          }
        },
    });

  return {
    operation,

    counts: {
      session:
        () =>
          sessionCalls,

      authorization:
        () =>
          authorizationCalls,
    },

    scopes,
  };
}

test(
  "rejects unknown, planned, malformed, and mismatched routes before security evaluation",
  async () => {
    const scenarios = [
      {
        request: {
          appKey:
            "unknown-app",
          pathname:
            "/personal",
        },
      },
      {
        request: {
          appKey:
            "noor-work",
          pathname:
            "/work",
        },
      },
      {
        request: {
          appKey:
            " NOOR ",
          pathname:
            "/personal",
        },
      },
      {
        request: {
          appKey:
            "noor-personal",
          pathname:
            "/personal/other",
        },
      },
    ];

    for (const scenario of scenarios) {
      const current =
        candidate();

      await assert.rejects(
        current.operation.execute({
          request:
            scenario.request,
          context: {
            sessionId:
              session.id,
          },
        }),
        InvalidRouteAccessEvidenceRequestError,
      );

      assert.equal(
        current.counts.session(),
        0,
      );

      assert.equal(
        current.counts.authorization(),
        0,
      );
    }
  },
);

test(
  "requires a running privileged host before security evaluation",
  async () => {
    const current =
      candidate({
        running:
          false,
      });

    await assert.rejects(
      current.operation.execute(
        validInput(),
      ),
      PrivilegedRouteAccessInvariantError,
    );

    assert.equal(
      current.counts.session(),
      0,
    );

    assert.equal(
      current.counts.authorization(),
      0,
    );
  },
);

test(
  "maps missing and invalid session evidence to authentication-required",
  async () => {
    const missing =
      candidate();

    assert.deepEqual(
      await missing
        .operation
        .execute(
          validInput(
            null,
          ),
        ),
      {
        kind:
          "authentication-required",
        appKey:
          "noor-personal",
        pathname:
          "/personal",
      },
    );

    assert.equal(
      missing.counts.session(),
      0,
    );

    for (
      const error
      of [
        new InvalidSessionRequestError(),
        new InvalidSessionError(),
      ]
    ) {
      const current =
        candidate({
          resolve:
            async () => {
              throw error;
            },
        });

      assert.equal(
        (
          await current
            .operation
            .execute(
              validInput(),
            )
        ).kind,
        "authentication-required",
      );
    }
  },
);

test(
  "maps session availability failure and rejects unexpected session failures as invariants",
  async () => {
    const unavailable =
      candidate({
        resolve:
          async () => {
            throw new SessionUnavailableError();
          },
      });

    assert.equal(
      (
        await unavailable
          .operation
          .execute(
            validInput(),
          )
      ).kind,
      "session-access-unavailable",
    );

    const unexpected =
      candidate({
        resolve:
          async () => {
            throw new Error(
              "unexpected-session-detail",
            );
          },
      });

    await assert.rejects(
      unexpected.operation.execute(
        validInput(),
      ),
      error => {
        assert.ok(
          error instanceof
            PrivilegedRouteAccessInvariantError,
        );

        assert.equal(
          String(error).includes(
            "unexpected-session-detail",
          ),
          false,
        );

        return true;
      },
    );
  },
);

test(
  "uses only resolved session account identity and canonical catalog entitlement scope",
  async () => {
    const current =
      candidate();

    const input = {
      ...validInput(),

      context: {
        sessionId:
          session.id,
        accountId:
          "attacker-account",
      },

      accountId:
        "attacker-account",
      action:
        "admin",
      resourceType:
        "anything",
      resourceId:
        "anything",
    } as never;

    assert.equal(
      (
        await current
          .operation
          .execute(
            input,
          )
      ).kind,
      "authenticated-authorized",
    );

    assert.equal(
      current.scopes.length,
      1,
    );

    assert.deepEqual(
      current.scopes[0],
      {
        accountId,
        action:
          "access",
        resourceType:
          "application",
        resourceId:
          "noor-personal",
      },
    );
  },
);

test(
  "maps authorization denial and availability while preserving invariant failures",
  async () => {
    const denied =
      candidate({
        authorize:
          async () => {
            throw new AuthorizationDeniedError();
          },
      });

    assert.equal(
      (
        await denied
          .operation
          .execute(
            validInput(),
          )
      ).kind,
      "authorization-denied",
    );

    const unavailable =
      candidate({
        authorize:
          async () => {
            throw new AuthorizationUnavailableError();
          },
      });

    assert.equal(
      (
        await unavailable
          .operation
          .execute(
            validInput(),
          )
      ).kind,
      "authorization-unavailable",
    );

    for (
      const error
      of [
        new InvalidAuthorizationRequestError(),
        new Error(
          "unexpected-authorization-detail",
        ),
      ]
    ) {
      const current =
        candidate({
          authorize:
            async () => {
              throw error;
            },
        });

      await assert.rejects(
        current.operation.execute(
          validInput(),
        ),
        invariant => {
          assert.ok(
            invariant instanceof
              PrivilegedRouteAccessInvariantError,
          );

          assert.equal(
            String(invariant).includes(
              "unexpected-authorization-detail",
            ),
            false,
          );

          return true;
        },
      );
    }
  },
);
