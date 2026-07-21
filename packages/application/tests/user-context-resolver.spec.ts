import {
  equal,
  rejects,
  strictEqual,
  throws,
} from "node:assert/strict";

import test from "node:test";

import {
  DefaultUserContextResolver,
  USER_CONTEXT_ERROR_CODES,
  UserContextInvalidError,
  UserContextMissingError,
  type UserContextProvider,
} from "../src/context/index.js";

test("resolves one provider candidate exactly once", async () => {
  const resolver =
    new DefaultUserContextResolver();

  let calls = 0;

  const provider: UserContextProvider = {
    async getCurrent() {
      calls += 1;

      return {
        userId: "user-1",
        principalKind: "user",
        sessionId: "session-1",
        authorizationScope: "workspace:a",
        correlationId: "correlation-1",
        attributes: {
          locale: "en",
        },
      };
    },
  };

  const context =
    await resolver.resolve(provider);

  equal(calls, 1);
  equal(context.userId, "user-1");
  strictEqual(Object.isFrozen(context), true);
});

test("fails closed when the provider has no principal", async () => {
  const resolver =
    new DefaultUserContextResolver();

  const provider: UserContextProvider = {
    async getCurrent() {
      return null;
    },
  };

  await rejects(
    () =>
      resolver.resolve(provider),
    (error: unknown) => {
      if (
        !(error instanceof UserContextMissingError)
      ) {
        return false;
      }

      equal(
        error.code,
        USER_CONTEXT_ERROR_CODES.MISSING,
      );

      return true;
    },
  );
});

test("rejects non-plain and circular attributes", () => {
  const resolver =
    new DefaultUserContextResolver();

  throws(
    () =>
      resolver.resolveCandidate({
        userId: "user-1",
        principalKind: "user",
        correlationId: "correlation",
        attributes: {
          createdAt: new Date(),
        },
      }),
    UserContextInvalidError,
  );

  const circular: Record<string, unknown> = {};
  circular.self = circular;

  throws(
    () =>
      resolver.resolveCandidate({
        userId: "user-1",
        principalKind: "user",
        correlationId: "correlation",
        attributes: circular,
      }),
    UserContextInvalidError,
  );
});

test("does not fabricate required correlation identity", () => {
  const resolver =
    new DefaultUserContextResolver();

  throws(
    () =>
      resolver.resolveCandidate({
        userId: "user-1",
        principalKind: "user",
      }),
    (error: unknown) => {
      if (
        !(error instanceof UserContextInvalidError)
      ) {
        return false;
      }

      equal(error.field, "correlationId");

      return true;
    },
  );
});
