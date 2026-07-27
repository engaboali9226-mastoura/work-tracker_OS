import assert from "node:assert/strict";
import {
  CANDIDATE_IDS,
  EXECUTION_PHASES,
  FAILURE_CODES,
  EvaluatorFoundationError,
  assertCandidateExecutionAuthorized,
  assertContainedResolvedPath,
  assertFoundationImplementationAuthorized,
  assertNoProtectedPathExposure,
  canonicalJson,
  createFoundationOnlyAuthorization,
  orderArtifacts,
  orderFailureEvidence,
  sanitizeEnvironment,
  validateEvidenceManifest,
  validateRunIntent,
} from "../dist/index.js";

const hash = "a".repeat(64);
const authorization = createFoundationOnlyAuthorization();

assertFoundationImplementationAuthorized(authorization);
assert.equal(authorization.candidateExecution, false);

assert.throws(
  () => assertCandidateExecutionAuthorized(authorization),
  (error) =>
    error instanceof EvaluatorFoundationError &&
    error.code === "AUTHORIZATION_MISSING",
);

assert.deepEqual(CANDIDATE_IDS, ["C-01", "C-02", "C-03", "C-04"]);
assert.equal(EXECUTION_PHASES.length, 10);
assert.equal(FAILURE_CODES.length, 18);
assert.equal(FAILURE_CODES.at(-1), "EVIDENCE_INCOMPLETE");

validateRunIntent({
  runId: "run-0001",
  candidateId: "C-01",
  fixtureId: "riyadh-2026-01-01",
  requirementsHash: hash,
  designHash: hash,
  protocolHash: hash,
  createdAt: "2026-07-25T16:00:00+03:00",
});

const environment = sanitizeEnvironment(
  {
    LANG: "C.UTF-8",
    TZ: "Asia/Riyadh",
    HOME: "/Users/example",
    API_TOKEN: "secret",
    HTTPS_PROXY: "http://proxy.invalid",
  },
  ["LANG", "TZ"],
);

assert.deepEqual(environment.effective, {
  LANG: "C.UTF-8",
  TZ: "Asia/Riyadh",
});

assert.deepEqual(environment.removedKeys, [
  "API_TOKEN",
  "HOME",
  "HTTPS_PROXY",
]);

assertContainedResolvedPath(
  "/tmp/noor-run",
  "/tmp/noor-run/output/result.json",
);

assert.throws(
  () =>
    assertContainedResolvedPath(
      "/tmp/noor-run",
      "/tmp/escape/result.json",
    ),
  (error) =>
    error instanceof EvaluatorFoundationError &&
    error.code === "FILESYSTEM_ESCAPE_ATTEMPT",
);

assert.throws(
  () =>
    assertNoProtectedPathExposure(
      ["working=/repo/noor-personal"],
      ["/repo/noor-personal"],
    ),
  (error) =>
    error instanceof EvaluatorFoundationError &&
    error.code === "SCOPE_VIOLATION",
);

assert.equal(
  canonicalJson({ z: 1, a: { y: 2, x: 3 } }),
  '{"a":{"x":3,"y":2},"z":1}',
);

assert.deepEqual(
  orderFailureEvidence([
    "EVIDENCE_INCOMPLETE",
    "AUTHORIZATION_MISSING",
    "AUTHORIZATION_MISSING",
  ]),
  ["AUTHORIZATION_MISSING", "EVIDENCE_INCOMPLETE"],
);

assert.deepEqual(
  orderArtifacts([
    {
      channel: "stdout",
      relativePath: "z.log",
      sha256: hash,
      bytes: 1,
    },
    {
      channel: "stderr",
      relativePath: "a.log",
      sha256: hash,
      bytes: 2,
    },
  ]).map((artifact) => artifact.channel),
  ["stderr", "stdout"],
);

validateEvidenceManifest({
  schemaVersion: "1",
  runIntent: {
    runId: "run-0001",
    candidateId: "C-01",
    fixtureId: "riyadh-2026-01-01",
    requirementsHash: hash,
    designHash: hash,
    protocolHash: hash,
    createdAt: "2026-07-25T16:00:00+03:00",
  },
  phase: "P-09_RESULT_SEALING",
  primaryFailure: null,
  secondaryFailures: [],
  limits: {
    initializationTimeoutMs: 1000,
    calculationTimeoutMs: 1000,
    stdoutBytes: 1024,
    stderrBytes: 1024,
    resultBytes: 4096,
    generatedFileCount: 4,
    generatedFileBytes: 8192,
  },
  artifacts: [
    {
      channel: "native-result",
      relativePath: "raw/result.json",
      sha256: hash,
      bytes: 128,
    },
  ],
  controllerTimestamp: "2026-07-25T16:00:01+03:00",
  repositoryMutation: false,
  candidateInstallation: false,
  candidateExecution: false,
  candidateSelection: false,
  dependencySelection: false,
  productionAdapterImplementation: false,
  commit: false,
  tag: false,
  push: false,
});

assert.throws(
  () => canonicalJson({ recommendation: "C-01" }),
  (error) =>
    error instanceof EvaluatorFoundationError &&
    error.code === "SCOPE_VIOLATION",
);

console.log("NOOR_STEP_017_FOUNDATION_TESTS_PASS");
