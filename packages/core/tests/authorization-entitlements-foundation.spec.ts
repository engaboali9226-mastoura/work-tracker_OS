import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  EntitlementConflictError,
  EntitlementGrant,
  InvalidAuthorizationRequestError,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createEntitlementId,
  createAuthenticationAccountId,
} from "../src/index.js";

const accountId =
  createAuthenticationAccountId("account-123");

const action =
  createAuthorizationAction(
    "task:read",
  );

const resourceType =
  createAuthorizationResourceType(
    "task",
  );

const resourceId =
  createAuthorizationResourceId(
    "task-001",
  );

test("EntitlementId preserves exact valid boundaries", () => {
  const minimum =
    "a".repeat(16);

  const maximum =
    "z".repeat(256);

  assert.equal(
    createEntitlementId(minimum),
    minimum,
  );

  assert.equal(
    createEntitlementId(maximum),
    maximum,
  );
});

test("authorization value factories reject invalid input without trimming", () => {
  const invalidValues = [
    "",
    "a".repeat(15),
    "a".repeat(257),
    " entitlement-0001",
    "entitlement-0001 ",
    "entitlement value",
    "entitlement/value",
  ];

  for (const value of invalidValues) {
    assert.throws(
      () =>
        createEntitlementId(value),
      InvalidAuthorizationRequestError,
    );
  }

  assert.throws(
    () =>
      createAuthorizationAction(
        "ab",
      ),
    InvalidAuthorizationRequestError,
  );

  assert.throws(
    () =>
      createAuthorizationResourceType(
        " resource",
      ),
    InvalidAuthorizationRequestError,
  );

  assert.throws(
    () =>
      createAuthorizationResourceId(
        "resource/id",
      ),
    InvalidAuthorizationRequestError,
  );
});

test("EntitlementGrant is immutable and validates temporal invariants", () => {
  const grant =
    EntitlementGrant.create({
      id:
        createEntitlementId(
          "entitlement-0001",
        ),
      accountId,
      action,
      resourceType,
      resourceId,
      grantedAtEpochMs:
        1000,
    });

  assert.equal(
    grant.revokedAtEpochMs,
    null,
  );

  assert.equal(
    Object.isFrozen(grant),
    true,
  );

  assert.throws(
    () =>
      EntitlementGrant.create({
        id:
          createEntitlementId(
            "entitlement-0002",
          ),
        accountId,
        action,
        resourceType,
        resourceId,
        grantedAtEpochMs:
          -1,
      }),
    InvalidAuthorizationRequestError,
  );

  assert.throws(
    () =>
      EntitlementGrant.create({
        id:
          createEntitlementId(
            "entitlement-0003",
          ),
        accountId,
        action,
        resourceType,
        resourceId,
        grantedAtEpochMs:
          1000,
        revokedAtEpochMs:
          999,
      }),
    InvalidAuthorizationRequestError,
  );
});

test("authorization errors expose fixed public names and messages", () => {
  const values = [
    [
      InvalidAuthorizationRequestError,
      "InvalidAuthorizationRequestError",
      "Invalid authorization request.",
    ],
    [
      AuthorizationDeniedError,
      "AuthorizationDeniedError",
      "Authorization denied.",
    ],
    [
      EntitlementConflictError,
      "EntitlementConflictError",
      "Entitlement already exists.",
    ],
    [
      AuthorizationUnavailableError,
      "AuthorizationUnavailableError",
      "Authorization service is unavailable.",
    ],
  ] as const;

  for (
    const [
      ErrorType,
      name,
      message,
    ]
    of values
  ) {
    const error =
      Reflect.construct(
        ErrorType,
        [
          "caller-controlled",
          {
            cause:
              new Error("hidden"),
          },
        ],
      ) as Error;

    assert.equal(
      error.name,
      name,
    );

    assert.equal(
      error.message,
      message,
    );

    assert.equal(
      "cause" in error,
      false,
    );
  }
});
