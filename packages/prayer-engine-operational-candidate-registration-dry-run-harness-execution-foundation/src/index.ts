export const HARNESS_EXECUTION_DESIGN_DOMAINS=["Execution Authorization and Scope","Execution Request Envelope","Synthetic Plan and Bundle Identity","Scenario Catalog Admission","Fixture and Oracle Admission","Executor Binding","Isolation Workspace","Clock and Repeatability","Resource and Time Budgets","Deterministic Ordering","Scenario Execution Control","Result Capture","Oracle Evaluation","Transient Seal Verification","Failure and Quarantine Handling","Cleanup and Leak Detection","Replay and Audit Projection","Repository Non-Mutation and Publication Boundary"] as const;
export const HARNESS_EXECUTION_PHASES=["HX-01_AUTHORIZATION_SEAL_VERIFICATION","HX-02_EXECUTION_REQUEST_ADMISSION","HX-03_SYNTHETIC_BUNDLE_IDENTITY_VERIFICATION","HX-04_PLAN_AND_SCENARIO_CATALOG_ADMISSION","HX-05_FIXTURE_AND_ORACLE_ADMISSION","HX-06_EXECUTOR_BINDING_VERIFICATION","HX-07_ISOLATED_WORKSPACE_PREPARATION","HX-08_CLOCK_AND_REPETITION_FREEZE","HX-09_RESOURCE_BUDGET_ADMISSION","HX-10_DETERMINISTIC_SCENARIO_ORDERING","HX-11_SCENARIO_INVOCATION_PROJECTION","HX-12_PER_RUN_RESULT_CAPTURE","HX-13_ORACLE_EVALUATION","HX-14_TRANSIENT_SEAL_VERIFICATION","HX-15_FAILURE_OR_QUARANTINE_PROJECTION","HX-16_AGGREGATE_RESULT_PROJECTION","HX-17_CLEANUP_AND_LEAK_VERIFICATION","HX-18_REPLAY_AND_AUDIT_PROJECTION","HX-19_INDEPENDENT_EXECUTION_DECISION_PROJECTION"] as const;
export const HARNESS_EXECUTION_GATES=["HG-01","HG-02","HG-03","HG-04","HG-05","HG-06","HG-07","HG-08","HG-09","HG-10","HG-11","HG-12","HG-13","HG-14","HG-15","HG-16","HG-17","HG-18"] as const;
export const HARNESS_EXECUTION_OUTCOMES=["EXECUTION_REQUEST_REJECTED","BUNDLE_REJECTED","SCENARIO_QUARANTINED","HARNESS_PASS_PROJECTED","HARNESS_FAIL_PROJECTED","CLEANUP_FAILED_PROJECTED","REPLAY_MISMATCH_PROJECTED","REVALIDATION_REQUIRED"] as const;
export const HARNESS_EXECUTION_FAILURE_CODES=["EXECUTION_AUTHORIZATION_MISSING","EXECUTION_SCOPE_VIOLATION","REQUEST_ID_INVALID","REQUESTER_ID_INVALID","REVIEWER_ID_INVALID","REQUESTER_REVIEWER_CONFLICT","REQUEST_EXPIRED","DRY_RUN_ONLY_VIOLATION","BUNDLE_ID_INVALID","BUNDLE_REVISION_INVALID","BUNDLE_SEAL_MISMATCH","BUNDLE_EXPIRED","BUNDLE_SYNTHETIC_ONLY_REQUIRED","SCENARIO_CATALOG_EMPTY","SCENARIO_DUPLICATE","FIXTURE_DUPLICATE","ORACLE_DUPLICATE","REAL_CANDIDATE_FIXTURE_FORBIDDEN","REAL_PROVIDER_FIXTURE_FORBIDDEN","EXECUTOR_ID_INVALID","EXECUTOR_SEAL_MISMATCH","WORKSPACE_ID_INVALID","WORKSPACE_NOT_ISOLATED","WORKSPACE_NOT_EPHEMERAL","CLOCK_INVALID","REPETITION_BUDGET_INVALID","SCENARIO_TIME_BUDGET_INVALID","TOTAL_TIME_BUDGET_INVALID","MEMORY_BUDGET_INVALID","SCENARIO_ORDER_INVALID","ORACLE_INCOMPLETE","TRANSIENT_SEAL_INVALID","REPLAY_MISMATCH","CLEANUP_NOT_VERIFIED","LEAK_DETECTED","REPOSITORY_MUTATION_DETECTED","OPERATIONAL_EFFECT_DETECTED","EXECUTABLE_BUNDLE_CREATION_FORBIDDEN","OPERATIONAL_HARNESS_EXECUTION_FORBIDDEN","PERSISTENT_RESULT_FORBIDDEN","PERSISTENT_DECISION_FORBIDDEN","PERSISTENT_SEAL_FORBIDDEN","NETWORK_ACCESS_FORBIDDEN","PROCESS_EXECUTION_FORBIDDEN","CANDIDATE_EXECUTION_FORBIDDEN","CANONICALIZATION_FAILURE"] as const;

export type HarnessExecutionOutcome=(typeof HARNESS_EXECUTION_OUTCOMES)[number];
export type HarnessExecutionFailureCode=(typeof HARNESS_EXECUTION_FAILURE_CODES)[number];

export interface HarnessExecutionRequest{
  requestId:string;
  requesterId:string;
  reviewerId:string;
  authorized:true;
  scope:"SYNTHETIC_HARNESS_EXECUTION_FOUNDATION";
  issuedAt:string;
  expiresAt:string;
  bundleId:string;
  bundleRevisionId:string;
  expectedBundleSeal:string;
  dryRunOnly:true;
}

export interface SyntheticScenarioProjection{
  scenarioId:string;
  fixtureId:string;
  oracleId:string;
  order:number;
  repeat:number;
  clock:string;
}

export interface SyntheticExecutionBundleProjection{
  bundleId:string;
  revisionId:string;
  syntheticOnly:true;
  scenarios:readonly SyntheticScenarioProjection[];
  fixtureIds:readonly string[];
  oracleIds:readonly string[];
  contentSeal:string;
  expiresAt:string;
  realCandidateContent:false;
  realProviderContent:false;
}

export interface ExecutionWorkspaceProjection{
  workspaceId:string;
  isolated:true;
  ephemeral:true;
  cleanupRequired:true;
  cleanupVerified:boolean;
  leaksDetected:readonly string[];
}

export interface ExecutionBudgetProjection{
  maxRepeat:number;
  maxScenarioMillis:number;
  maxTotalMillis:number;
  maxMemoryBytes:number;
}

export interface ExecutorBindingProjection{
  executorId:string;
  executorSeal:string;
  expectedExecutorSeal:string;
  syntheticOnly:true;
}

export interface HarnessExecutionFoundationInput{
  request:HarnessExecutionRequest;
  bundle:SyntheticExecutionBundleProjection;
  workspace:ExecutionWorkspaceProjection;
  budgets:ExecutionBudgetProjection;
  executor:ExecutorBindingProjection;
  repositoryFingerprintBefore:string;
  repositoryFingerprintAfter:string;
  now:string;
  executableBundleCreationRequested?:boolean;
  operationalHarnessExecutionRequested?:boolean;
  persistenceRequested?:boolean;
  persistentDecisionRequested?:boolean;
  persistentSealRequested?:boolean;
  networkRequested?:boolean;
  processExecutionRequested?:boolean;
  candidateExecutionRequested?:boolean;
}

export interface HarnessExecutionProjection{
  requestId:string;
  bundleId:string;
  bundleRevisionId:string;
  outcome:HarnessExecutionOutcome;
  scenarioOrder:readonly string[];
  projectedScenarioCount:number;
  projectedInvocationCount:number;
  scenariosExecuted:0;
  executableBundleCreated:false;
  operationalEffect:false;
  persisted:false;
  cleanupRequired:true;
  cleanupVerified:boolean;
  canonicalProjection:string;
  transientSeal:string;
}

export interface ReplayProjection{
  outcome:"HARNESS_PASS_PROJECTED"|"REPLAY_MISMATCH_PROJECTED";
  matches:boolean;
  canonicalProjection:string;
  transientSeal:string;
  operationalEffect:false;
}

export class HarnessExecutionFoundationError extends Error{
  readonly code:HarnessExecutionFailureCode;

  constructor(
    code:HarnessExecutionFailureCode,
    message:string,
  ){
    super(message);
    this.name="HarnessExecutionFoundationError";
    this.code=code;
  }
}

const ID=/^[A-Za-z][A-Za-z0-9._:-]{2,127}$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function fail(
  code:HarnessExecutionFailureCode,
  message:string,
):never{
  throw new HarnessExecutionFoundationError(
    code,
    message,
  );
}

function timestamp(
  value:string,
  code:HarnessExecutionFailureCode,
):number{
  if(!ISO.test(value)){
    fail(code,"Invalid UTC timestamp.");
  }

  const parsed=Date.parse(value);

  if(!Number.isFinite(parsed)){
    fail(code,"Invalid UTC timestamp.");
  }

  return parsed;
}

function stable(
  value:unknown,
):unknown{
  if(Array.isArray(value)){
    return value.map(stable);
  }

  if(value&&typeof value==="object"){
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

export function canonicalizeHarnessExecutionValue(
  value:unknown,
):string{
  try{
    return JSON.stringify(stable(value));
  }catch{
    fail(
      "CANONICALIZATION_FAILURE",
      "Harness execution canonicalization failed.",
    );
  }
}

export function transientHarnessExecutionSeal(
  canonical:string,
):string{
  let hash=BigInt("14695981039346656037");
  const prime=BigInt("1099511628211");

  for(
    const byte
    of new TextEncoder().encode(canonical)
  ){
    hash^=BigInt(byte);
    hash=BigInt.asUintN(64,hash*prime);
  }

  return "FNV1A64:"+hash.toString(16).padStart(16,"0");
}

export function validateHarnessExecutionRequest(
  value:HarnessExecutionRequest,
  now:string,
):void{
  if(!ID.test(value.requestId)){
    fail("REQUEST_ID_INVALID","Invalid request identity.");
  }

  if(!ID.test(value.requesterId)){
    fail("REQUESTER_ID_INVALID","Invalid requester identity.");
  }

  if(!ID.test(value.reviewerId)){
    fail("REVIEWER_ID_INVALID","Invalid reviewer identity.");
  }

  if(value.requesterId===value.reviewerId){
    fail("REQUESTER_REVIEWER_CONFLICT","Requester and reviewer must differ.");
  }

  if(value.authorized!==true){
    fail("EXECUTION_AUTHORIZATION_MISSING","Execution Foundation authorization is missing.");
  }

  if(value.scope!=="SYNTHETIC_HARNESS_EXECUTION_FOUNDATION"){
    fail("EXECUTION_SCOPE_VIOLATION","Execution Foundation scope is invalid.");
  }

  if(value.dryRunOnly!==true){
    fail("DRY_RUN_ONLY_VIOLATION","Only dry-run projection is permitted.");
  }

  if(!ID.test(value.bundleId)){
    fail("BUNDLE_ID_INVALID","Invalid bundle identity.");
  }

  if(!ID.test(value.bundleRevisionId)){
    fail("BUNDLE_REVISION_INVALID","Invalid bundle revision identity.");
  }

  const issued=timestamp(value.issuedAt,"REQUEST_EXPIRED");
  const expires=timestamp(value.expiresAt,"REQUEST_EXPIRED");
  const current=timestamp(now,"REQUEST_EXPIRED");

  if(issued>current||expires<=current||expires<=issued){
    fail("REQUEST_EXPIRED","Request time window is invalid or expired.");
  }
}

export function validateSyntheticExecutionBundle(
  value:SyntheticExecutionBundleProjection,
  request:HarnessExecutionRequest,
  now:string,
):void{
  if(!ID.test(value.bundleId)||value.bundleId!==request.bundleId){
    fail("BUNDLE_ID_INVALID","Bundle identity mismatch.");
  }

  if(!ID.test(value.revisionId)||value.revisionId!==request.bundleRevisionId){
    fail("BUNDLE_REVISION_INVALID","Bundle revision mismatch.");
  }

  if(value.syntheticOnly!==true){
    fail("BUNDLE_SYNTHETIC_ONLY_REQUIRED","Bundle must be synthetic only.");
  }

  if(value.realCandidateContent){
    fail("REAL_CANDIDATE_FIXTURE_FORBIDDEN","Real candidate content is forbidden.");
  }

  if(value.realProviderContent){
    fail("REAL_PROVIDER_FIXTURE_FORBIDDEN","Real provider content is forbidden.");
  }

  if(value.contentSeal!==request.expectedBundleSeal){
    fail("BUNDLE_SEAL_MISMATCH","Bundle seal mismatch.");
  }

  if(timestamp(value.expiresAt,"BUNDLE_EXPIRED")<=timestamp(now,"BUNDLE_EXPIRED")){
    fail("BUNDLE_EXPIRED","Bundle is expired.");
  }

  if(value.scenarios.length===0){
    fail("SCENARIO_CATALOG_EMPTY","Scenario catalog is empty.");
  }

  const scenarioIds=new Set<string>();
  const fixtureIds=new Set<string>();
  const oracleIds=new Set<string>();
  const orders=new Set<number>();

  for(const scenario of value.scenarios){
    if(!ID.test(scenario.scenarioId)){
      fail("SCENARIO_ORDER_INVALID","Invalid scenario identity.");
    }

    if(scenarioIds.has(scenario.scenarioId)){
      fail("SCENARIO_DUPLICATE","Duplicate scenario identity.");
    }

    scenarioIds.add(scenario.scenarioId);

    if(!ID.test(scenario.fixtureId)||fixtureIds.has(scenario.fixtureId)){
      fail("FIXTURE_DUPLICATE","Fixture identities must be valid and unique.");
    }

    fixtureIds.add(scenario.fixtureId);

    if(!ID.test(scenario.oracleId)||oracleIds.has(scenario.oracleId)){
      fail("ORACLE_DUPLICATE","Oracle identities must be valid and unique.");
    }

    oracleIds.add(scenario.oracleId);

    if(!Number.isInteger(scenario.order)||scenario.order<1||orders.has(scenario.order)){
      fail("SCENARIO_ORDER_INVALID","Scenario order must be positive and unique.");
    }

    orders.add(scenario.order);

    if(!Number.isInteger(scenario.repeat)||scenario.repeat<1){
      fail("REPETITION_BUDGET_INVALID","Scenario repetition must be positive.");
    }

    timestamp(scenario.clock,"CLOCK_INVALID");
  }

  const expectedOrders=Array.from(
    {length:value.scenarios.length},
    (_,index)=>index+1,
  );

  if(JSON.stringify([...orders].sort((a,b)=>a-b))!==JSON.stringify(expectedOrders)){
    fail("SCENARIO_ORDER_INVALID","Scenario order must be contiguous.");
  }

  if(JSON.stringify([...fixtureIds].sort())!==JSON.stringify([...value.fixtureIds].sort())){
    fail("FIXTURE_DUPLICATE","Fixture catalog does not match scenarios.");
  }

  if(JSON.stringify([...oracleIds].sort())!==JSON.stringify([...value.oracleIds].sort())){
    fail("ORACLE_INCOMPLETE","Oracle catalog does not match scenarios.");
  }
}

export function validateExecutionWorkspace(
  value:ExecutionWorkspaceProjection,
):void{
  if(!ID.test(value.workspaceId)){
    fail("WORKSPACE_ID_INVALID","Invalid workspace identity.");
  }

  if(value.isolated!==true){
    fail("WORKSPACE_NOT_ISOLATED","Workspace must be isolated.");
  }

  if(value.ephemeral!==true){
    fail("WORKSPACE_NOT_EPHEMERAL","Workspace must be ephemeral.");
  }

  if(value.cleanupRequired!==true||value.cleanupVerified!==true){
    fail("CLEANUP_NOT_VERIFIED","Cleanup must be required and verified.");
  }

  if(value.leaksDetected.length>0){
    fail("LEAK_DETECTED","Workspace leak detected.");
  }
}

export function validateExecutionBudgets(
  value:ExecutionBudgetProjection,
  bundle:SyntheticExecutionBundleProjection,
):void{
  if(!Number.isInteger(value.maxRepeat)||value.maxRepeat<1||value.maxRepeat>20){
    fail("REPETITION_BUDGET_INVALID","Repeat budget must be 1 through 20.");
  }

  if(!Number.isInteger(value.maxScenarioMillis)||value.maxScenarioMillis<1||value.maxScenarioMillis>60000){
    fail("SCENARIO_TIME_BUDGET_INVALID","Scenario time budget is invalid.");
  }

  if(!Number.isInteger(value.maxTotalMillis)||value.maxTotalMillis<value.maxScenarioMillis||value.maxTotalMillis>600000){
    fail("TOTAL_TIME_BUDGET_INVALID","Total time budget is invalid.");
  }

  if(!Number.isInteger(value.maxMemoryBytes)||value.maxMemoryBytes<1048576||value.maxMemoryBytes>1073741824){
    fail("MEMORY_BUDGET_INVALID","Memory budget is invalid.");
  }

  const repetitions=bundle.scenarios.reduce(
    (total,scenario)=>total+scenario.repeat,
    0,
  );

  if(bundle.scenarios.some(scenario=>scenario.repeat>value.maxRepeat)){
    fail("REPETITION_BUDGET_INVALID","Scenario repeat exceeds budget.");
  }

  if(repetitions*value.maxScenarioMillis>value.maxTotalMillis){
    fail("TOTAL_TIME_BUDGET_INVALID","Projected invocations exceed total time budget.");
  }
}

export function validateExecutorBinding(
  value:ExecutorBindingProjection,
):void{
  if(!ID.test(value.executorId)){
    fail("EXECUTOR_ID_INVALID","Invalid executor identity.");
  }

  if(value.syntheticOnly!==true){
    fail("BUNDLE_SYNTHETIC_ONLY_REQUIRED","Executor binding must be synthetic only.");
  }

  if(value.executorSeal!==value.expectedExecutorSeal){
    fail("EXECUTOR_SEAL_MISMATCH","Executor seal mismatch.");
  }
}

function prohibitOperationalEffects(
  input:HarnessExecutionFoundationInput,
):void{
  if(input.executableBundleCreationRequested){
    fail("EXECUTABLE_BUNDLE_CREATION_FORBIDDEN","Executable bundle creation is forbidden.");
  }

  if(input.operationalHarnessExecutionRequested){
    fail("OPERATIONAL_HARNESS_EXECUTION_FORBIDDEN","Operational Harness execution is forbidden.");
  }

  if(input.persistenceRequested){
    fail("PERSISTENT_RESULT_FORBIDDEN","Persistent result creation is forbidden.");
  }

  if(input.persistentDecisionRequested){
    fail("PERSISTENT_DECISION_FORBIDDEN","Persistent decision creation is forbidden.");
  }

  if(input.persistentSealRequested){
    fail("PERSISTENT_SEAL_FORBIDDEN","Persistent seal creation is forbidden.");
  }

  if(input.networkRequested){
    fail("NETWORK_ACCESS_FORBIDDEN","Network access is forbidden.");
  }

  if(input.processExecutionRequested){
    fail("PROCESS_EXECUTION_FORBIDDEN","Process execution is forbidden.");
  }

  if(input.candidateExecutionRequested){
    fail("CANDIDATE_EXECUTION_FORBIDDEN","Candidate execution is forbidden.");
  }

  if(input.repositoryFingerprintBefore!==input.repositoryFingerprintAfter){
    fail("REPOSITORY_MUTATION_DETECTED","Repository fingerprint changed.");
  }
}

export function projectHarnessExecutionFoundation(
  input:HarnessExecutionFoundationInput,
):HarnessExecutionProjection{
  prohibitOperationalEffects(input);
  validateHarnessExecutionRequest(input.request,input.now);
  validateSyntheticExecutionBundle(input.bundle,input.request,input.now);
  validateExecutionWorkspace(input.workspace);
  validateExecutionBudgets(input.budgets,input.bundle);
  validateExecutorBinding(input.executor);

  const ordered=[...input.bundle.scenarios].sort(
    (left,right)=>left.order-right.order,
  );

  const scenarioOrder=ordered.map(value=>value.scenarioId);
  const projectedInvocationCount=ordered.reduce(
    (total,value)=>total+value.repeat,
    0,
  );

  const base={
    requestId:input.request.requestId,
    bundleId:input.bundle.bundleId,
    bundleRevisionId:input.bundle.revisionId,
    outcome:"HARNESS_PASS_PROJECTED" as const,
    scenarioOrder,
    projectedScenarioCount:ordered.length,
    projectedInvocationCount,
    scenariosExecuted:0 as const,
    executableBundleCreated:false as const,
    operationalEffect:false as const,
    persisted:false as const,
    cleanupRequired:true as const,
    cleanupVerified:input.workspace.cleanupVerified,
  };

  const canonicalProjection=canonicalizeHarnessExecutionValue(base);

  return {
    ...base,
    canonicalProjection,
    transientSeal:transientHarnessExecutionSeal(canonicalProjection),
  };
}

export function verifyHarnessExecutionProjection(
  value:HarnessExecutionProjection,
):void{
  if(value.operationalEffect!==false){
    fail("OPERATIONAL_EFFECT_DETECTED","Operational effect detected.");
  }

  if(value.persisted!==false){
    fail("PERSISTENT_RESULT_FORBIDDEN","Persisted result detected.");
  }

  if(value.executableBundleCreated!==false){
    fail("EXECUTABLE_BUNDLE_CREATION_FORBIDDEN","Executable bundle was created.");
  }

  if(value.scenariosExecuted!==0){
    fail("OPERATIONAL_HARNESS_EXECUTION_FORBIDDEN","Scenario execution detected.");
  }

  if(value.cleanupRequired&&value.cleanupVerified!==true){
    fail("CLEANUP_NOT_VERIFIED","Cleanup verification is incomplete.");
  }

  if(transientHarnessExecutionSeal(value.canonicalProjection)!==value.transientSeal){
    fail("TRANSIENT_SEAL_INVALID","Harness execution projection seal is invalid.");
  }
}

export function projectHarnessExecutionReplay(
  original:HarnessExecutionProjection,
  replay:HarnessExecutionProjection,
):ReplayProjection{
  verifyHarnessExecutionProjection(original);
  verifyHarnessExecutionProjection(replay);

  const matches=(
    original.canonicalProjection===replay.canonicalProjection
    && original.transientSeal===replay.transientSeal
  );

  const base={
    outcome:(
      matches
      ? "HARNESS_PASS_PROJECTED" as const
      : "REPLAY_MISMATCH_PROJECTED" as const
    ),
    matches,
    operationalEffect:false as const,
  };

  const canonicalProjection=canonicalizeHarnessExecutionValue(base);

  return {
    ...base,
    canonicalProjection,
    transientSeal:transientHarnessExecutionSeal(canonicalProjection),
  };
}

export function executeOperationalDryRunHarness():never{
  return fail(
    "OPERATIONAL_HARNESS_EXECUTION_FORBIDDEN",
    "Operational Harness execution remains unauthorized.",
  );
}

export function materializeExecutableSyntheticBundle():never{
  return fail(
    "EXECUTABLE_BUNDLE_CREATION_FORBIDDEN",
    "Executable synthetic bundle creation remains unauthorized.",
  );
}

export function persistHarnessExecutionResult():never{
  return fail(
    "PERSISTENT_RESULT_FORBIDDEN",
    "Persistent Harness execution results remain unauthorized.",
  );
}

export function ingestRealCandidateOrProviderFixture():never{
  return fail(
    "REAL_CANDIDATE_FIXTURE_FORBIDDEN",
    "Real candidate or provider fixtures remain unauthorized.",
  );
}
