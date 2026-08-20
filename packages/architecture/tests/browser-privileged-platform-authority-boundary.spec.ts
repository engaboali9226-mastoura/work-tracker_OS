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

const HOST_SOURCE_ROOT =
  fileURLToPath(
    new URL(
      "../../../apps/noor-runtime/src/",
      import.meta.url,
    ),
  );

const HOST_000C_CORE_FILES =
  [
    "index.ts",
    "runtime-environment.ts",
    "privileged-platform-runtime-host.ts",
    "privileged-route-access-evidence-operation.ts",
  ].map(
    file =>
      resolve(
        HOST_SOURCE_ROOT,
        file,
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

function sourceFiles(
  directory:
    string,
): string[] {
  const files:
    string[] =
      [];

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
    const sourcePath =
      resolve(
        directory,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...sourceFiles(
          sourcePath,
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
      files.push(
        sourcePath,
      );
    }
  }

  return files.sort();
}

test(
  "browser production source cannot own privileged platform runtime authority",
  () => {
    const signals =
      [
        {
          name:
            "privileged-infrastructure-import",
          pattern:
            /@worktracker\/infrastructure/u,
        },

        {
          name:
            "privileged-supabase-client-construction",
          pattern:
            /\bcreateNoorPrivilegedSupabaseClient\s*\(/u,
        },

        {
          name:
            "production-runtime-configuration-construction",
          pattern:
            /\bcreateNoorProductionRuntimeConfiguration\s*\(/u,
        },

        {
          name:
            "production-platform-root-construction",
          pattern:
            /\bcreatePlatformCompositionRoot\s*\(/u,
        },

        {
          name:
            "direct-platform-root-construction",
          pattern:
            /\bnew\s+PlatformCompositionRoot\b/u,
        },

        {
          name:
            "service-role-field",
          pattern:
            /\bsupabaseServiceRoleKey\b/u,
        },

        {
          name:
            "service-role-environment",
          pattern:
            /\bSUPABASE_SERVICE_ROLE_KEY\b/u,
        },
      ] as const;

    const findings:
      string[] =
        [];

    for (
      const sourceFile
      of sourceFiles(
        WEB_SOURCE_ROOT,
      )
    ) {
      const source =
        readFileSync(
          sourceFile,
          "utf8",
        );

      for (
        const signal
        of signals
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
                sourceFile,
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
      "apps/web production source must remain outside privileged production authority.",
    );
  },
);

test(
  "MVP-CP-000C core files remain transport-neutral and own no process keepalive",
  () => {
    const signals =
      [
        /node:http/u,
        /node:https/u,
        /node:http2/u,
        /node:net/u,
        /\bcreateServer\s*\(/u,
        /\.listen\s*\(/u,
        /\bfetch\s*\(/u,
        /\bWebSocket\b/u,
        /\bprocess\.stdin\.resume\b/u,
        /\bsetInterval\s*\(/u,
        /\bSIGINT\b/u,
        /\bSIGTERM\b/u,
      ] as const;

    const findings:
      string[] =
        [];

    for (
      const sourceFile
      of HOST_000C_CORE_FILES
    ) {
      const source =
        readFileSync(
          sourceFile,
          "utf8",
        );

      for (
        const signal
        of signals
      ) {
        if (
          signal.test(
            source,
          )
        ) {
          findings.push(
            relative(
              HOST_SOURCE_ROOT,
              sourceFile,
            ),
          );
        }
      }
    }

    assert.deepEqual(
      findings,
      [],
      "MVP-CP-000C core authority must remain transport-neutral.",
    );
  },
);
