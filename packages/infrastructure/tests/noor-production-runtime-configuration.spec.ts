import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createNoorProductionRuntimeConfiguration,
  type NoorProductionRuntimeConfiguration,
} from "../src/index.js";

const INVALID_CONFIGURATION_MESSAGE =
  "Noor production runtime configuration is invalid.";

function createValidInput(): {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  expectedIssuer: string;
  expectedAudience: string;
  expectedAlgorithm: "ES256";
  sessionLifetimeMs: number;
} {
  return {
    supabaseUrl: "https://project.example.test/rest/v1",
    supabaseServiceRoleKey: "server-role-key",
    expectedIssuer: "https://project.example.test/auth/v1",
    expectedAudience: "authenticated",
    expectedAlgorithm: "ES256",
    sessionLifetimeMs: 3_600_000,
  };
}

function assertInvalidConfiguration(
  input: unknown,
): void {
  assert.throws(
    () =>
      createNoorProductionRuntimeConfiguration(
        input,
      ),
    {
      name: "TypeError",
      message: INVALID_CONFIGURATION_MESSAGE,
    },
  );
}

test(
  "createNoorProductionRuntimeConfiguration accepts and copies a complete configuration",
  () => {
    const input = {
      ...createValidInput(),
      ignored: "not part of the contract",
    };
    const configuration: NoorProductionRuntimeConfiguration =
      createNoorProductionRuntimeConfiguration(
        input,
      );

    assert.notEqual(
      configuration,
      input,
    );
    assert.equal(
      Object.isFrozen(
        configuration,
      ),
      true,
    );
    assert.deepEqual(
      configuration,
      createValidInput(),
    );
    assert.deepEqual(
      Object.keys(
        configuration,
      ),
      [
        "supabaseUrl",
        "supabaseServiceRoleKey",
        "expectedIssuer",
        "expectedAudience",
        "expectedAlgorithm",
        "sessionLifetimeMs",
      ],
    );
    assert.equal(
      "ignored" in configuration,
      false,
    );
  },
);

test(
  "createNoorProductionRuntimeConfiguration rejects non-object input and invalid required strings",
  () => {
    for (const input of [
      undefined,
      null,
      [],
      "configuration",
    ]) {
      assertInvalidConfiguration(
        input,
      );
    }

    for (const field of [
      "supabaseUrl",
      "supabaseServiceRoleKey",
      "expectedIssuer",
      "expectedAudience",
    ] as const) {
      for (const value of [
        undefined,
        "",
        "  ",
        " padded ",
      ]) {
        const input =
          createValidInput();

        Object.assign(
          input,
          { [field]: value },
        );
        assertInvalidConfiguration(
          input,
        );
      }
    }
  },
);

test(
  "createNoorProductionRuntimeConfiguration requires every contract field",
  () => {
    for (const field of [
      "supabaseUrl",
      "supabaseServiceRoleKey",
      "expectedIssuer",
      "expectedAudience",
      "expectedAlgorithm",
      "sessionLifetimeMs",
    ] as const) {
      const input = {
        ...createValidInput(),
      } as Record<string, unknown>;

      delete input[field];
      assertInvalidConfiguration(
        input,
      );
    }
  },
);

test(
  "createNoorProductionRuntimeConfiguration validates and preserves supabaseUrl exactly",
  () => {
    const input =
      createValidInput();
    input.supabaseUrl =
      "https://project.example.test/rest/v1?retain=this";

    assert.equal(
      createNoorProductionRuntimeConfiguration(
        input,
      ).supabaseUrl,
      input.supabaseUrl,
    );

    input.supabaseUrl =
      "not a URL";
    assertInvalidConfiguration(
      input,
    );
  },
);

test(
  "createNoorProductionRuntimeConfiguration requires and preserves the service role key exactly",
  () => {
    const input =
      createValidInput();
    input.supabaseServiceRoleKey =
      "exact-server-role-key";

    assert.equal(
      createNoorProductionRuntimeConfiguration(
        input,
      ).supabaseServiceRoleKey,
      input.supabaseServiceRoleKey,
    );

    delete (input as {
      supabaseServiceRoleKey?: string;
    }).supabaseServiceRoleKey;
    assertInvalidConfiguration(
      input,
    );
  },
);

test(
  "createNoorProductionRuntimeConfiguration enforces expected issuer semantics",
  () => {
    const invalidIssuers = [
      "not a URL",
      "http://project.example.test/auth/v1",
      "https://user@project.example.test/auth/v1",
      "https://user:password@project.example.test/auth/v1",
      "https://project.example.test/auth/v1?query=value",
      "https://project.example.test/auth/v1#fragment",
    ];

    for (const expectedIssuer of invalidIssuers) {
      assertInvalidConfiguration({
        ...createValidInput(),
        expectedIssuer,
      });
    }

    const expectedIssuer =
      "https://project.example.test/auth/v1/";
    assert.equal(
      createNoorProductionRuntimeConfiguration({
        ...createValidInput(),
        expectedIssuer,
      }).expectedIssuer,
      expectedIssuer,
    );
  },
);

test(
  "createNoorProductionRuntimeConfiguration validates audience and allowed algorithms",
  () => {
    for (const expectedAudience of [
      undefined,
      "",
      "  ",
      " audience ",
    ]) {
      assertInvalidConfiguration({
        ...createValidInput(),
        expectedAudience,
      });
    }

    assert.equal(
      createNoorProductionRuntimeConfiguration({
        ...createValidInput(),
        expectedAudience: "service-role",
      }).expectedAudience,
      "service-role",
    );

    for (const expectedAlgorithm of [
      undefined,
      "HS256",
      "es256",
      123,
    ]) {
      assertInvalidConfiguration({
        ...createValidInput(),
        expectedAlgorithm,
      });
    }

    for (const expectedAlgorithm of [
      "ES256",
      "RS256",
    ] as const) {
      assert.equal(
        createNoorProductionRuntimeConfiguration({
          ...createValidInput(),
          expectedAlgorithm,
        }).expectedAlgorithm,
        expectedAlgorithm,
      );
    }
  },
);

test(
  "createNoorProductionRuntimeConfiguration validates the session lifetime and omits JWKS configuration",
  () => {
    for (const sessionLifetimeMs of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
      "3600000",
    ]) {
      assertInvalidConfiguration({
        ...createValidInput(),
        sessionLifetimeMs,
      });
    }

    const configuration =
      createNoorProductionRuntimeConfiguration({
        ...createValidInput(),
        sessionLifetimeMs: 1,
        jwksUrl: "https://ignored.example.test/jwks.json",
      });

    assert.equal(
      configuration.sessionLifetimeMs,
      1,
    );
    assert.equal(
      "jwksUrl" in configuration,
      false,
    );
  },
);

test(
  "createNoorProductionRuntimeConfiguration has no environment, client, or provider boundary behavior",
  () => {
    const source =
      readFileSync(
        new URL(
          "../src/configuration/noor-production-runtime-configuration.ts",
          import.meta.url,
        ),
        "utf8",
      );

    for (const forbiddenSourceFragment of [
      "process.env",
      "import.meta.env",
      "createClient(",
      "SupabaseClient",
      "fetch(",
      "jwksUrl",
    ]) {
      assert.equal(
        source.includes(
          forbiddenSourceFragment,
        ),
        false,
      );
    }
  },
);
