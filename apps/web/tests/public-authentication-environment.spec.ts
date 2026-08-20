import assert from "node:assert/strict";
import test from "node:test";

import {
  readPublicAuthenticationConfiguration,
} from "../src/public-authentication-environment.js";

function legacyKey(
  role:
    string,
): string {
  const encode =
    (
      value:
        unknown,
    ) =>
      Buffer.from(
        JSON.stringify(
          value,
        ),
      ).toString(
        "base64url",
      );

  return [
    encode({
      alg:
        "HS256",
    }),
    encode({
      role,
    }),
    "signature",
  ].join(
    ".",
  );
}

test(
  "public authentication environment accepts public HTTPS configuration and explicit loopback only",
  () => {
    assert.deepEqual(
      readPublicAuthenticationConfiguration({
        VITE_NOOR_SUPABASE_URL:
          "https://example.supabase.co/",
        VITE_NOOR_SUPABASE_PUBLISHABLE_KEY:
          "sb_publishable_public",
      }),
      {
        supabaseUrl:
          "https://example.supabase.co",
        supabasePublishableKey:
          "sb_publishable_public",
      },
    );

    assert.equal(
      readPublicAuthenticationConfiguration({
        VITE_NOOR_SUPABASE_URL:
          "http://127.0.0.1:54321",
        VITE_NOOR_SUPABASE_PUBLISHABLE_KEY:
          "public-key",
      }).supabaseUrl,
      "http://127.0.0.1:54321",
    );

    assert.throws(
      () =>
        readPublicAuthenticationConfiguration({
          VITE_NOOR_SUPABASE_URL:
            "http://example.test",
          VITE_NOOR_SUPABASE_PUBLISHABLE_KEY:
            "public-key",
        }),
    );
  },
);

test(
  "missing secret-prefixed and legacy privileged-role keys fail closed",
  () => {
    for (
      const key
      of [
        undefined,
        "",
        "sb_secret_example",
        legacyKey(
          [
            "service",
            "role",
          ].join(
            "_",
          ),
        ),
      ]
    ) {
      assert.throws(
        () =>
          readPublicAuthenticationConfiguration({
            VITE_NOOR_SUPABASE_URL:
              "https://example.supabase.co",
            VITE_NOOR_SUPABASE_PUBLISHABLE_KEY:
              key,
          }),
      );
    }
  },
);
