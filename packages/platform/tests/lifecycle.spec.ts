import assert from "node:assert/strict";
import test from "node:test";

import {
  PLATFORM_COMPOSITION_STATES,
  PlatformBootstrapError,
  PlatformFailedClosedError,
  PlatformRollbackError,
  PlatformShutdownError,
  createPlatformCompositionRoot,
} from "../src/index.js";

import type {
  PlatformRuntimeComponentDefinition,
} from "../src/index.js";

import {
  createTestDependencies,
} from "./test-support.js";

function createRuntimeDefinition(
  componentId: string,
  events: string[],
  options: Readonly<{
    failStart?: () => boolean;
    failStop?: () => boolean;
  }> = {},
): PlatformRuntimeComponentDefinition {
  return {
    componentId,
    factory: () => {
      events.push(
        `factory:${componentId}`,
      );

      return {
        id:
          componentId,
        name:
          componentId,
        version:
          "1.0.0",
        async start() {
          events.push(
            `start:${componentId}`,
          );

          if (
            options.failStart?.()
          ) {
            throw new Error(
              `Start failed: ${componentId}`,
            );
          }
        },
        async stop() {
          events.push(
            `stop:${componentId}`,
          );

          if (
            options.failStop?.()
          ) {
            throw new Error(
              `Stop failed: ${componentId}`,
            );
          }
        },
      };
    },
  };
}

function assertSanitizedPlatformError(
  error: unknown,
  expected: Readonly<{
    name: string;
    code: string;
    message: string;
    forbiddenDetails: readonly string[];
  }>,
): boolean {
  assert.ok(
    error instanceof Error,
  );

  assert.equal(
    error.name,
    expected.name,
  );

  assert.equal(
    (
      error as Error & {
        readonly code?: string;
      }
    ).code,
    expected.code,
  );

  assert.equal(
    error.message,
    expected.message,
  );

  assert.equal(
    "cause" in error,
    false,
  );

  assert.equal(
    error
      instanceof AggregateError,
    false,
  );

  assert.equal(
    "errors" in error,
    false,
  );

  const publicError =
    [
      String(error),
      error.stack
        ?? "",
      JSON.stringify(error),
    ].join(" ");

  for (
    const detail
    of expected.forbiddenDetails
  ) {
    assert.equal(
      publicError.includes(
        detail,
      ),
      false,
    );
  }

  return true;
}

test(
  "bootstrap and shutdown are deterministic, idempotent, and coalesce concurrent calls",
  async () => {
    const events:
      string[] =
        [];

    const {
      configuration,
    } =
      createTestDependencies([
        createRuntimeDefinition(
          "alpha",
          events,
        ),
      ], [
        {
          appKey:
            "noor-personal",
          components: [
            createRuntimeDefinition(
              "beta",
              events,
            ),
          ],
        },
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    const firstBootstrap =
      root.bootstrap();

    const concurrentBootstrap =
      root.bootstrap();

    assert.equal(
      firstBootstrap,
      concurrentBootstrap,
    );

    const firstPlatform =
      await firstBootstrap;

    assert.equal(
      await root.bootstrap(),
      firstPlatform,
    );

    assert.deepEqual(
      events,
      [
        "factory:alpha",
        "factory:beta",
        "start:alpha",
        "start:beta",
      ],
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .RUNNING,
    );

    const firstShutdown =
      root.shutdown();

    const concurrentShutdown =
      root.shutdown();

    assert.equal(
      firstShutdown,
      concurrentShutdown,
    );

    await firstShutdown;

    assert.deepEqual(
      events,
      [
        "factory:alpha",
        "factory:beta",
        "start:alpha",
        "start:beta",
        "stop:beta",
        "stop:alpha",
      ],
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .IDLE,
    );

    await root.shutdown();

    assert.equal(
      events.length,
      6,
    );
  },
);

test(
  "opposite lifecycle requests serialize without overlapping runtime work",
  async () => {
    const events:
      string[] =
        [];

    const {
      configuration,
    } =
      createTestDependencies([
        createRuntimeDefinition(
          "alpha",
          events,
        ),
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    const bootstrap =
      root.bootstrap();

    const shutdown =
      root.shutdown();

    await bootstrap;
    await shutdown;

    assert.deepEqual(
      events,
      [
        "factory:alpha",
        "start:alpha",
        "stop:alpha",
      ],
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .IDLE,
    );
  },
);

test(
  "interleaved requests preserve call order and the final requested state",
  async () => {
    const events:
      string[] =
        [];

    const {
      configuration,
    } =
      createTestDependencies([
        createRuntimeDefinition(
          "alpha",
          events,
        ),
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    const firstBootstrap =
      root.bootstrap();

    const shutdown =
      root.shutdown();

    const finalBootstrap =
      root.bootstrap();

    await firstBootstrap;
    await shutdown;
    await finalBootstrap;

    assert.deepEqual(
      events,
      [
        "factory:alpha",
        "start:alpha",
        "stop:alpha",
        "factory:alpha",
        "start:alpha",
      ],
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .RUNNING,
    );

    await root.shutdown();
  },
);

test(
  "a complete rollback returns to idle and permits a clean retry",
  async () => {
    const events:
      string[] =
        [];

    let betaStarts =
      0;

    const {
      configuration,
    } =
      createTestDependencies([
        createRuntimeDefinition(
          "alpha",
          events,
        ),
        createRuntimeDefinition(
          "beta",
          events,
          {
            failStart: () => {
              betaStarts += 1;

              return betaStarts === 1;
            },
          },
        ),
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    await assert.rejects(
      root.bootstrap(),
      error =>
        assertSanitizedPlatformError(
          error,
          {
            name:
              PlatformBootstrapError
                .name,
            code:
              "PLATFORM_COMPOSITION_BOOTSTRAP_FAILED",
            message:
              "Platform bootstrap failed.",
            forbiddenDetails: [
              "Start failed: beta",
              "AggregateError",
            ],
          },
        ),
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .IDLE,
    );

    assert.deepEqual(
      events,
      [
        "factory:alpha",
        "factory:beta",
        "start:alpha",
        "start:beta",
        "stop:alpha",
      ],
    );

    await root.bootstrap();

    assert.deepEqual(
      events.slice(5),
      [
        "factory:alpha",
        "factory:beta",
        "start:alpha",
        "start:beta",
      ],
    );

    await root.shutdown();

    assert.deepEqual(
      events.slice(-2),
      [
        "stop:beta",
        "stop:alpha",
      ],
    );
  },
);

test(
  "an incomplete bootstrap rollback fails closed and blocks every retry",
  async () => {
    const events:
      string[] =
        [];

    const {
      configuration,
    } =
      createTestDependencies([
        createRuntimeDefinition(
          "alpha",
          events,
          {
            failStop: () =>
              true,
          },
        ),
        createRuntimeDefinition(
          "beta",
          events,
          {
            failStart: () =>
              true,
          },
        ),
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    await assert.rejects(
      root.bootstrap(),
      error =>
        assertSanitizedPlatformError(
          error,
          {
            name:
              PlatformRollbackError
                .name,
            code:
              "PLATFORM_COMPOSITION_ROLLBACK_FAILED",
            message:
              "Platform bootstrap rollback failed; the composition is closed.",
            forbiddenDetails: [
              "Start failed: beta",
              "Stop failed: alpha",
              "AggregateError",
            ],
          },
        ),
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .FAILED_CLOSED,
    );

    const factoryEvents =
      events.filter(
        event =>
          event.startsWith(
            "factory:",
          ),
      ).length;

    await assert.rejects(
      root.bootstrap(),
      error =>
        assertSanitizedPlatformError(
          error,
          {
            name:
              PlatformFailedClosedError
                .name,
            code:
              "PLATFORM_COMPOSITION_FAILED_CLOSED",
            message:
              "Platform composition is closed after an incomplete cleanup.",
            forbiddenDetails: [
              "Start failed: beta",
              "Stop failed: alpha",
              "AggregateError",
            ],
          },
        ),
    );

    await assert.rejects(
      root.shutdown(),
      error =>
        assertSanitizedPlatformError(
          error,
          {
            name:
              PlatformFailedClosedError
                .name,
            code:
              "PLATFORM_COMPOSITION_FAILED_CLOSED",
            message:
              "Platform composition is closed after an incomplete cleanup.",
            forbiddenDetails: [
              "Start failed: beta",
              "Stop failed: alpha",
              "AggregateError",
            ],
          },
        ),
    );

    assert.equal(
      events.filter(
        event =>
          event.startsWith(
            "factory:",
          ),
      ).length,
      factoryEvents,
    );
  },
);

test(
  "a shutdown cleanup failure fails closed after attempting reverse cleanup",
  async () => {
    const events:
      string[] =
        [];

    const {
      configuration,
    } =
      createTestDependencies([
        createRuntimeDefinition(
          "alpha",
          events,
          {
            failStop: () =>
              true,
          },
        ),
        createRuntimeDefinition(
          "beta",
          events,
        ),
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    await root.bootstrap();

    await assert.rejects(
      root.shutdown(),
      error =>
        assertSanitizedPlatformError(
          error,
          {
            name:
              PlatformShutdownError
                .name,
            code:
              "PLATFORM_COMPOSITION_SHUTDOWN_FAILED",
            message:
              "Platform shutdown failed; the composition is closed.",
            forbiddenDetails: [
              "Stop failed: alpha",
              "AggregateError",
            ],
          },
        ),
    );

    assert.deepEqual(
      events.slice(-2),
      [
        "stop:beta",
        "stop:alpha",
      ],
    );

    assert.equal(
      root.getState(),
      PLATFORM_COMPOSITION_STATES
        .FAILED_CLOSED,
    );

    await assert.rejects(
      root.bootstrap(),
      PlatformFailedClosedError,
    );
  },
);
