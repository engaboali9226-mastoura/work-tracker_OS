import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  EntitlementGrant,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createEntitlementId,
  createAuthenticationAccountId,
} from "@worktracker/core";
import type {
  EntitlementRepository,
  EntitlementScope,
} from "@worktracker/core";

import {
  Authorize,
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

function createGrant(
  revokedAtEpochMs: number | null = null,
): EntitlementGrant {
  return EntitlementGrant.create({
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
    revokedAtEpochMs,
  });
}

function createRepository(
  lookup:
    (
      scope: EntitlementScope,
    ) =>
      Promise<EntitlementGrant | null>,
): {
  repository: EntitlementRepository;
  lookupCount: () => number;
} {
  let calls = 0;

  return {
    repository: {
      async create() {
        throw new Error(
          "not used",
        );
      },

      async findByExactScope(
        scope,
      ) {
        calls += 1;
        return lookup(
          scope,
        );
      },

      async revoke() {
        throw new Error(
          "not used",
        );
      },
    },

    lookupCount:
      () =>
        calls,
  };
}

const request = {
  accountId,
  action,
  resourceType,
  resourceId,
};

test("Authorize returns the exact stored grant after one lookup", async () => {
  const grant =
    createGrant();

  const fixture =
    createRepository(
      async scope => {
        assert.deepEqual(
          scope,
          request,
        );

        return grant;
      },
    );

  const result =
    await new Authorize(
      fixture.repository,
    ).execute(
      request,
    );

  assert.equal(
    result,
    grant,
  );

  assert.equal(
    fixture.lookupCount(),
    1,
  );
});

test("Authorize makes missing and revoked grants indistinguishable", async () => {
  const missing =
    createRepository(
      async () =>
        null,
    );

  const revoked =
    createRepository(
      async () =>
        createGrant(2000),
    );

  const errors: Error[] = [];

  for (
    const repository
    of [
      missing.repository,
      revoked.repository,
    ]
  ) {
    try {
      await new Authorize(
        repository,
      ).execute(
        request,
      );

      assert.fail(
        "authorization should be denied",
      );
    } catch (error) {
      assert.ok(
        error
        instanceof AuthorizationDeniedError,
      );

      errors.push(
        error,
      );
    }
  }

  assert.equal(
    errors[0].name,
    errors[1].name,
  );

  assert.equal(
    errors[0].message,
    errors[1].message,
  );
});

test("Authorize performs exact case-sensitive lookup with no fallback", async () => {
  const fixture =
    createRepository(
      async scope =>
        scope.action === action
        && scope.resourceId === resourceId
          ? createGrant()
          : null,
    );

  await assert.rejects(
    new Authorize(
      fixture.repository,
    ).execute({
      ...request,
      action:
        "TASK:READ",
    }),
    AuthorizationDeniedError,
  );

  assert.equal(
    fixture.lookupCount(),
    1,
  );
});

test("Authorize validates before lookup and translates repository failure", async () => {
  const invalidFixture =
    createRepository(
      async () =>
        createGrant(),
    );

  await assert.rejects(
    new Authorize(
      invalidFixture.repository,
    ).execute({
      ...request,
      action:
        " invalid",
    }),
  );

  assert.equal(
    invalidFixture.lookupCount(),
    0,
  );

  const failedFixture =
    createRepository(
      async () => {
        throw new Error(
          "provider detail",
        );
      },
    );

  await assert.rejects(
    new Authorize(
      failedFixture.repository,
    ).execute(
      request,
    ),
    AuthorizationUnavailableError,
  );
});
