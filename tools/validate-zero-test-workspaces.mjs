import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SUPPORTED_CATEGORIES = Object.freeze([
  "compile-time-contract-only",
  "empty-placeholder",
  "interface-only",
  "minimal-bootstrap",
  "pre-implementation-placeholder",
]);

export const ISSUE_CODES = Object.freeze({
  UNREVIEWED_ZERO_TEST_WORKSPACE: "ZT-001",
  NONEXISTENT_WORKSPACE_EXEMPTION: "ZT-002",
  STALE_EXEMPTION_WITH_TESTS: "ZT-003",
  MISSING_RATIONALE: "ZT-004",
  UNSUPPORTED_CATEGORY: "ZT-005",
  SOURCE_FINGERPRINT_MISMATCH: "ZT-006",
  MALFORMED_POLICY: "ZT-007",
});

const IGNORED_DIRECTORIES = new Set([
  ".git",
  "coverage",
  "dist",
  "node_modules",
]);

const TEST_FILE_PATTERN =
  /(?:^|[.-])(test|spec)\.(?:c|m)?(?:js|ts)x?$/i;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globPatternToRegExp(pattern) {
  const normalized = normalizeRelativePath(pattern);
  const segments = normalized.split("/");

  const regexSegments = segments.map((segment) => {
    if (segment === "**") {
      return ".*";
    }

    if (segment === "*") {
      return "[^/]+";
    }

    return escapeRegExp(segment);
  });

  return new RegExp(`^${regexSegments.join("/")}$`);
}

function collectWorkspaceDirectories(rootDir) {
  const result = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(currentDir, entry.name);

      const relativePath = normalizeRelativePath(
        path.relative(rootDir, absolutePath),
      );

      if (fs.existsSync(path.join(absolutePath, "package.json"))) {
        result.push(relativePath);
      }

      walk(absolutePath);
    }
  }

  walk(rootDir);

  return result.sort();
}

export function discoverWorkspaces(rootDir) {
  const rootPackagePath = path.join(rootDir, "package.json");

  if (!fs.existsSync(rootPackagePath)) {
    throw new Error(
      `Root package.json not found: ${rootPackagePath}`,
    );
  }

  const rootPackage = readJsonFile(rootPackagePath);

  const workspacePatterns = Array.isArray(rootPackage.workspaces)
    ? rootPackage.workspaces
    : Array.isArray(rootPackage.workspaces?.packages)
      ? rootPackage.workspaces.packages
      : [];

  if (workspacePatterns.length === 0) {
    return [];
  }

  const matchers = workspacePatterns.map(globPatternToRegExp);

  return collectWorkspaceDirectories(rootDir).filter(
    (workspacePath) =>
      matchers.some((matcher) => matcher.test(workspacePath)),
  );
}

function collectRegularFiles(rootDir, currentDir, result) {
  const entries = fs.readdirSync(currentDir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.name === ".gitkeep") {
      continue;
    }

    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      collectRegularFiles(rootDir, absolutePath, result);
      continue;
    }

    if (entry.isFile()) {
      result.push({
        absolutePath,
        relativePath: normalizeRelativePath(
          path.relative(rootDir, absolutePath),
        ),
      });
    }
  }
}

export function computeSourceFingerprint(
  rootDir,
  workspacePath,
) {
  const sourceDir = path.join(
    rootDir,
    workspacePath,
    "src",
  );

  if (!fs.existsSync(sourceDir)) {
    return sha256("<missing-src>\n");
  }

  const files = [];

  collectRegularFiles(rootDir, sourceDir, files);

  files.sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath),
  );

  if (files.length === 0) {
    return sha256("<empty-src>\n");
  }

  const aggregatePayload =
    files
      .map(({ absolutePath, relativePath }) => {
        const fileHash = sha256(
          fs.readFileSync(absolutePath),
        );

        return `${relativePath}\t${fileHash}`;
      })
      .join("\n") + "\n";

  return sha256(aggregatePayload);
}

export function workspaceHasTests(rootDir, workspacePath) {
  const workspaceDir = path.join(rootDir, workspacePath);

  if (!fs.existsSync(workspaceDir)) {
    return false;
  }

  const files = [];

  collectRegularFiles(rootDir, workspaceDir, files);

  return files.some(({ relativePath }) => {
    const normalized =
      normalizeRelativePath(relativePath);

    const basename = path.posix.basename(normalized);

    return TEST_FILE_PATTERN.test(basename);
  });
}

function createIssue(
  code,
  workspace,
  reason,
  remediation,
) {
  return {
    code,
    workspace,
    reason,
    remediation,
  };
}

function validatePolicyShape(policy) {
  if (
    !policy ||
    typeof policy !== "object" ||
    Array.isArray(policy) ||
    policy.version !== 1 ||
    !policy.exemptions ||
    typeof policy.exemptions !== "object" ||
    Array.isArray(policy.exemptions)
  ) {
    return false;
  }

  return true;
}

function isValidFingerprint(value) {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{64}$/.test(value)
  );
}

export function validateZeroTestWorkspaceGovernance({
  rootDir,
  policyPath = path.join(
    rootDir,
    "architecture",
    "zero-test-workspace-policy.json",
  ),
}) {
  const workspaces = discoverWorkspaces(rootDir);

  let policy;

  try {
    policy = readJsonFile(policyPath);
  } catch (error) {
    return {
      passed: false,
      totalWorkspaces: workspaces.length,
      zeroTestWorkspaces: [],
      validExemptions: 0,
      issues: [
        createIssue(
          ISSUE_CODES.MALFORMED_POLICY,
          "<policy>",
          `Unable to read or parse policy: ${error.message}`,
          "Repair architecture/zero-test-workspace-policy.json so it contains valid JSON and the required governance structure.",
        ),
      ],
    };
  }

  if (!validatePolicyShape(policy)) {
    return {
      passed: false,
      totalWorkspaces: workspaces.length,
      zeroTestWorkspaces: [],
      validExemptions: 0,
      issues: [
        createIssue(
          ISSUE_CODES.MALFORMED_POLICY,
          "<policy>",
          "The policy does not match the required version 1 structure.",
          "Provide version 1 and an exemptions object keyed by workspace path.",
        ),
      ],
    };
  }

  const zeroTestWorkspaces = workspaces.filter(
    (workspacePath) =>
      !workspaceHasTests(rootDir, workspacePath),
  );

  const workspaceSet = new Set(workspaces);

  const zeroTestWorkspaceSet = new Set(
    zeroTestWorkspaces,
  );

  const exemptions = policy.exemptions;
  const issues = [];

  const invalidExemptionWorkspaces = new Set();

  for (const workspacePath of zeroTestWorkspaces) {
    if (
      !Object.prototype.hasOwnProperty.call(
        exemptions,
        workspacePath,
      )
    ) {
      issues.push(
        createIssue(
          ISSUE_CODES.UNREVIEWED_ZERO_TEST_WORKSPACE,
          workspacePath,
          "The workspace contains no discovered test files and has no reviewed exemption.",
          "Add meaningful tests or add a reviewed policy exemption with category, rationale, and current source fingerprint.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);
    }
  }

  for (
    const [workspacePath, exemption]
    of Object.entries(exemptions)
  ) {
    if (!workspaceSet.has(workspacePath)) {
      issues.push(
        createIssue(
          ISSUE_CODES.NONEXISTENT_WORKSPACE_EXEMPTION,
          workspacePath,
          "The exemption references a workspace that does not exist in the repository workspace set.",
          "Remove the stale exemption or restore the referenced workspace if it is still intended to exist.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);

      continue;
    }

    if (!zeroTestWorkspaceSet.has(workspacePath)) {
      issues.push(
        createIssue(
          ISSUE_CODES.STALE_EXEMPTION_WITH_TESTS,
          workspacePath,
          "The workspace now contains discovered test files, so its zero-test exemption is stale.",
          "Remove the exemption because the workspace is now protected by tests.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);
    }

    if (
      !exemption ||
      typeof exemption !== "object" ||
      Array.isArray(exemption)
    ) {
      issues.push(
        createIssue(
          ISSUE_CODES.MALFORMED_POLICY,
          workspacePath,
          "The exemption entry is not a valid object.",
          "Replace the entry with an object containing category, rationale, and sourceFingerprint.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);

      continue;
    }

    if (
      typeof exemption.rationale !== "string" ||
      exemption.rationale.trim().length === 0
    ) {
      issues.push(
        createIssue(
          ISSUE_CODES.MISSING_RATIONALE,
          workspacePath,
          "The exemption rationale is missing or empty.",
          "Add a specific reviewed rationale explaining why zero tests are currently intentional.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);
    }

    if (
      !SUPPORTED_CATEGORIES.includes(
        exemption.category,
      )
    ) {
      issues.push(
        createIssue(
          ISSUE_CODES.UNSUPPORTED_CATEGORY,
          workspacePath,
          `Unsupported exemption category: ${String(exemption.category)}`,
          `Use one of the supported categories: ${SUPPORTED_CATEGORIES.join(", ")}.`,
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);
    }

    if (
      !isValidFingerprint(
        exemption.sourceFingerprint,
      )
    ) {
      issues.push(
        createIssue(
          ISSUE_CODES.MALFORMED_POLICY,
          workspacePath,
          "The sourceFingerprint must be a lowercase 64-character SHA-256 hexadecimal value.",
          "Recompute the workspace source fingerprint and store the valid lowercase SHA-256 value.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);

      continue;
    }

    const actualFingerprint =
      computeSourceFingerprint(
        rootDir,
        workspacePath,
      );

    if (
      actualFingerprint !==
      exemption.sourceFingerprint
    ) {
      issues.push(
        createIssue(
          ISSUE_CODES.SOURCE_FINGERPRINT_MISMATCH,
          workspacePath,
          `Reviewed fingerprint ${exemption.sourceFingerprint} does not match current source fingerprint ${actualFingerprint}.`,
          "Review the workspace source change, add meaningful tests if behavior now exists, or update the exemption fingerprint only after intentional review.",
        ),
      );

      invalidExemptionWorkspaces.add(workspacePath);
    }
  }

  const validExemptions =
    zeroTestWorkspaces.filter(
      (workspacePath) =>
        Object.prototype.hasOwnProperty.call(
          exemptions,
          workspacePath,
        ) &&
        !invalidExemptionWorkspaces.has(
          workspacePath,
        ),
    ).length;

  return {
    passed: issues.length === 0,
    totalWorkspaces: workspaces.length,
    zeroTestWorkspaces,
    validExemptions,
    issues,
  };
}

export function formatIssue(issue) {
  return [
    `[${issue.code}] ${issue.workspace}`,
    `Reason: ${issue.reason}`,
    `Remediation: ${issue.remediation}`,
  ].join("\n");
}

export function formatValidationResult(result) {
  const lines = [
    "Zero-Test Workspace Governance Validation",
    `Total workspaces: ${result.totalWorkspaces}`,
    `Zero-test workspaces: ${result.zeroTestWorkspaces.length}`,
    `Valid exemptions: ${result.validExemptions}`,
    `Governance issues: ${result.issues.length}`,
  ];

  if (result.issues.length > 0) {
    lines.push("");

    for (const issue of result.issues) {
      lines.push(formatIssue(issue));
      lines.push("");
    }
  }

  lines.push(
    result.passed
      ? "Zero-test workspace governance: PASS"
      : "Zero-test workspace governance: FAIL",
  );

  return lines.join("\n");
}

function runCli() {
  const rootDir = process.cwd();

  const result =
    validateZeroTestWorkspaceGovernance({
      rootDir,
    });

  console.log(formatValidationResult(result));

  if (!result.passed) {
    process.exitCode = 1;
  }
}

const currentFilePath =
  fileURLToPath(import.meta.url);

const invokedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : "";

if (invokedPath === currentFilePath) {
  runCli();
}
