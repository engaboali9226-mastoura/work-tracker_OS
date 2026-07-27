export const CONTROLLED_RUN_REQUEST_EXECUTION_DOMAINS = [
  "Independent Execution Authorization and Request Identity",
  "Stable Foundation Policy and Seal Binding",
  "Synthetic Bundle Materialization Request Boundary",
  "Scenario Catalog Fixture and Oracle Admission",
  "Restricted Executor Callback Binding",
  "Ephemeral Workspace Allocation and Destruction",
  "Deterministic Clock Seed Locale Timezone and Environment",
  "Invocation Plan Materialization",
  "Per-Invocation Execution Boundary",
  "Time Memory Result and Count Budgets",
  "Capture Construction and Canonicalization",
  "Oracle Evaluation and Quarantine",
  "Abort Cancellation and Terminal Semantics",
  "Aggregate Result and Transient Seal Construction",
  "Cleanup Leak Detection and Workspace Destruction",
  "Replay Agreement and Independent Execution Decision",
  "Expiry Revocation Retry and Revalidation",
  "Repository Non-Mutation Persistence and Publication Boundary",
] as const;

export const CONTROLLED_RUN_REQUEST_EXECUTION_PHASES = [
  "CSRX-01_INDEPENDENT_EXECUTION_AUTHORITY_VERIFICATION",
  "CSRX-02_RUN_REQUEST_ENVELOPE_ADMISSION",
  "CSRX-03_STABLE_FOUNDATION_POLICY_AND_SEAL_BINDING",
  "CSRX-04_EXECUTABLE_SYNTHETIC_BUNDLE_REQUEST_ADMISSION",
  "CSRX-05_EXECUTABLE_SYNTHETIC_BUNDLE_MATERIALIZATION",
  "CSRX-06_SCENARIO_CATALOG_FIXTURE_AND_ORACLE_FREEZE",
  "CSRX-07_RESTRICTED_EXECUTOR_CALLBACK_BINDING",
  "CSRX-08_EPHEMERAL_WORKSPACE_ALLOCATION",
  "CSRX-09_CLOCK_SEED_LOCALE_TIMEZONE_AND_ENVIRONMENT_FREEZE",
  "CSRX-10_RESOURCE_BUDGET_ADMISSION",
  "CSRX-11_DETERMINISTIC_INVOCATION_PLAN_MATERIALIZATION",
  "CSRX-12_CONTROLLED_SYNTHETIC_SCENARIO_INVOCATION",
  "CSRX-13_PER_INVOCATION_CAPTURE_CONSTRUCTION",
  "CSRX-14_ORACLE_EVALUATION",
  "CSRX-15_QUARANTINE_ABORT_OR_CANCELLATION",
  "CSRX-16_AGGREGATE_RESULT_CONSTRUCTION",
  "CSRX-17_TRANSIENT_SEAL_VERIFICATION",
  "CSRX-18_CLEANUP_AND_LEAK_VERIFICATION",
  "CSRX-19_WORKSPACE_DESTRUCTION_VERIFICATION",
  "CSRX-20_REPLAY_AGREEMENT_VERIFICATION",
  "CSRX-21_INDEPENDENT_EXECUTION_DECISION",
  "CSRX-22_EXPIRY_REVOCATION_RETRY_AND_REVALIDATION",
] as const;

export const CONTROLLED_RUN_REQUEST_EXECUTION_GATES = [
  "CRXG-01",
  "CRXG-02",
  "CRXG-03",
  "CRXG-04",
  "CRXG-05",
  "CRXG-06",
  "CRXG-07",
  "CRXG-08",
  "CRXG-09",
  "CRXG-10",
  "CRXG-11",
  "CRXG-12",
  "CRXG-13",
  "CRXG-14",
  "CRXG-15",
  "CRXG-16",
  "CRXG-17",
  "CRXG-18",
] as const;

export const CONTROLLED_RUN_REQUEST_EXECUTION_OUTCOMES = [
  "RUN_REQUEST_REJECTED",
  "EXECUTABLE_BUNDLE_REJECTED",
  "RUN_PLAN_NOT_READY",
  "RUN_EXECUTION_ABORTED",
  "RUN_SCENARIO_QUARANTINED",
  "RUN_PASS_PROJECTED",
  "RUN_FAIL_PROJECTED",
  "RUN_BUDGET_EXCEEDED_PROJECTED",
  "RUN_CLEANUP_FAILED_PROJECTED",
  "RUN_REPLAY_MISMATCH_PROJECTED",
  "RUN_REVALIDATION_REQUIRED",
] as const;

export const CONTROLLED_RUN_REQUEST_EXECUTION_FAILURE_CODES = [
  "AUTHORIZATION_MISSING",
  "AUTHORIZATION_PURPOSE_INVALID",
  "AUTHORIZATION_EXPIRED",
  "AUTHORIZATION_REVOKED",
  "AUTHORIZATION_IDENTITY_CONFLICT",
  "REQUEST_ID_INVALID",
  "REQUEST_REVISION_INVALID",
  "REQUEST_SEAL_INVALID",
  "REQUEST_FOUNDATION_SEAL_MISMATCH",
  "REQUEST_REAL_INPUT_FORBIDDEN",
  "REQUEST_OPERATIONAL_REGISTRATION_FORBIDDEN",
  "REQUEST_PERSISTENCE_FORBIDDEN",
  "REQUEST_NETWORK_FORBIDDEN",
  "REQUEST_PROCESS_FORBIDDEN",
  "REQUEST_CANDIDATE_EXECUTION_FORBIDDEN",
  "REQUEST_ADAPTER_EXECUTION_FORBIDDEN",
  "REQUEST_PUBLICATION_FORBIDDEN",
  "BUNDLE_ID_INVALID",
  "BUNDLE_REVISION_INVALID",
  "BUNDLE_SEAL_INVALID",
  "BUNDLE_SYNTHETIC_ONLY_REQUIRED",
  "BUNDLE_CATALOG_NOT_FROZEN",
  "BUNDLE_EMPTY",
  "BUNDLE_EXPIRED",
  "SCENARIO_ID_INVALID",
  "SCENARIO_DUPLICATE",
  "SCENARIO_ORDER_INVALID",
  "SCENARIO_REPEAT_INVALID",
  "FIXTURE_ID_INVALID",
  "FIXTURE_DUPLICATE",
  "ORACLE_ID_INVALID",
  "ORACLE_DUPLICATE",
  "ORACLE_INCOMPLETE",
  "ORACLE_OPERATIONAL_EFFECT_FALSE_REQUIRED",
  "EXECUTOR_ID_INVALID",
  "EXECUTOR_REVISION_INVALID",
  "EXECUTOR_SEAL_INVALID",
  "EXECUTOR_CAPABILITY_INVALID",
  "EXECUTOR_CALLBACK_REQUIRED",
  "EXECUTOR_AMBIENT_AUTHORITY_FORBIDDEN",
  "WORKSPACE_POLICY_ID_INVALID",
  "WORKSPACE_ROOT_INVALID",
  "WORKSPACE_ISOLATION_REQUIRED",
  "WORKSPACE_EPHEMERAL_REQUIRED",
  "WORKSPACE_CLEANUP_REQUIRED",
  "WORKSPACE_DESTRUCTION_REQUIRED",
  "WORKSPACE_ALLOWLIST_INVALID",
  "WORKSPACE_CREDENTIAL_ISOLATION_REQUIRED",
  "ENVIRONMENT_CLOCK_INVALID",
  "ENVIRONMENT_SEED_INVALID",
  "ENVIRONMENT_LOCALE_INVALID",
  "ENVIRONMENT_TIMEZONE_INVALID",
  "ENVIRONMENT_VARIABLE_INVALID",
  "BUDGET_SCENARIO_INVALID",
  "BUDGET_REPEAT_INVALID",
  "BUDGET_SCENARIO_TIME_INVALID",
  "BUDGET_TOTAL_TIME_INVALID",
  "BUDGET_MEMORY_INVALID",
  "BUDGET_RESULT_SIZE_INVALID",
  "BUDGET_CAPTURE_COUNT_INVALID",
  "BUDGET_OUTPUT_COUNT_INVALID",
  "FOUNDATION_ID_INVALID",
  "FOUNDATION_REVISION_INVALID",
  "FOUNDATION_SEAL_INVALID",
  "FOUNDATION_REQUEST_BINDING_INVALID",
  "FOUNDATION_BUNDLE_BINDING_INVALID",
  "FOUNDATION_EXECUTOR_BINDING_INVALID",
  "FOUNDATION_WORKSPACE_BINDING_INVALID",
  "FOUNDATION_ENVIRONMENT_BINDING_INVALID",
  "LIFECYCLE_PROJECTION_ID_INVALID",
  "LIFECYCLE_PROJECTION_NONDETERMINISTIC",
  "SUPPLIED_CAPTURE_ID_INVALID",
  "SUPPLIED_CAPTURE_SCENARIO_INVALID",
  "SUPPLIED_CAPTURE_REPETITION_INVALID",
  "SUPPLIED_CAPTURE_SEAL_INVALID",
  "SUPPLIED_CAPTURE_OPERATIONAL_EFFECT_DETECTED",
  "SUPPLIED_CAPTURE_PAYLOAD_INVALID",
  "TERMINAL_DISPOSITION_INVALID",
  "CLEANUP_NOT_VERIFIED",
  "WORKSPACE_NOT_DESTROYED",
  "LEAK_DETECTED",
  "CANONICALIZATION_FAILURE",
  "REQUEST_CREATION_FORBIDDEN",
  "BUNDLE_MATERIALIZATION_FORBIDDEN",
  "WORKSPACE_ALLOCATION_FORBIDDEN",
  "INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN",
  "SCENARIO_EXECUTION_FORBIDDEN",
  "CAPTURE_CONSTRUCTION_FORBIDDEN",
  "RESULT_CONSTRUCTION_FORBIDDEN",
  "PERSISTENCE_FORBIDDEN",
  "NETWORK_ACCESS_FORBIDDEN",
  "PROCESS_EXECUTION_FORBIDDEN",
  "CANDIDATE_EXECUTION_FORBIDDEN",
  "ADAPTER_EXECUTION_FORBIDDEN",
  "STAGE_FORBIDDEN",
  "COMMIT_FORBIDDEN",
  "TAG_FORBIDDEN",
  "PUSH_FORBIDDEN",
] as const;

export type FailureCode=(typeof CONTROLLED_RUN_REQUEST_EXECUTION_FAILURE_CODES)[number];
export type Outcome=(typeof CONTROLLED_RUN_REQUEST_EXECUTION_OUTCOMES)[number];
type Obj=Readonly<Record<string,unknown>>;
export class ControlledRunRequestExecutionFoundationError extends Error{readonly code:FailureCode;constructor(code:FailureCode,message:string){super(message);this.name="ControlledRunRequestExecutionFoundationError";this.code=code}}
export type Authority={authorizationId:string;requesterId:string;executorOwnerId:string;reviewerId:string;authorized:true;revoked:false;purpose:"CONTROLLED_SYNTHETIC_EXECUTION_RUN_REQUEST_AND_EXECUTION_FOUNDATION";issuedAt:string;expiresAt:string;stableFoundationSeal:string};
export type Oracle={oracleId:string;expectedOutcome:string;expectedErrorCode:string|null;expectedFailedGates:readonly string[];expectedFindings:readonly string[];requireOperationalEffectFalse:true};
export type Scenario={scenarioId:string;fixtureId:string;oracle:Oracle;order:number;repeat:number};
export type Bundle={bundleId:string;revisionId:string;syntheticOnly:true;catalogFrozen:true;scenarios:readonly Scenario[];contentSeal:string;expiresAt:string};
export type ExecutorPolicy={executorId:string;revisionId:string;contentSeal:string;callbackContract:"PURE_SYNTHETIC_SCENARIO_CALLBACK";callbackDeclared:true;invocationAllowed:false;networkAllowed:false;processExecutionAllowed:false;filesystemOutsideWorkspaceAllowed:false;persistenceAllowed:false;candidateExecutionAllowed:false;adapterExecutionAllowed:false};
export type WorkspacePolicy={workspacePolicyId:string;rootToken:string;isolated:true;ephemeral:true;cleanupRequired:true;destructionRequired:true;credentialIsolationRequired:true;allowlistedInputs:readonly string[];allowlistedOutputs:readonly string[]};
export type Environment={clock:string;seed:number;locale:string;timezone:string;variables:Readonly<Record<string,string>>};
export type Budgets={maxScenarios:number;maxRepeat:number;maxScenarioMillis:number;maxTotalMillis:number;maxMemoryBytes:number;maxResultBytes:number;maxCaptureCount:number;maxOutputCount:number};
export type Request={requestId:string;revisionId:string;requestSeal:string;expectedRequestSeal:string;foundationSeal:string;authority:Authority;bundle:Bundle;expectedBundleSeal:string;realCandidateInput:false;realProviderInput:false;productionInput:false;operationalRegistrationRequested:false;persistenceRequested:false;networkRequested:false;processExecutionRequested:false;candidateExecutionRequested:false;adapterExecutionRequested:false;stageRequested:false;commitRequested:false;tagRequested:false;pushRequested:false;now:string};
export type FoundationEnvelope={foundationId:string;revisionId:string;contentSeal:string;expectedContentSeal:string;request:Request;expectedRequestId:string;expectedBundleId:string;executorPolicy:ExecutorPolicy;expectedExecutorId:string;workspacePolicy:WorkspacePolicy;expectedWorkspacePolicyId:string;environment:Environment;expectedEnvironmentCanonical:string;budgets:Budgets};
export type LifecycleProjection={projectionId:string;foundationId:string;requestId:string;bundleId:string;phaseOrder:readonly string[];gateStates:readonly {gateId:string;state:"NOT_READY"}[];scenarioOrder:readonly string[];scenarioCount:number;totalRepetitions:number;controlledRunRequestsCreated:0;executableBundlesMaterialized:0;ephemeralWorkspacesAllocated:0;invocationPlansMaterialized:0;controlledSyntheticScenariosInvoked:0;capturesConstructed:0;resultBundlesConstructed:0;persistedArtifacts:0;operationalEffect:false;canonicalProjection:string;transientSeal:string};
export type SuppliedCapture={captureId:string;scenarioId:string;repetition:number;outcome:string;errorCode:string|null;failedGates:readonly string[];findings:readonly string[];operationalEffect:false;payload:Obj;canonicalCapture:string;transientSeal:string};
export type CaptureEvaluation={captureId:string;scenarioId:string;status:"PASS"|"QUARANTINED";outcome:Outcome;oracleFailures:readonly string[];cleanupVerified:boolean;workspaceDestroyed:boolean;leaksDetected:readonly string[];capturesConstructed:0;resultBundlesConstructed:0;persistedArtifacts:0;operationalEffect:false;canonicalEvaluation:string;transientSeal:string};
export type ReplayProjection={matches:boolean;outcome:"RUN_PASS_PROJECTED"|"RUN_REPLAY_MISMATCH_PROJECTED";operationalEffect:false;canonicalReplay:string;transientSeal:string};
const ID=/^[A-Za-z][A-Za-z0-9._:-]{2,127}$/;const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;const LOC=/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;const TZ=/^(?:UTC|[A-Za-z_]+\/[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)?)$/;
function fail(code:FailureCode,message:string):never{throw new ControlledRunRequestExecutionFoundationError(code,message)}
function requireId(v:string,c:FailureCode){if(!ID.test(v))fail(c,c)}
function parseTime(v:string,c:FailureCode){if(!ISO.test(v)||!Number.isFinite(Date.parse(v)))fail(c,c);return Date.parse(v)}
function stable(v:unknown):unknown{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==="object"){const o:Record<string,unknown>={};for(const k of Object.keys(v as Record<string,unknown>).sort())o[k]=stable((v as Record<string,unknown>)[k]);return o}return v}
export function canonicalizeControlledRunRequestExecutionValue(v:unknown):string{try{return JSON.stringify(stable(v))}catch{fail("CANONICALIZATION_FAILURE","canonicalization")}}
export function transientControlledRunRequestExecutionSeal(c:string):string{let h=14695981039346656037n;for(const b of new TextEncoder().encode(c)){h^=BigInt(b);h=BigInt.asUintN(64,h*1099511628211n)}return`FNV1A64:${h.toString(16).padStart(16,"0")}`}
const sorted=(v:readonly string[])=>[...v].sort();
export function validateControlledRunRequestExecutionFoundationEnvelope(e:FoundationEnvelope):void{
 const r=e.request,a=r.authority,b=r.bundle,x=e.executorPolicy,w=e.workspacePolicy,n=e.environment,z=e.budgets;
 requireId(e.foundationId,"FOUNDATION_ID_INVALID");requireId(e.revisionId,"FOUNDATION_REVISION_INVALID");if(e.contentSeal!==e.expectedContentSeal)fail("FOUNDATION_SEAL_INVALID","foundation seal");
 requireId(a.authorizationId,"AUTHORIZATION_MISSING");for(const id of[a.requesterId,a.executorOwnerId,a.reviewerId])requireId(id,"AUTHORIZATION_MISSING");if(new Set([a.requesterId,a.executorOwnerId,a.reviewerId]).size!==3)fail("AUTHORIZATION_IDENTITY_CONFLICT","identity");if(a.authorized!==true)fail("AUTHORIZATION_MISSING","authorization");if(a.revoked!==false)fail("AUTHORIZATION_REVOKED","revoked");if(a.purpose!=="CONTROLLED_SYNTHETIC_EXECUTION_RUN_REQUEST_AND_EXECUTION_FOUNDATION")fail("AUTHORIZATION_PURPOSE_INVALID","purpose");const issued=parseTime(a.issuedAt,"AUTHORIZATION_EXPIRED"),expires=parseTime(a.expiresAt,"AUTHORIZATION_EXPIRED"),now=parseTime(r.now,"AUTHORIZATION_EXPIRED");if(issued>now||expires<=now||expires<=issued)fail("AUTHORIZATION_EXPIRED","time");if(a.stableFoundationSeal!==r.foundationSeal)fail("REQUEST_FOUNDATION_SEAL_MISMATCH","foundation");
 requireId(r.requestId,"REQUEST_ID_INVALID");requireId(r.revisionId,"REQUEST_REVISION_INVALID");if(r.requestSeal!==r.expectedRequestSeal)fail("REQUEST_SEAL_INVALID","request seal");if(r.requestId!==e.expectedRequestId)fail("FOUNDATION_REQUEST_BINDING_INVALID","request binding");
 if(r.realCandidateInput!==false||r.realProviderInput!==false||r.productionInput!==false)fail("REQUEST_REAL_INPUT_FORBIDDEN","real input");if(r.operationalRegistrationRequested!==false)fail("REQUEST_OPERATIONAL_REGISTRATION_FORBIDDEN","registration");if(r.persistenceRequested!==false)fail("REQUEST_PERSISTENCE_FORBIDDEN","persistence");if(r.networkRequested!==false)fail("REQUEST_NETWORK_FORBIDDEN","network");if(r.processExecutionRequested!==false)fail("REQUEST_PROCESS_FORBIDDEN","process");if(r.candidateExecutionRequested!==false)fail("REQUEST_CANDIDATE_EXECUTION_FORBIDDEN","candidate");if(r.adapterExecutionRequested!==false)fail("REQUEST_ADAPTER_EXECUTION_FORBIDDEN","adapter");if(r.stageRequested||r.commitRequested||r.tagRequested||r.pushRequested)fail("REQUEST_PUBLICATION_FORBIDDEN","publication");
 requireId(b.bundleId,"BUNDLE_ID_INVALID");requireId(b.revisionId,"BUNDLE_REVISION_INVALID");if(b.bundleId!==e.expectedBundleId)fail("FOUNDATION_BUNDLE_BINDING_INVALID","bundle binding");if(b.contentSeal!==r.expectedBundleSeal)fail("BUNDLE_SEAL_INVALID","bundle seal");if(b.syntheticOnly!==true)fail("BUNDLE_SYNTHETIC_ONLY_REQUIRED","synthetic");if(b.catalogFrozen!==true)fail("BUNDLE_CATALOG_NOT_FROZEN","catalog");if(parseTime(b.expiresAt,"BUNDLE_EXPIRED")<=now)fail("BUNDLE_EXPIRED","expired");if(!b.scenarios.length)fail("BUNDLE_EMPTY","empty");const ss=new Set<string>(),ff=new Set<string>(),oo=new Set<string>(),orders=new Set<number>();for(const s of b.scenarios){requireId(s.scenarioId,"SCENARIO_ID_INVALID");if(ss.has(s.scenarioId))fail("SCENARIO_DUPLICATE","scenario");ss.add(s.scenarioId);requireId(s.fixtureId,"FIXTURE_ID_INVALID");if(ff.has(s.fixtureId))fail("FIXTURE_DUPLICATE","fixture");ff.add(s.fixtureId);requireId(s.oracle.oracleId,"ORACLE_ID_INVALID");if(oo.has(s.oracle.oracleId))fail("ORACLE_DUPLICATE","oracle");oo.add(s.oracle.oracleId);if(!Number.isInteger(s.order)||s.order<1||orders.has(s.order))fail("SCENARIO_ORDER_INVALID","order");orders.add(s.order);if(!Number.isInteger(s.repeat)||s.repeat<1)fail("SCENARIO_REPEAT_INVALID","repeat");if(!s.oracle.expectedOutcome)fail("ORACLE_INCOMPLETE","oracle");if(s.oracle.requireOperationalEffectFalse!==true)fail("ORACLE_OPERATIONAL_EFFECT_FALSE_REQUIRED","oracle effect")}if(JSON.stringify([...orders].sort((p,q)=>p-q))!==JSON.stringify(Array.from({length:b.scenarios.length},(_,i)=>i+1)))fail("SCENARIO_ORDER_INVALID","order sequence");
 requireId(x.executorId,"EXECUTOR_ID_INVALID");requireId(x.revisionId,"EXECUTOR_REVISION_INVALID");if(!x.contentSeal)fail("EXECUTOR_SEAL_INVALID","executor seal");if(x.executorId!==e.expectedExecutorId)fail("FOUNDATION_EXECUTOR_BINDING_INVALID","executor binding");if(x.callbackContract!=="PURE_SYNTHETIC_SCENARIO_CALLBACK")fail("EXECUTOR_CAPABILITY_INVALID","executor");if(x.callbackDeclared!==true)fail("EXECUTOR_CALLBACK_REQUIRED","callback");if(x.invocationAllowed||x.networkAllowed||x.processExecutionAllowed||x.filesystemOutsideWorkspaceAllowed||x.persistenceAllowed||x.candidateExecutionAllowed||x.adapterExecutionAllowed)fail("EXECUTOR_AMBIENT_AUTHORITY_FORBIDDEN","ambient authority");
 requireId(w.workspacePolicyId,"WORKSPACE_POLICY_ID_INVALID");requireId(w.rootToken,"WORKSPACE_ROOT_INVALID");if(w.workspacePolicyId!==e.expectedWorkspacePolicyId)fail("FOUNDATION_WORKSPACE_BINDING_INVALID","workspace binding");if(w.isolated!==true)fail("WORKSPACE_ISOLATION_REQUIRED","isolation");if(w.ephemeral!==true)fail("WORKSPACE_EPHEMERAL_REQUIRED","ephemeral");if(w.cleanupRequired!==true)fail("WORKSPACE_CLEANUP_REQUIRED","cleanup");if(w.destructionRequired!==true)fail("WORKSPACE_DESTRUCTION_REQUIRED","destruction");if(w.credentialIsolationRequired!==true)fail("WORKSPACE_CREDENTIAL_ISOLATION_REQUIRED","credentials");if([...w.allowlistedInputs,...w.allowlistedOutputs].some(v=>!ID.test(v)))fail("WORKSPACE_ALLOWLIST_INVALID","allowlist");
 parseTime(n.clock,"ENVIRONMENT_CLOCK_INVALID");if(!Number.isInteger(n.seed)||n.seed<0)fail("ENVIRONMENT_SEED_INVALID","seed");if(!LOC.test(n.locale))fail("ENVIRONMENT_LOCALE_INVALID","locale");if(!TZ.test(n.timezone))fail("ENVIRONMENT_TIMEZONE_INVALID","timezone");if(Object.entries(n.variables).some(([k,v])=>!ID.test(k)||typeof v!=="string"))fail("ENVIRONMENT_VARIABLE_INVALID","variables");if(canonicalizeControlledRunRequestExecutionValue(n)!==e.expectedEnvironmentCanonical)fail("FOUNDATION_ENVIRONMENT_BINDING_INVALID","environment binding");
 if(!Number.isInteger(z.maxScenarios)||z.maxScenarios<1||b.scenarios.length>z.maxScenarios)fail("BUDGET_SCENARIO_INVALID","scenario budget");if(!Number.isInteger(z.maxRepeat)||z.maxRepeat<1||b.scenarios.some(s=>s.repeat>z.maxRepeat))fail("BUDGET_REPEAT_INVALID","repeat budget");if(!Number.isInteger(z.maxScenarioMillis)||z.maxScenarioMillis<1)fail("BUDGET_SCENARIO_TIME_INVALID","scenario time");const total=b.scenarios.reduce((q,s)=>q+s.repeat,0);if(!Number.isInteger(z.maxTotalMillis)||z.maxTotalMillis<z.maxScenarioMillis*total)fail("BUDGET_TOTAL_TIME_INVALID","total time");if(!Number.isInteger(z.maxMemoryBytes)||z.maxMemoryBytes<1048576)fail("BUDGET_MEMORY_INVALID","memory");if(!Number.isInteger(z.maxResultBytes)||z.maxResultBytes<1024)fail("BUDGET_RESULT_SIZE_INVALID","result");if(!Number.isInteger(z.maxCaptureCount)||z.maxCaptureCount<total)fail("BUDGET_CAPTURE_COUNT_INVALID","captures");if(!Number.isInteger(z.maxOutputCount)||z.maxOutputCount<1)fail("BUDGET_OUTPUT_COUNT_INVALID","outputs");
}
export function projectControlledRunRequestExecutionLifecycle(e:FoundationEnvelope,projectionId:string):LifecycleProjection{validateControlledRunRequestExecutionFoundationEnvelope(e);requireId(projectionId,"LIFECYCLE_PROJECTION_ID_INVALID");const scenarios=[...e.request.bundle.scenarios].sort((a,b)=>a.order-b.order);const base={projectionId,foundationId:e.foundationId,requestId:e.request.requestId,bundleId:e.request.bundle.bundleId,phaseOrder:[...CONTROLLED_RUN_REQUEST_EXECUTION_PHASES],gateStates:CONTROLLED_RUN_REQUEST_EXECUTION_GATES.map(gateId=>({gateId,state:"NOT_READY" as const})),scenarioOrder:scenarios.map(s=>s.scenarioId),scenarioCount:scenarios.length,totalRepetitions:scenarios.reduce((n,s)=>n+s.repeat,0),controlledRunRequestsCreated:0 as const,executableBundlesMaterialized:0 as const,ephemeralWorkspacesAllocated:0 as const,invocationPlansMaterialized:0 as const,controlledSyntheticScenariosInvoked:0 as const,capturesConstructed:0 as const,resultBundlesConstructed:0 as const,persistedArtifacts:0 as const,operationalEffect:false as const};const c=canonicalizeControlledRunRequestExecutionValue(base);return{...base,canonicalProjection:c,transientSeal:transientControlledRunRequestExecutionSeal(c)}}
export function verifyControlledRunRequestExecutionLifecycleProjection(p:LifecycleProjection):void{requireId(p.projectionId,"LIFECYCLE_PROJECTION_ID_INVALID");if(p.phaseOrder.length!==22||p.gateStates.length!==18||p.gateStates.some(g=>g.state!=="NOT_READY")||p.controlledRunRequestsCreated!==0||p.executableBundlesMaterialized!==0||p.ephemeralWorkspacesAllocated!==0||p.invocationPlansMaterialized!==0||p.controlledSyntheticScenariosInvoked!==0||p.capturesConstructed!==0||p.resultBundlesConstructed!==0||p.persistedArtifacts!==0||p.operationalEffect!==false||transientControlledRunRequestExecutionSeal(p.canonicalProjection)!==p.transientSeal)fail("LIFECYCLE_PROJECTION_NONDETERMINISTIC","projection")}
export function createTestOwnedSuppliedSyntheticCapture(v:Omit<SuppliedCapture,"canonicalCapture"|"transientSeal">):SuppliedCapture{const base={...v,failedGates:sorted(v.failedGates),findings:sorted(v.findings)};const c=canonicalizeControlledRunRequestExecutionValue(base);return{...base,canonicalCapture:c,transientSeal:transientControlledRunRequestExecutionSeal(c)}}
export function validateSuppliedSyntheticCaptureRecord(e:FoundationEnvelope,c:SuppliedCapture):Scenario{validateControlledRunRequestExecutionFoundationEnvelope(e);requireId(c.captureId,"SUPPLIED_CAPTURE_ID_INVALID");const s=e.request.bundle.scenarios.find(x=>x.scenarioId===c.scenarioId);if(!s)fail("SUPPLIED_CAPTURE_SCENARIO_INVALID","scenario");if(!Number.isInteger(c.repetition)||c.repetition<1||c.repetition>s.repeat)fail("SUPPLIED_CAPTURE_REPETITION_INVALID","repetition");if(c.operationalEffect!==false)fail("SUPPLIED_CAPTURE_OPERATIONAL_EFFECT_DETECTED","effect");if(!c.payload||typeof c.payload!=="object"||Array.isArray(c.payload))fail("SUPPLIED_CAPTURE_PAYLOAD_INVALID","payload");if(transientControlledRunRequestExecutionSeal(c.canonicalCapture)!==c.transientSeal)fail("SUPPLIED_CAPTURE_SEAL_INVALID","seal");return s}
export function evaluateSuppliedSyntheticCapture(e:FoundationEnvelope,c:SuppliedCapture,terminal:"CLEAN_PASS"|"QUARANTINED",cleanupVerified:boolean,workspaceDestroyed:boolean,leaksDetected:readonly string[]):CaptureEvaluation{const s=validateSuppliedSyntheticCaptureRecord(e,c);if(terminal!=="CLEAN_PASS"&&terminal!=="QUARANTINED")fail("TERMINAL_DISPOSITION_INVALID","terminal");if(!cleanupVerified)fail("CLEANUP_NOT_VERIFIED","cleanup");if(!workspaceDestroyed)fail("WORKSPACE_NOT_DESTROYED","destroyed");if(leaksDetected.length)fail("LEAK_DETECTED","leaks");const failures:string[]=[];if(c.outcome!==s.oracle.expectedOutcome)failures.push("OUTCOME_MISMATCH");if(c.errorCode!==s.oracle.expectedErrorCode)failures.push("ERROR_CODE_MISMATCH");if(JSON.stringify(sorted(c.failedGates))!==JSON.stringify(sorted(s.oracle.expectedFailedGates)))failures.push("FAILED_GATES_MISMATCH");if(JSON.stringify(sorted(c.findings))!==JSON.stringify(sorted(s.oracle.expectedFindings)))failures.push("FINDINGS_MISMATCH");if(terminal==="QUARANTINED"&&!failures.length)failures.push("QUARANTINE_REASON_REQUIRED");const pass=terminal==="CLEAN_PASS"&&!failures.length;const base={captureId:c.captureId,scenarioId:c.scenarioId,status:pass?"PASS" as const:"QUARANTINED" as const,outcome:pass?"RUN_PASS_PROJECTED" as const:"RUN_SCENARIO_QUARANTINED" as const,oracleFailures:failures.sort(),cleanupVerified,workspaceDestroyed,leaksDetected:[...leaksDetected],capturesConstructed:0 as const,resultBundlesConstructed:0 as const,persistedArtifacts:0 as const,operationalEffect:false as const};const canonical=canonicalizeControlledRunRequestExecutionValue(base);return{...base,canonicalEvaluation:canonical,transientSeal:transientControlledRunRequestExecutionSeal(canonical)}}
export function projectSuppliedCaptureReplayAgreement(a:CaptureEvaluation,b:CaptureEvaluation):ReplayProjection{const matches=a.canonicalEvaluation===b.canonicalEvaluation&&a.transientSeal===b.transientSeal;const base={matches,outcome:matches?"RUN_PASS_PROJECTED" as const:"RUN_REPLAY_MISMATCH_PROJECTED" as const,operationalEffect:false as const};const c=canonicalizeControlledRunRequestExecutionValue(base);return{...base,canonicalReplay:c,transientSeal:transientControlledRunRequestExecutionSeal(c)}}
const forbidden=(code:FailureCode)=>(()=>fail(code,code));
export const createControlledSyntheticRunRequest=forbidden("REQUEST_CREATION_FORBIDDEN");export const materializeExecutableSyntheticBundle=forbidden("BUNDLE_MATERIALIZATION_FORBIDDEN");export const allocateEphemeralControlledRunWorkspace=forbidden("WORKSPACE_ALLOCATION_FORBIDDEN");export const materializeControlledRunInvocationPlan=forbidden("INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN");export const executeControlledSyntheticScenario=forbidden("SCENARIO_EXECUTION_FORBIDDEN");export const constructControlledRunCapture=forbidden("CAPTURE_CONSTRUCTION_FORBIDDEN");export const constructControlledRunResultBundle=forbidden("RESULT_CONSTRUCTION_FORBIDDEN");export const persistControlledRunArtifact=forbidden("PERSISTENCE_FORBIDDEN");export const useControlledRunNetwork=forbidden("NETWORK_ACCESS_FORBIDDEN");export const useControlledRunExternalProcess=forbidden("PROCESS_EXECUTION_FORBIDDEN");export const executeControlledRunCandidate=forbidden("CANDIDATE_EXECUTION_FORBIDDEN");export const executeControlledRunAdapter=forbidden("ADAPTER_EXECUTION_FORBIDDEN");export const stageControlledRunFoundation=forbidden("STAGE_FORBIDDEN");export const commitControlledRunFoundation=forbidden("COMMIT_FORBIDDEN");export const tagControlledRunFoundation=forbidden("TAG_FORBIDDEN");export const pushControlledRunFoundation=forbidden("PUSH_FORBIDDEN");
