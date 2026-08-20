import assert from "node:assert/strict";
import test from "node:test";

import {
  createBrowserPublicSupabaseAuthenticationClient,
} from "../src/public-supabase-authentication-client.js";

import type {
  PublicSupabaseClientFactory,
} from "../src/public-supabase-authentication-client.js";

test(
  "public Supabase client disables provider-session persistence and returns only access-token proof",
  async () => {
    let capturedOptions:
      unknown;

    const factory:
      PublicSupabaseClientFactory =
      (
        url,
        key,
        options,
      ) => {
        assert.equal(
          url,
          "https://example.supabase.co",
        );

        assert.equal(
          key,
          "public-key",
        );

        capturedOptions =
          options;

        return {
          auth: {
            async signInWithPassword(
              credentials,
            ) {
              assert.deepEqual(
                credentials,
                {
                  email:
                    "user@example.com",
                  password:
                    "password",
                },
              );

              return {
                data: {
                  session: {
                    access_token:
                      "provider-proof",
                  },
                },
                error:
                  null,
              };
            },
          },
        };
      };

    const client =
      createBrowserPublicSupabaseAuthenticationClient(
        {
          supabaseUrl:
            "https://example.supabase.co",
          supabasePublishableKey:
            "public-key",
        },
        factory,
      );

    assert.deepEqual(
      capturedOptions,
      {
        auth: {
          persistSession:
            false,
          autoRefreshToken:
            false,
          detectSessionInUrl:
            false,
        },
      },
    );

    assert.deepEqual(
      await client.authenticate({
        email:
          "user@example.com",
        password:
          "password",
      }),
      {
        kind:
          "authenticated",
        proof:
          "provider-proof",
      },
    );
  },
);

test(
  "provider credential failures and unavailable provider states remain generic",
  async () => {
    const invalid =
      createBrowserPublicSupabaseAuthenticationClient(
        {
          supabaseUrl:
            "https://example.supabase.co",
          supabasePublishableKey:
            "public-key",
        },
        () => ({
          auth: {
            async signInWithPassword() {
              return {
                data: {
                  session:
                    null,
                },
                error: {
                  status:
                    400,
                },
              };
            },
          },
        }),
      );

    assert.deepEqual(
      await invalid.authenticate({
        email:
          "user@example.com",
        password:
          "wrong",
      }),
      {
        kind:
          "invalid-credentials",
      },
    );

    const unavailable =
      createBrowserPublicSupabaseAuthenticationClient(
        {
          supabaseUrl:
            "https://example.supabase.co",
          supabasePublishableKey:
            "public-key",
        },
        () => ({
          auth: {
            async signInWithPassword() {
              throw new Error(
                "network unavailable",
              );
            },
          },
        }),
      );

    assert.deepEqual(
      await unavailable.authenticate({
        email:
          "user@example.com",
        password:
          "password",
      }),
      {
        kind:
          "unavailable",
      },
    );
  },
);
