import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  syncBuiltinESMExports,
} from "node:module";
import test from "node:test";
import {
  createSessionId,
  type SessionIdGenerator,
} from "@worktracker/core";

const moduleUrl =
  new URL(
    "../src/session/cryptographic-session-id-generator.ts",
    import.meta.url,
  );

async function loadGenerator(
  cacheKey: string,
) {
  const module =
    await import(
      `${moduleUrl.href}?${cacheKey}`,
    );

  return new module.CryptographicSessionIdGenerator();
}

test(
  "CryptographicSessionIdGenerator implements SessionIdGenerator and returns a Core-valid identifier",
  async () => {
    const generator: SessionIdGenerator =
      await loadGenerator(
        "contract",
      );

    const id =
      await generator.generate();

    assert.equal(
      createSessionId(
        id,
      ),
      id,
    );
    assert.equal(
      id.length,
      43,
    );
    assert.match(
      id,
      /^[A-Za-z0-9_-]{43}$/,
    );
  },
);

test(
  "CryptographicSessionIdGenerator requests exactly 32 entropy bytes",
  async () => {
    const originalRandomBytes =
      crypto.randomBytes;
    const requestedSizes: number[] = [];

    try {
      crypto.randomBytes =
        ((size: number) => {
          requestedSizes.push(
            size,
          );

          return Buffer.alloc(
            size,
            7,
          );
        }) as typeof crypto.randomBytes;
      syncBuiltinESMExports();

      const generator =
        await loadGenerator(
          "entropy-size",
        );
      const id =
        await generator.generate();

      assert.deepEqual(
        requestedSizes,
        [
          32,
        ],
      );
      assert.equal(
        id,
        "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc",
      );
    } finally {
      crypto.randomBytes =
        originalRandomBytes;
      syncBuiltinESMExports();
    }
  },
);

test(
  "CryptographicSessionIdGenerator rejects entropy acquisition failure without fallback",
  async () => {
    const originalRandomBytes =
      crypto.randomBytes;

    try {
      crypto.randomBytes =
        (() => {
          throw new Error(
            "entropy unavailable",
          );
        }) as typeof crypto.randomBytes;
      syncBuiltinESMExports();

      const generator =
        await loadGenerator(
          "entropy-failure",
        );

      await assert.rejects(
        () =>
          generator.generate(),
      );
    } finally {
      crypto.randomBytes =
        originalRandomBytes;
      syncBuiltinESMExports();
    }
  },
);

test(
  "CryptographicSessionIdGenerator rejects malformed non-Buffer entropy",
  async () => {
    const originalRandomBytes =
      crypto.randomBytes;

    try {
      crypto.randomBytes =
        (() => "not entropy") as unknown as typeof crypto.randomBytes;
      syncBuiltinESMExports();

      const generator =
        await loadGenerator(
          "malformed-entropy",
        );

      await assert.rejects(
        () =>
          generator.generate(),
      );
    } finally {
      crypto.randomBytes =
        originalRandomBytes;
      syncBuiltinESMExports();
    }
  },
);

test(
  "CryptographicSessionIdGenerator retains its captured security intrinsics",
  async () => {
    const generator =
      await loadGenerator(
        "captured-intrinsics",
      );
    const originalRandomBytes =
      crypto.randomBytes;
    const originalIsBuffer =
      Buffer.isBuffer;
    const originalToString =
      Buffer.prototype.toString;
    const originalApply =
      Reflect.apply;
    let randomBytesCalls = 0;
    let isBufferCalls = 0;
    let toStringCalls = 0;
    let applyCalls = 0;

    try {
      crypto.randomBytes =
        (() => {
          randomBytesCalls +=
            1;
          throw new Error(
            "tampered randomBytes called",
          );
        }) as typeof crypto.randomBytes;
      syncBuiltinESMExports();
      Buffer.isBuffer =
        (() => {
          isBufferCalls +=
            1;
          return false;
        }) as typeof Buffer.isBuffer;
      Buffer.prototype.toString =
        (() => {
          toStringCalls +=
            1;
          return "tampered";
        }) as typeof Buffer.prototype.toString;
      Reflect.apply =
        (() => {
          applyCalls +=
            1;
          throw new Error(
            "tampered Reflect.apply called",
          );
        }) as typeof Reflect.apply;

      const id =
        await generator.generate();

      assert.match(
        id,
        /^[A-Za-z0-9_-]{43}$/,
      );
      assert.equal(
        randomBytesCalls,
        0,
      );
      assert.equal(
        isBufferCalls,
        0,
      );
      assert.equal(
        toStringCalls,
        0,
      );
      assert.equal(
        applyCalls,
        0,
      );
    } finally {
      crypto.randomBytes =
        originalRandomBytes;
      syncBuiltinESMExports();
      Buffer.isBuffer =
        originalIsBuffer;
      Buffer.prototype.toString =
        originalToString;
      Reflect.apply =
        originalApply;
    }
  },
);
