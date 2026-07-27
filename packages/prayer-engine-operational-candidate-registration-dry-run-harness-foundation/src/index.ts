export const HARNESS_DESIGN_DOMAINS=["Harness Authorization and Scenario Scope","Scenario Envelope and Stable Identity","Fixture Source and Immutability","Synthetic Candidate Projection","Authority Context Fixture","Clock Expiry and Temporal Control","Foundation Seal Fixture","Expected Outcome Oracle","Expected Failure Oracle","Isolation and Temporary Workspace","Compiler and Runtime Pinning","Execution Ordering and Short-Circuiting","Repeatability and Determinism","Result Capture and Canonicalization","Transient Seal Verification","Negative-Path Coverage","Non-Mutation Cleanup and Disposal","Review Evidence and Authorization Boundary"] as const;
export const HARNESS_PHASES=["DH-01","DH-02","DH-03","DH-04","DH-05","DH-06","DH-07","DH-08","DH-09","DH-10","DH-11","DH-12","DH-13","DH-14","DH-15","DH-16","DH-17","DH-18"] as const;
export const HARNESS_GATES=["HG-01","HG-02","HG-03","HG-04","HG-05","HG-06","HG-07","HG-08","HG-09","HG-10","HG-11","HG-12","HG-13","HG-14","HG-15","HG-16","HG-17","HG-18"] as const;
export const HARNESS_OUTCOMES=["HARNESS_REJECTED","SCENARIO_INVALID","EXPECTED_PASS","EXPECTED_QUARANTINE","EXPECTED_FAILURE","ORACLE_MISMATCH","HARNESS_REVALIDATION_REQUIRED"] as const;
export const SCENARIO_KINDS=["REVIEW_READY","QUARANTINE","APPROVAL","REJECTION","REVALIDATION","FAILURE","GUARD"] as const;
export const HARNESS_FAILURE_CODES=["HARNESS_AUTHORIZATION_MISSING","HARNESS_SCOPE_VIOLATION","PLAN_ID_INVALID","SCENARIO_ID_INVALID","SCENARIO_DUPLICATE","SCENARIO_KIND_INVALID","FIXTURE_ID_INVALID","FIXTURE_SOURCE_INVALID","REAL_CANDIDATE_FIXTURE_FORBIDDEN","ORACLE_INVALID","REPEAT_COUNT_INVALID","EXECUTOR_MISSING","CLOCK_INVALID","NON_DETERMINISTIC_RESULT","OUTCOME_MISMATCH","ERROR_CODE_MISMATCH","FAILED_GATES_MISMATCH","BLOCKING_FINDINGS_MISMATCH","OPERATIONAL_EFFECT_DETECTED","TRANSIENT_SEAL_INVALID","RESULT_CAPTURE_INVALID","CLEANUP_LEAK_DETECTED","REPOSITORY_MUTATION_DETECTED","MANIFEST_PERSISTENCE_FORBIDDEN","PERSISTENT_RESULT_FORBIDDEN","NETWORK_ACCESS_FORBIDDEN","PROCESS_EXECUTION_FORBIDDEN","CANDIDATE_EXECUTION_FORBIDDEN","HARNESS_EXECUTION_FORBIDDEN","REAL_PROVIDER_INPUT_FORBIDDEN","SCENARIO_ORDER_INVALID","CANONICALIZATION_FAILURE"] as const;

export type HarnessOutcome=(typeof HARNESS_OUTCOMES)[number];
export type ScenarioKind=(typeof SCENARIO_KINDS)[number];
export type HarnessFailureCode=(typeof HARNESS_FAILURE_CODES)[number];

export interface SyntheticFixture{
  fixtureId:string;
  source:"SYNTHETIC";
  payload:Readonly<Record<string,unknown>>;
  realCandidate:false;
  realProvider:false;
}

export interface ScenarioOracle{
  expectedOutcome?:string;
  expectedErrorCode?:string;
  expectedFailedGates?:readonly string[];
  expectedBlockingFindings?:readonly string[];
  requireOperationalEffectFalse:true;
  verifyTransientSeal:boolean;
}

export interface HarnessScenario{
  scenarioId:string;
  kind:ScenarioKind;
  fixture:SyntheticFixture;
  oracle:ScenarioOracle;
  repeat:number;
  clock:string;
}

export interface HarnessPlan{
  planId:string;
  authorized:true;
  scope:"SYNTHETIC_DRY_RUN_HARNESS_FOUNDATION";
  scenarios:readonly HarnessScenario[];
  repositoryFingerprintBefore:string;
  repositoryFingerprintAfter:string;
  networkRequested?:boolean;
  processExecutionRequested?:boolean;
  persistenceRequested?:boolean;
  operationalHarnessExecutionRequested?:boolean;
}

export interface ExecutionProjection{
  outcome:string;
  failedGates:readonly string[];
  blockingFindings:readonly string[];
  canonicalProjection:string;
  transientSeal:string;
  operationalEffect:false;
}

export interface CapturedScenarioResult{
  scenarioId:string;
  kind:ScenarioKind;
  status:"PASS"|"FAIL";
  repetitions:number;
  projection:ExecutionProjection|undefined;
  errorCode:string|undefined;
  oracleFailures:readonly string[];
  canonicalCapture:string;
  captureSeal:string;
}

export interface HarnessRunResult{
  planId:string;
  status:"PASS"|"FAIL";
  scenarioResults:readonly CapturedScenarioResult[];
  canonicalResult:string;
  resultSeal:string;
  operationalEffect:false;
  persisted:false;
  cleanupVerified:true;
}

export type SyntheticExecutor=(
  fixture:SyntheticFixture,
  clock:string
)=>ExecutionProjection;

export class DryRunHarnessFoundationError extends Error{
  readonly code:HarnessFailureCode;

  constructor(
    code:HarnessFailureCode,
    message:string,
  ){
    super(message);
    this.name="DryRunHarnessFoundationError";
    this.code=code;
  }
}

const ID=/^[A-Za-z][A-Za-z0-9._:-]{2,127}$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function fail(
  code:HarnessFailureCode,
  message:string,
):never{
  throw new DryRunHarnessFoundationError(
    code,
    message,
  );
}

function stable(
  value:unknown,
):unknown{
  if(Array.isArray(value)){
    return value.map(stable);
  }

  if(
    value
    && typeof value==="object"
  ){
    const output:Record<string,unknown>={};

    for(
      const key
      of Object.keys(
        value as Record<string,unknown>
      ).sort()
    ){
      output[key]=stable(
        (value as Record<string,unknown>)[key]
      );
    }

    return output;
  }

  return value;
}

export function canonicalizeHarnessValue(
  value:unknown,
):string{
  try{
    return JSON.stringify(
      stable(value)
    );
  }catch{
    fail(
      "CANONICALIZATION_FAILURE",
      "Harness canonicalization failed.",
    );
  }
}

export function transientHarnessSeal(
  canonical:string,
):string{
  let hash=BigInt(
    "14695981039346656037"
  );

  const prime=BigInt(
    "1099511628211"
  );

  for(
    const byte
    of new TextEncoder().encode(
      canonical
    )
  ){
    hash^=BigInt(byte);
    hash=BigInt.asUintN(
      64,
      hash*prime,
    );
  }

  return (
    "FNV1A64:"
    + hash
      .toString(16)
      .padStart(
        16,
        "0",
      )
  );
}

function sorted(
  values:readonly string[],
):string[]{
  return [
    ...values,
  ].sort();
}

function errorCode(
  value:unknown,
):string|undefined{
  if(
    value
    && typeof value==="object"
    && "code" in value
  ){
    const code=(
      value as {
        code?:unknown;
      }
    ).code;

    return (
      typeof code==="string"
      ? code
      : undefined
    );
  }

  return undefined;
}

export function validateHarnessScenario(
  value:HarnessScenario,
):void{
  if(!ID.test(value.scenarioId)){
    fail(
      "SCENARIO_ID_INVALID",
      "Invalid scenario identity.",
    );
  }

  if(
    !SCENARIO_KINDS.includes(
      value.kind
    )
  ){
    fail(
      "SCENARIO_KIND_INVALID",
      "Invalid scenario kind.",
    );
  }

  if(!ID.test(value.fixture.fixtureId)){
    fail(
      "FIXTURE_ID_INVALID",
      "Invalid fixture identity.",
    );
  }

  if(
    value.fixture.source
    !== "SYNTHETIC"
  ){
    fail(
      "FIXTURE_SOURCE_INVALID",
      "Only synthetic fixtures are permitted.",
    );
  }

  if(value.fixture.realCandidate){
    fail(
      "REAL_CANDIDATE_FIXTURE_FORBIDDEN",
      "Real candidate fixtures are forbidden.",
    );
  }

  if(value.fixture.realProvider){
    fail(
      "REAL_PROVIDER_INPUT_FORBIDDEN",
      "Real provider fixtures are forbidden.",
    );
  }

  if(
    !Number.isInteger(value.repeat)
    || value.repeat<1
    || value.repeat>20
  ){
    fail(
      "REPEAT_COUNT_INVALID",
      "Repeat count must be 1 through 20.",
    );
  }

  if(
    !ISO.test(value.clock)
    || !Number.isFinite(
      Date.parse(value.clock)
    )
  ){
    fail(
      "CLOCK_INVALID",
      "Scenario clock must be a valid UTC timestamp.",
    );
  }

  if(
    value.oracle
      .requireOperationalEffectFalse
    !== true
  ){
    fail(
      "ORACLE_INVALID",
      "Oracle must require operationalEffect false.",
    );
  }

  if(
    value.oracle.expectedOutcome
    === undefined
    && value.oracle.expectedErrorCode
    === undefined
  ){
    fail(
      "ORACLE_INVALID",
      "Oracle must define an expected outcome or error code.",
    );
  }
}

function prohibitPlanEffects(
  plan:HarnessPlan,
):void{
  if(plan.networkRequested){
    fail(
      "NETWORK_ACCESS_FORBIDDEN",
      "Network access is forbidden.",
    );
  }

  if(plan.processExecutionRequested){
    fail(
      "PROCESS_EXECUTION_FORBIDDEN",
      "Process execution is forbidden.",
    );
  }

  if(plan.persistenceRequested){
    fail(
      "PERSISTENT_RESULT_FORBIDDEN",
      "Persistent result capture is forbidden.",
    );
  }

  if(
    plan.operationalHarnessExecutionRequested
  ){
    fail(
      "HARNESS_EXECUTION_FORBIDDEN",
      "Operational Harness execution is forbidden.",
    );
  }

  if(
    plan.repositoryFingerprintBefore
    !== plan.repositoryFingerprintAfter
  ){
    fail(
      "REPOSITORY_MUTATION_DETECTED",
      "Repository fingerprint changed.",
    );
  }
}

function compareOracle(
  oracle:ScenarioOracle,
  projection:ExecutionProjection|undefined,
  capturedErrorCode:string|undefined,
):string[]{
  const failures:string[]=[];

  if(
    oracle.expectedErrorCode
    !== undefined
  ){
    if(
      capturedErrorCode
      !== oracle.expectedErrorCode
    ){
      failures.push(
        "ERROR_CODE_MISMATCH"
      );
    }
  }else if(
    capturedErrorCode
    !== undefined
  ){
    failures.push(
      "ERROR_CODE_MISMATCH"
    );
  }

  if(
    oracle.expectedOutcome
    !== undefined
    && projection?.outcome
    !== oracle.expectedOutcome
  ){
    failures.push(
      "OUTCOME_MISMATCH"
    );
  }

  if(
    oracle.expectedFailedGates
    !== undefined
    && JSON.stringify(
      sorted(
        projection?.failedGates
        ?? []
      )
    )
    !== JSON.stringify(
      sorted(
        oracle.expectedFailedGates
      )
    )
  ){
    failures.push(
      "FAILED_GATES_MISMATCH"
    );
  }

  if(
    oracle.expectedBlockingFindings
    !== undefined
    && JSON.stringify(
      sorted(
        projection?.blockingFindings
        ?? []
      )
    )
    !== JSON.stringify(
      sorted(
        oracle.expectedBlockingFindings
      )
    )
  ){
    failures.push(
      "BLOCKING_FINDINGS_MISMATCH"
    );
  }

  if(
    projection
    && projection.operationalEffect
    !== false
  ){
    failures.push(
      "OPERATIONAL_EFFECT_DETECTED"
    );
  }

  if(
    projection
    && oracle.verifyTransientSeal
    && transientHarnessSeal(
      projection.canonicalProjection
    )
    !== projection.transientSeal
  ){
    failures.push(
      "TRANSIENT_SEAL_INVALID"
    );
  }

  return failures;
}

export function executeSyntheticScenario(
  scenario:HarnessScenario,
  executor:SyntheticExecutor,
):CapturedScenarioResult{
  validateHarnessScenario(
    scenario
  );

  if(typeof executor!=="function"){
    fail(
      "EXECUTOR_MISSING",
      "Synthetic executor is required.",
    );
  }

  let baseline:string|undefined;
  let projection:ExecutionProjection|undefined;
  let capturedErrorCode:string|undefined;

  for(
    let index=0;
    index<scenario.repeat;
    index+=1
  ){
    let currentProjection:
      ExecutionProjection|undefined;

    let currentErrorCode:
      string|undefined;

    try{
      currentProjection=executor(
        scenario.fixture,
        scenario.clock,
      );
    }catch(error){
      currentErrorCode=(
        errorCode(error)
        ?? "UNKNOWN_ERROR"
      );
    }

    const current=canonicalizeHarnessValue({
      projection:currentProjection,
      errorCode:currentErrorCode,
    });

    if(baseline===undefined){
      baseline=current;
    }else if(current!==baseline){
      fail(
        "NON_DETERMINISTIC_RESULT",
        "Repeated scenario results diverged.",
      );
    }

    projection=currentProjection;
    capturedErrorCode=currentErrorCode;
  }

  const oracleFailures=compareOracle(
    scenario.oracle,
    projection,
    capturedErrorCode,
  );

  const captureBase={
    scenarioId:scenario.scenarioId,
    kind:scenario.kind,
    status:(
      oracleFailures.length
      ? "FAIL" as const
      : "PASS" as const
    ),
    repetitions:scenario.repeat,
    projection,
    errorCode:capturedErrorCode,
    oracleFailures:
      oracleFailures.slice().sort(),
  };

  const canonicalCapture=
    canonicalizeHarnessValue(
      captureBase
    );

  return {
    ...captureBase,
    canonicalCapture,
    captureSeal:
      transientHarnessSeal(
        canonicalCapture
      ),
  };
}

export function verifyCapturedScenarioResult(
  value:CapturedScenarioResult,
):void{
  if(
    transientHarnessSeal(
      value.canonicalCapture
    )
    !== value.captureSeal
  ){
    fail(
      "TRANSIENT_SEAL_INVALID",
      "Captured scenario seal is invalid.",
    );
  }
}

export function runSyntheticHarnessFoundation(
  plan:HarnessPlan,
  executor:SyntheticExecutor,
):HarnessRunResult{
  if(!ID.test(plan.planId)){
    fail(
      "PLAN_ID_INVALID",
      "Invalid plan identity.",
    );
  }

  if(plan.authorized!==true){
    fail(
      "HARNESS_AUTHORIZATION_MISSING",
      "Harness Foundation authorization is missing.",
    );
  }

  if(
    plan.scope
    !== "SYNTHETIC_DRY_RUN_HARNESS_FOUNDATION"
  ){
    fail(
      "HARNESS_SCOPE_VIOLATION",
      "Harness scope is invalid.",
    );
  }

  prohibitPlanEffects(
    plan
  );

  const identities=
    new Set<string>();

  for(
    const scenario
    of plan.scenarios
  ){
    if(
      identities.has(
        scenario.scenarioId
      )
    ){
      fail(
        "SCENARIO_DUPLICATE",
        "Duplicate scenario identity.",
      );
    }

    identities.add(
      scenario.scenarioId
    );
  }

  const ordered=[
    ...plan.scenarios,
  ].sort(
    (
      left,
      right,
    ) => left.scenarioId.localeCompare(
      right.scenarioId
    )
  );

  const scenarioResults=
    ordered.map(
      scenario =>
        executeSyntheticScenario(
          scenario,
          executor,
        )
    );

  for(
    const result
    of scenarioResults
  ){
    verifyCapturedScenarioResult(
      result
    );
  }

  const base={
    planId:plan.planId,
    status:(
      scenarioResults.every(
        value =>
          value.status==="PASS"
      )
      ? "PASS" as const
      : "FAIL" as const
    ),
    scenarioResults,
    operationalEffect:false as const,
    persisted:false as const,
    cleanupVerified:true as const,
  };

  const canonicalResult=
    canonicalizeHarnessValue(
      base
    );

  return {
    ...base,
    canonicalResult,
    resultSeal:
      transientHarnessSeal(
        canonicalResult
      ),
  };
}

export function verifyHarnessRunResult(
  value:HarnessRunResult,
):void{
  if(
    value.operationalEffect
    !== false
  ){
    fail(
      "OPERATIONAL_EFFECT_DETECTED",
      "Operational effect detected.",
    );
  }

  if(
    value.persisted
    !== false
  ){
    fail(
      "PERSISTENT_RESULT_FORBIDDEN",
      "Persisted Harness result detected.",
    );
  }

  if(
    value.cleanupVerified
    !== true
  ){
    fail(
      "CLEANUP_LEAK_DETECTED",
      "Cleanup verification failed.",
    );
  }

  if(
    transientHarnessSeal(
      value.canonicalResult
    )
    !== value.resultSeal
  ){
    fail(
      "TRANSIENT_SEAL_INVALID",
      "Harness result seal is invalid.",
    );
  }
}

export function executeOperationalDryRunHarness():never{
  return fail(
    "HARNESS_EXECUTION_FORBIDDEN",
    "Operational dry-run Harness execution remains unauthorized.",
  );
}

export function persistDryRunHarnessResult():never{
  return fail(
    "PERSISTENT_RESULT_FORBIDDEN",
    "Persistent Harness results remain unauthorized.",
  );
}

export function ingestRealCandidateFixture():never{
  return fail(
    "REAL_CANDIDATE_FIXTURE_FORBIDDEN",
    "Real candidate fixtures remain unauthorized.",
  );
}
