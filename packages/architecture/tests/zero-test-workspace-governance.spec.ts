import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  computeSourceFingerprint,
  formatIssue,
  validateZeroTestWorkspaceGovernance,
} from "../../../tools/validate-zero-test-workspaces.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

type Exemption = {
  category: string;
  rationale: string;
  sourceFingerprint: string;
};

function createTemporaryRoot(): string {
  const rootDir = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      "zero-test-governance-",
    ),
  );

  fs.writeFileSync(
    path.join(rootDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        workspaces: [
          "apps/*",
          "packages/*",
        ],
      },
      null,
      2,
    ) + "\n",
  );

  fs.mkdirSync(
    path.join(rootDir, "architecture"),
    {
      recursive: true,
    },
  );

  return rootDir;
}

function createWorkspace(
  rootDir: string,
  workspacePath: string,
  options: {
    sourceFiles?: Record<string, string>;
    createSrc?: boolean;
    testFiles?: Record<string, string>;
  } = {},
): void {
  const workspaceDir = path.join(
    rootDir,
    workspacePath,
  );

  fs.mkdirSync(workspaceDir, {
    recursive: true,
  });

  fs.writeFileSync(
    path.join(workspaceDir, "package.json"),
    JSON.stringify(
      {
        name:
          `@test/${workspacePath.replace(/\//g, "-")}`,
        private: true,
      },
      null,
      2,
    ) + "\n",
  );

  if (options.createSrc !== false) {
    fs.mkdirSync(
      path.join(workspaceDir, "src"),
      {
        recursive: true,
      },
    );
  }

  for (
    const [relativePath, content]
    of Object.entries(
      options.sourceFiles ?? {},
    )
  ) {
    const targetPath = path.join(
      workspaceDir,
      "src",
      relativePath,
    );

    fs.mkdirSync(
      path.dirname(targetPath),
      {
        recursive: true,
      },
    );

    fs.writeFileSync(targetPath, content);
  }

  for (
    const [relativePath, content]
    of Object.entries(
      options.testFiles ?? {},
    )
  ) {
    const targetPath = path.join(
      workspaceDir,
      relativePath,
    );

    fs.mkdirSync(
      path.dirname(targetPath),
      {
        recursive: true,
      },
    );

    fs.writeFileSync(targetPath, content);
  }
}

function writePolicy(
  rootDir: string,
  exemptions: Record<
    string,
    Exemption | Record<string, unknown>
  >,
): string {
  const policyPath = path.join(
    rootDir,
    "architecture",
    "zero-test-workspace-policy.json",
  );

  fs.writeFileSync(
    policyPath,
    JSON.stringify(
      {
        version: 1,
        exemptions,
      },
      null,
      2,
    ) + "\n",
  );

  return policyPath;
}

function createValidExemption(
  rootDir: string,
  workspacePath: string,
  overrides: Partial<Exemption> = {},
): Exemption {
  return {
    category: "interface-only",
    rationale:
      "Reviewed zero-test workspace for focused governance testing.",
    sourceFingerprint:
      computeSourceFingerprint(
        rootDir,
        workspacePath,
      ),
    ...overrides,
  };
}

function validateTemporaryRoot(
  rootDir: string,
) {
  return validateZeroTestWorkspaceGovernance({
    rootDir,
    policyPath: path.join(
      rootDir,
      "architecture",
      "zero-test-workspace-policy.json",
    ),
  });
}

test(
  "1. accepts the real repository when every current zero-test exemption is valid",
  () => {
    const result =
      validateZeroTestWorkspaceGovernance({
        rootDir: REPOSITORY_ROOT,
      });

    assert.equal(result.passed, true);
    assert.equal(result.totalWorkspaces, 14);
    assert.equal(
      result.zeroTestWorkspaces.length,
      7,
    );
    assert.equal(result.validExemptions, 7);
    assert.deepEqual(result.issues, []);
  },
);

test(
  "2. rejects a newly discovered zero-test workspace with no exemption",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "apps/new-zero-test",
        {
          sourceFiles: {
            "main.ts":
              "export const value = 1;\n",
          },
        },
      );

      writePolicy(rootDir, {});

      const result =
        validateTemporaryRoot(rootDir);

      assert.equal(result.passed, false);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-001" &&
            issue.workspace ===
              "apps/new-zero-test",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "3. rejects an exemption for a nonexistent workspace",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/existing",
        {
          sourceFiles: {
            "index.ts":
              "export interface Example {}\n",
          },
        },
      );

      writePolicy(rootDir, {
        "packages/existing":
          createValidExemption(
            rootDir,
            "packages/existing",
          ),
        "packages/missing": {
          category: "interface-only",
          rationale:
            "This workspace does not actually exist.",
          sourceFingerprint:
            "0000000000000000000000000000000000000000000000000000000000000000",
        },
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-002" &&
            issue.workspace ===
              "packages/missing",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "4. rejects a stale exemption when a workspace gains a test",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "index.ts":
              "export const value = 1;\n",
          },
        },
      );

      const exemption =
        createValidExemption(
          rootDir,
          "packages/example",
        );

      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "index.ts":
              "export const value = 1;\n",
          },
          testFiles: {
            "tests/example.spec.ts":
              'import test from "node:test";\n',
          },
        },
      );

      writePolicy(rootDir, {
        "packages/example": exemption,
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-003" &&
            issue.workspace ===
              "packages/example",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "5. rejects an exemption with missing rationale",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "index.ts":
              "export interface Example {}\n",
          },
        },
      );

      writePolicy(rootDir, {
        "packages/example":
          createValidExemption(
            rootDir,
            "packages/example",
            {
              rationale: "",
            },
          ),
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-004" &&
            issue.workspace ===
              "packages/example",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "6. rejects an exemption with unsupported category",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "index.ts":
              "export interface Example {}\n",
          },
        },
      );

      writePolicy(rootDir, {
        "packages/example":
          createValidExemption(
            rootDir,
            "packages/example",
            {
              category:
                "unsupported-category",
            },
          ),
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-005" &&
            issue.workspace ===
              "packages/example",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "7. rejects source fingerprint mismatch after source content changes",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "index.ts":
              "export const value = 1;\n",
          },
        },
      );

      const exemption =
        createValidExemption(
          rootDir,
          "packages/example",
        );

      fs.writeFileSync(
        path.join(
          rootDir,
          "packages/example/src/index.ts",
        ),
        "export const value = 2;\n",
      );

      writePolicy(rootDir, {
        "packages/example": exemption,
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-006" &&
            issue.workspace ===
              "packages/example",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "8. rejects source fingerprint mismatch after source-file addition",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "index.ts":
              "export interface Example {}\n",
          },
        },
      );

      const exemption =
        createValidExemption(
          rootDir,
          "packages/example",
        );

      fs.writeFileSync(
        path.join(
          rootDir,
          "packages/example/src/additional.ts",
        ),
        "export interface Additional {}\n",
      );

      writePolicy(rootDir, {
        "packages/example": exemption,
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-006" &&
            issue.workspace ===
              "packages/example",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "9. rejects source fingerprint mismatch after source-file deletion",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/example",
        {
          sourceFiles: {
            "first.ts":
              "export interface First {}\n",
            "second.ts":
              "export interface Second {}\n",
          },
        },
      );

      const exemption =
        createValidExemption(
          rootDir,
          "packages/example",
        );

      fs.rmSync(
        path.join(
          rootDir,
          "packages/example/src/second.ts",
        ),
      );

      writePolicy(rootDir, {
        "packages/example": exemption,
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.ok(
        result.issues.some(
          (issue) =>
            issue.code === "ZT-006" &&
            issue.workspace ===
              "packages/example",
        ),
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "10. handles missing src deterministically",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/missing-src",
        {
          createSrc: false,
        },
      );

      const first =
        computeSourceFingerprint(
          rootDir,
          "packages/missing-src",
        );

      const second =
        computeSourceFingerprint(
          rootDir,
          "packages/missing-src",
        );

      assert.match(
        first,
        /^[a-f0-9]{64}$/,
      );

      assert.equal(first, second);

      writePolicy(rootDir, {
        "packages/missing-src":
          createValidExemption(
            rootDir,
            "packages/missing-src",
            {
              category:
                "empty-placeholder",
            },
          ),
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.equal(result.passed, true);
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "11. handles empty src deterministically",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "packages/missing-src",
        {
          createSrc: false,
        },
      );

      createWorkspace(
        rootDir,
        "packages/empty-src",
      );

      const missingFingerprint =
        computeSourceFingerprint(
          rootDir,
          "packages/missing-src",
        );

      const firstEmptyFingerprint =
        computeSourceFingerprint(
          rootDir,
          "packages/empty-src",
        );

      const secondEmptyFingerprint =
        computeSourceFingerprint(
          rootDir,
          "packages/empty-src",
        );

      assert.match(
        firstEmptyFingerprint,
        /^[a-f0-9]{64}$/,
      );

      assert.equal(
        firstEmptyFingerprint,
        secondEmptyFingerprint,
      );

      assert.notEqual(
        firstEmptyFingerprint,
        missingFingerprint,
      );

      writePolicy(rootDir, {
        "packages/missing-src":
          createValidExemption(
            rootDir,
            "packages/missing-src",
            {
              category:
                "empty-placeholder",
            },
          ),
        "packages/empty-src":
          createValidExemption(
            rootDir,
            "packages/empty-src",
            {
              category:
                "empty-placeholder",
            },
          ),
      });

      const result =
        validateTemporaryRoot(rootDir);

      assert.equal(result.passed, true);
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  "12. reports workspace path, reason, and remediation direction clearly",
  () => {
    const rootDir = createTemporaryRoot();

    try {
      createWorkspace(
        rootDir,
        "apps/unreviewed",
        {
          sourceFiles: {
            "main.ts":
              "export const value = 1;\n",
          },
        },
      );

      writePolicy(rootDir, {});

      const result =
        validateTemporaryRoot(rootDir);

      const issue =
        result.issues.find(
          (candidate) =>
            candidate.code === "ZT-001",
        );

      assert.ok(issue);

      assert.equal(
        issue.workspace,
        "apps/unreviewed",
      );

      assert.ok(
        issue.reason.trim().length > 0,
      );

      assert.ok(
        issue.remediation.trim().length > 0,
      );

      const formatted =
        formatIssue(issue);

      assert.match(
        formatted,
        /\[ZT-001\]/,
      );

      assert.match(
        formatted,
        /apps\/unreviewed/,
      );

      assert.match(
        formatted,
        /Reason:/,
      );

      assert.match(
        formatted,
        /Remediation:/,
      );
    } finally {
      fs.rmSync(rootDir, {
        recursive: true,
        force: true,
      });
    }
  },
);
