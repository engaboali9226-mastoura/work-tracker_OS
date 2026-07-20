import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as core from "@worktracker/core";
import * as application from "../src/index.js";

test(
  "Core and Application roots expose approved Session runtime values",
  () => {
    const coreRuntimeExports = [
      "createSessionId",
      "createSessionSnapshot",
      "InvalidSessionRequestError",
      "InvalidSessionError",
      "SessionUnavailableError",
    ];

    const applicationRuntimeExports = [
      "CreateSession",
      "ResolveSession",
      "RevokeSession",
    ];

    for (const exportName of coreRuntimeExports) {
      assert.equal(
        exportName in core,
        true,
        `Missing Core runtime export: ${exportName}`,
      );
    }

    for (const exportName of applicationRuntimeExports) {
      assert.equal(
        exportName in application,
        true,
        `Missing Application runtime export: ${exportName}`,
      );
    }
  },
);

test(
  "Session public TypeScript surfaces are consumable",
  () => {
    const id: core.SessionId =
      core.createSessionId(
        "session-0000000001",
      );

    const generator: core.SessionIdGenerator = {
      async generate(): Promise<core.SessionId> {
        return id;
      },
    };

    const policy: core.SessionLifetimePolicy = {
      calculateExpirationEpochMs(
        createdAtEpochMs: number,
      ): number {
        return createdAtEpochMs +
          1_000;
      },
    };

    const request: application.ResolveSessionRequest = {
      sessionId:
        id,
    };

    const revokeOutput: application.RevokeSessionOutput =
      undefined;

    assert.equal(
      generator !== null,
      true,
    );

    assert.equal(
      policy.calculateExpirationEpochMs(
        1_000,
      ),
      2_000,
    );

    assert.equal(
      request.sessionId,
      id,
    );

    assert.equal(
      revokeOutput,
      undefined,
    );
  },
);

test(
  "Session roots do not expose transport, token or concrete persistence APIs",
  () => {
    const forbidden = [
      "CookieSession",
      "JwtSession",
      "BearerSession",
      "RedisSessionRepository",
      "PostgresSessionRepository",
      "CurrentSession",
      "SessionMiddleware",
    ];

    for (const exportName of forbidden) {
      assert.equal(
        exportName in core,
        false,
        `Forbidden Core export exists: ${exportName}`,
      );

      assert.equal(
        exportName in application,
        false,
        `Forbidden Application export exists: ${exportName}`,
      );
    }
  },
);

test(
  "Session production source has no ambient clock, global session or provider implementation",
  () => {
    const repositoryRoot =
      path.resolve(
        path.resolve(
      decodeURIComponent(
        new URL(
          ".",
          import.meta.url,
        ).pathname,
      ),
      "../../..",
    ),
      );

    const sourceDirectories = [
      path.join(
        repositoryRoot,
        "packages/core/src/session",
      ),
      path.join(
        repositoryRoot,
        "packages/application/src/session",
      ),
    ];

    const files =
      sourceDirectories.flatMap(
        directory =>
          fs.readdirSync(
            directory,
          )
            .filter(
              file =>
                file.endsWith(
                  ".ts",
                ),
            )
            .map(
              file =>
                path.join(
                  directory,
                  file,
                ),
            ),
      );

    const combined =
      files
        .map(
          file =>
            fs.readFileSync(
              file,
              "utf8",
            ),
        )
        .join(
          "\n",
        );

    const forbiddenPatterns = [
      /\bDate\.now\s*\(/,
      /\bcurrentSession\b/i,
      /\bglobalSession\b/i,
      /\bexpress-session\b/i,
      /\bjsonwebtoken\b/i,
      /\bconnect-redis\b/i,
      /\bRedisStore\b/,
      /\bPrismaSessionRepository\b/,
      /\bPostgresSessionRepository\b/,
      /\bdocument\.cookie\b/,
      /\bAuthorization\b/,
      /\bEntitlement\b/,
    ];

    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(
          combined,
        ),
        false,
        `Forbidden Session source pattern exists: ${pattern}`,
      );
    }
  },
);
