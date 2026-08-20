import assert from "node:assert/strict";

import {
  readFileSync,
} from "node:fs";

import test from "node:test";

import {
  createPrivilegedTransportRuntime,
} from "../src/privileged-transport-runtime.js";

import type {
  PrivilegedTransportHost,
  RouteAccessHttpServerFactory,
} from "../src/privileged-transport-runtime.js";

import {
  readNoorRuntimeHttpConfigurationFromEnvironment,
} from "../src/runtime-http-environment.js";

import type {
  RouteAccessEvidenceExecutor,
  RouteAccessHttpServer,
} from "../src/route-access-http-server.js";

const executor:
  RouteAccessEvidenceExecutor =
  {
    async execute() {
      return Object.freeze({
        kind:
          "authentication-required",
        appKey:
          "noor-personal",
        pathname:
          "/personal",
      });
    },
  };

function candidate(
  options:
    Readonly<{
      listenFailure?:
        boolean;
      closeFailure?:
        boolean;
      hostShutdownFailure?:
        boolean;
    }> = {},
) {
  const events:
    string[] =
      [];

  let hostStarts =
    0;

  let hostShutdowns =
    0;

  let listens =
    0;

  let closes =
    0;

  const host:
    PrivilegedTransportHost =
    {
      async start() {
        hostStarts +=
          1;

        events.push(
          "host-start",
        );

        return executor;
      },

      async shutdown() {
        hostShutdowns +=
          1;

        events.push(
          "host-shutdown",
        );

        if (
          options
            .hostShutdownFailure
        ) {
          throw new Error(
            "synthetic host shutdown failure",
          );
        }
      },
    };

  const createHttpServer:
    RouteAccessHttpServerFactory =
    () => {
      events.push(
        "server-create",
      );

      const server:
        RouteAccessHttpServer =
        {
          async listen() {
            listens +=
              1;

            events.push(
              "server-listen",
            );

            if (
              options
                .listenFailure
            ) {
              throw new Error(
                "synthetic listen failure",
              );
            }
          },

          async close() {
            closes +=
              1;

            events.push(
              "server-close",
            );

            if (
              options
                .closeFailure
            ) {
              throw new Error(
                "synthetic close failure",
              );
            }
          },

          address() {
            return null;
          },
        };

      return server;
    };

  const runtime =
    createPrivilegedTransportRuntime({
      host,
      httpConfiguration: {
        host:
          "127.0.0.1",
        port:
          8787,
      },
      createHttpServer,
    });

  return {
    runtime,
    events,
    counts: {
      hostStarts:
        () =>
          hostStarts,
      hostShutdowns:
        () =>
          hostShutdowns,
      listens:
        () =>
          listens,
      closes:
        () =>
          closes,
    },
  };
}

test(
  "HTTP environment defaults are deterministic and explicit values validate strictly",
  () => {
    assert.deepEqual(
      readNoorRuntimeHttpConfigurationFromEnvironment(
        {},
      ),
      {
        host:
          "127.0.0.1",
        port:
          8787,
      },
    );

    assert.deepEqual(
      readNoorRuntimeHttpConfigurationFromEnvironment({
        NOOR_RUNTIME_LISTEN_HOST:
          "localhost",
        NOOR_RUNTIME_LISTEN_PORT:
          "9443",
      }),
      {
        host:
          "localhost",
        port:
          9443,
      },
    );

    for (
      const value
      of [
        "0",
        "65536",
        "-1",
        "abc",
        "1.5",
      ]
    ) {
      assert.throws(
        () =>
          readNoorRuntimeHttpConfigurationFromEnvironment({
            NOOR_RUNTIME_LISTEN_PORT:
              value,
          }),
      );
    }

    for (
      const value
      of [
        "",
        " localhost",
        "local host",
      ]
    ) {
      assert.throws(
        () =>
          readNoorRuntimeHttpConfigurationFromEnvironment({
            NOOR_RUNTIME_LISTEN_HOST:
              value,
          }),
      );
    }
  },
);

test(
  "transport startup starts host before creating and listening on HTTP server and coalesces repeated starts",
  async () => {
    const value =
      candidate();

    await Promise.all([
      value.runtime.start(),
      value.runtime.start(),
    ]);

    assert.deepEqual(
      value.events,
      [
        "host-start",
        "server-create",
        "server-listen",
      ],
    );

    assert.equal(
      value.counts
        .hostStarts(),
      1,
    );

    assert.equal(
      value.counts
        .listens(),
      1,
    );

    await value.runtime
      .shutdown();
  },
);

test(
  "shutdown closes HTTP listener before host shutdown and is idempotent",
  async () => {
    const value =
      candidate();

    await value.runtime
      .start();

    const first =
      value.runtime
        .shutdown();

    const second =
      value.runtime
        .shutdown();

    assert.equal(
      first,
      second,
    );

    await first;

    assert.deepEqual(
      value.events,
      [
        "host-start",
        "server-create",
        "server-listen",
        "server-close",
        "host-shutdown",
      ],
    );

    assert.equal(
      value.counts
        .closes(),
      1,
    );

    assert.equal(
      value.counts
        .hostShutdowns(),
      1,
    );
  },
);

test(
  "listen failure shuts down privileged host and leaves runtime failed closed",
  async () => {
    const value =
      candidate({
        listenFailure:
          true,
      });

    await assert.rejects(
      value.runtime.start(),
    );

    assert.deepEqual(
      value.events,
      [
        "host-start",
        "server-create",
        "server-listen",
        "server-close",
        "host-shutdown",
      ],
    );

    await assert.rejects(
      value.runtime.start(),
    );
  },
);

test(
  "runnable main is isolated from package imports and owns only sanctioned signal lifecycle",
  () => {
    const manifest =
      JSON.parse(
        readFileSync(
          new URL(
            "../package.json",
            import.meta.url,
          ),
          "utf8",
        ),
      ) as {
        main?:
          string;
        exports?:
          unknown;
        scripts?:
          Record<string, string>;
      };

    assert.equal(
      manifest.main,
      "./dist/index.js",
    );

    assert.equal(
      manifest.scripts?.start,
      "node ./dist/main.js",
    );

    const mainSource =
      readFileSync(
        new URL(
          "../src/main.ts",
          import.meta.url,
        ),
        "utf8",
      );

    assert.match(
      mainSource,
      /\bSIGINT\b/u,
    );

    assert.match(
      mainSource,
      /\bSIGTERM\b/u,
    );

    assert.doesNotMatch(
      mainSource,
      /\bprocess\.exit\s*\(/u,
    );

    assert.doesNotMatch(
      mainSource,
      /\bprocess\.stdin\.resume\b/u,
    );

    assert.doesNotMatch(
      mainSource,
      /\bsetInterval\s*\(/u,
    );
  },
);
