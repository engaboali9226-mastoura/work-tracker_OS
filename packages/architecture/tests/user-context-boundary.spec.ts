import {
  equal,
  match,
  ok,
} from "node:assert/strict";

import {
  existsSync,
  readFileSync,
} from "node:fs";

import {
  dirname,
  resolve,
} from "node:path";

import test from "node:test";

function findRepositoryRoot(
  start: string,
): string {
  let current = start;

  for (let depth = 0; depth < 10; depth += 1) {
    if (
      existsSync(
        resolve(
          current,
          "packages/application/package.json",
        ),
      )
    ) {
      return current;
    }

    const parent =
      dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  throw new Error(
    "Unable to locate repository root.",
  );
}

const repositoryRoot =
  findRepositoryRoot(process.cwd());

const contextDirectory =
  resolve(
    repositoryRoot,
    "packages/application/src/context",
  );

const contextFiles = [
  "user-context.ts",
  "user-context-provider.ts",
  "user-context-resolver.ts",
  "user-context.errors.ts",
  "index.ts",
];

test("application owns transport-independent User Context contracts", () => {
  for (const file of contextFiles) {
    const absolute =
      resolve(contextDirectory, file);

    ok(
      existsSync(absolute),
      `Missing User Context file: ${file}`,
    );

    const content =
      readFileSync(absolute, "utf8");

    equal(
      /from\s+["'][^"']*(express|fastify|koa|node:http|packages\/runtime)[^"']*["']/.test(
        content,
      ),
      false,
      `${file} imports a prohibited transport or runtime dependency.`,
    );
  }
});

test("application public exports include User Context", () => {
  const applicationIndex =
    readFileSync(
      resolve(
        repositoryRoot,
        "packages/application/src/index.ts",
      ),
      "utf8",
    );

  match(
    applicationIndex,
    /export\s+\*\s+from\s+["']\.\/context\/index(?:\.js)?["']/,
  );
});

test("runtime test does not create an undeclared application dependency", () => {
  const runtimeTest =
    readFileSync(
      resolve(
        repositoryRoot,
        "packages/runtime/tests/user-context-propagation.spec.ts",
      ),
      "utf8",
    );

  equal(
    /from\s+["']@worktracker\/application["']/.test(
      runtimeTest,
    ),
    false,
  );

  equal(
    /from\s+["'][^"']*packages\/application[^"']*["']/.test(
      runtimeTest,
    ),
    false,
  );
});

test("User Context does not duplicate authentication or policy engines", () => {
  const combined =
    contextFiles
      .map(
        file =>
          readFileSync(
            resolve(
              contextDirectory,
              file,
            ),
            "utf8",
          ),
      )
      .join("\n");

  equal(
    /verifyPassword|validatePassword|decodeJwt|signJwt|refreshToken\s*\(/.test(
      combined,
    ),
    false,
  );

  equal(
    /calculateEntitlements|evaluatePolicy|expandRoles|grantPermission\s*\(/.test(
      combined,
    ),
    false,
  );
});
