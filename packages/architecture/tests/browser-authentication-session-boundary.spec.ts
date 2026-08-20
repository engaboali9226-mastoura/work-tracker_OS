import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";

const PUBLIC_AUTH_CLIENT =
  fileURLToPath(
    new URL(
      "../../../apps/web/src/public-supabase-authentication-client.ts",
      import.meta.url,
    ),
  );

const SESSION_CLIENT =
  fileURLToPath(
    new URL(
      "../../../apps/web/src/session-establishment-client.ts",
      import.meta.url,
    ),
  );

const PRIVILEGED_OPERATION =
  fileURLToPath(
    new URL(
      "../../../apps/noor-runtime/src/privileged-session-establishment-operation.ts",
      import.meta.url,
    ),
  );

test(
  "browser public Supabase adapter is auth-only and contains no privileged database capability",
  () => {
    const source =
      readFileSync(
        PUBLIC_AUTH_CLIENT,
        "utf8",
      );

    assert.match(
      source,
      /@supabase\/supabase-js/u,
    );

    assert.match(
      source,
      /\bsignInWithPassword\b/u,
    );

    assert.match(
      source,
      /\bpersistSession\s*:\s*false\b/u,
    );

    assert.match(
      source,
      /\bautoRefreshToken\s*:\s*false\b/u,
    );

    assert.match(
      source,
      /\bdetectSessionInUrl\s*:\s*false\b/u,
    );

    assert.doesNotMatch(
      source,
      /\.from\s*\(/u,
    );

    assert.doesNotMatch(
      source,
      /@worktracker\/infrastructure/u,
    );
  },
);

test(
  "browser session-establishment transport carries proof only and no account user or session authority",
  () => {
    const source =
      readFileSync(
        SESSION_CLIENT,
        "utf8",
      );

    assert.match(
      source,
      /\/api\/noor\/session/u,
    );

    assert.match(
      source,
      /\bproof\b/u,
    );

    assert.doesNotMatch(
      source,
      /\baccountId\b/u,
    );

    assert.doesNotMatch(
      source,
      /\buserId\b/u,
    );

    assert.doesNotMatch(
      source,
      /\bsessionId\b/u,
    );

    assert.doesNotMatch(
      source,
      /\bAuthorization\b/u,
    );
  },
);

test(
  "privileged operation authenticates before passing exact authentication into CreateSession",
  () => {
    const source =
      readFileSync(
        PRIVILEGED_OPERATION,
        "utf8",
      );

    const authenticateIndex =
      source.indexOf(
        ".authenticate",
      );

    const createIndex =
      source.indexOf(
        ".createSession",
      );

    assert.ok(
      authenticateIndex >= 0,
    );

    assert.ok(
      createIndex >
        authenticateIndex,
    );

    assert.match(
      source,
      /authentication,\s*\}\);/u,
    );
  },
);
