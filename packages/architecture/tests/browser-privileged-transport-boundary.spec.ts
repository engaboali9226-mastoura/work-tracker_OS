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
  "browser transport cannot own NOOR session or privileged authority while one public provider-auth adapter is sanctioned",
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
      const relativeFile =
        relative(
          WEB_SOURCE_ROOT,
          sourceFile,
        );

      const source =
        readFileSync(
          sourceFile,
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
          [
            relativeFile,
            "direct-supabase",
          ].join(
            "::",
          ),
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
          [
            relativeFile,
            "public-auth-database-operation",
          ].join(
            "::",
          ),
        );
      }

      for (
        const signal
        of forbidden
      ) {
        if (
          signal.pattern.test(
            source,
          )
          && !(signal.name === "browser-session-storage" && relativeFile === "appearance-preference-store.ts")
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

    const preferences = readFileSync(resolve(WEB_SOURCE_ROOT,"appearance-preference-store.ts"),"utf8");
    assert.match(preferences,/const APPEARANCE_KEY = "noor:appearance:v1"/u);
    assert.equal([...preferences.matchAll(/localStorage\.getItem\(APPEARANCE_KEY\)/gu)].length,1);
    assert.equal([...preferences.matchAll(/localStorage\.setItem\(APPEARANCE_KEY, value\)/gu)].length,1);
    assert.equal([...preferences.matchAll(/\blocalStorage\b/gu)].length,2);
    assert.doesNotMatch(preferences,/sessionStorage|document\.cookie|\bfetch\s*\(|\.removeItem\(|\.clear\(|SUPABASE|sessionId|access_token|refresh_token/u);
    assert.deepEqual(
      findings,
      [],
    );
  },
);

test(
  "000D runtime transport primitives remain confined while 000E adds only the sanctioned session boundary",
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
              "session-establishment-http-handler.ts",
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
              "session-cookie.ts",
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

    allowances.push({name:"scheduled-materialization-timer",pattern:/\bsetInterval\s*\(/u,files:new Set(["personal-daily-materialization-scheduler.ts"])});
    const scheduler=readFileSync(resolve(RUNTIME_SOURCE_ROOT,"personal-daily-materialization-scheduler.ts"),"utf8");
    assert.match(scheduler,/this\.timer\.unref\?\.\(\)/u);
    assert.match(scheduler,/clearInterval\(this\.timer\)/u);
    assert.match(scheduler,/await this\.activeTick/u);
    const globallyForbidden =
      [
        /\bprocess\.exit\s*\(/u,
        /\bprocess\.stdin\.resume\b/u,
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
  "web wiring retains dedicated 000D route-access client/controller and Vite owns only development same-origin proxy",
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
