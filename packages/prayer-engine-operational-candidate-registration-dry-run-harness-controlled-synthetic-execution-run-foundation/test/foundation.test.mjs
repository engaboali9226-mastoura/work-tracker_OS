import assert from "node:assert/strict";
import {
  ControlledSyntheticRunFoundationError,
  CONTROLLED_RUN_DESIGN_DOMAINS,
  CONTROLLED_RUN_PHASES,
  CONTROLLED_RUN_GATES,
  CONTROLLED_RUN_OUTCOMES,
  CONTROLLED_RUN_FAILURE_CODES,
  createControlledRunCapture,
  createControlledSyntheticRunPlan,
  verifyControlledSyntheticRunPlan,
  evaluateControlledRunCaptures,
  verifyControlledRunDecision,
  projectControlledRunReplay,
  executeControlledSyntheticRun,
  materializeExecutableSyntheticBundle,
  persistControlledRunDecision,
  useControlledRunNetworkOrProcess,
} from "../dist/index.js";

const foundationSeal = "FOUNDATION-SEAL-039";
const requestSeal = "REQUEST-SEAL-039";
const bundleSeal = "BUNDLE-SEAL-039";
const authorization = {
  requestId: "REQUEST-039",
  requesterId: "REQUESTER-039",
  executorOwnerId: "EXECUTOR-OWNER-039",
  reviewerId: "REVIEWER-039",
  authorized: true,
  purpose: "CONTROLLED_SYNTHETIC_EXECUTION_RUN_FOUNDATION",
  dryRunOnly: true,
  issuedAt: "2026-07-27T10:00:00Z",
  expiresAt: "2026-07-27T12:00:00Z",
  expectedFoundationSeal: foundationSeal,
};
const scenarios = [
  {
    scenarioId: "SCENARIO-039-B",
    fixtureId: "FIXTURE-039-B",
    oracle: {oracleId: "ORACLE-039-B", expectedOutcome: "PASS-B", expectedErrorCode: null, expectedFailedGates: [], expectedFindings: [], requireOperationalEffectFalse: true},
    order: 2,
    repeat: 1,
    clock: "2026-07-27T11:00:00Z",
    seed: 2039,
    locale: "en-US",
    timezone: "Asia/Riyadh",
    fixture: {mode: "B"},
    realCandidateInput: false,
    realProviderInput: false,
    productionInput: false,
  },
  {
    scenarioId: "SCENARIO-039-A",
    fixtureId: "FIXTURE-039-A",
    oracle: {oracleId: "ORACLE-039-A", expectedOutcome: "PASS-A", expectedErrorCode: null, expectedFailedGates: [], expectedFindings: [], requireOperationalEffectFalse: true},
    order: 1,
    repeat: 2,
    clock: "2026-07-27T11:00:00Z",
    seed: 1039,
    locale: "en-US",
    timezone: "Asia/Riyadh",
    fixture: {mode: "A"},
    realCandidateInput: false,
    realProviderInput: false,
    productionInput: false,
  },
];
const bundle = {bundleId: "BUNDLE-039", revisionId: "REVISION-039", syntheticOnly: true, catalogFrozen: true, scenarios, contentSeal: bundleSeal, expiresAt: "2026-07-27T12:00:00Z"};
const request = {
  authorization,
  requestSeal,
  expectedRequestSeal: requestSeal,
  foundationSeal,
  bundle,
  expectedBundleSeal: bundleSeal,
  executorBinding: {executorId: "EXECUTOR-039", executorSeal: "EXECUTOR-SEAL-039", expectedExecutorSeal: "EXECUTOR-SEAL-039", capability: "PURE_IN_MEMORY_CAPTURE_EVALUATION", invocationAllowed: false, networkAllowed: false, processExecutionAllowed: false, persistenceAllowed: false, candidateExecutionAllowed: false, adapterExecutionAllowed: false},
  workspace: {workspaceId: "WORKSPACE-039", isolated: true, ephemeral: true, cleanupRequired: true, cleanupVerified: true, destructionVerified: true, leaksDetected: [], allowlistedInputs: ["INPUT-039"], allowlistedOutputs: ["OUTPUT-039"]},
  budgets: {maxScenarios: 5, maxRepeat: 5, maxScenarioMillis: 1000, maxTotalMillis: 10000, maxMemoryBytes: 16777216, maxResultBytes: 1048576},
  planId: "PLAN-039",
  repositoryFingerprintBefore: "same",
  repositoryFingerprintAfter: "same",
  now: "2026-07-27T11:00:00Z",
};

const capture = (id, scenarioId, repetition, outcome, payload) => createControlledRunCapture({captureId: id, scenarioId, repetition, outcome, errorCode: null, failedGates: [], findings: [], operationalEffect: false, payload});

assert.equal(CONTROLLED_RUN_DESIGN_DOMAINS.length, 18);
assert.equal(CONTROLLED_RUN_PHASES.length, 21);
assert.equal(CONTROLLED_RUN_GATES.length, 18);
assert.equal(CONTROLLED_RUN_OUTCOMES.length, 10);
assert.equal(CONTROLLED_RUN_FAILURE_CODES.length, 69);

const plan = createControlledSyntheticRunPlan(request);
assert.deepEqual(plan.scenarioOrder, ["SCENARIO-039-A", "SCENARIO-039-B"]);
assert.deepEqual(plan.invocations.map((item) => item.invocationKey), ["SCENARIO-039-A#1", "SCENARIO-039-A#2", "SCENARIO-039-B#1"]);
assert.equal(plan.controlledRunRequestsCreated, 0);
assert.equal(plan.executableBundlesMaterialized, 0);
assert.equal(plan.controlledRunScenariosExecuted, 0);
assert.equal(plan.persisted, false);
assert.equal(plan.operationalEffect, false);
verifyControlledSyntheticRunPlan(plan);
assert.deepEqual(createControlledSyntheticRunPlan(request), plan);

const captures = [
  capture("CAPTURE-039-A1", "SCENARIO-039-A", 1, "PASS-A", {mode: "A"}),
  capture("CAPTURE-039-A2", "SCENARIO-039-A", 2, "PASS-A", {mode: "A"}),
  capture("CAPTURE-039-B1", "SCENARIO-039-B", 1, "PASS-B", {mode: "B"}),
];
const decision = evaluateControlledRunCaptures(request, plan, captures);
assert.equal(decision.status, "PASS");
assert.equal(decision.outcome, "RUN_PASS_PROJECTED");
assert.equal(decision.capturesEvaluated, 3);
assert.equal(decision.controlledRunScenariosExecuted, 0);
assert.equal(decision.executableBundlesMaterialized, 0);
assert.equal(decision.persisted, false);
assert.equal(decision.operationalEffect, false);
verifyControlledRunDecision(decision);
assert.deepEqual(evaluateControlledRunCaptures(request, plan, captures), decision);
const replay = projectControlledRunReplay(decision, decision);
assert.equal(replay.matches, true);
assert.equal(replay.outcome, "RUN_PASS_PROJECTED");

const wrong = [...captures];
wrong[0] = capture("CAPTURE-039-WRONG", "SCENARIO-039-A", 1, "WRONG", {mode: "A"});
const quarantined = evaluateControlledRunCaptures(request, plan, wrong);
assert.equal(quarantined.status, "FAIL");
assert.ok(quarantined.scenarioDecisions[0].oracleFailures.includes("OUTCOME_MISMATCH"));
const nondeterministic = [...captures];
nondeterministic[1] = capture("CAPTURE-039-NONDET", "SCENARIO-039-A", 2, "PASS-A", {mode: "A", variation: 2});
const nondeterministicDecision = evaluateControlledRunCaptures(request, plan, nondeterministic);
assert.ok(nondeterministicDecision.scenarioDecisions[0].oracleFailures.includes("NON_DETERMINISTIC_CAPTURE"));
assert.equal(projectControlledRunReplay(decision, quarantined).outcome, "RUN_REPLAY_MISMATCH_PROJECTED");

let cases = 0;
function expectCode(operation, expected) {
  cases += 1;
  let caught = null;
  try { operation(); } catch (error) { caught = error; }
  assert.ok(caught instanceof ControlledSyntheticRunFoundationError);
  assert.equal(caught.code, expected);
}
const invalidPlanCases = [
  [{authorization: {...authorization, authorized: false}}, "AUTHORIZATION_MISSING"],
  [{authorization: {...authorization, purpose: "INVALID"}}, "PURPOSE_INVALID"],
  [{authorization: {...authorization, reviewerId: authorization.requesterId}}, "IDENTITY_CONFLICT"],
  [{authorization: {...authorization, expiresAt: request.now}}, "AUTHORIZATION_EXPIRED"],
  [{foundationSeal: "wrong"}, "FOUNDATION_SEAL_MISMATCH"],
  [{requestSeal: "wrong"}, "REQUEST_SEAL_MISMATCH"],
  [{bundle: {...bundle, syntheticOnly: false}}, "BUNDLE_NOT_SYNTHETIC_ONLY"],
  [{bundle: {...bundle, catalogFrozen: false}}, "CATALOG_NOT_FROZEN"],
  [{bundle: {...bundle, contentSeal: "wrong"}}, "BUNDLE_SEAL_MISMATCH"],
  [{bundle: {...bundle, scenarios: []}}, "SCENARIO_CATALOG_EMPTY"],
  [{bundle: {...bundle, scenarios: [scenarios[0], {...scenarios[1], scenarioId: scenarios[0].scenarioId}]}}, "SCENARIO_DUPLICATE"],
  [{bundle: {...bundle, scenarios: [scenarios[0], {...scenarios[1], fixtureId: scenarios[0].fixtureId}]}}, "FIXTURE_DUPLICATE"],
  [{bundle: {...bundle, scenarios: [scenarios[0], {...scenarios[1], oracle: {...scenarios[1].oracle, oracleId: scenarios[0].oracle.oracleId}}]}}, "ORACLE_DUPLICATE"],
  [{bundle: {...bundle, scenarios: [{...scenarios[0], order: 3}, scenarios[1]]}}, "SCENARIO_ORDER_INVALID"],
  [{bundle: {...bundle, scenarios: [{...scenarios[0], locale: "bad locale"}, scenarios[1]]}}, "LOCALE_INVALID"],
  [{bundle: {...bundle, scenarios: [{...scenarios[0], timezone: "bad zone"}, scenarios[1]]}}, "TIMEZONE_INVALID"],
  [{bundle: {...bundle, scenarios: [{...scenarios[0], realCandidateInput: true}, scenarios[1]]}}, "REAL_CANDIDATE_INPUT_FORBIDDEN"],
  [{bundle: {...bundle, scenarios: [{...scenarios[0], realProviderInput: true}, scenarios[1]]}}, "REAL_PROVIDER_INPUT_FORBIDDEN"],
  [{bundle: {...bundle, scenarios: [{...scenarios[0], productionInput: true}, scenarios[1]]}}, "PRODUCTION_INPUT_FORBIDDEN"],
  [{executorBinding: {...request.executorBinding, executorSeal: "wrong"}}, "EXECUTOR_SEAL_MISMATCH"],
  [{executorBinding: {...request.executorBinding, invocationAllowed: true}}, "EXECUTOR_CAPABILITY_VIOLATION"],
  [{workspace: {...request.workspace, isolated: false}}, "WORKSPACE_NOT_ISOLATED"],
  [{workspace: {...request.workspace, ephemeral: false}}, "WORKSPACE_NOT_EPHEMERAL"],
  [{workspace: {...request.workspace, cleanupVerified: false}}, "CLEANUP_NOT_VERIFIED"],
  [{workspace: {...request.workspace, leaksDetected: ["LEAK"]}}, "LEAK_DETECTED"],
  [{budgets: {...request.budgets, maxRepeat: 1}}, "REPETITION_BUDGET_INVALID"],
  [{budgets: {...request.budgets, maxTotalMillis: 1000}}, "TOTAL_TIME_BUDGET_INVALID"],
  [{budgets: {...request.budgets, maxMemoryBytes: 1}}, "MEMORY_BUDGET_INVALID"],
  [{budgets: {...request.budgets, maxResultBytes: 10}}, "RESULT_SIZE_BUDGET_INVALID"],
  [{repositoryFingerprintAfter: "changed"}, "REPOSITORY_MUTATION_DETECTED"],
  [{bundleMaterializationRequested: true}, "BUNDLE_MATERIALIZATION_FORBIDDEN"],
  [{runExecutionRequested: true}, "RUN_EXECUTION_FORBIDDEN"],
  [{persistenceRequested: true}, "PERSISTENCE_FORBIDDEN"],
  [{networkRequested: true}, "NETWORK_ACCESS_FORBIDDEN"],
  [{processExecutionRequested: true}, "PROCESS_EXECUTION_FORBIDDEN"],
  [{candidateExecutionRequested: true}, "CANDIDATE_EXECUTION_FORBIDDEN"],
  [{adapterExecutionRequested: true}, "ADAPTER_EXECUTION_FORBIDDEN"],
];
for (const [patch, code] of invalidPlanCases) expectCode(() => createControlledSyntheticRunPlan({...request, ...patch}), code);
expectCode(() => verifyControlledSyntheticRunPlan({...plan, transientSeal: "FNV1A64:0000000000000000"}), "PLAN_SEAL_MISMATCH");
expectCode(() => evaluateControlledRunCaptures(request, plan, captures.slice(0, 2)), "CAPTURE_INCOMPLETE");
expectCode(() => evaluateControlledRunCaptures(request, plan, [captures[0], captures[0], captures[2]]), "CAPTURE_DUPLICATE");
expectCode(() => evaluateControlledRunCaptures(request, plan, [{...captures[0], transientSeal: "FNV1A64:0000000000000000"}, captures[1], captures[2]]), "TRANSIENT_SEAL_INVALID");
expectCode(() => verifyControlledRunDecision({...decision, transientSeal: "FNV1A64:0000000000000000"}), "TRANSIENT_SEAL_INVALID");
expectCode(() => verifyControlledRunDecision({...decision, persisted: true}), "PERSISTENCE_FORBIDDEN");
expectCode(() => verifyControlledRunDecision({...decision, cleanupVerified: false}), "CLEANUP_NOT_VERIFIED");
expectCode(() => executeControlledSyntheticRun(), "RUN_EXECUTION_FORBIDDEN");
expectCode(() => materializeExecutableSyntheticBundle(), "BUNDLE_MATERIALIZATION_FORBIDDEN");
expectCode(() => persistControlledRunDecision(), "PERSISTENCE_FORBIDDEN");
expectCode(() => useControlledRunNetworkOrProcess(), "NETWORK_ACCESS_FORBIDDEN");
assert.equal(cases, 48);
console.log("NOOR_STEP_039_CONTROLLED_SYNTHETIC_RUN_FOUNDATION_TESTS_PASS");
