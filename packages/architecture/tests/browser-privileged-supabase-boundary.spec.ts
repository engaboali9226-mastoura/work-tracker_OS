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

const SANCTIONED_PUBLIC_AUTH_FILE =
  "public-supabase-authentication-client.ts";

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
        /\bsb_secret_[A-Za-z0-9_-]+/u,
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
  "browser production source cannot own privileged Supabase infrastructure while one public auth adapter is sanctioned",
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
      const relativeFile =
        relative(
          WEB_SOURCE_ROOT,
          file,
        );

      const source =
        readFileSync(
          file,
          "utf8",
        );

      if (
        /@supabase\/supabase-js/u.test(
          source,
        )
        && relativeFile !==
          SANCTIONED_PUBLIC_AUTH_FILE
      ) {
        findings.push(
          `${relativeFile}::direct-supabase-client-import`,
        );
      }

      if (
        relativeFile ===
          SANCTIONED_PUBLIC_AUTH_FILE
        && /\.from\s*\(/u.test(
          source,
        )
      ) {
        findings.push(
          `${relativeFile}::public-auth-database-operation`,
        );
      }

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
              relativeFile,
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
