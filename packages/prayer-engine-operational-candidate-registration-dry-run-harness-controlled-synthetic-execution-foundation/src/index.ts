export const CONTROLLED_EXECUTION_DESIGN_DOMAINS = [
  "Controlled Execution Authorization and Purpose",
  "Authorized Synthetic Bundle Admission",
  "Scenario Catalog Freeze",
  "Fixture and Oracle Integrity",
  "Synthetic Executor Invocation Boundary",
  "Isolated Workspace Lifecycle",
  "Deterministic Clock Seed and Repetition",
  "Resource and Time Budget Enforcement",
  "Deterministic Invocation Ordering",
  "In-Memory Scenario Execution",
  "Per-Repetition Result Capture",
  "Oracle Evaluation and Quarantine",
  "Aggregate Result Construction",
  "Transient Seal and Replay Verification",
  "Cleanup and Leak Detection",
  "Independent Review and Decision Projection",
  "Expiry Revocation and Revalidation",
  "Repository Non-Mutation and Publication Boundary",
] as const;

export const CONTROLLED_EXECUTION_PHASES = [
  "CSX-01_AUTHORITY_AND_PURPOSE_VERIFICATION",
  "CSX-02_CONTROLLED_EXECUTION_REQUEST_ADMISSION",
  "CSX-03_SYNTHETIC_BUNDLE_SEAL_VERIFICATION",
  "CSX-04_SCENARIO_CATALOG_FREEZE",
  "CSX-05_FIXTURE_AND_ORACLE_INTEGRITY_VERIFICATION",
  "CSX-06_EXECUTOR_BINDING_AND_CAPABILITY_RESTRICTION",
  "CSX-07_ISOLATED_WORKSPACE_CREATION_PROJECTION",
  "CSX-08_CLOCK_SEED_AND_REPETITION_FREEZE",
  "CSX-09_RESOURCE_BUDGET_ADMISSION",
  "CSX-10_DETERMINISTIC_INVOCATION_ORDERING",
  "CSX-11_CONTROLLED_SCENARIO_INVOCATION",
  "CSX-12_PER_REPETITION_CAPTURE",
  "CSX-13_ORACLE_EVALUATION",
  "CSX-14_FAILURE_OR_QUARANTINE_PROJECTION",
  "CSX-15_AGGREGATE_RESULT_CONSTRUCTION",
  "CSX-16_TRANSIENT_SEAL_VERIFICATION",
  "CSX-17_CLEANUP_AND_LEAK_VERIFICATION",
  "CSX-18_REPLAY_AGREEMENT_VERIFICATION",
  "CSX-19_INDEPENDENT_REVIEW_DECISION_PROJECTION",
  "CSX-20_EXPIRY_REVOCATION_AND_REVALIDATION",
] as const;

export const CONTROLLED_EXECUTION_GATES = [
  "CG-01", "CG-02", "CG-03", "CG-04", "CG-05", "CG-06",
  "CG-07", "CG-08", "CG-09", "CG-10", "CG-11", "CG-12",
  "CG-13", "CG-14", "CG-15", "CG-16", "CG-17", "CG-18",
] as const;

export const CONTROLLED_EXECUTION_OUTCOMES = [
  "CONTROLLED_EXECUTION_REQUEST_REJECTED",
  "SYNTHETIC_BUNDLE_REJECTED",
  "SCENARIO_QUARANTINED",
  "CONTROLLED_EXECUTION_PASS_PROJECTED",
  "CONTROLLED_EXECUTION_FAIL_PROJECTED",
  "BUDGET_EXCEEDED_PROJECTED",
  "CLEANUP_FAILED_PROJECTED",
  "REPLAY_MISMATCH_PROJECTED",
  "REVALIDATION_REQUIRED",
] as const;

export const CONTROLLED_EXECUTION_FAILURE_CODES = [
  "AUTHORIZATION_MISSING",
  "PURPOSE_INVALID",
  "REQUEST_ID_INVALID",
  "REQUESTER_ID_INVALID",
  "EXECUTOR_OWNER_ID_INVALID",
  "REVIEWER_ID_INVALID",
  "IDENTITY_CONFLICT",
  "AUTHORIZATION_EXPIRED",
  "DRY_RUN_ONLY_REQUIRED",
  "FOUNDATION_SEAL_MISMATCH",
  "BUNDLE_ID_INVALID",
  "BUNDLE_REVISION_INVALID",
  "BUNDLE_SEAL_MISMATCH",
  "BUNDLE_EXPIRED",
  "BUNDLE_NOT_SYNTHETIC_ONLY",
  "CATALOG_NOT_FROZEN",
  "SCENARIO_CATALOG_EMPTY",
  "SCENARIO_ID_INVALID",
  "SCENARIO_DUPLICATE",
  "SCENARIO_ORDER_INVALID",
  "FIXTURE_ID_INVALID",
  "FIXTURE_DUPLICATE",
  "ORACLE_ID_INVALID",
  "ORACLE_DUPLICATE",
  "ORACLE_INCOMPLETE",
  "REAL_CANDIDATE_INPUT_FORBIDDEN",
  "REAL_PROVIDER_INPUT_FORBIDDEN",
  "PRODUCTION_INPUT_FORBIDDEN",
  "EXECUTOR_ID_INVALID",
  "EXECUTOR_SEAL_MISMATCH",
  "EXECUTOR_CAPABILITY_VIOLATION",
  "WORKSPACE_ID_INVALID",
  "WORKSPACE_NOT_ISOLATED",
  "WORKSPACE_NOT_EPHEMERAL",
  "WORKSPACE_ALLOWLIST_INVALID",
  "CLOCK_INVALID",
  "SEED_INVALID",
  "REPETITION_BUDGET_INVALID",
  "SCENARIO_TIME_BUDGET_INVALID",
  "TOTAL_TIME_BUDGET_INVALID",
  "MEMORY_BUDGET_INVALID",
  "RESULT_SIZE_BUDGET_INVALID",
  "EXECUTOR_RESULT_INVALID",
  "NON_DETERMINISTIC_RESULT",
  "ORACLE_MISMATCH",
  "OPERATIONAL_EFFECT_DETECTED",
  "CLEANUP_NOT_VERIFIED",
  "LEAK_DETECTED",
  "TRANSIENT_SEAL_INVALID",
  "REPLAY_MISMATCH",
  "REPOSITORY_MUTATION_DETECTED",
  "PERSISTENCE_FORBIDDEN",
  "NETWORK_ACCESS_FORBIDDEN",
  "PROCESS_EXECUTION_FORBIDDEN",
  "CANDIDATE_EXECUTION_FORBIDDEN",
  "ADAPTER_EXECUTION_FORBIDDEN",
  "CANONICALIZATION_FAILURE",
] as const;

export type ControlledExecutionOutcome = (typeof CONTROLLED_EXECUTION_OUTCOMES)[number];
export type ControlledExecutionFailureCode = (typeof CONTROLLED_EXECUTION_FAILURE_CODES)[number];

export interface ControlledExecutionAuthorization {
  requestId: string;
  requesterId: string;
  executorOwnerId: string;
  reviewerId: string;
  authorized: true;
  purpose: "CONTROLLED_SYNTHETIC_EXECUTION_FOUNDATION";
  dryRunOnly: true;
  issuedAt: string;
  expiresAt: string;
  expectedFoundationSeal: string;
}

export interface ControlledScenarioOracle {
  oracleId: string;
  expectedOutcome: string;
  expectedErrorCode: string | null;
  expectedFailedGates: readonly string[];
  expectedFindings: readonly string[];
  requireOperationalEffectFalse: true;
}

export interface ControlledSyntheticScenario {
  scenarioId: string;
  fixtureId: string;
  oracle: ControlledScenarioOracle;
  order: number;
  repeat: number;
  clock: string;
  seed: number;
  fixture: Readonly<Record<string, unknown>>;
  realCandidateInput: false;
  realProviderInput: false;
  productionInput: false;
}

export interface ControlledSyntheticBundle {
  bundleId: string;
  revisionId: string;
  syntheticOnly: true;
  catalogFrozen: true;
  scenarios: readonly ControlledSyntheticScenario[];
  contentSeal: string;
  expiresAt: string;
}

export interface RestrictedExecutorBinding {
  executorId: string;
  executorSeal: string;
  expectedExecutorSeal: string;
  capability: "PURE_IN_MEMORY_SYNTHETIC_EXECUTION";
  networkAllowed: false;
  processExecutionAllowed: false;
  persistenceAllowed: false;
  candidateExecutionAllowed: false;
  adapterExecutionAllowed: false;
}

export interface ControlledExecutionWorkspace {
  workspaceId: string;
  isolated: true;
  ephemeral: true;
  cleanupRequired: true;
  cleanupVerified: boolean;
  leaksDetected: readonly string[];
  allowlistedInputs: readonly string[];
  allowlistedOutputs: readonly string[];
}

export interface ControlledExecutionBudgets {
  maxScenarios: number;
  maxRepeat: number;
  maxScenarioMillis: number;
  maxTotalMillis: number;
  maxMemoryBytes: number;
  maxResultBytes: number;
}

export interface ControlledExecutorContext {
  clock: string;
  seed: number;
  repetition: number;
  workspaceId: string;
}

export interface ControlledExecutorResult {
  outcome: string;
  errorCode: string | null;
  failedGates: readonly string[];
  findings: readonly string[];
  operationalEffect: false;
  payload: Readonly<Record<string, unknown>>;
}

export type ControlledSyntheticExecutor = (
  scenario: ControlledSyntheticScenario,
  context: ControlledExecutorContext,
) => ControlledExecutorResult;

export interface ControlledRepetitionCapture {
  scenarioId: string;
  repetition: number;
  outcome: string;
  errorCode: string | null;
  failedGates: readonly string[];
  findings: readonly string[];
  operationalEffect: false;
  payload: Readonly<Record<string, unknown>>;
  canonicalCapture: string;
  transientSeal: string;
}

export interface ControlledScenarioResult {
  scenarioId: string;
  status: "PASS" | "QUARANTINED";
  oracleFailures: readonly string[];
  captures: readonly ControlledRepetitionCapture[];
  deterministic: boolean;
}

export interface ControlledExecutionResult {
  requestId: string;
  bundleId: string;
  bundleRevisionId: string;
  status: "PASS" | "FAIL";
  outcome: ControlledExecutionOutcome;
  scenarioOrder: readonly string[];
  scenarioResults: readonly ControlledScenarioResult[];
  controlledSyntheticScenariosExecuted: number;
  controlledSyntheticInvocationsExecuted: number;
  operationalHarnessScenariosExecuted: 0;
  executableBundleCreated: false;
  persisted: false;
  operationalEffect: false;
  cleanupVerified: boolean;
  canonicalResult: string;
  transientSeal: string;
}

export interface ControlledExecutionInput {
  authorization: ControlledExecutionAuthorization;
  foundationSeal: string;
  bundle: ControlledSyntheticBundle;
  expectedBundleSeal: string;
  executorBinding: RestrictedExecutorBinding;
  workspace: ControlledExecutionWorkspace;
  budgets: ControlledExecutionBudgets;
  repositoryFingerprintBefore: string;
  repositoryFingerprintAfter: string;
  now: string;
  persistenceRequested?: boolean;
  networkRequested?: boolean;
  processExecutionRequested?: boolean;
  candidateExecutionRequested?: boolean;
  adapterExecutionRequested?: boolean;
}

export interface ControlledReplayResult {
  matches: boolean;
  outcome: "CONTROLLED_EXECUTION_PASS_PROJECTED" | "REPLAY_MISMATCH_PROJECTED";
  operationalEffect: false;
  canonicalReplay: string;
  transientSeal: string;
}

export class ControlledSyntheticExecutionFoundationError extends Error {
  readonly code: ControlledExecutionFailureCode;

  constructor(code: ControlledExecutionFailureCode, message: string) {
    super(message);
    this.name = "ControlledSyntheticExecutionFoundationError";
    this.code = code;
  }
}

const ID = /^[A-Za-z][A-Za-z0-9._:-]{2,127}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function fail(code: ControlledExecutionFailureCode, message: string): never {
  throw new ControlledSyntheticExecutionFoundationError(code, message);
}

function parseTime(value: string, code: ControlledExecutionFailureCode): number {
  if (!ISO.test(value)) {
    fail(code, "Invalid UTC timestamp.");
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    fail(code, "Invalid UTC timestamp.");
  }

  return parsed;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stable);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      output[key] = stable((value as Record<string, unknown>)[key]);
    }

    return output;
  }

  return value;
}

export function canonicalizeControlledExecutionValue(value: unknown): string {
  try {
    return JSON.stringify(stable(value));
  } catch {
    fail("CANONICALIZATION_FAILURE", "Controlled execution canonicalization failed.");
  }
}

export function transientControlledExecutionSeal(canonical: string): string {
  let hash = BigInt("14695981039346656037");
  const prime = BigInt("1099511628211");

  for (const byte of new TextEncoder().encode(canonical)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }

  return "FNV1A64:" + hash.toString(16).padStart(16, "0");
}

export function validateControlledExecutionAuthorization(
  authorization: ControlledExecutionAuthorization,
  foundationSeal: string,
  now: string,
): void {
  if (!ID.test(authorization.requestId)) {
    fail("REQUEST_ID_INVALID", "Invalid request identity.");
  }

  if (!ID.test(authorization.requesterId)) {
    fail("REQUESTER_ID_INVALID", "Invalid requester identity.");
  }

  if (!ID.test(authorization.executorOwnerId)) {
    fail("EXECUTOR_OWNER_ID_INVALID", "Invalid executor owner identity.");
  }

  if (!ID.test(authorization.reviewerId)) {
    fail("REVIEWER_ID_INVALID", "Invalid reviewer identity.");
  }

  const identities = new Set([
    authorization.requesterId,
    authorization.executorOwnerId,
    authorization.reviewerId,
  ]);

  if (identities.size !== 3) {
    fail("IDENTITY_CONFLICT", "Requester, executor owner, and reviewer must differ.");
  }

  if (authorization.authorized !== true) {
    fail("AUTHORIZATION_MISSING", "Controlled execution authorization is missing.");
  }

  if (authorization.purpose !== "CONTROLLED_SYNTHETIC_EXECUTION_FOUNDATION") {
    fail("PURPOSE_INVALID", "Controlled execution purpose is invalid.");
  }

  if (authorization.dryRunOnly !== true) {
    fail("DRY_RUN_ONLY_REQUIRED", "Controlled execution must remain dry-run only.");
  }

  if (authorization.expectedFoundationSeal !== foundationSeal) {
    fail("FOUNDATION_SEAL_MISMATCH", "Foundation seal mismatch.");
  }

  const issued = parseTime(authorization.issuedAt, "AUTHORIZATION_EXPIRED");
  const expires = parseTime(authorization.expiresAt, "AUTHORIZATION_EXPIRED");
  const current = parseTime(now, "AUTHORIZATION_EXPIRED");

  if (issued > current || expires <= current || expires <= issued) {
    fail("AUTHORIZATION_EXPIRED", "Authorization is expired or invalid.");
  }
}

export function validateControlledSyntheticBundle(
  bundle: ControlledSyntheticBundle,
  expectedBundleSeal: string,
  now: string,
): void {
  if (!ID.test(bundle.bundleId)) {
    fail("BUNDLE_ID_INVALID", "Invalid bundle identity.");
  }

  if (!ID.test(bundle.revisionId)) {
    fail("BUNDLE_REVISION_INVALID", "Invalid bundle revision identity.");
  }

  if (bundle.syntheticOnly !== true) {
    fail("BUNDLE_NOT_SYNTHETIC_ONLY", "Bundle must be synthetic only.");
  }

  if (bundle.catalogFrozen !== true) {
    fail("CATALOG_NOT_FROZEN", "Scenario catalog must be frozen.");
  }

  if (bundle.contentSeal !== expectedBundleSeal) {
    fail("BUNDLE_SEAL_MISMATCH", "Bundle seal mismatch.");
  }

  if (parseTime(bundle.expiresAt, "BUNDLE_EXPIRED") <= parseTime(now, "BUNDLE_EXPIRED")) {
    fail("BUNDLE_EXPIRED", "Bundle is expired.");
  }

  if (bundle.scenarios.length === 0) {
    fail("SCENARIO_CATALOG_EMPTY", "Scenario catalog is empty.");
  }

  const scenarioIds = new Set<string>();
  const fixtureIds = new Set<string>();
  const oracleIds = new Set<string>();
  const orders = new Set<number>();

  for (const scenario of bundle.scenarios) {
    if (!ID.test(scenario.scenarioId)) {
      fail("SCENARIO_ID_INVALID", "Invalid scenario identity.");
    }

    if (scenarioIds.has(scenario.scenarioId)) {
      fail("SCENARIO_DUPLICATE", "Duplicate scenario identity.");
    }

    scenarioIds.add(scenario.scenarioId);

    if (!ID.test(scenario.fixtureId)) {
      fail("FIXTURE_ID_INVALID", "Invalid fixture identity.");
    }

    if (fixtureIds.has(scenario.fixtureId)) {
      fail("FIXTURE_DUPLICATE", "Duplicate fixture identity.");
    }

    fixtureIds.add(scenario.fixtureId);

    if (!ID.test(scenario.oracle.oracleId)) {
      fail("ORACLE_ID_INVALID", "Invalid oracle identity.");
    }

    if (oracleIds.has(scenario.oracle.oracleId)) {
      fail("ORACLE_DUPLICATE", "Duplicate oracle identity.");
    }

    oracleIds.add(scenario.oracle.oracleId);

    if (
      !Number.isInteger(scenario.order)
      || scenario.order < 1
      || orders.has(scenario.order)
    ) {
      fail("SCENARIO_ORDER_INVALID", "Scenario order must be positive and unique.");
    }

    orders.add(scenario.order);

    if (!Number.isInteger(scenario.repeat) || scenario.repeat < 1) {
      fail("REPETITION_BUDGET_INVALID", "Scenario repeat must be positive.");
    }

    parseTime(scenario.clock, "CLOCK_INVALID");

    if (!Number.isInteger(scenario.seed) || scenario.seed < 0) {
      fail("SEED_INVALID", "Scenario seed must be a non-negative integer.");
    }

    if (scenario.realCandidateInput !== false) {
      fail("REAL_CANDIDATE_INPUT_FORBIDDEN", "Real candidate input is forbidden.");
    }

    if (scenario.realProviderInput !== false) {
      fail("REAL_PROVIDER_INPUT_FORBIDDEN", "Real provider input is forbidden.");
    }

    if (scenario.productionInput !== false) {
      fail("PRODUCTION_INPUT_FORBIDDEN", "Production input is forbidden.");
    }

    if (
      !scenario.oracle.expectedOutcome
      || scenario.oracle.requireOperationalEffectFalse !== true
    ) {
      fail("ORACLE_INCOMPLETE", "Scenario oracle is incomplete.");
    }
  }

  const expectedOrders = Array.from(
    { length: bundle.scenarios.length },
    (_, index) => index + 1,
  );

  if (
    JSON.stringify([...orders].sort((left, right) => left - right))
    !== JSON.stringify(expectedOrders)
  ) {
    fail("SCENARIO_ORDER_INVALID", "Scenario order must be contiguous.");
  }
}

export function validateRestrictedExecutorBinding(binding: RestrictedExecutorBinding): void {
  if (!ID.test(binding.executorId)) {
    fail("EXECUTOR_ID_INVALID", "Invalid executor identity.");
  }

  if (binding.executorSeal !== binding.expectedExecutorSeal) {
    fail("EXECUTOR_SEAL_MISMATCH", "Executor seal mismatch.");
  }

  if (
    binding.capability !== "PURE_IN_MEMORY_SYNTHETIC_EXECUTION"
    || binding.networkAllowed !== false
    || binding.processExecutionAllowed !== false
    || binding.persistenceAllowed !== false
    || binding.candidateExecutionAllowed !== false
    || binding.adapterExecutionAllowed !== false
  ) {
    fail("EXECUTOR_CAPABILITY_VIOLATION", "Executor capabilities exceed the allowlist.");
  }
}

export function validateControlledExecutionWorkspace(workspace: ControlledExecutionWorkspace): void {
  if (!ID.test(workspace.workspaceId)) {
    fail("WORKSPACE_ID_INVALID", "Invalid workspace identity.");
  }

  if (workspace.isolated !== true) {
    fail("WORKSPACE_NOT_ISOLATED", "Workspace must be isolated.");
  }

  if (workspace.ephemeral !== true) {
    fail("WORKSPACE_NOT_EPHEMERAL", "Workspace must be ephemeral.");
  }

  if (
    workspace.allowlistedInputs.some((value) => !ID.test(value))
    || workspace.allowlistedOutputs.some((value) => !ID.test(value))
  ) {
    fail("WORKSPACE_ALLOWLIST_INVALID", "Workspace allowlist is invalid.");
  }

  if (workspace.cleanupRequired !== true || workspace.cleanupVerified !== true) {
    fail("CLEANUP_NOT_VERIFIED", "Workspace cleanup is not verified.");
  }

  if (workspace.leaksDetected.length > 0) {
    fail("LEAK_DETECTED", "Workspace leak detected.");
  }
}

export function validateControlledExecutionBudgets(
  budgets: ControlledExecutionBudgets,
  bundle: ControlledSyntheticBundle,
): void {
  if (
    !Number.isInteger(budgets.maxScenarios)
    || budgets.maxScenarios < 1
    || budgets.maxScenarios > 100
    || bundle.scenarios.length > budgets.maxScenarios
  ) {
    fail("REPETITION_BUDGET_INVALID", "Scenario-count budget is invalid.");
  }

  if (!Number.isInteger(budgets.maxRepeat) || budgets.maxRepeat < 1 || budgets.maxRepeat > 20) {
    fail("REPETITION_BUDGET_INVALID", "Repeat budget is invalid.");
  }

  if (
    !Number.isInteger(budgets.maxScenarioMillis)
    || budgets.maxScenarioMillis < 1
    || budgets.maxScenarioMillis > 60000
  ) {
    fail("SCENARIO_TIME_BUDGET_INVALID", "Scenario time budget is invalid.");
  }

  if (
    !Number.isInteger(budgets.maxTotalMillis)
    || budgets.maxTotalMillis < budgets.maxScenarioMillis
    || budgets.maxTotalMillis > 600000
  ) {
    fail("TOTAL_TIME_BUDGET_INVALID", "Total time budget is invalid.");
  }

  if (
    !Number.isInteger(budgets.maxMemoryBytes)
    || budgets.maxMemoryBytes < 1048576
    || budgets.maxMemoryBytes > 1073741824
  ) {
    fail("MEMORY_BUDGET_INVALID", "Memory budget is invalid.");
  }

  if (
    !Number.isInteger(budgets.maxResultBytes)
    || budgets.maxResultBytes < 1024
    || budgets.maxResultBytes > 10485760
  ) {
    fail("RESULT_SIZE_BUDGET_INVALID", "Result-size budget is invalid.");
  }

  const invocationCount = bundle.scenarios.reduce(
    (total, scenario) => total + scenario.repeat,
    0,
  );

  if (bundle.scenarios.some((scenario) => scenario.repeat > budgets.maxRepeat)) {
    fail("REPETITION_BUDGET_INVALID", "Scenario repeat exceeds the admitted budget.");
  }

  if (invocationCount * budgets.maxScenarioMillis > budgets.maxTotalMillis) {
    fail("TOTAL_TIME_BUDGET_INVALID", "Projected invocations exceed the total time budget.");
  }
}

function prohibitOperationalEffects(input: ControlledExecutionInput): void {
  if (input.persistenceRequested) {
    fail("PERSISTENCE_FORBIDDEN", "Persistence remains forbidden.");
  }

  if (input.networkRequested) {
    fail("NETWORK_ACCESS_FORBIDDEN", "Network access remains forbidden.");
  }

  if (input.processExecutionRequested) {
    fail("PROCESS_EXECUTION_FORBIDDEN", "External process execution remains forbidden.");
  }

  if (input.candidateExecutionRequested) {
    fail("CANDIDATE_EXECUTION_FORBIDDEN", "Candidate execution remains forbidden.");
  }

  if (input.adapterExecutionRequested) {
    fail("ADAPTER_EXECUTION_FORBIDDEN", "Adapter execution remains forbidden.");
  }

  if (input.repositoryFingerprintBefore !== input.repositoryFingerprintAfter) {
    fail("REPOSITORY_MUTATION_DETECTED", "Repository fingerprint changed.");
  }
}

function normalizeStrings(values: readonly string[]): readonly string[] {
  return [...values].sort();
}

function validateExecutorResult(value: ControlledExecutorResult): void {
  if (
    typeof value.outcome !== "string"
    || value.outcome.length === 0
    || !Array.isArray(value.failedGates)
    || !Array.isArray(value.findings)
    || value.operationalEffect !== false
    || !value.payload
    || typeof value.payload !== "object"
    || Array.isArray(value.payload)
  ) {
    fail("EXECUTOR_RESULT_INVALID", "Executor result is invalid.");
  }

  if (value.operationalEffect !== false) {
    fail("OPERATIONAL_EFFECT_DETECTED", "Operational effect detected.");
  }
}

function evaluateOracle(
  scenario: ControlledSyntheticScenario,
  capture: ControlledRepetitionCapture,
): readonly string[] {
  const failures: string[] = [];

  if (capture.outcome !== scenario.oracle.expectedOutcome) {
    failures.push("OUTCOME_MISMATCH");
  }

  if (capture.errorCode !== scenario.oracle.expectedErrorCode) {
    failures.push("ERROR_CODE_MISMATCH");
  }

  if (
    JSON.stringify(normalizeStrings(capture.failedGates))
    !== JSON.stringify(normalizeStrings(scenario.oracle.expectedFailedGates))
  ) {
    failures.push("FAILED_GATES_MISMATCH");
  }

  if (
    JSON.stringify(normalizeStrings(capture.findings))
    !== JSON.stringify(normalizeStrings(scenario.oracle.expectedFindings))
  ) {
    failures.push("FINDINGS_MISMATCH");
  }

  if (capture.operationalEffect !== false) {
    failures.push("OPERATIONAL_EFFECT_MISMATCH");
  }

  return failures;
}

export function runControlledSyntheticExecutionFoundation(
  input: ControlledExecutionInput,
  executor: ControlledSyntheticExecutor,
): ControlledExecutionResult {
  prohibitOperationalEffects(input);
  validateControlledExecutionAuthorization(
    input.authorization,
    input.foundationSeal,
    input.now,
  );
  validateControlledSyntheticBundle(
    input.bundle,
    input.expectedBundleSeal,
    input.now,
  );
  validateRestrictedExecutorBinding(input.executorBinding);
  validateControlledExecutionWorkspace(input.workspace);
  validateControlledExecutionBudgets(input.budgets, input.bundle);

  const ordered = [...input.bundle.scenarios].sort(
    (left, right) => left.order - right.order,
  );
  const scenarioResults: ControlledScenarioResult[] = [];
  let invocationCount = 0;

  for (const scenario of ordered) {
    const captures: ControlledRepetitionCapture[] = [];
    const oracleFailures = new Set<string>();

    for (let repetition = 1; repetition <= scenario.repeat; repetition += 1) {
      const raw = executor(
        scenario,
        {
          clock: scenario.clock,
          seed: scenario.seed,
          repetition,
          workspaceId: input.workspace.workspaceId,
        },
      );

      validateExecutorResult(raw);

      const base = {
        scenarioId: scenario.scenarioId,
        repetition,
        outcome: raw.outcome,
        errorCode: raw.errorCode,
        failedGates: normalizeStrings(raw.failedGates),
        findings: normalizeStrings(raw.findings),
        operationalEffect: false as const,
        payload: raw.payload,
      };
      const canonicalCapture = canonicalizeControlledExecutionValue(base);
      const capture: ControlledRepetitionCapture = {
        ...base,
        canonicalCapture,
        transientSeal: transientControlledExecutionSeal(canonicalCapture),
      };

      for (const failure of evaluateOracle(scenario, capture)) {
        oracleFailures.add(failure);
      }

      captures.push(capture);
      invocationCount += 1;
    }

    const comparison = captures.map((capture) => canonicalizeControlledExecutionValue({
      outcome: capture.outcome,
      errorCode: capture.errorCode,
      failedGates: capture.failedGates,
      findings: capture.findings,
      operationalEffect: capture.operationalEffect,
      payload: capture.payload,
    }));
    const deterministic = new Set(comparison).size === 1;

    if (!deterministic) {
      oracleFailures.add("NON_DETERMINISTIC_RESULT");
    }

    scenarioResults.push({
      scenarioId: scenario.scenarioId,
      status: oracleFailures.size === 0 ? "PASS" : "QUARANTINED",
      oracleFailures: [...oracleFailures].sort(),
      captures,
      deterministic,
    });
  }

  const pass = scenarioResults.every((result) => result.status === "PASS");
  const base = {
    requestId: input.authorization.requestId,
    bundleId: input.bundle.bundleId,
    bundleRevisionId: input.bundle.revisionId,
    status: pass ? "PASS" as const : "FAIL" as const,
    outcome: pass
      ? "CONTROLLED_EXECUTION_PASS_PROJECTED" as const
      : "SCENARIO_QUARANTINED" as const,
    scenarioOrder: ordered.map((scenario) => scenario.scenarioId),
    scenarioResults,
    controlledSyntheticScenariosExecuted: ordered.length,
    controlledSyntheticInvocationsExecuted: invocationCount,
    operationalHarnessScenariosExecuted: 0 as const,
    executableBundleCreated: false as const,
    persisted: false as const,
    operationalEffect: false as const,
    cleanupVerified: input.workspace.cleanupVerified,
  };
  const canonicalResult = canonicalizeControlledExecutionValue(base);
  const encodedBytes = new TextEncoder().encode(canonicalResult).length;

  if (encodedBytes > input.budgets.maxResultBytes) {
    fail("RESULT_SIZE_BUDGET_INVALID", "Controlled execution result exceeds the result-size budget.");
  }

  return {
    ...base,
    canonicalResult,
    transientSeal: transientControlledExecutionSeal(canonicalResult),
  };
}

export function verifyControlledExecutionResult(value: ControlledExecutionResult): void {
  if (value.operationalEffect !== false) {
    fail("OPERATIONAL_EFFECT_DETECTED", "Operational effect detected.");
  }

  if (value.persisted !== false) {
    fail("PERSISTENCE_FORBIDDEN", "Persisted controlled execution result detected.");
  }

  if (value.executableBundleCreated !== false) {
    fail("PRODUCTION_INPUT_FORBIDDEN", "Executable bundle materialization detected.");
  }

  if (value.operationalHarnessScenariosExecuted !== 0) {
    fail("CANDIDATE_EXECUTION_FORBIDDEN", "Operational Harness execution detected.");
  }

  if (value.cleanupVerified !== true) {
    fail("CLEANUP_NOT_VERIFIED", "Cleanup verification is incomplete.");
  }

  if (transientControlledExecutionSeal(value.canonicalResult) !== value.transientSeal) {
    fail("TRANSIENT_SEAL_INVALID", "Controlled execution transient seal is invalid.");
  }

  for (const scenario of value.scenarioResults) {
    for (const capture of scenario.captures) {
      if (transientControlledExecutionSeal(capture.canonicalCapture) !== capture.transientSeal) {
        fail("TRANSIENT_SEAL_INVALID", "Controlled repetition capture seal is invalid.");
      }
    }
  }
}

export function projectControlledExecutionReplay(
  original: ControlledExecutionResult,
  replay: ControlledExecutionResult,
): ControlledReplayResult {
  verifyControlledExecutionResult(original);
  verifyControlledExecutionResult(replay);

  const matches = (
    original.canonicalResult === replay.canonicalResult
    && original.transientSeal === replay.transientSeal
  );
  const base = {
    matches,
    outcome: matches
      ? "CONTROLLED_EXECUTION_PASS_PROJECTED" as const
      : "REPLAY_MISMATCH_PROJECTED" as const,
    operationalEffect: false as const,
  };
  const canonicalReplay = canonicalizeControlledExecutionValue(base);

  return {
    ...base,
    canonicalReplay,
    transientSeal: transientControlledExecutionSeal(canonicalReplay),
  };
}

export function executeOperationalCandidateRegistration(): never {
  return fail(
    "CANDIDATE_EXECUTION_FORBIDDEN",
    "Operational candidate registration remains unauthorized.",
  );
}

export function persistControlledExecutionResult(): never {
  return fail(
    "PERSISTENCE_FORBIDDEN",
    "Persistent controlled execution results remain unauthorized.",
  );
}

export function useNetworkOrExternalProcess(): never {
  return fail(
    "NETWORK_ACCESS_FORBIDDEN",
    "Network and external-process access remain unauthorized.",
  );
}
