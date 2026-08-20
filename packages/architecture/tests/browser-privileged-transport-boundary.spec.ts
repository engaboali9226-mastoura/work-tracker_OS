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

const RUNTIME_SOURCE_ROOT =
  fileURLToPath(
    new URL(
      "../../../apps/noor-runtime/src/",
      import.meta.url,
    ),
  );

const VITE_CONFIG =
  fileURLToPath(
    new URL(
      "../../../apps/web/vite.config.ts",
      import.meta.url,
    ),
  );

const WEB_MAIN =
  fileURLToPath(
    new URL(
      "../../../apps/web/src/main.tsx",
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

function sourceFiles(
  directory:
    string,
): string[] {
  const result:
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
    const path =
      resolve(
        directory,
        entry.name,
      );

    if (entry.isDirectory()) {
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
  "browser transport requests evidence but cannot own session or privileged authority",
  () => {
    const forbidden =
      [
        {
          name:
            "document-cookie",
          pattern:
            /\bdocument\.cookie\b/u,
        },
        {
          name:
            "session-id-ownership",
          pattern:
            /\bsessionId\b/u,
        },
        {
          name:
            "authorization-header",
          pattern:
            /(?:["']Authorization["']|\bAuthorization\s*:|\bheaders\.Authorization\b)/iu,
        },
        {
          name:
            "bearer-transport",
          pattern:
            /["']Bearer[ \t]+/iu,
        },
        {
          name:
            "browser-session-storage",
          pattern:
            /\b(?:localStorage|sessionStorage)\b/u,
        },
        {
          name:
            "service-role",
          pattern:
            /\bSUPABASE_SERVICE_ROLE_KEY\b/u,
        },
        {
          name:
            "privileged-infrastructure",
          pattern:
            /@worktracker\/infrastructure/u,
        },
        {
          name:
            "direct-supabase",
          pattern:
            /@supabase\/supabase-js/u,
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
        of forbidden
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
    );
  },
);

test(
  "000D runtime transport primitives are confined to explicit server and process owners",
  () => {
    const allowances =
      [
        {
          name:
            "node-http",
          pattern:
            /node:http/u,
          files:
            new Set([
              "route-access-http-server.ts",
            ]),
        },
        {
          name:
            "create-server",
          pattern:
            /\bcreateServer\s*\(/u,
          files:
            new Set([
              "route-access-http-server.ts",
            ]),
        },
        {
          name:
            "listen",
          pattern:
            /\.listen\s*\(/u,
          files:
            new Set([
              "route-access-http-server.ts",
              "privileged-transport-runtime.ts",
            ]),
        },
        {
          name:
            "session-cookie",
          pattern:
            /\bnoor_session\b/u,
          files:
            new Set([
              "route-access-http-server.ts",
            ]),
        },
        {
          name:
            "signals",
          pattern:
            /\b(?:SIGINT|SIGTERM)\b/u,
          files:
            new Set([
              "main.ts",
            ]),
        },
      ];

    const globallyForbidden =
      [
        /\bprocess\.exit\s*\(/u,
        /\bprocess\.stdin\.resume\b/u,
        /\bsetInterval\s*\(/u,
      ];

    const findings:
      string[] =
        [];

    for (
      const sourceFile
      of sourceFiles(
        RUNTIME_SOURCE_ROOT,
      )
    ) {
      const relativeFile =
        relative(
          RUNTIME_SOURCE_ROOT,
          sourceFile,
        );

      const source =
        readFileSync(
          sourceFile,
          "utf8",
        );

      for (
        const allowance
        of allowances
      ) {
        if (
          allowance.pattern.test(
            source,
          )
          && !allowance.files.has(
            relativeFile,
          )
        ) {
          findings.push(
            [
              relativeFile,
              allowance.name,
            ].join(
              "::",
            ),
          );
        }
      }

      for (
        const pattern
        of globallyForbidden
      ) {
        if (
          pattern.test(
            source,
          )
        ) {
          findings.push(
            [
              relativeFile,
              "forbidden-process-liveness",
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
    );
  },
);

test(
  "web wiring uses the dedicated route-access client and controller while Vite owns only the development same-origin proxy",
  () => {
    const main =
      readFileSync(
        WEB_MAIN,
        "utf8",
      );

    assert.match(
      main,
      /\bcreateBrowserRouteAccessEvidenceClient\b/u,
    );

    assert.match(
      main,
      /\bcreateRouteAccessEvidenceController\b/u,
    );

    assert.match(
      main,
      /\blifecycleState\b/u,
    );

    assert.match(
      main,
      /\baccessEvidence\b/u,
    );

    const vite =
      readFileSync(
        VITE_CONFIG,
        "utf8",
      );

    assert.match(
      vite,
      /"\/api\/noor"/u,
    );

    assert.match(
      vite,
      /\bNOOR_RUNTIME_DEV_ORIGIN\b/u,
    );

    assert.match(
      vite,
      /http:\/\/127\.0\.0\.1:8787/u,
    );

    assert.doesNotMatch(
      vite,
      /\bcors\s*:/u,
    );
  },
);
