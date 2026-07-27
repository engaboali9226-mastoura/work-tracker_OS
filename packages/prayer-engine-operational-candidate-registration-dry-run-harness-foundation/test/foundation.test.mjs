import assert from "node:assert/strict";

import {
  DryRunHarnessFoundationError,
  HARNESS_DESIGN_DOMAINS,
  HARNESS_PHASES,
  HARNESS_GATES,
  HARNESS_OUTCOMES,
  SCENARIO_KINDS,
  HARNESS_FAILURE_CODES,
  transientHarnessSeal,
  runSyntheticHarnessFoundation,
  verifyHarnessRunResult,
  executeOperationalDryRunHarness,
  persistDryRunHarnessResult,
  ingestRealCandidateFixture,
} from "../dist/index.js";

const projection=(
  outcome,
  failedGates=[],
  blockingFindings=[],
)=>{
  const base={
    outcome,
    failedGates:[
      ...failedGates,
    ].sort(),
    blockingFindings:[
      ...blockingFindings,
    ].sort(),
    operationalEffect:false,
  };

  const canonicalProjection=
    JSON.stringify(
      Object.fromEntries(
        Object.entries(base).sort(
          ([left],[right]) =>
            left.localeCompare(right)
        )
      )
    );

  return {
    ...base,
    canonicalProjection,
    transientSeal:
      transientHarnessSeal(
        canonicalProjection
      ),
  };
};

const executor=fixture=>{
  const mode=fixture.payload.mode;

  if(mode==="READY"){
    return projection(
      "REVIEW_READY_PROJECTED"
    );
  }

  if(mode==="QUARANTINE"){
    return projection(
      "QUARANTINED",
      [
        "BLOCKING_FINDINGS_PRESENT",
      ],
      [
        "synthetic-blocker",
      ],
    );
  }

  if(mode==="APPROVAL"){
    return projection(
      "APPROVAL_PROJECTED"
    );
  }

  if(mode==="REJECTION"){
    return projection(
      "REJECTION_PROJECTED"
    );
  }

  if(mode==="REVALIDATION"){
    return projection(
      "REVALIDATION_REQUIRED"
    );
  }

  if(mode==="ERROR"){
    const error=
      new Error(
        "Synthetic failure"
      );

    error.code=
      "SELF_REVIEW_FORBIDDEN";

    throw error;
  }

  return projection(
    "EXECUTION_REJECTED"
  );
};

const scenario=(
  id,
  kind,
  mode,
  oracle,
  repeat=3,
)=>({
  scenarioId:id,
  kind,
  fixture:{
    fixtureId:
      `FIXTURE-${id}`,
    source:"SYNTHETIC",
    payload:{
      mode,
    },
    realCandidate:false,
    realProvider:false,
  },
  oracle:{
    ...oracle,
    requireOperationalEffectFalse:true,
    verifyTransientSeal:true,
  },
  repeat,
  clock:"2026-07-27T09:00:00Z",
});

const scenarios=[
  scenario(
    "SCENARIO-READY",
    "REVIEW_READY",
    "READY",
    {
      expectedOutcome:
        "REVIEW_READY_PROJECTED",
      expectedFailedGates:[],
      expectedBlockingFindings:[],
    },
  ),
  scenario(
    "SCENARIO-QUARANTINE",
    "QUARANTINE",
    "QUARANTINE",
    {
      expectedOutcome:
        "QUARANTINED",
      expectedFailedGates:[
        "BLOCKING_FINDINGS_PRESENT",
      ],
      expectedBlockingFindings:[
        "synthetic-blocker",
      ],
    },
  ),
  scenario(
    "SCENARIO-APPROVAL",
    "APPROVAL",
    "APPROVAL",
    {
      expectedOutcome:
        "APPROVAL_PROJECTED",
    },
  ),
  scenario(
    "SCENARIO-REJECTION",
    "REJECTION",
    "REJECTION",
    {
      expectedOutcome:
        "REJECTION_PROJECTED",
    },
  ),
  scenario(
    "SCENARIO-REVALIDATION",
    "REVALIDATION",
    "REVALIDATION",
    {
      expectedOutcome:
        "REVALIDATION_REQUIRED",
    },
  ),
  scenario(
    "SCENARIO-FAILURE",
    "FAILURE",
    "ERROR",
    {
      expectedErrorCode:
        "SELF_REVIEW_FORBIDDEN",
    },
  ),
  scenario(
    "SCENARIO-GUARD",
    "GUARD",
    "READY",
    {
      expectedOutcome:
        "REVIEW_READY_PROJECTED",
    },
    2,
  ),
];

const plan={
  planId:"HARNESS-PLAN-033",
  authorized:true,
  scope:
    "SYNTHETIC_DRY_RUN_HARNESS_FOUNDATION",
  scenarios:[
    ...scenarios,
  ].reverse(),
  repositoryFingerprintBefore:
    "same",
  repositoryFingerprintAfter:
    "same",
};

assert.equal(
  HARNESS_DESIGN_DOMAINS.length,
  18,
);

assert.equal(
  HARNESS_PHASES.length,
  18,
);

assert.equal(
  HARNESS_GATES.length,
  18,
);

assert.equal(
  HARNESS_OUTCOMES.length,
  7,
);

assert.equal(
  SCENARIO_KINDS.length,
  7,
);

assert.equal(
  HARNESS_FAILURE_CODES.length,
  32,
);

const result=
  runSyntheticHarnessFoundation(
    plan,
    executor,
  );

assert.equal(
  result.status,
  "PASS",
);

assert.equal(
  result.scenarioResults.length,
  7,
);

assert.deepEqual(
  result.scenarioResults.map(
    value =>
      value.scenarioId
  ),
  [
    ...result.scenarioResults.map(
      value =>
        value.scenarioId
    ),
  ].sort(),
);

assert.equal(
  result.operationalEffect,
  false,
);

assert.equal(
  result.persisted,
  false,
);

assert.equal(
  result.cleanupVerified,
  true,
);

verifyHarnessRunResult(
  result
);

assert.deepEqual(
  runSyntheticHarnessFoundation(
    plan,
    executor,
  ),
  result,
);

function expectCode(
  operation,
  expected,
){
  let caught=null;

  try{
    operation();
  }catch(error){
    caught=error;
  }

  assert.ok(
    caught
    instanceof DryRunHarnessFoundationError
  );

  assert.equal(
    caught.code,
    expected,
  );
}

expectCode(
  () =>
    runSyntheticHarnessFoundation(
      {
        ...plan,
        scenarios:[
          scenarios[0],
          scenarios[0],
        ],
      },
      executor,
    ),
  "SCENARIO_DUPLICATE",
);

expectCode(
  () =>
    runSyntheticHarnessFoundation(
      {
        ...plan,
        repositoryFingerprintAfter:
          "changed",
      },
      executor,
    ),
  "REPOSITORY_MUTATION_DETECTED",
);

expectCode(
  () =>
    runSyntheticHarnessFoundation(
      {
        ...plan,
        networkRequested:true,
      },
      executor,
    ),
  "NETWORK_ACCESS_FORBIDDEN",
);

expectCode(
  () =>
    runSyntheticHarnessFoundation(
      {
        ...plan,
        processExecutionRequested:true,
      },
      executor,
    ),
  "PROCESS_EXECUTION_FORBIDDEN",
);

expectCode(
  () =>
    runSyntheticHarnessFoundation(
      {
        ...plan,
        persistenceRequested:true,
      },
      executor,
    ),
  "PERSISTENT_RESULT_FORBIDDEN",
);

expectCode(
  () =>
    runSyntheticHarnessFoundation(
      {
        ...plan,
        operationalHarnessExecutionRequested:
          true,
      },
      executor,
    ),
  "HARNESS_EXECUTION_FORBIDDEN",
);

expectCode(
  () =>
    executeOperationalDryRunHarness(),
  "HARNESS_EXECUTION_FORBIDDEN",
);

expectCode(
  () =>
    persistDryRunHarnessResult(),
  "PERSISTENT_RESULT_FORBIDDEN",
);

expectCode(
  () =>
    ingestRealCandidateFixture(),
  "REAL_CANDIDATE_FIXTURE_FORBIDDEN",
);

console.log(
  "NOOR_STEP_033_DRY_RUN_HARNESS_FOUNDATION_TESTS_PASS"
);
