import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import test from "node:test";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  NoorAuthenticationAccountLinkageDatabase,
} from "../src/authentication/supabase-postgres-authentication-account-linkage-resolver.js";

import type {
  NoorEntitlementDatabase,
} from "../src/authorization/supabase-postgres-entitlement-repository.js";

import {
  createNoorPrivilegedSupabaseClient,
  type NoorPrivilegedSupabaseClientConfiguration,
} from "../src/index.js";

import type {
  NoorSessionDatabase,
} from "../src/session/supabase-postgres-session-repository.js";

const INVALID_CONFIGURATION_MESSAGE =
  "Noor privileged Supabase client configuration is invalid.";

const VALID_CONFIGURATION:
  NoorPrivilegedSupabaseClientConfiguration =
    Object.freeze({
      supabaseUrl:
        "https://project.example.test",
      supabaseServiceRoleKey:
        "test-service-role-key",
    });

function createCandidate(
  input: unknown,
): SupabaseClient<NoorSessionDatabase> {
  return createNoorPrivilegedSupabaseClient<
    NoorSessionDatabase
  >(
    input as
      NoorPrivilegedSupabaseClientConfiguration,
  );
}

test(
  "createNoorPrivilegedSupabaseClient is exported and returns a real Supabase client",
  () => {
    const client =
      createCandidate(
        VALID_CONFIGURATION,
      );

    assert.equal(
      typeof client.from,
      "function",
    );

    assert.equal(
      typeof client.auth,
      "object",
    );
  },
);

test(
  "factory is type-compatible with all existing privileged Supabase database contracts",
  () => {
    const sessionClient:
      SupabaseClient<
        NoorSessionDatabase
      > =
        createNoorPrivilegedSupabaseClient<
          NoorSessionDatabase
        >(
          VALID_CONFIGURATION,
        );

    const entitlementClient:
      SupabaseClient<
        NoorEntitlementDatabase
      > =
        createNoorPrivilegedSupabaseClient<
          NoorEntitlementDatabase
        >(
          VALID_CONFIGURATION,
        );

    const linkageClient:
      SupabaseClient<
        NoorAuthenticationAccountLinkageDatabase
      > =
        createNoorPrivilegedSupabaseClient<
          NoorAuthenticationAccountLinkageDatabase
        >(
          VALID_CONFIGURATION,
        );

    assert.equal(
      typeof sessionClient.from,
      "function",
    );

    assert.equal(
      typeof entitlementClient.from,
      "function",
    );

    assert.equal(
      typeof linkageClient.from,
      "function",
    );
  },
);

test(
  "factory uses the exact privileged URL and key for PostgREST without live network",
  async () => {
    const originalFetch =
      globalThis.fetch;

    const requests:
      Request[] = [];

    globalThis.fetch =
      async (
        input,
        init,
      ) => {
        const request =
          new Request(
            input,
            init,
          );

        requests.push(
          request,
        );

        return new Response(
          JSON.stringify(
            [],
          ),
          {
            status:
              200,
            headers: {
              "content-type":
                "application/json",
            },
          },
        );
      };

    try {
      const client =
        createCandidate(
          VALID_CONFIGURATION,
        );

      const result =
        await client
          .from(
            "noor_sessions",
          )
          .select(
            "id",
          )
          .limit(
            1,
          );

      assert.equal(
        result.error,
        null,
      );

      assert.equal(
        requests.length,
        1,
      );

      const request =
        requests[0];

      assert.ok(
        request,
      );

      const url =
        new URL(
          request.url,
        );

      assert.equal(
        url.origin,
        "https://project.example.test",
      );

      assert.equal(
        url.pathname,
        "/rest/v1/noor_sessions",
      );

      assert.equal(
        url.searchParams.get(
          "select",
        ),
        "id",
      );

      assert.equal(
        url.searchParams.get(
          "limit",
        ),
        "1",
      );

      assert.equal(
        request.headers.get(
          "apikey",
        ),
        VALID_CONFIGURATION
          .supabaseServiceRoleKey,
      );

      assert.equal(
        request.headers.get(
          "authorization",
        ),
        "Bearer "
          + VALID_CONFIGURATION
            .supabaseServiceRoleKey,
      );
    } finally {
      globalThis.fetch =
        originalFetch;
    }
  },
);

test(
  "factory rejects malformed privileged URLs fail-closed",
  () => {
    for (const supabaseUrl of [
      undefined,
      "",
      "   ",
      " https://project.example.test",
      "https://project.example.test ",
      "not-a-url",
      "http://project.example.test",
      "https://user@project.example.test",
      "https://user:password@project.example.test",
      "https://project.example.test/rest/v1",
      "https://project.example.test/path",
      "https://project.example.test?query=value",
      "https://project.example.test#fragment",
    ]) {
      assert.throws(
        () =>
          createCandidate({
            ...VALID_CONFIGURATION,
            supabaseUrl,
          }),
        {
          name:
            "TypeError",
          message:
            INVALID_CONFIGURATION_MESSAGE,
        },
      );
    }
  },
);

test(
  "factory rejects malformed privileged keys without exposing the supplied value",
  () => {
    for (const supabaseServiceRoleKey of [
      undefined,
      "",
      "   ",
      " padded-secret ",
    ]) {
      try {
        createCandidate({
          ...VALID_CONFIGURATION,
          supabaseServiceRoleKey,
        });

        assert.fail(
          "Expected privileged client configuration rejection.",
        );
      } catch (error: unknown) {
        assert.ok(
          error instanceof
            TypeError,
        );

        assert.equal(
          error.message,
          INVALID_CONFIGURATION_MESSAGE,
        );

        if (
          typeof supabaseServiceRoleKey
            === "string"
          && supabaseServiceRoleKey
            .length > 0
        ) {
          assert.equal(
            error.message.includes(
              supabaseServiceRoleKey,
            ),
            false,
          );
        }
      }
    }
  },
);

test(
  "factory configuration rejection never includes an otherwise valid secret",
  () => {
    const secret =
      "unique-sensitive-test-secret";

    try {
      createCandidate({
        supabaseUrl:
          "http://project.example.test",
        supabaseServiceRoleKey:
          secret,
      });

      assert.fail(
        "Expected invalid URL rejection.",
      );
    } catch (error: unknown) {
      assert.ok(
        error instanceof
          TypeError,
      );

      assert.equal(
        error.message,
        INVALID_CONFIGURATION_MESSAGE,
      );

      assert.equal(
        error.message.includes(
          secret,
        ),
        false,
      );
    }
  },
);

test(
  "factory owns no environment lookup and configures server-side auth behavior explicitly",
  () => {
    const source =
      readFileSync(
        new URL(
          "../src/database/noor-privileged-supabase-client.ts",
          import.meta.url,
        ),
        "utf8",
      );

    for (const forbidden of [
      "process.env",
      "import.meta.env",
      "Bun.env",
      "Deno.env",
    ]) {
      assert.equal(
        source.includes(
          forbidden,
        ),
        false,
      );
    }

    assert.match(
      source,
      /autoRefreshToken:\s*false/u,
    );

    assert.match(
      source,
      /persistSession:\s*false/u,
    );

    assert.match(
      source,
      /detectSessionInUrl:\s*false/u,
    );
  },
);
