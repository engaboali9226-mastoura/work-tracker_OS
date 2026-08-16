import assert from "node:assert/strict";
import test from "node:test";
import type {
  SessionLifetimePolicy,
} from "@worktracker/core";
import {
  FixedSessionLifetimePolicy,
} from "../src/index.js";

test(
  "FixedSessionLifetimePolicy calculates exact fixed expiration values",
  () => {
    const policy: SessionLifetimePolicy =
      new FixedSessionLifetimePolicy(
        5_000,
      );

    assert.equal(
      policy.calculateExpirationEpochMs(
        1_000,
      ),
      6_000,
    );
    assert.equal(
      policy.calculateExpirationEpochMs(
        1_000,
      ),
      6_000,
    );
  },
);

test(
  "FixedSessionLifetimePolicy accepts the minimum duration and safe upper boundary",
  () => {
    assert.equal(
      new FixedSessionLifetimePolicy(
        1,
      ).calculateExpirationEpochMs(
        0,
      ),
      1,
    );
    assert.equal(
      new FixedSessionLifetimePolicy(
        1,
      ).calculateExpirationEpochMs(
        Number.MAX_SAFE_INTEGER - 1,
      ),
      Number.MAX_SAFE_INTEGER,
    );
  },
);

test(
  "FixedSessionLifetimePolicy freezes validated configuration",
  () => {
    const policy =
      new FixedSessionLifetimePolicy(
        5_000,
      );

    assert.equal(
      Object.isFrozen(
        policy,
      ),
      true,
    );
    assert.throws(
      () => {
        (policy as unknown as {
          durationMs: number;
        }).durationMs = 1;
      },
    );
    assert.equal(
      policy.calculateExpirationEpochMs(
        1,
      ),
      5_001,
    );
  },
);

test(
  "FixedSessionLifetimePolicy rejects invalid durations fail-closed",
  () => {
    const invalidDurations: unknown[] = [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
      "1000",
      null,
    ];

    for (const duration of invalidDurations) {
      assert.throws(
        () =>
          new FixedSessionLifetimePolicy(
            duration as number,
          ),
      );
    }
  },
);

test(
  "FixedSessionLifetimePolicy rejects invalid creation epochs fail-closed",
  () => {
    const policy =
      new FixedSessionLifetimePolicy(
        1,
      );
    const invalidCreationEpochs: unknown[] = [
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
      "1000",
      null,
    ];

    for (const createdAtEpochMs of invalidCreationEpochs) {
      assert.throws(
        () =>
          policy.calculateExpirationEpochMs(
            createdAtEpochMs as number,
          ),
      );
    }
  },
);

test(
  "FixedSessionLifetimePolicy rejects overflow and always returns a later expiration",
  () => {
    const policy =
      new FixedSessionLifetimePolicy(
        1,
      );

    assert.throws(
      () =>
        policy.calculateExpirationEpochMs(
          Number.MAX_SAFE_INTEGER,
        ),
    );

    const createdAtEpochMs =
      4_000;
    const expiresAtEpochMs =
      new FixedSessionLifetimePolicy(
        3,
      ).calculateExpirationEpochMs(
        createdAtEpochMs,
      );

    assert.equal(
      expiresAtEpochMs > createdAtEpochMs,
      true,
    );
  },
);
