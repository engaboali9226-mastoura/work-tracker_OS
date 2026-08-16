import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  syncBuiltinESMExports,
} from "node:module";
import test from "node:test";
import {
  createEntitlementId,
  type EntitlementIdGenerator,
} from "@worktracker/core";

const moduleUrl =
  new URL(
    "../src/authorization/cryptographic-entitlement-id-generator.ts",
    import.meta.url,
  );

async function loadGenerator(
  cacheKey: string,
) {
  const module =
    await import(
      `${moduleUrl.href}?${cacheKey}`,
    );

  return new module.CryptographicEntitlementIdGenerator();
}

test(
  "CryptographicEntitlementIdGenerator implements its Core contract and returns a canonical identifier",
  async () => {
    const generator: EntitlementIdGenerator =
      await loadGenerator(
        "contract",
      );

    const id =
      await generator.generate();

    assert.equal(
      createEntitlementId(id),
      id,
    );
    assert.equal(id.length, 43);
    assert.match(id, /^[A-Za-z0-9_-]{43}$/);
  },
);

test(
  "CryptographicEntitlementIdGenerator requests 32 crypto bytes and base64url encodes them",
  async () => {
    const originalRandomBytes = crypto.randomBytes;
    const requestedSizes: number[] = [];

    try {
      crypto.randomBytes =
        ((size: number) => {
          requestedSizes.push(size);
          return Buffer.alloc(size, 7);
        }) as typeof crypto.randomBytes;
      syncBuiltinESMExports();

      const generator =
        await loadGenerator("entropy-size");

      assert.equal(
        await generator.generate(),
        "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc",
      );
      assert.deepEqual(requestedSizes, [32]);
    } finally {
      crypto.randomBytes = originalRandomBytes;
      syncBuiltinESMExports();
    }
  },
);

test(
  "CryptographicEntitlementIdGenerator rejects entropy failure without a fallback",
  async () => {
    const originalRandomBytes = crypto.randomBytes;

    try {
      crypto.randomBytes =
        (() => {
          throw new Error("entropy unavailable");
        }) as typeof crypto.randomBytes;
      syncBuiltinESMExports();

      const generator =
        await loadGenerator("entropy-failure");

      await assert.rejects(() => generator.generate());
    } finally {
      crypto.randomBytes = originalRandomBytes;
      syncBuiltinESMExports();
    }
  },
);

test(
  "CryptographicEntitlementIdGenerator has no provider dependency and rejects malformed entropy",
  async () => {
    const originalRandomBytes = crypto.randomBytes;

    try {
      crypto.randomBytes =
        (() => "not entropy") as unknown as typeof crypto.randomBytes;
      syncBuiltinESMExports();

      const generator =
        await loadGenerator("malformed-entropy");

      await assert.rejects(() => generator.generate());
    } finally {
      crypto.randomBytes = originalRandomBytes;
      syncBuiltinESMExports();
    }
  },
);
