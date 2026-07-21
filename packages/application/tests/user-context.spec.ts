import {
  deepStrictEqual,
  equal,
  ok,
  strictEqual,
  throws,
} from "node:assert/strict";

import test from "node:test";

import {
  DefaultUserContextResolver,
  USER_CONTEXT_ERROR_CODES,
  UserContextInvalidError,
  UserContextMismatchError,
  UserContextScopeViolationError,
  hasSameUserContextIdentity,
} from "../src/context/index.js";

test("resolves and deeply freezes a canonical user context", () => {
  const resolver =
    new DefaultUserContextResolver();

  const context =
    resolver.resolveCandidate({
      userId: " user-123 ",
      principalKind: "user",
      sessionId: " session-7 ",
      authorizationScope: " workspace:alpha ",
      correlationId: " correlation-42 ",
      attributes: {
        locale: "en",
        nested: {
          feature: true,
        },
        flags: [
          "one",
          "two",
        ],
      },
    });

  equal(context.userId, "user-123");
  equal(context.sessionId, "session-7");
  equal(context.authorizationScope, "workspace:alpha");
  equal(context.correlationId, "correlation-42");

  ok(Object.isFrozen(context));
  ok(Object.isFrozen(context.attributes));
  ok(
    Object.isFrozen(
      context.attributes.nested as object,
    ),
  );
  ok(
    Object.isFrozen(
      context.attributes.flags as object,
    ),
  );

  throws(
    () => {
      (
        context.attributes.nested as {
          feature: boolean;
        }
      ).feature = false;
    },
    TypeError,
  );

  deepStrictEqual(
    context.attributes,
    {
      locale: "en",
      nested: {
        feature: true,
      },
      flags: [
        "one",
        "two",
      ],
    },
  );
});

test("rejects invalid identity and prohibited secret attributes", () => {
  const resolver =
    new DefaultUserContextResolver();

  throws(
    () =>
      resolver.resolveCandidate({
        userId: " ",
        principalKind: "user",
        correlationId: "correlation",
      }),
    (error: unknown) => {
      if (
        !(error instanceof UserContextInvalidError)
      ) {
        return false;
      }

      equal(
        error.code,
        USER_CONTEXT_ERROR_CODES.INVALID,
      );

      equal(error.field, "userId");

      return true;
    },
  );

  throws(
    () =>
      resolver.resolveCandidate({
        userId: "user-1",
        principalKind: "unknown",
        correlationId: "correlation",
      }),
    UserContextInvalidError,
  );

  throws(
    () =>
      resolver.resolveCandidate({
        userId: "user-1",
        principalKind: "user",
        correlationId: "correlation",
        attributes: {
          accessToken: "prohibited",
        },
      }),
    UserContextInvalidError,
  );
});

test("rejects principal substitution", () => {
  const resolver =
    new DefaultUserContextResolver();

  const root =
    resolver.resolveCandidate({
      userId: "user-1",
      principalKind: "user",
      authorizationScope: "workspace:a",
      correlationId: "root",
    });

  const compatible =
    resolver.resolveCandidate({
      userId: "user-1",
      principalKind: "user",
      authorizationScope: "workspace:a",
      correlationId: "nested",
    });

  const replacement =
    resolver.resolveCandidate({
      userId: "user-2",
      principalKind: "user",
      authorizationScope: "workspace:a",
      correlationId: "nested",
    });

  strictEqual(
    hasSameUserContextIdentity(
      root,
      compatible,
    ),
    true,
  );

  strictEqual(
    hasSameUserContextIdentity(
      root,
      replacement,
    ),
    false,
  );

  resolver.assertCompatible(
    root,
    compatible,
  );

  throws(
    () =>
      resolver.assertCompatible(
        root,
        replacement,
      ),
    UserContextMismatchError,
  );
});

test("exports the stable error taxonomy", () => {
  equal(
    USER_CONTEXT_ERROR_CODES.MISSING,
    "USER_CONTEXT_MISSING",
  );

  equal(
    USER_CONTEXT_ERROR_CODES.INVALID,
    "USER_CONTEXT_INVALID",
  );

  equal(
    USER_CONTEXT_ERROR_CODES.MISMATCH,
    "USER_CONTEXT_MISMATCH",
  );

  equal(
    USER_CONTEXT_ERROR_CODES.SCOPE_VIOLATION,
    "USER_CONTEXT_SCOPE_VIOLATION",
  );

  equal(
    new UserContextScopeViolationError().code,
    USER_CONTEXT_ERROR_CODES.SCOPE_VIOLATION,
  );
});
