import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const locateRepositoryRoot = (): string => {
  let current = dirname(fileURLToPath(import.meta.url));

  while (true) {
    if (
      existsSync(join(current, "package-lock.json")) &&
      existsSync(
        join(
          current,
          ".github",
          "workflows",
          "architecture-validation.yml",
        ),
      )
    ) {
      return current;
    }

    const parent = dirname(current);

    assert.notEqual(
      parent,
      current,
      "Unable to locate repository root.",
    );

    current = parent;
  }
};

const repositoryRoot = locateRepositoryRoot();

const readRepositoryFile = (relativePath: string): string =>
  readFileSync(join(repositoryRoot, relativePath), "utf8");

const workflowPath =
  ".github/workflows/architecture-validation.yml";

const driverPath =
  "tools/ci/run-architecture-validation.sh";

const parityPath =
  "tools/ci/run-node24-parity.sh";

const testPath =
  "packages/architecture/tests/ci-reliability-boundary.spec.ts";

const workflow = readRepositoryFile(workflowPath);
const driver = readRepositoryFile(driverPath);
const parity = readRepositoryFile(parityPath);

test("CI reliability paths use their approved owners", () => {
  for (const path of [
    workflowPath,
    driverPath,
    parityPath,
    testPath,
  ]) {
    assert.equal(
      existsSync(join(repositoryRoot, path)),
      true,
      `Missing approved CI reliability path: ${path}`,
    );
  }
});

test("workflow preserves runner, actions and Node.js 24", () => {
  assert.match(workflow, /runs-on:\s*ubuntu-latest/u);
  assert.match(workflow, /uses:\s*actions\/checkout@v4/u);
  assert.match(workflow, /uses:\s*actions\/setup-node@v4/u);
  assert.match(workflow, /node-version:\s*["']?24\.x["']?/u);
});

test("workflow delegates exactly once to the canonical driver", () => {
  const matches =
    workflow.match(
      /run:\s*bash tools\/ci\/run-architecture-validation\.sh/gu,
    ) ?? [];

  assert.equal(matches.length, 1);
});

test("workflow contains no duplicate inline project commands", () => {
  assert.doesNotMatch(workflow, /run:\s*npm ci\s*$/gmu);
  assert.doesNotMatch(
    workflow,
    /run:\s*npm run validate:architecture\s*$/gmu,
  );
  assert.doesNotMatch(workflow, /run:\s*npm test\s*$/gmu);
});

test("canonical driver owns the approved command order", () => {
  const commands = [
    "npm ci",
    "npm run validate:architecture",
    "npm test",
  ];

  let previousIndex = -1;

  for (const command of commands) {
    const currentIndex = driver.indexOf(command);

    assert.ok(
      currentIndex > previousIndex,
      `Command order differs for ${command}.`,
    );

    previousIndex = currentIndex;
  }
});

test("canonical driver exposes command boundaries and failures", () => {
  assert.match(driver, /BEGIN STEP —/u);
  assert.match(driver, /END STEP —/u);
  assert.match(driver, /FAILED STEP —/u);
  assert.match(driver, /Exit code:/u);
  assert.match(driver, /return "\$STEP_STATUS"/u);
});

test("canonical driver does not suppress failures", () => {
  assert.doesNotMatch(driver, /continue-on-error/iu);
  assert.doesNotMatch(driver, /\|\|\s*true/iu);
  assert.doesNotMatch(driver, /\|\|\s*:/u);
  assert.doesNotMatch(driver, /exit\s+0\b/u);
});

test("canonical driver uses an allowlisted environment summary", () => {
  assert.match(driver, /RUNNER_OS/u);
  assert.match(driver, /RUNNER_ARCH/u);
  assert.match(driver, /npm config get cache/u);
  assert.doesNotMatch(driver, /^\s*env\s*$/gmu);
  assert.doesNotMatch(driver, /\bprintenv\b/u);
});

test("parity harness requests Node.js 24 and npm 11", () => {
  assert.match(parity, /--package=node@24/u);
  assert.match(parity, /--package=npm@11/u);
  assert.match(parity, /\^v24\\\./u);
  assert.match(parity, /\^11\\\./u);
});

test("parity harness requires exactly three clean runs", () => {
  assert.match(parity, /TOTAL_RUNS="3"/u);
  assert.match(parity, /while \[ "\$RUN_NUMBER" -le "\$TOTAL_RUNS" \]/u);
});

test("parity runs use unique snapshots and npm caches", () => {
  assert.match(parity, /mktemp -d/u);
  assert.match(parity, /noor-node24-parity-/u);
  assert.match(parity, /noor-node24-cache-/u);
  assert.match(parity, /NPM_CONFIG_CACHE/u);
});

test("parity snapshots use git archive and approved overlays", () => {
  assert.match(parity, /git archive "\$CANDIDATE_COMMIT"/u);
  assert.match(parity, /OVERLAY_MANIFEST/u);
  assert.match(
    parity,
    /packages\/architecture\/tests\/ci-reliability-boundary\.spec\.ts/u,
  );
});

test("parity evidence uses tmp logs, tee and VS Code", () => {
  assert.match(parity, /\/tmp\/noor-node24-parity-/u);
  assert.match(parity, /\btee "\$RUN_LOG"/u);
  assert.match(parity, /command -v code/u);
});

test("CI scripts contain no Git history or remote mutation commands", () => {
  const combined = `${driver}\n${parity}`;

  assert.doesNotMatch(
    combined,
    /\bgit\s+(add|commit|push|reset|checkout|switch|update-ref)\b/u,
  );

  assert.doesNotMatch(
    combined,
    /\bgit\s+tag\b/u,
  );

  assert.doesNotMatch(
    combined,
    /\bgit\s+branch\s+-D\b/u,
  );
});

test("CI scripts avoid Bash 4-only constructs and preserve tag identities", () => {
  const combined = `${driver}\n${parity}`;

  assert.doesNotMatch(combined, /\bdeclare\s+-A\b/u);
  assert.doesNotMatch(combined, /\bmapfile\b/u);
  assert.doesNotMatch(combined, /\breadarray\b/u);
  assert.doesNotMatch(combined, /\$\{[^}]+,,\}/u);
  assert.doesNotMatch(combined, /\$\{[^}]+\^\^\}/u);

  assert.match(
    parity,
    /platform-user-context-foundation-v1\.0\.0/u,
  );

  assert.match(
    parity,
    /platform-user-context-foundation-ci-reliability-fix-v1\.0\.0/u,
  );
});
