import assert from "node:assert/strict";
import test from "node:test";

import {
  PLATFORM_COMPOSITION_ERROR_CODES,
  InvalidPlatformCompositionError,
  PlatformBootstrapError,
  PlatformFailedClosedError,
  PlatformRollbackError,
  PlatformShutdownError,
  createPlatformCompositionRoot,
} from "../src/index.js";

import {
  createTestDependencies,
} from "./test-support.js";

import type {
  PlatformRuntimeComponentDefinition,
} from "../src/index.js";

function createRuntimeDefinition(
  componentId: string,
): PlatformRuntimeComponentDefinition {
  return {
    componentId,
    factory: async () => ({
      id:
        componentId,
      name:
        componentId,
      version:
        "1.0.0",
      async start() {},
      async stop() {},
    }),
  };
}

test(
  "public errors expose only fixed codes and messages",
  () => {
    const errors = [
      new InvalidPlatformCompositionError(),
      new PlatformBootstrapError(),
      new PlatformRollbackError(),
      new PlatformShutdownError(),
      new PlatformFailedClosedError(),
    ];

    assert.deepEqual(
      errors.map(
        error => [
          error.code,
          error.message,
        ],
      ),
      [
        [
          PLATFORM_COMPOSITION_ERROR_CODES
            .INVALID_CONFIGURATION,
          "Platform composition configuration is invalid.",
        ],
        [
          PLATFORM_COMPOSITION_ERROR_CODES
            .BOOTSTRAP_FAILED,
          "Platform bootstrap failed.",
        ],
        [
          PLATFORM_COMPOSITION_ERROR_CODES
            .ROLLBACK_FAILED,
          "Platform bootstrap rollback failed; the composition is closed.",
        ],
        [
          PLATFORM_COMPOSITION_ERROR_CODES
            .SHUTDOWN_FAILED,
          "Platform shutdown failed; the composition is closed.",
        ],
        [
          PLATFORM_COMPOSITION_ERROR_CODES
            .FAILED_CLOSED,
          "Platform composition is closed after an incomplete cleanup.",
        ],
      ],
    );

    assert.equal(
      Object.isFrozen(
        PLATFORM_COMPOSITION_ERROR_CODES,
      ),
      true,
    );

    for (
      const error
      of errors
    ) {
      assert.equal(
        "cause" in error,
        false,
      );

      assert.equal(
        Object.hasOwn(
          error,
          "cause",
        ),
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

      assert.equal(
        String(error).includes(
          "AggregateError",
        ),
        false,
      );
    }
  },
);

test(
  "the bootstrapped public API exposes no runtime or lifecycle mutation surface",
  async () => {
    const {
      configuration,
    } =
      createTestDependencies();

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    const platform =
      await root.bootstrap();

    assert.deepEqual(
      Object.keys(platform),
      [
        "services",
      ],
    );

    for (
      const forbiddenSurface
      of [
        "runtime",
        "runtimePlan",
        "kernel",
        "register",
        "registerComponent",
        "start",
        "stop",
      ]
    ) {
      assert.equal(
        forbiddenSurface
          in platform,
        false,
      );
    }

    const rootPrototype =
      Object.getPrototypeOf(
        root,
      );

    for (
      const forbiddenMutation
      of [
        "boot",
        "kernel",
        "registerComponent",
        "startComponent",
        "stopComponent",
        "unregisterComponent",
      ]
    ) {
      assert.equal(
        forbiddenMutation
          in rootPrototype,
        false,
      );
    }

    await root.shutdown();
  },
);

test(
  "invalid dependencies and malformed runtime plans fail at the public boundary",
  () => {
    assert.throws(
      () =>
        createPlatformCompositionRoot(
          {} as never,
        ),
      InvalidPlatformCompositionError,
    );

    const {
      configuration,
    } =
      createTestDependencies();

    assert.throws(
      () =>
        createPlatformCompositionRoot({
          ...configuration,
          runtime: {
            platformComponents: [
              createRuntimeDefinition(
                "duplicate",
              ),
            ],
            applicationBindings: [
              {
                appKey:
                  "noor-personal",
                components: [
                  createRuntimeDefinition(
                    "duplicate",
                  ),
                ],
              },
            ],
          },
        }),
      InvalidPlatformCompositionError,
    );

    assert.throws(
      () =>
        createPlatformCompositionRoot({
          ...configuration,
          runtime: {
            platformComponents: [],
            applicationBindings: [
              {
                appKey:
                  "unknown-app",
                components: [],
              },
            ],
          },
        }),
      InvalidPlatformCompositionError,
    );

    assert.throws(
      () =>
        createPlatformCompositionRoot({
          ...configuration,
          runtime: {
            platformComponents: [],
            applicationBindings: [
              {
                appKey:
                  "NOOR-PERSONAL",
                components: [],
              },
            ],
          },
        }),
      InvalidPlatformCompositionError,
    );

    assert.throws(
      () =>
        createPlatformCompositionRoot({
          ...configuration,
          runtime: {
            platformComponents: [],
            applicationBindings: [
              {
                appKey:
                  "noor-work",
                components: [],
              },
            ],
          },
        }),
      InvalidPlatformCompositionError,
    );

    assert.throws(
      () =>
        createPlatformCompositionRoot({
          ...configuration,
          runtime: {
            platformComponents: [],
            applicationBindings: [
              {
                appKey:
                  "noor-personal",
                components: [],
              },
              {
                appKey:
                  "noor-personal",
                components: [],
              },
            ],
          },
        }),
      InvalidPlatformCompositionError,
    );

    assert.throws(
      () =>
        createPlatformCompositionRoot({
          ...configuration,
          runtime: {
            components: [],
          },
        } as never),
      InvalidPlatformCompositionError,
    );
  },
);

test(
  "a component factory mismatch rolls back through a sanitized bootstrap error",
  async () => {
    const {
      configuration,
    } =
      createTestDependencies([
        {
          componentId:
            "expected",
          factory: async () => ({
            id:
              "unexpected",
            name:
              "Unexpected",
            version:
              "1.0.0",
            async start() {},
            async stop() {},
          }),
        },
      ]);

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    await assert.rejects(
      root.bootstrap(),
      error => {
        assert.ok(
          error
          instanceof PlatformBootstrapError,
        );

        assert.equal(
          error.message,
          "Platform bootstrap failed.",
        );

        assert.equal(
          "cause" in error,
          false,
        );

        assert.equal(
          String(error).includes(
            "Runtime component identity mismatch.",
          ),
          false,
        );

        return true;
      },
    );

    assert.equal(
      root.getState(),
      "idle",
    );
  },
);
