import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationUnavailableError,
  EntitlementConflictError,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createEntitlementId,
  createAuthenticationAccountId,
} from "@worktracker/core";
import type {
  Clock,
  EntitlementGrant,
  EntitlementIdGenerator,
  EntitlementRepository,
} from "@worktracker/core";

import {
  GrantEntitlement,
} from "../src/index.js";

const accountId =
  createAuthenticationAccountId("account-123");

const request = {
  accountId,
  action:
    createAuthorizationAction(
      "task:write",
    ),
  resourceType:
    createAuthorizationResourceType(
      "task",
    ),
  resourceId:
    createAuthorizationResourceId(
      "task-001",
    ),
};

function createClock(
  order: string[],
  epochMs = 5000,
): Clock {
  return {
    now() {
      order.push(
        "clock",
      );

      return {
        toDate() {
          return new Date(
            epochMs,
          );
        },
      } as ReturnType<Clock["now"]>;
    },
  };
}

test("GrantEntitlement uses generator, Clock and repository once in order", async () => {
  const order: string[] = [];
  let generatorCalls = 0;
  let repositoryCalls = 0;
  let persisted:
    EntitlementGrant
    | undefined;

  const generator: EntitlementIdGenerator = {
    async generate() {
      generatorCalls += 1;
      order.push(
        "generator",
      );

      return createEntitlementId(
        "entitlement-0001",
      );
    },
  };

  const repository: EntitlementRepository = {
    async create(
      grant,
    ) {
      repositoryCalls += 1;
      order.push(
        "repository",
      );
      persisted = grant;
    },

    async findByExactScope() {
      throw new Error(
        "not used",
      );
    },

    async revoke() {
      throw new Error(
        "not used",
      );
    },
  };

  const result =
    await new GrantEntitlement(
      generator,
      createClock(
        order,
      ),
      repository,
    ).execute(
      request,
    );

  assert.deepEqual(
    order,
    [
      "generator",
      "clock",
      "repository",
    ],
  );

  assert.equal(
    generatorCalls,
    1,
  );

  assert.equal(
    repositoryCalls,
    1,
  );

  assert.equal(
    result,
    persisted,
  );

  assert.equal(
    result.revokedAtEpochMs,
    null,
  );

  assert.equal(
    result.grantedAtEpochMs,
    5000,
  );
});

test("GrantEntitlement preserves exact duplicate conflict", async () => {
  const generator: EntitlementIdGenerator = {
    async generate() {
      return createEntitlementId(
        "entitlement-0002",
      );
    },
  };

  const repository: EntitlementRepository = {
    async create() {
      throw new EntitlementConflictError();
    },

    async findByExactScope() {
      throw new Error(
        "not used",
      );
    },

    async revoke() {
      throw new Error(
        "not used",
      );
    },
  };

  await assert.rejects(
    new GrantEntitlement(
      generator,
      createClock([]),
      repository,
    ).execute(
      request,
    ),
    EntitlementConflictError,
  );
});

test("GrantEntitlement validates before collaborators and hides failures", async () => {
  let generatorCalls = 0;
  let clockCalls = 0;
  let repositoryCalls = 0;

  const generator: EntitlementIdGenerator = {
    async generate() {
      generatorCalls += 1;
      throw new Error(
        "generator detail",
      );
    },
  };

  const clock: Clock = {
    now() {
      clockCalls += 1;
      return createClock([]).now();
    },
  };

  const repository: EntitlementRepository = {
    async create() {
      repositoryCalls += 1;
    },

    async findByExactScope() {
      throw new Error(
        "not used",
      );
    },

    async revoke() {
      throw new Error(
        "not used",
      );
    },
  };

  await assert.rejects(
    new GrantEntitlement(
      generator,
      clock,
      repository,
    ).execute({
      ...request,
      resourceId:
        " invalid",
    }),
  );

  assert.equal(
    generatorCalls,
    0,
  );

  assert.equal(
    clockCalls,
    0,
  );

  assert.equal(
    repositoryCalls,
    0,
  );

  await assert.rejects(
    new GrantEntitlement(
      generator,
      clock,
      repository,
    ).execute(
      request,
    ),
    AuthorizationUnavailableError,
  );

  assert.equal(
    generatorCalls,
    1,
  );

  assert.equal(
    clockCalls,
    0,
  );

  assert.equal(
    repositoryCalls,
    0,
  );
});
