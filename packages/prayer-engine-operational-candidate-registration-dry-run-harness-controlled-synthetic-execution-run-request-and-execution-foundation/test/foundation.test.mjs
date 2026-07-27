import assert from "node:assert/strict";
import {ControlledRunRequestExecutionFoundationError,CONTROLLED_RUN_REQUEST_EXECUTION_DOMAINS,CONTROLLED_RUN_REQUEST_EXECUTION_PHASES,CONTROLLED_RUN_REQUEST_EXECUTION_GATES,CONTROLLED_RUN_REQUEST_EXECUTION_OUTCOMES,CONTROLLED_RUN_REQUEST_EXECUTION_FAILURE_CODES,canonicalizeControlledRunRequestExecutionValue,transientControlledRunRequestExecutionSeal,validateControlledRunRequestExecutionFoundationEnvelope,projectControlledRunRequestExecutionLifecycle,verifyControlledRunRequestExecutionLifecycleProjection,createTestOwnedSuppliedSyntheticCapture,validateSuppliedSyntheticCaptureRecord,evaluateSuppliedSyntheticCapture,projectSuppliedCaptureReplayAgreement,createControlledSyntheticRunRequest,
  materializeExecutableSyntheticBundle,
  allocateEphemeralControlledRunWorkspace,
  materializeControlledRunInvocationPlan,
  executeControlledSyntheticScenario,
  constructControlledRunCapture,
  constructControlledRunResultBundle,
  persistControlledRunArtifact,
  useControlledRunNetwork,
  useControlledRunExternalProcess,
  executeControlledRunCandidate,
  executeControlledRunAdapter,
  stageControlledRunFoundation,
  commitControlledRunFoundation,
  tagControlledRunFoundation,
  pushControlledRunFoundation} from "../dist/index.js";
const now="2026-07-27T16:00:00Z",foundationSeal="FOUNDATION-SEAL",requestSeal="REQUEST-SEAL",bundleSeal="BUNDLE-SEAL";
const authority={authorizationId:"AUTHORIZATION-ONE",requesterId:"REQUESTER-ONE",executorOwnerId:"OWNER-ONE",reviewerId:"REVIEWER-ONE",authorized:true,revoked:false,purpose:"CONTROLLED_SYNTHETIC_EXECUTION_RUN_REQUEST_AND_EXECUTION_FOUNDATION",issuedAt:"2026-07-27T15:00:00Z",expiresAt:"2026-07-27T17:00:00Z",stableFoundationSeal:foundationSeal};
const oracle={oracleId:"ORACLE-ONE",expectedOutcome:"PASS",expectedErrorCode:null,expectedFailedGates:[],expectedFindings:[],requireOperationalEffectFalse:true};
const scenario={scenarioId:"SCENARIO-ONE",fixtureId:"FIXTURE-ONE",oracle,order:1,repeat:2};
const bundle={bundleId:"BUNDLE-ONE",revisionId:"REVISION-ONE",syntheticOnly:true,catalogFrozen:true,scenarios:[scenario],contentSeal:bundleSeal,expiresAt:"2026-07-27T17:00:00Z"};
const executorPolicy={executorId:"EXECUTOR-ONE",revisionId:"EXECUTOR-REVISION",contentSeal:"EXECUTOR-SEAL",callbackContract:"PURE_SYNTHETIC_SCENARIO_CALLBACK",callbackDeclared:true,invocationAllowed:false,networkAllowed:false,processExecutionAllowed:false,filesystemOutsideWorkspaceAllowed:false,persistenceAllowed:false,candidateExecutionAllowed:false,adapterExecutionAllowed:false};
const workspacePolicy={workspacePolicyId:"WORKSPACE-POLICY",rootToken:"WORKSPACE-ROOT",isolated:true,ephemeral:true,cleanupRequired:true,destructionRequired:true,credentialIsolationRequired:true,allowlistedInputs:["INPUT-ONE"],allowlistedOutputs:["OUTPUT-ONE"]};
const environment={clock:now,seed:41,locale:"en-US",timezone:"Asia/Riyadh",variables:{MODE:"SYNTHETIC"}};
const request={requestId:"REQUEST-ONE",revisionId:"REQUEST-REVISION",requestSeal,expectedRequestSeal:requestSeal,foundationSeal,authority,bundle,expectedBundleSeal:bundleSeal,realCandidateInput:false,realProviderInput:false,productionInput:false,operationalRegistrationRequested:false,persistenceRequested:false,networkRequested:false,processExecutionRequested:false,candidateExecutionRequested:false,adapterExecutionRequested:false,stageRequested:false,commitRequested:false,tagRequested:false,pushRequested:false,now};
const envelope={foundationId:"FOUNDATION-ONE",revisionId:"FOUNDATION-REVISION",contentSeal:"ENVELOPE-SEAL",expectedContentSeal:"ENVELOPE-SEAL",request,expectedRequestId:request.requestId,expectedBundleId:bundle.bundleId,executorPolicy,expectedExecutorId:executorPolicy.executorId,workspacePolicy,expectedWorkspacePolicyId:workspacePolicy.workspacePolicyId,environment,expectedEnvironmentCanonical:canonicalizeControlledRunRequestExecutionValue(environment),budgets:{maxScenarios:2,maxRepeat:3,maxScenarioMillis:1000,maxTotalMillis:3000,maxMemoryBytes:1048576,maxResultBytes:4096,maxCaptureCount:2,maxOutputCount:1}};
assert.equal(CONTROLLED_RUN_REQUEST_EXECUTION_DOMAINS.length,18);assert.equal(CONTROLLED_RUN_REQUEST_EXECUTION_PHASES.length,22);assert.equal(CONTROLLED_RUN_REQUEST_EXECUTION_GATES.length,18);assert.equal(CONTROLLED_RUN_REQUEST_EXECUTION_OUTCOMES.length,11);assert.equal(CONTROLLED_RUN_REQUEST_EXECUTION_FAILURE_CODES.length,98);
validateControlledRunRequestExecutionFoundationEnvelope(envelope);const p1=projectControlledRunRequestExecutionLifecycle(envelope,"PROJECTION-ONE"),p2=projectControlledRunRequestExecutionLifecycle(envelope,"PROJECTION-ONE");assert.deepEqual(p1,p2);assert.equal(p1.totalRepetitions,2);verifyControlledRunRequestExecutionLifecycleProjection(p1);
const capture=createTestOwnedSuppliedSyntheticCapture({captureId:"CAPTURE-ONE",scenarioId:scenario.scenarioId,repetition:1,outcome:"PASS",errorCode:null,failedGates:[],findings:[],operationalEffect:false,payload:{fixture:"synthetic"}});validateSuppliedSyntheticCaptureRecord(envelope,capture);const evaluation=evaluateSuppliedSyntheticCapture(envelope,capture,"CLEAN_PASS",true,true,[]);assert.equal(evaluation.status,"PASS");assert.equal(evaluation.capturesConstructed,0);assert.equal(projectSuppliedCaptureReplayAgreement(evaluation,evaluation).matches,true);const badCapture=createTestOwnedSuppliedSyntheticCapture({...capture,captureId:"CAPTURE-TWO",outcome:"FAIL"});const quarantined=evaluateSuppliedSyntheticCapture(envelope,badCapture,"QUARANTINED",true,true,[]);assert.equal(quarantined.status,"QUARANTINED");assert.equal(projectSuppliedCaptureReplayAgreement(evaluation,quarantined).matches,false);
let cases=0;function expectCode(fn,code){cases++;let caught;try{fn()}catch(error){caught=error}assert.ok(caught instanceof ControlledRunRequestExecutionFoundationError);assert.equal(caught.code,code)}
const invalidCases=[
  [{authority:{...authority,authorized:false}},"AUTHORIZATION_MISSING"],
  [{authority:{...authority,revoked:true}},"AUTHORIZATION_REVOKED"],
  [{authority:{...authority,purpose:"BAD"}},"AUTHORIZATION_PURPOSE_INVALID"],
  [{authority:{...authority,reviewerId:authority.requesterId}},"AUTHORIZATION_IDENTITY_CONFLICT"],
  [{authority:{...authority,expiresAt:now}},"AUTHORIZATION_EXPIRED"],
  [{requestId:"x"},"REQUEST_ID_INVALID"],
  [{revisionId:"x"},"REQUEST_REVISION_INVALID"],
  [{requestSeal:"bad"},"REQUEST_SEAL_INVALID"],
  [{foundationSeal:"bad"},"REQUEST_FOUNDATION_SEAL_MISMATCH"],
  [{realCandidateInput:true},"REQUEST_REAL_INPUT_FORBIDDEN"],
  [{operationalRegistrationRequested:true},"REQUEST_OPERATIONAL_REGISTRATION_FORBIDDEN"],
  [{persistenceRequested:true},"REQUEST_PERSISTENCE_FORBIDDEN"],
  [{networkRequested:true},"REQUEST_NETWORK_FORBIDDEN"],
  [{processExecutionRequested:true},"REQUEST_PROCESS_FORBIDDEN"],
  [{candidateExecutionRequested:true},"REQUEST_CANDIDATE_EXECUTION_FORBIDDEN"],
  [{adapterExecutionRequested:true},"REQUEST_ADAPTER_EXECUTION_FORBIDDEN"],
  [{stageRequested:true},"REQUEST_PUBLICATION_FORBIDDEN"],
  [{bundle:{...bundle,bundleId:"x"}},"BUNDLE_ID_INVALID"],
  [{bundle:{...bundle,revisionId:"x"}},"BUNDLE_REVISION_INVALID"],
  [{bundle:{...bundle,contentSeal:"bad"}},"BUNDLE_SEAL_INVALID"],
  [{bundle:{...bundle,syntheticOnly:false}},"BUNDLE_SYNTHETIC_ONLY_REQUIRED"],
  [{bundle:{...bundle,catalogFrozen:false}},"BUNDLE_CATALOG_NOT_FROZEN"],
  [{bundle:{...bundle,scenarios:[]}},"BUNDLE_EMPTY"],
  [{bundle:{...bundle,expiresAt:now}},"BUNDLE_EXPIRED"],
  [{bundle:{...bundle,scenarios:[{...scenario,scenarioId:"x"}]}},"SCENARIO_ID_INVALID"],
  [{bundle:{...bundle,scenarios:[scenario,{...scenario,order:2}]}},"SCENARIO_DUPLICATE"],
  [{bundle:{...bundle,scenarios:[{...scenario,order:2}]}},"SCENARIO_ORDER_INVALID"],
  [{bundle:{...bundle,scenarios:[{...scenario,repeat:0}]}},"SCENARIO_REPEAT_INVALID"],
  [{bundle:{...bundle,scenarios:[{...scenario,fixtureId:"x"}]}},"FIXTURE_ID_INVALID"],
  [{bundle:{...bundle,scenarios:[scenario,{...scenario,scenarioId:"SCENARIO-TWO",order:2}]}},"FIXTURE_DUPLICATE"],
  [{bundle:{...bundle,scenarios:[{...scenario,oracle:{...oracle,oracleId:"x"}}]}},"ORACLE_ID_INVALID"],
  [{bundle:{...bundle,scenarios:[scenario,{...scenario,scenarioId:"SCENARIO-TWO",fixtureId:"FIXTURE-TWO",order:2}]}},"ORACLE_DUPLICATE"],
  [{bundle:{...bundle,scenarios:[{...scenario,oracle:{...oracle,expectedOutcome:""}}]}},"ORACLE_INCOMPLETE"],
  [{bundle:{...bundle,scenarios:[{...scenario,oracle:{...oracle,requireOperationalEffectFalse:false}}]}},"ORACLE_OPERATIONAL_EFFECT_FALSE_REQUIRED"],
  [{executorPolicy:{...executorPolicy,executorId:"x"}},"EXECUTOR_ID_INVALID"],
  [{executorPolicy:{...executorPolicy,revisionId:"x"}},"EXECUTOR_REVISION_INVALID"],
  [{executorPolicy:{...executorPolicy,contentSeal:""}},"EXECUTOR_SEAL_INVALID"],
  [{executorPolicy:{...executorPolicy,callbackContract:"BAD"}},"EXECUTOR_CAPABILITY_INVALID"],
  [{executorPolicy:{...executorPolicy,callbackDeclared:false}},"EXECUTOR_CALLBACK_REQUIRED"],
  [{executorPolicy:{...executorPolicy,networkAllowed:true}},"EXECUTOR_AMBIENT_AUTHORITY_FORBIDDEN"],
  [{workspacePolicy:{...workspacePolicy,workspacePolicyId:"x"}},"WORKSPACE_POLICY_ID_INVALID"],
  [{workspacePolicy:{...workspacePolicy,rootToken:"x"}},"WORKSPACE_ROOT_INVALID"],
  [{workspacePolicy:{...workspacePolicy,isolated:false}},"WORKSPACE_ISOLATION_REQUIRED"],
  [{workspacePolicy:{...workspacePolicy,ephemeral:false}},"WORKSPACE_EPHEMERAL_REQUIRED"],
  [{workspacePolicy:{...workspacePolicy,cleanupRequired:false}},"WORKSPACE_CLEANUP_REQUIRED"],
  [{workspacePolicy:{...workspacePolicy,destructionRequired:false}},"WORKSPACE_DESTRUCTION_REQUIRED"],
  [{workspacePolicy:{...workspacePolicy,credentialIsolationRequired:false}},"WORKSPACE_CREDENTIAL_ISOLATION_REQUIRED"],
  [{workspacePolicy:{...workspacePolicy,allowlistedInputs:["x"]}},"WORKSPACE_ALLOWLIST_INVALID"],
  [{environment:{...environment,clock:"bad"}},"ENVIRONMENT_CLOCK_INVALID"],
  [{environment:{...environment,seed:-1}},"ENVIRONMENT_SEED_INVALID"],
  [{environment:{...environment,locale:"bad locale"}},"ENVIRONMENT_LOCALE_INVALID"],
  [{environment:{...environment,timezone:"bad zone"}},"ENVIRONMENT_TIMEZONE_INVALID"],
  [{environment:{...environment,variables:{"bad key":"v"}}},"ENVIRONMENT_VARIABLE_INVALID"],
];
for(const[patch,code]of invalidCases){let modified={...envelope};if(patch.authority)modified.request={...request,authority:patch.authority};else if(patch.bundle)modified.request={...request,bundle:patch.bundle};else if(patch.executorPolicy||patch.workspacePolicy||patch.environment||patch.budgets)modified={...envelope,...patch};else modified.request={...request,...patch};expectCode(()=>validateControlledRunRequestExecutionFoundationEnvelope(modified),code)}
expectCode(()=>createControlledSyntheticRunRequest(),"REQUEST_CREATION_FORBIDDEN");
expectCode(()=>materializeExecutableSyntheticBundle(),"BUNDLE_MATERIALIZATION_FORBIDDEN");
expectCode(()=>allocateEphemeralControlledRunWorkspace(),"WORKSPACE_ALLOCATION_FORBIDDEN");
expectCode(()=>materializeControlledRunInvocationPlan(),"INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN");
expectCode(()=>executeControlledSyntheticScenario(),"SCENARIO_EXECUTION_FORBIDDEN");
expectCode(()=>constructControlledRunCapture(),"CAPTURE_CONSTRUCTION_FORBIDDEN");
expectCode(()=>constructControlledRunResultBundle(),"RESULT_CONSTRUCTION_FORBIDDEN");
expectCode(()=>persistControlledRunArtifact(),"PERSISTENCE_FORBIDDEN");
expectCode(()=>useControlledRunNetwork(),"NETWORK_ACCESS_FORBIDDEN");
expectCode(()=>useControlledRunExternalProcess(),"PROCESS_EXECUTION_FORBIDDEN");
expectCode(()=>executeControlledRunCandidate(),"CANDIDATE_EXECUTION_FORBIDDEN");
expectCode(()=>executeControlledRunAdapter(),"ADAPTER_EXECUTION_FORBIDDEN");
expectCode(()=>stageControlledRunFoundation(),"STAGE_FORBIDDEN");
expectCode(()=>commitControlledRunFoundation(),"COMMIT_FORBIDDEN");
expectCode(()=>tagControlledRunFoundation(),"TAG_FORBIDDEN");
expectCode(()=>pushControlledRunFoundation(),"PUSH_FORBIDDEN");
assert.equal(cases,69);console.log("NOOR_STEP_041_CONTROLLED_RUN_REQUEST_EXECUTION_FOUNDATION_TESTS_PASS");
