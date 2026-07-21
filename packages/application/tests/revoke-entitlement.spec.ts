import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationUnavailableError,
  createEntitlementId,
} from "@worktracker/core";
import type {
  Clock,
  EntitlementRepository,
} from "@worktracker/core";

import {
  RevokeEntitlement,
} from "../src/index.js";

function createClock(
  order: string[],
): Clock {
  return {
    now() {
      order.push(
        "clock",
      );

      return {
        toDate() {
          return new Date(
            9000,
          );
        },
      } as ReturnType<Clock["now"]>;
    },
  };
}

test("RevokeEntitlement invokes Clock and revoke once without lookup", async () => {
  const order: string[] = [];
  let revokeCalls = 0;
  let lookupCalls = 0;

  const repository: EntitlementRepository = {
    async create() {
      throw new Error(
        "not used",
      );
    },

    async findByExactScope() {
      lookupCalls += 1;
      return null;
    },

    async revoke(
      id,
      revokedAtEpochMs,
    ) {
      revokeCalls += 1;
      order.push(
        "revoke",
      );

      assert.equal(
        id,
        createEntitlementId(
          "entitlement-0001",
        ),
      );

      assert.equal(
        revokedAtEpochMs,
        9000,
      );
    },
  };

  await new RevokeEntitlement(
    createClock(
      order,
    ),
    repository,
  ).execute({
    entitlementId:
      "entitlement-0001",
  });

  assert.deepEqual(
    order,
    [
      "clock",
      "revoke",
    ],
  );

  assert.equal(
    revokeCalls,
    1,
  );

  assert.equal(
    lookupCalls,
    0,
  );
});

test("unknown and repeated revocation remain idempotent success", async () => {
  let calls = 0;

  const repository: EntitlementRepository = {
    async create() {
      throw new Error(
        "not used",
      );
    },

    async findByExactScope() {
      throw new Error(
        "lookup must not run",
      );
    },

    async revoke() {
      calls += 1;
    },
  };

  const useCase =
    new RevokeEntitlement(
      createClock([]),
      repository,
    );

  await useCase.execute({
    entitlementId:
      "entitlement-9999",
  });

  await useCase.execute({
    entitlementId:
      "entitlement-9999",
  });

  assert.equal(
    calls,
    2,
  );
});

test("RevokeEntitlement validates first and hides collaborator failures", async () => {
  let clockCalls = 0;
  let repositoryCalls = 0;

  const clock: Clock = {
    now() {
      clockCalls += 1;

      return {
        toDate() {
          return new Date(
            9000,
          );
        },
      } as ReturnType<Clock["now"]>;
    },
  };

  const repository: EntitlementRepository = {
    async create() {
      throw new Error(
        "not used",
      );
    },

    async findByExactScope() {
      throw new Error(
        "not used",
      );
    },

    async revoke() {
      repositoryCalls += 1;
      throw new Error(
        "repository detail",
      );
    },
  };

  await assert.rejects(
    new RevokeEntitlement(
      clock,
      repository,
    ).execute({
      entitlementId:
        "short",
    }),
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
    new RevokeEntitlement(
      clock,
      repository,
    ).execute({
      entitlementId:
        "entitlement-0001",
    }),
    AuthorizationUnavailableError,
  );

  assert.equal(
    clockCalls,
    1,
  );

  assert.equal(
    repositoryCalls,
    1,
  );
});
