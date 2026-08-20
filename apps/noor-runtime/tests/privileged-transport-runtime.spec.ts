import assert from "node:assert/strict";

import {
  readFileSync,
} from "node:fs";

import test from "node:test";

import {
  createPrivilegedTransportRuntime,
} from "../src/privileged-transport-runtime.js";

import type {
  PrivilegedTransportExecutor,
  PrivilegedTransportHost,
  RouteAccessHttpServerFactory,
} from "../src/privileged-transport-runtime.js";

import {
  readNoorRuntimeHttpConfigurationFromEnvironment,
} from "../src/runtime-http-environment.js";

import type {
  RouteAccessHttpServer,
  RouteAccessHttpServerOptions,
} from "../src/route-access-http-server.js";

const executor:
  PrivilegedTransportExecutor =
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

    sessionEstablishment: {
      async execute() {
        throw new Error(
          "session establishment not invoked",
        );
      },
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

  let serverOptions:
    RouteAccessHttpServerOptions
    | undefined;

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
    (
      _executor,
      resolvedOptions,
    ) => {
      serverOptions =
        resolvedOptions;

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
        publicOrigin:
          "https://shell.noor.test",
        secureCookie:
          true,
      },
      createHttpServer,
    });

  return {
    runtime,
    events,
    serverOptions:
      () =>
        serverOptions,
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
  "HTTP environment requires canonical public origin and applies deterministic Secure-cookie policy",
  () => {
    assert.throws(
      () =>
        readNoorRuntimeHttpConfigurationFromEnvironment(
          {},
        ),
    );

    assert.deepEqual(
      readNoorRuntimeHttpConfigurationFromEnvironment({
        NOOR_PUBLIC_ORIGIN:
          "https://shell.noor.test/",
      }),
      {
        host:
          "127.0.0.1",
        port:
          8787,
        publicOrigin:
          "https://shell.noor.test",
        secureCookie:
          true,
      },
    );

    assert.deepEqual(
      readNoorRuntimeHttpConfigurationFromEnvironment({
        NOOR_RUNTIME_LISTEN_HOST:
          "localhost",
        NOOR_RUNTIME_LISTEN_PORT:
          "9443",
        NOOR_PUBLIC_ORIGIN:
          "http://localhost:5173",
      }),
      {
        host:
          "localhost",
        port:
          9443,
        publicOrigin:
          "http://localhost:5173",
        secureCookie:
          false,
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
            NOOR_PUBLIC_ORIGIN:
              "https://shell.noor.test",
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
            NOOR_PUBLIC_ORIGIN:
              "https://shell.noor.test",
          }),
      );
    }

    for (
      const value
      of [
        "http://example.test",
        "ftp://shell.noor.test",
        "https://shell.noor.test/path",
        "https://shell.noor.test?query=1",
        "https://user@shell.noor.test",
      ]
    ) {
      assert.throws(
        () =>
          readNoorRuntimeHttpConfigurationFromEnvironment({
            NOOR_PUBLIC_ORIGIN:
              value,
          }),
      );
    }
  },
);

test(
  "transport startup passes only sanctioned session establishment configuration and coalesces repeated starts",
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

    assert.equal(
      value.serverOptions()
        ?.sessionEstablishment
        ?.publicOrigin,
      "https://shell.noor.test",
    );

    assert.equal(
      value.serverOptions()
        ?.sessionEstablishment
        ?.secureCookie,
      true,
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
