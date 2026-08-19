import assert from "node:assert/strict";
import {
  readdirSync,
  readFileSync,
} from "node:fs";
import {
  extname,
  relative,
  resolve,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";

const WEB_SOURCE_ROOT =
  fileURLToPath(
    new URL(
      "../../../apps/web/src/",
      import.meta.url,
    ),
  );

const SOURCE_EXTENSIONS =
  new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mts",
    ".cts",
  ]);

const FORBIDDEN_SIGNALS =
  [
    {
      name:
        "infrastructure-package-import",
      pattern:
        /@worktracker\/infrastructure/u,
    },
    {
      name:
        "direct-supabase-client-import",
      pattern:
        /@supabase\/supabase-js/u,
    },
    {
      name:
        "deep-infrastructure-path",
      pattern:
        /packages\/infrastructure/u,
    },
    {
      name:
        "service-role-configuration-field",
      pattern:
        /\bsupabaseServiceRoleKey\b/u,
    },
    {
      name:
        "service-role-environment-symbol",
      pattern:
        /\bSUPABASE_SERVICE_ROLE_KEY\b/u,
    },
    {
      name:
        "supabase-secret-key-prefix",
      pattern:
        /\bsb_secret_[A-Za-z0-9_-]*/u,
    },
    {
      name:
        "legacy-service-role-token",
      pattern:
        /\bservice_role\b/u,
    },
  ] as const;

function sourceFiles(
  directory: string,
): string[] {
  const result:
    string[] = [];

  for (
    const entry
    of readdirSync(
      directory,
      {
        withFileTypes:
          true,
      },
    )
  ) {
    const path =
      resolve(
        directory,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      result.push(
        ...sourceFiles(
          path,
        ),
      );

      continue;
    }

    if (
      entry.isFile()
      && SOURCE_EXTENSIONS.has(
        extname(
          entry.name,
        ),
      )
    ) {
      result.push(
        path,
      );
    }
  }

  return result.sort();
}

test(
  "browser production source cannot own or import privileged Supabase infrastructure",
  () => {
    const files =
      sourceFiles(
        WEB_SOURCE_ROOT,
      );

    assert.ok(
      files.length > 0,
      "apps/web/src must contain production source files.",
    );

    const findings:
      string[] = [];

    for (const file of files) {
      const source =
        readFileSync(
          file,
          "utf8",
        );

      for (
        const signal
        of FORBIDDEN_SIGNALS
      ) {
        if (
          signal.pattern.test(
            source,
          )
        ) {
          findings.push(
            [
              relative(
                WEB_SOURCE_ROOT,
                file,
              ),
              signal.name,
            ].join(
              "::",
            ),
          );
        }
      }
    }

    assert.deepEqual(
      findings,
      [],
      "Privileged Supabase authority must remain outside apps/web/src.",
    );
  },
);
