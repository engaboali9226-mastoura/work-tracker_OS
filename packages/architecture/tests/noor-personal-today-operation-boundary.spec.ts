import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo =
  path.resolve(
    import.meta.dirname,
    "../../..",
  );

function read(
  relative:
    string,
):
string {
  return fs.readFileSync(
    path.join(
      repo,
      relative,
    ),
    "utf8",
  );
}

test(
  "Personal Today authority flows from HttpOnly session to account resolver, never from browser userId",
  () => {
    const operation =
      read(
        "apps/noor-runtime/src/personal-today-operation.ts",
      );

    const client =
      read(
        "apps/web/src/noor-personal-today-client.ts",
      );

    assert.match(
      operation,
      /accountUserResolver[\s\S]*\.resolve\([\s\S]*accountId/um,
    );

    assert.match(
      operation,
      /resourceId:\s*"noor-personal"/um,
    );

    assert.match(
      operation,
      /openOperation\([\s\S]*userId\.toString\(\)/um,
    );

    assert.doesNotMatch(
      client,
      /userId\s*:/um,
    );

    assert.doesNotMatch(
      client,
      /accountId\s*:/um,
    );

    assert.match(
      client,
      /body:\s*"\{\}"/um,
    );
  },
);

test(
  "Personal persistence uses one loaded revision and CAS without automatic retry",
  () => {
    const persistence =
      read(
        "apps/noor-personal/src/infrastructure/supabase-postgres-personal-foundation-persistence.ts",
      );

    assert.match(
      persistence,
      /\.eq\(\s*"revision",\s*loaded\.revision/um,
    );

    assert.match(
      persistence,
      /"PersistenceConflict"/um,
    );

    assert.doesNotMatch(
      persistence,
      /\bwhile\s*\(|\bfor\s*\([^)]*retry|automaticRetry|retryCount/ium,
    );

    assert.match(
      persistence,
      /transactionAttempted/um,
    );
  },
);

test(
  "Current first-real Today path contains no trivial placeholder tests or persistence stubs",
  () => {
    for (
      const relative
      of [
        "apps/noor-personal/test/personal-foundation-operation-scope.test.mjs",
        "apps/noor-runtime/tests/personal-today-operation.spec.ts",
        "apps/web/tests/noor-personal-today-client.spec.ts",
        "packages/infrastructure/tests/supabase-postgres-authentication-account-user-resolver.spec.ts",
      ]
    ) {
      assert.doesNotMatch(
        read(relative),
        /assert\.ok\(true\)/u,
        relative,
      );
    }

    assert.doesNotMatch(
      read(
        "apps/noor-personal/src/infrastructure/supabase-postgres-personal-foundation-persistence.ts",
      ),
      /Personal foundation persistence is unavailable/u,
    );
  },
);
