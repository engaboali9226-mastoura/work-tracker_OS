import assert from "node:assert/strict";

import {
  ControlledSyntheticExecutionFoundationError,
  CONTROLLED_EXECUTION_DESIGN_DOMAINS,
  CONTROLLED_EXECUTION_PHASES,
  CONTROLLED_EXECUTION_GATES,
  CONTROLLED_EXECUTION_OUTCOMES,
  CONTROLLED_EXECUTION_FAILURE_CODES,
  runControlledSyntheticExecutionFoundation,
  verifyControlledExecutionResult,
  projectControlledExecutionReplay,
  executeOperationalCandidateRegistration,
  persistControlledExecutionResult,
  useNetworkOrExternalProcess,
} from "../dist/index.js";

const foundationSeal = "FOUNDATION-SEAL-037";
const bundleSeal = "BUNDLE-SEAL-037";
const authorization = {
  requestId: "REQUEST-037",
  requesterId: "REQUESTER-037",
  executorOwnerId: "EXECUTOR-OWNER-037",
  reviewerId: "REVIEWER-037",
  authorized: true,
  purpose: "CONTROLLED_SYNTHETIC_EXECUTION_FOUNDATION",
  dryRunOnly: true,
  issuedAt: "2026-07-27T10:00:00Z",
  expiresAt: "2026-07-27T12:00:00Z",
  expectedFoundationSeal: foundationSeal,
};
const scenarios = [
  {
    scenarioId: "SCENARIO-037-C",
    fixtureId: "FIXTURE-037-C",
    oracle: {
      oracleId: "ORACLE-037-C",
      expectedOutcome: "QUARANTINED",
      expectedErrorCode: "EXPECTED-C",
      expectedFailedGates: ["CG-03"],
      expectedFindings: ["FINDING-C"],
      requireOperationalEffectFalse: true,
    },
    order: 3,
    repeat: 1,
    clock: "2026-07-27T11:00:00Z",
    seed: 3037,
    fixture: { mode: "C" },
    realCandidateInput: false,
    realProviderInput: false,
    productionInput: false,
  },
  {
    scenarioId: "SCENARIO-037-A",
    fixtureId: "FIXTURE-037-A",
    oracle: {
      oracleId: "ORACLE-037-A",
      expectedOutcome: "PASS-A",
      expectedErrorCode: null,
      expectedFailedGates: [],
      expectedFindings: [],
      requireOperationalEffectFalse: true,
    },
    order: 1,
    repeat: 3,
    clock: "2026-07-27T11:00:00Z",
    seed: 1037,
    fixture: { mode: "A" },
    realCandidateInput: false,
    realProviderInput: false,
    productionInput: false,
  },
  {
    scenarioId: "SCENARIO-037-B",
    fixtureId: "FIXTURE-037-B",
    oracle: {
      oracleId: "ORACLE-037-B",
      expectedOutcome: "PASS-B",
      expectedErrorCode: null,
      expectedFailedGates: [],
      expectedFindings: [],
      requireOperationalEffectFalse: true,
    },
    order: 2,
    repeat: 2,
    clock: "2026-07-27T11:00:00Z",
    seed: 2037,
    fixture: { mode: "B" },
    realCandidateInput: false,
    realProviderInput: false,
    productionInput: false,
  },
];
const bundle = {
  bundleId: "BUNDLE-037",
  revisionId: "REVISION-037",
  syntheticOnly: true,
  catalogFrozen: true,
  scenarios,
  contentSeal: bundleSeal,
  expiresAt: "2026-07-27T12:00:00Z",
};
const input = {
  authorization,
  foundationSeal,
  bundle,
  expectedBundleSeal: bundleSeal,
  executorBinding: {
    executorId: "EXECUTOR-037",
    executorSeal: "EXECUTOR-SEAL-037",
    expectedExecutorSeal: "EXECUTOR-SEAL-037",
    capability: "PURE_IN_MEMORY_SYNTHETIC_EXECUTION",
    networkAllowed: false,
    processExecutionAllowed: false,
    persistenceAllowed: false,
    candidateExecutionAllowed: false,
    adapterExecutionAllowed: false,
  },
  workspace: {
    workspaceId: "WORKSPACE-037",
    isolated: true,
    ephemeral: true,
    cleanupRequired: true,
    cleanupVerified: true,
    leaksDetected: [],
    allowlistedInputs: ["INPUT-037"],
    allowlistedOutputs: ["OUTPUT-037"],
  },
  budgets: {
    maxScenarios: 5,
    maxRepeat: 5,
    maxScenarioMillis: 1000,
    maxTotalMillis: 10000,
    maxMemoryBytes: 16777216,
    maxResultBytes: 1048576,
  },
  repositoryFingerprintBefore: "same",
  repositoryFingerprintAfter: "same",
  now: "2026-07-27T11:00:00Z",
};

const executor = (scenario) => {
  const mode = scenario.fixture.mode;

  if (mode === "C") {
    return {
      outcome: "QUARANTINED",
      errorCode: "EXPECTED-C",
      failedGates: ["CG-03"],
      findings: ["FINDING-C"],
      operationalEffect: false,
      payload: { mode },
    };
  }

  return {
    outcome: `PASS-${mode}`,
    errorCode: null,
    failedGates: [],
    findings: [],
    operationalEffect: false,
    payload: { mode },
  };
};

assert.equal(CONTROLLED_EXECUTION_DESIGN_DOMAINS.length, 18);
assert.equal(CONTROLLED_EXECUTION_PHASES.length, 20);
assert.equal(CONTROLLED_EXECUTION_GATES.length, 18);
assert.equal(CONTROLLED_EXECUTION_OUTCOMES.length, 9);
assert.equal(CONTROLLED_EXECUTION_FAILURE_CODES.length, 57);

const result = runControlledSyntheticExecutionFoundation(input, executor);
assert.equal(result.status, "PASS");
assert.equal(result.outcome, "CONTROLLED_EXECUTION_PASS_PROJECTED");
assert.deepEqual(result.scenarioOrder, [
  "SCENARIO-037-A",
  "SCENARIO-037-B",
  "SCENARIO-037-C",
]);
assert.equal(result.controlledSyntheticScenariosExecuted, 3);
assert.equal(result.controlledSyntheticInvocationsExecuted, 6);
assert.equal(result.operationalHarnessScenariosExecuted, 0);
assert.equal(result.executableBundleCreated, false);
assert.equal(result.persisted, false);
assert.equal(result.operationalEffect, false);
assert.equal(result.cleanupVerified, true);
verifyControlledExecutionResult(result);
assert.deepEqual(runControlledSyntheticExecutionFoundation(input, executor), result);

const replay = projectControlledExecutionReplay(result, result);
assert.equal(replay.matches, true);
assert.equal(replay.outcome, "CONTROLLED_EXECUTION_PASS_PROJECTED");

const quarantined = runControlledSyntheticExecutionFoundation(
  input,
  (scenario, context) => {
    const value = executor(scenario, context);
    return scenario.scenarioId === "SCENARIO-037-A"
      ? { ...value, outcome: "WRONG" }
      : value;
  },
);
assert.equal(quarantined.status, "FAIL");
assert.equal(quarantined.outcome, "SCENARIO_QUARANTINED");
assert.ok(quarantined.scenarioResults[0].oracleFailures.includes("OUTCOME_MISMATCH"));

const nondeterministic = runControlledSyntheticExecutionFoundation(
  input,
  (scenario, context) => ({
    ...executor(scenario, context),
    payload: { mode: scenario.fixture.mode, repetition: context.repetition },
  }),
);
assert.equal(nondeterministic.status, "FAIL");
assert.ok(nondeterministic.scenarioResults[0].oracleFailures.includes("NON_DETERMINISTIC_RESULT"));

const mismatchReplay = projectControlledExecutionReplay(result, quarantined);
assert.equal(mismatchReplay.matches, false);
assert.equal(mismatchReplay.outcome, "REPLAY_MISMATCH_PROJECTED");

let forbiddenCases = 0;
function expectCode(operation, expected) {
  forbiddenCases += 1;
  let caught = null;
  try {
    operation();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ControlledSyntheticExecutionFoundationError);
  assert.equal(caught.code, expected);
}

expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, authorization: { ...authorization, authorized: false } }, executor), "AUTHORIZATION_MISSING");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, authorization: { ...authorization, purpose: "INVALID" } }, executor), "PURPOSE_INVALID");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, authorization: { ...authorization, reviewerId: authorization.requesterId } }, executor), "IDENTITY_CONFLICT");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, authorization: { ...authorization, expiresAt: input.now } }, executor), "AUTHORIZATION_EXPIRED");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, foundationSeal: "wrong" }, executor), "FOUNDATION_SEAL_MISMATCH");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, syntheticOnly: false } }, executor), "BUNDLE_NOT_SYNTHETIC_ONLY");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, catalogFrozen: false } }, executor), "CATALOG_NOT_FROZEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, contentSeal: "wrong" } }, executor), "BUNDLE_SEAL_MISMATCH");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [] } }, executor), "SCENARIO_CATALOG_EMPTY");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [scenarios[0], { ...scenarios[1], scenarioId: scenarios[0].scenarioId }] } }, executor), "SCENARIO_DUPLICATE");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [scenarios[0], { ...scenarios[1], fixtureId: scenarios[0].fixtureId }] } }, executor), "FIXTURE_DUPLICATE");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [scenarios[0], { ...scenarios[1], oracle: { ...scenarios[1].oracle, oracleId: scenarios[0].oracle.oracleId } }] } }, executor), "ORACLE_DUPLICATE");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [{ ...scenarios[0], order: 4 }, scenarios[1], scenarios[2]] } }, executor), "SCENARIO_ORDER_INVALID");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [{ ...scenarios[0], realCandidateInput: true }, scenarios[1], scenarios[2]] } }, executor), "REAL_CANDIDATE_INPUT_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [{ ...scenarios[0], realProviderInput: true }, scenarios[1], scenarios[2]] } }, executor), "REAL_PROVIDER_INPUT_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, bundle: { ...bundle, scenarios: [{ ...scenarios[0], productionInput: true }, scenarios[1], scenarios[2]] } }, executor), "PRODUCTION_INPUT_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, executorBinding: { ...input.executorBinding, executorSeal: "wrong" } }, executor), "EXECUTOR_SEAL_MISMATCH");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, executorBinding: { ...input.executorBinding, networkAllowed: true } }, executor), "EXECUTOR_CAPABILITY_VIOLATION");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, workspace: { ...input.workspace, isolated: false } }, executor), "WORKSPACE_NOT_ISOLATED");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, workspace: { ...input.workspace, ephemeral: false } }, executor), "WORKSPACE_NOT_EPHEMERAL");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, workspace: { ...input.workspace, cleanupVerified: false } }, executor), "CLEANUP_NOT_VERIFIED");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, workspace: { ...input.workspace, leaksDetected: ["LEAK"] } }, executor), "LEAK_DETECTED");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, budgets: { ...input.budgets, maxRepeat: 1 } }, executor), "REPETITION_BUDGET_INVALID");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, budgets: { ...input.budgets, maxTotalMillis: 1000 } }, executor), "TOTAL_TIME_BUDGET_INVALID");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, budgets: { ...input.budgets, maxMemoryBytes: 1 } }, executor), "MEMORY_BUDGET_INVALID");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, budgets: { ...input.budgets, maxResultBytes: 10 } }, executor), "RESULT_SIZE_BUDGET_INVALID");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, repositoryFingerprintAfter: "changed" }, executor), "REPOSITORY_MUTATION_DETECTED");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, persistenceRequested: true }, executor), "PERSISTENCE_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, networkRequested: true }, executor), "NETWORK_ACCESS_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, processExecutionRequested: true }, executor), "PROCESS_EXECUTION_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, candidateExecutionRequested: true }, executor), "CANDIDATE_EXECUTION_FORBIDDEN");
expectCode(() => runControlledSyntheticExecutionFoundation({ ...input, adapterExecutionRequested: true }, executor), "ADAPTER_EXECUTION_FORBIDDEN");
expectCode(() => verifyControlledExecutionResult({ ...result, transientSeal: "FNV1A64:0000000000000000" }), "TRANSIENT_SEAL_INVALID");
expectCode(() => verifyControlledExecutionResult({ ...result, operationalEffect: true }), "OPERATIONAL_EFFECT_DETECTED");
expectCode(() => verifyControlledExecutionResult({ ...result, persisted: true }), "PERSISTENCE_FORBIDDEN");
expectCode(() => verifyControlledExecutionResult({ ...result, cleanupVerified: false }), "CLEANUP_NOT_VERIFIED");
expectCode(() => executeOperationalCandidateRegistration(), "CANDIDATE_EXECUTION_FORBIDDEN");
expectCode(() => persistControlledExecutionResult(), "PERSISTENCE_FORBIDDEN");
expectCode(() => useNetworkOrExternalProcess(), "NETWORK_ACCESS_FORBIDDEN");

assert.equal(forbiddenCases, 39);
console.log("NOOR_STEP_037_CONTROLLED_SYNTHETIC_EXECUTION_FOUNDATION_TESTS_PASS");
