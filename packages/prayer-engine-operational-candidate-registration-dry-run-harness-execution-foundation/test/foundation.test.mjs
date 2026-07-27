import assert from "node:assert/strict";

import {
  HarnessExecutionFoundationError,
  HARNESS_EXECUTION_DESIGN_DOMAINS,
  HARNESS_EXECUTION_PHASES,
  HARNESS_EXECUTION_GATES,
  HARNESS_EXECUTION_OUTCOMES,
  HARNESS_EXECUTION_FAILURE_CODES,
  projectHarnessExecutionFoundation,
  verifyHarnessExecutionProjection,
  projectHarnessExecutionReplay,
  executeOperationalDryRunHarness,
  materializeExecutableSyntheticBundle,
  persistHarnessExecutionResult,
  ingestRealCandidateOrProviderFixture,
} from "../dist/index.js";

const request={
  requestId:"REQUEST-035-001",
  requesterId:"REQUESTER-035",
  reviewerId:"REVIEWER-035",
  authorized:true,
  scope:"SYNTHETIC_HARNESS_EXECUTION_FOUNDATION",
  issuedAt:"2026-07-27T09:00:00Z",
  expiresAt:"2026-07-27T11:00:00Z",
  bundleId:"BUNDLE-035",
  bundleRevisionId:"REVISION-035",
  expectedBundleSeal:"BUNDLE-SEAL-035",
  dryRunOnly:true,
};

const bundle={
  bundleId:request.bundleId,
  revisionId:request.bundleRevisionId,
  syntheticOnly:true,
  scenarios:[
    {
      scenarioId:"SCENARIO-035-B",
      fixtureId:"FIXTURE-035-B",
      oracleId:"ORACLE-035-B",
      order:2,
      repeat:2,
      clock:"2026-07-27T10:00:00Z",
    },
    {
      scenarioId:"SCENARIO-035-A",
      fixtureId:"FIXTURE-035-A",
      oracleId:"ORACLE-035-A",
      order:1,
      repeat:3,
      clock:"2026-07-27T10:00:00Z",
    },
  ],
  fixtureIds:["FIXTURE-035-A","FIXTURE-035-B"],
  oracleIds:["ORACLE-035-A","ORACLE-035-B"],
  contentSeal:request.expectedBundleSeal,
  expiresAt:"2026-07-27T11:00:00Z",
  realCandidateContent:false,
  realProviderContent:false,
};

const input={
  request,
  bundle,
  workspace:{
    workspaceId:"WORKSPACE-035",
    isolated:true,
    ephemeral:true,
    cleanupRequired:true,
    cleanupVerified:true,
    leaksDetected:[],
  },
  budgets:{
    maxRepeat:5,
    maxScenarioMillis:1000,
    maxTotalMillis:10000,
    maxMemoryBytes:16777216,
  },
  executor:{
    executorId:"EXECUTOR-035",
    executorSeal:"EXECUTOR-SEAL-035",
    expectedExecutorSeal:"EXECUTOR-SEAL-035",
    syntheticOnly:true,
  },
  repositoryFingerprintBefore:"same",
  repositoryFingerprintAfter:"same",
  now:"2026-07-27T10:00:00Z",
};

assert.equal(HARNESS_EXECUTION_DESIGN_DOMAINS.length,18);
assert.equal(HARNESS_EXECUTION_PHASES.length,19);
assert.equal(HARNESS_EXECUTION_GATES.length,18);
assert.equal(HARNESS_EXECUTION_OUTCOMES.length,8);
assert.equal(HARNESS_EXECUTION_FAILURE_CODES.length,46);

const projection=projectHarnessExecutionFoundation(input);
assert.equal(projection.outcome,"HARNESS_PASS_PROJECTED");
assert.deepEqual(projection.scenarioOrder,["SCENARIO-035-A","SCENARIO-035-B"]);
assert.equal(projection.projectedScenarioCount,2);
assert.equal(projection.projectedInvocationCount,5);
assert.equal(projection.scenariosExecuted,0);
assert.equal(projection.executableBundleCreated,false);
assert.equal(projection.operationalEffect,false);
assert.equal(projection.persisted,false);
verifyHarnessExecutionProjection(projection);
assert.deepEqual(projectHarnessExecutionFoundation(input),projection);

const replay=projectHarnessExecutionReplay(projection,projection);
assert.equal(replay.outcome,"HARNESS_PASS_PROJECTED");
assert.equal(replay.matches,true);

const different=projectHarnessExecutionFoundation({
  ...input,
  bundle:{
    ...bundle,
    scenarios:[
      {...bundle.scenarios[0],repeat:1},
      bundle.scenarios[1],
    ],
  },
});

const mismatch=projectHarnessExecutionReplay(projection,different);
assert.equal(mismatch.outcome,"REPLAY_MISMATCH_PROJECTED");
assert.equal(mismatch.matches,false);

function expectCode(operation,expected){
  let caught=null;
  try{operation();}catch(error){caught=error;}
  assert.ok(caught instanceof HarnessExecutionFoundationError);
  assert.equal(caught.code,expected);
}

expectCode(()=>projectHarnessExecutionFoundation({...input,request:{...request,reviewerId:request.requesterId}}),"REQUESTER_REVIEWER_CONFLICT");
expectCode(()=>projectHarnessExecutionFoundation({...input,bundle:{...bundle,realCandidateContent:true}}),"REAL_CANDIDATE_FIXTURE_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,bundle:{...bundle,realProviderContent:true}}),"REAL_PROVIDER_FIXTURE_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,workspace:{...input.workspace,isolated:false}}),"WORKSPACE_NOT_ISOLATED");
expectCode(()=>projectHarnessExecutionFoundation({...input,workspace:{...input.workspace,cleanupVerified:false}}),"CLEANUP_NOT_VERIFIED");
expectCode(()=>projectHarnessExecutionFoundation({...input,workspace:{...input.workspace,leaksDetected:["leak"]}}),"LEAK_DETECTED");
expectCode(()=>projectHarnessExecutionFoundation({...input,budgets:{...input.budgets,maxRepeat:1}}),"REPETITION_BUDGET_INVALID");
expectCode(()=>projectHarnessExecutionFoundation({...input,executor:{...input.executor,executorSeal:"wrong"}}),"EXECUTOR_SEAL_MISMATCH");
expectCode(()=>projectHarnessExecutionFoundation({...input,repositoryFingerprintAfter:"changed"}),"REPOSITORY_MUTATION_DETECTED");
expectCode(()=>projectHarnessExecutionFoundation({...input,executableBundleCreationRequested:true}),"EXECUTABLE_BUNDLE_CREATION_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,operationalHarnessExecutionRequested:true}),"OPERATIONAL_HARNESS_EXECUTION_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,persistenceRequested:true}),"PERSISTENT_RESULT_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,networkRequested:true}),"NETWORK_ACCESS_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,processExecutionRequested:true}),"PROCESS_EXECUTION_FORBIDDEN");
expectCode(()=>projectHarnessExecutionFoundation({...input,candidateExecutionRequested:true}),"CANDIDATE_EXECUTION_FORBIDDEN");
expectCode(()=>verifyHarnessExecutionProjection({...projection,transientSeal:"FNV1A64:0000000000000000"}),"TRANSIENT_SEAL_INVALID");
expectCode(()=>executeOperationalDryRunHarness(),"OPERATIONAL_HARNESS_EXECUTION_FORBIDDEN");
expectCode(()=>materializeExecutableSyntheticBundle(),"EXECUTABLE_BUNDLE_CREATION_FORBIDDEN");
expectCode(()=>persistHarnessExecutionResult(),"PERSISTENT_RESULT_FORBIDDEN");
expectCode(()=>ingestRealCandidateOrProviderFixture(),"REAL_CANDIDATE_FIXTURE_FORBIDDEN");

console.log("NOOR_STEP_035_DRY_RUN_HARNESS_EXECUTION_FOUNDATION_TESTS_PASS");
