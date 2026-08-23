import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import test from "node:test";

import {
  createNoorProductionRuntimeConfiguration,
} from "@worktracker/infrastructure";

import {
  createPrivilegedPlatformRuntimeHost,
} from "../src/privileged-platform-runtime-host.js";

import {
  NOOR_RUNTIME_ENVIRONMENT_KEYS,
  readNoorProductionRuntimeConfigurationFromEnvironment,
} from "../src/runtime-environment.js";

const SYNTHETIC_SECRET =
  "synthetic-service-role-secret";

function configuration() {
  return createNoorProductionRuntimeConfiguration({
    supabaseUrl:
      "https://example.supabase.co",
    supabaseServiceRoleKey:
      SYNTHETIC_SECRET,
    expectedIssuer:
      "https://issuer.example/",
    expectedAudience:
      "authenticated",
    expectedAlgorithm:
      "RS256",
    sessionLifetimeMs:
      60_000,
  });
}

test(
  "runtime environment reader produces validated privileged configuration without reflecting secrets on failure",
  () => {
    const environment = {
      [
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .supabaseUrl
      ]:
        "https://example.supabase.co",

      [
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .supabaseServiceRoleKey
      ]:
        SYNTHETIC_SECRET,

      [
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .expectedIssuer
      ]:
        "https://issuer.example/",

      [
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .expectedAudience
      ]:
        "authenticated",

      [
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .expectedAlgorithm
      ]:
        "RS256",

      [
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .sessionLifetimeMs
      ]:
        "60000",
    };

    const resolved =
      readNoorProductionRuntimeConfigurationFromEnvironment(
        environment,
      );

    assert.equal(
      resolved.sessionLifetimeMs,
      60_000,
    );

    assert.equal(
      resolved.supabaseServiceRoleKey,
      SYNTHETIC_SECRET,
    );

    assert.throws(
      () =>
        readNoorProductionRuntimeConfigurationFromEnvironment({
          ...environment,

          [
            NOOR_RUNTIME_ENVIRONMENT_KEYS
              .supabaseUrl
          ]:
            "not-a-url",
        }),
      error => {
        assert.ok(
          error instanceof
            Error,
        );

        assert.equal(
          error.message.includes(
            SYNTHETIC_SECRET,
          ),
          false,
        );

        return true;
      },
    );
  },
);

test(
  "real production graph bootstraps with an empty runtime plan and shuts down without network access",
  async () => {
    const host =
      createPrivilegedPlatformRuntimeHost(
        configuration(),
      );

    assert.equal(
      host.getState(),
      "idle",
    );

    const first =
      await host.start();

    assert.equal(
      host.getState(),
      "running",
    );

    const second =
      await host.start();

    assert.equal(
      second,
      first,
    );

    assert.deepEqual(
      await first.execute({
        request: {
          appKey:
            "noor-personal",
          pathname:
            "/personal",
        },

        context: {
          sessionId:
            null,
        },
      }),
      {
        kind:
          "authentication-required",
        appKey:
          "noor-personal",
        pathname:
          "/personal",
      },
    );

    await host.shutdown();

    assert.equal(
      host.getState(),
      "idle",
    );

    await assert.rejects(
      first.execute({
        request: {
          appKey:
            "noor-personal",
          pathname:
            "/personal",
        },

        context: {
          sessionId:
            null,
        },
      }),
    );

    await host.shutdown();

    assert.equal(
      host.getState(),
      "idle",
    );
  },
);

test(
  "production host source composes exactly five typed privileged Supabase clients and no process runner",
  () => {
    const source =
      readFileSync(
        new URL(
          "../src/privileged-platform-runtime-host.ts",
          import.meta.url,
        ),
        "utf8",
      );

    assert.equal(
      (
        source.match(
          /createNoorPrivilegedSupabaseClient</gu,
        )
        ?? []
      ).length,
      5,
    );

    for (
      const databaseType
      of [
        "NoorAuthenticationAccountLinkageDatabase",
        "NoorSessionDatabase",
        "NoorEntitlementDatabase",
        "NoorAuthenticationAccountUserDatabase",
        "NoorPersonalFoundationDatabase",
      ]
    ) {
      assert.match(
        source,
        new RegExp(
          `createNoorPrivilegedSupabaseClient<\\s*${databaseType}`,
          "u",
        ),
      );
    }

    for (
      const forbidden
      of [
        "createServer(",
        ".listen(",
        "process.stdin.resume",
        "SIGINT",
        "SIGTERM",
      ]
    ) {
      assert.equal(
        source.includes(
          forbidden,
        ),
        false,
      );
    }
  },
);
