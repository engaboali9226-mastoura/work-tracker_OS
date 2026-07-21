import {
  deepStrictEqual,
  equal,
  strictEqual,
} from "node:assert/strict";

import test from "node:test";

interface ExecutionUserContext {
  readonly userId: string;
  readonly principalKind: "user" | "service";
  readonly authorizationScope?: string;
  readonly correlationId: string;
}

function executeNested<T>(
  context: ExecutionUserContext,
  operation: (
    nestedContext: ExecutionUserContext,
  ) => T,
): T {
  return operation(context);
}

test("explicit nested execution reuses the root context instance", () => {
  const root: ExecutionUserContext =
    Object.freeze({
      userId: "user-1",
      principalKind: "user",
      authorizationScope: "workspace:a",
      correlationId: "correlation-1",
    });

  const observed =
    executeNested(
      root,
      nested => {
        strictEqual(nested, root);

        return {
          userId:
            nested.userId,
          correlationId:
            nested.correlationId,
        };
      },
    );

  deepStrictEqual(
    observed,
    {
      userId: "user-1",
      correlationId: "correlation-1",
    },
  );
});

test("concurrent explicit executions preserve structural isolation", async () => {
  const first: ExecutionUserContext =
    Object.freeze({
      userId: "user-1",
      principalKind: "user",
      correlationId: "correlation-1",
    });

  const second: ExecutionUserContext =
    Object.freeze({
      userId: "user-2",
      principalKind: "user",
      correlationId: "correlation-2",
    });

  const observed =
    await Promise.all([
      Promise.resolve().then(
        () =>
          executeNested(
            first,
            context =>
              context.userId,
          ),
      ),
      Promise.resolve().then(
        () =>
          executeNested(
            second,
            context =>
              context.userId,
          ),
      ),
    ]);

  equal(observed[0], "user-1");
  equal(observed[1], "user-2");
});

test("runtime propagation test has no application package dependency", () => {
  const dependencyMode =
    "STRUCTURAL_CONTEXT_FIXTURE_NO_CROSS_PACKAGE_IMPORT";

  equal(
    dependencyMode,
    "STRUCTURAL_CONTEXT_FIXTURE_NO_CROSS_PACKAGE_IMPORT",
  );
});
