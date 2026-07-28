export const AUTHORIZATION_DOMAINS = ["AUTHORITY_SCOPE", "IDENTITY_SEPARATION", "SUBJECT_CAPABILITY_PURPOSE", "FOUNDATION_POLICY_SEALS", "SYNTHETIC_BUNDLE_CATALOG", "RESTRICTED_EXECUTOR_CALLBACK", "EPHEMERAL_WORKSPACE", "DETERMINISTIC_ENVIRONMENT", "RESOURCE_BUDGET", "INVOCATION_PLAN", "SCENARIO_REPETITION", "CAPTURE_ORACLE_QUARANTINE", "ABORT_CANCELLATION_CLEANUP", "REPLAY_INDEPENDENT_DECISION", "EXPIRY_REVOCATION_SUSPENSION_RENEWAL", "DELEGATION_NON_TRANSFERABILITY_CONFLICT", "AUDIT_NON_PERSISTENCE", "REPOSITORY_PRODUCTION_BOUNDARY"] as const;
export const AUTHORIZATION_PHASES = ["AUTHORITY_SOURCE_ADMISSION", "AUTHORIZATION_REQUEST_IDENTITY_VALIDATION", "REQUESTER_EXECUTOR_REVIEWER_SEPARATION", "PURPOSE_SCOPE_CAPABILITY_BINDING", "FOUNDATION_POLICY_SEAL_BINDING", "SYNTHETIC_BUNDLE_CATALOG_BINDING", "RESTRICTED_EXECUTOR_CALLBACK_BINDING", "EPHEMERAL_WORKSPACE_BINDING", "DETERMINISTIC_ENVIRONMENT_BINDING", "RESOURCE_BUDGET_BINDING", "INVOCATION_PLAN_BINDING", "SCENARIO_REPETITION_BINDING", "CAPTURE_ORACLE_QUARANTINE_BINDING", "ABORT_CANCELLATION_CLEANUP_BINDING", "REPLAY_INDEPENDENT_DECISION_BINDING", "DELEGATION_NON_TRANSFERABILITY_CHECK", "CONFLICT_OF_INTEREST_CHECK", "EXPIRY_REVOCATION_SUSPENSION_CHECK", "ENVELOPE_CANONICALIZATION", "TRANSIENT_SEAL_PROJECTION", "INDEPENDENT_AUTHORIZATION_DECISION", "RENEWAL_REVALIDATION_OR_REJECTION"] as const;
export const AUTHORIZATION_GATES = ["AUTHORITY_SCOPE", "IDENTITY_SEPARATION", "SUBJECT_CAPABILITY_PURPOSE", "FOUNDATION_POLICY_SEALS", "SYNTHETIC_BUNDLE_CATALOG", "RESTRICTED_EXECUTOR_CALLBACK", "EPHEMERAL_WORKSPACE", "DETERMINISTIC_ENVIRONMENT", "RESOURCE_BUDGET", "INVOCATION_PLAN", "SCENARIO_REPETITION", "CAPTURE_ORACLE_QUARANTINE", "ABORT_CANCELLATION_CLEANUP", "REPLAY_INDEPENDENT_DECISION", "LIFECYCLE", "DELEGATION_CONFLICT", "AUDIT_NON_PERSISTENCE", "PUBLICATION_PRODUCTION"] as const;
export const AUTHORIZATION_OUTCOMES = ["AUTHORIZATION_REQUEST_REJECTED", "AUTHORIZATION_NOT_READY", "AUTHORIZATION_SCOPE_CONFLICT", "AUTHORIZATION_IDENTITY_CONFLICT", "AUTHORIZATION_EXPIRED", "AUTHORIZATION_REVOKED", "AUTHORIZATION_SUSPENDED", "AUTHORIZATION_DELEGATION_REJECTED", "AUTHORIZATION_APPROVED_PROJECTED", "AUTHORIZATION_REVALIDATION_REQUIRED", "AUTHORIZATION_PUBLICATION_FORBIDDEN"] as const;
export const AUTHORIZATION_FAILURE_CODES = ["AUTHORITY_OR_IDENTITY_INVALID", "IDENTITY_CONFLICT", "IDENTITY_ROLE_INVALID", "SCOPE_INVALID", "SEAL_BINDING_INVALID", "BOUND_SCOPE_INVALID", "LIFECYCLE_INVALID", "AUTHORIZATION_EXPIRED", "AUTHORIZATION_REVOKED", "AUTHORIZATION_SUSPENDED", "RENEWAL_REVALIDATION_REQUIRED", "DELEGATION_FORBIDDEN", "TRANSFER_FORBIDDEN", "CONFLICT_OF_INTEREST", "AMBIGUOUS_PRECEDENCE", "FOUNDATION_BOUNDARY_VIOLATION", "SUPPLIED_DECISION_INVALID", "CONTROL_MISMATCH", "AUTHORIZATION_CREATION_FORBIDDEN", "AUTHORIZATION_ISSUANCE_FORBIDDEN", "AUTHORIZATION_ACTIVATION_FORBIDDEN", "AUTHORIZATION_SUSPENSION_FORBIDDEN", "AUTHORIZATION_REVOCATION_FORBIDDEN", "AUTHORIZATION_RENEWAL_FORBIDDEN", "AUTHORIZATION_DELEGATION_FORBIDDEN", "AUTHORIZATION_TRANSFER_FORBIDDEN", "SCOPE_WIDENING_FORBIDDEN", "AUTHORIZATION_PERSISTENCE_FORBIDDEN", "CONTROLLED_RUN_REQUEST_CREATION_FORBIDDEN", "EXECUTABLE_BUNDLE_MATERIALIZATION_FORBIDDEN", "WORKSPACE_ALLOCATION_FORBIDDEN", "INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN", "SCENARIO_EXECUTION_FORBIDDEN", "OPERATIONAL_CAPTURE_CONSTRUCTION_FORBIDDEN", "OPERATIONAL_RESULT_CONSTRUCTION_FORBIDDEN", "EVIDENCE_ADMISSION_FORBIDDEN", "CANDIDATE_STATE_MUTATION_FORBIDDEN", "CANDIDATE_EXECUTION_FORBIDDEN", "ADAPTER_EXECUTION_FORBIDDEN", "NETWORK_ACCESS_FORBIDDEN", "EXTERNAL_PROCESS_FORBIDDEN", "STAGE_FORBIDDEN", "COMMIT_FORBIDDEN", "TAG_FORBIDDEN", "PUSH_FORBIDDEN"] as const;
export type FailureCode=(typeof AUTHORIZATION_FAILURE_CODES)[number];
export type GateState="NOT_READY"|"PROJECTION_ONLY";
export type Identity={id:string;role:"REQUESTER"|"EXECUTOR_OWNER"|"REVIEWER"|"APPROVER"};
export type SealBindings={foundation:string;policy:string;request:string;subject:string;scope:string};
export type Scope={subject:string;purpose:"CONTROLLED_SYNTHETIC_EXECUTION_RUN_AUTHORIZATION_FOUNDATION";capabilities:readonly string[];leastPrivilege:true;syntheticBundle:string;catalog:string;executor:string;callback:string;workspace:string;environment:string;resourceBudget:string;invocationPlan:string;scenarios:readonly string[];repetitions:number;capture:string;oracle:string;quarantine:string;abort:string;cancellation:string;cleanup:string;replay:string};
export type Lifecycle={issuedAt:string;activatesAt:string;expiresAt:string;suspended:false;revoked:false;renewalRequested:false};
export type Envelope={authoritySource:string;requestId:string;revision:string;immutable:true;requester:Identity;executorOwner:Identity;reviewer:Identity;approver:Identity;scope:Scope;seals:SealBindings;lifecycle:Lifecycle;delegationAllowed:false;transferable:false;conflictOfInterest:false;ambiguousPrecedence:false;operationalEffects:false;persistence:false};
export type SuppliedDecision={fixtureOwner:"TEST";decisionId:string;requestId:string;canonicalEnvelope:string;transientSeal:string;controls:Readonly<Record<string,boolean>>;outcome:"AUTHORIZATION_APPROVED_PROJECTED"};
export type Projection={requestId:string;gateStates:readonly {gate:string;state:GateState}[];readiness:"PROJECTION_ONLY";canonical:string;transientSeal:string;operationalCounters:{created:0;issued:0;activated:0;suspended:0;revoked:0;renewed:0;delegated:0;transferred:0;persisted:0;requests:0;bundles:0;workspaces:0;plans:0;scenarios:0;captures:0;results:0;evidence:0;candidate:0;adapter:0;network:0;process:0;stage:0;commit:0;tag:0;push:0}};
export class AuthorizationFoundationError extends Error{readonly code:FailureCode;constructor(code:FailureCode){super(code);this.name="AuthorizationFoundationError";this.code=code}}
const fail=(c:FailureCode):never=>{throw new AuthorizationFoundationError(c)};
const ids=(e:Envelope)=>[e.requester.id,e.executorOwner.id,e.reviewer.id,e.approver.id];
const stable=(v:unknown):unknown=>{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==="object"){const o=v as Record<string,unknown>;return Object.fromEntries(Object.keys(o).sort().map(k=>[k,stable(o[k])]))}return v};
export function canonicalizeAuthorization(v:unknown):string{return JSON.stringify(stable(v))}
export function transientAuthorizationSeal(c:string):string{let h=2166136261;for(const b of new TextEncoder().encode(c)){h^=b;h=Math.imul(h,16777619)>>>0}return"FNV1A32:"+h.toString(16).padStart(8,"0")}
export function validateAuthorizationEnvelope(e:Envelope):void{
 if(!e.authoritySource||!e.requestId||!e.revision||e.immutable!==true)fail("AUTHORITY_OR_IDENTITY_INVALID");
 if(new Set(ids(e)).size!==4)fail("IDENTITY_CONFLICT");
 if(e.requester.role!=="REQUESTER"||e.executorOwner.role!=="EXECUTOR_OWNER"||e.reviewer.role!=="REVIEWER"||e.approver.role!=="APPROVER")fail("IDENTITY_ROLE_INVALID");
 if(e.scope.purpose!=="CONTROLLED_SYNTHETIC_EXECUTION_RUN_AUTHORIZATION_FOUNDATION"||e.scope.leastPrivilege!==true||!e.scope.subject||!e.scope.capabilities.length)fail("SCOPE_INVALID");
 if(!Object.values(e.seals).every(x=>x.length>=8))fail("SEAL_BINDING_INVALID");
 if(!e.scope.syntheticBundle||!e.scope.catalog||!e.scope.executor||!e.scope.callback||!e.scope.workspace||!e.scope.environment||!e.scope.resourceBudget||!e.scope.invocationPlan||!e.scope.scenarios.length||e.scope.repetitions<1||!e.scope.capture||!e.scope.oracle||!e.scope.quarantine||!e.scope.abort||!e.scope.cancellation||!e.scope.cleanup||!e.scope.replay)fail("BOUND_SCOPE_INVALID");
 const now=Date.parse("2026-07-28T00:00:00Z"),issued=Date.parse(e.lifecycle.issuedAt),active=Date.parse(e.lifecycle.activatesAt),expires=Date.parse(e.lifecycle.expiresAt);
 if(!Number.isFinite(issued)||!Number.isFinite(active)||!Number.isFinite(expires)||issued>active||active>now)fail("LIFECYCLE_INVALID");
 if(expires<=now)fail("AUTHORIZATION_EXPIRED");
 if(e.lifecycle.revoked)fail("AUTHORIZATION_REVOKED");if(e.lifecycle.suspended)fail("AUTHORIZATION_SUSPENDED");if(e.lifecycle.renewalRequested)fail("RENEWAL_REVALIDATION_REQUIRED");
 if(e.delegationAllowed)fail("DELEGATION_FORBIDDEN");if(e.transferable)fail("TRANSFER_FORBIDDEN");if(e.conflictOfInterest)fail("CONFLICT_OF_INTEREST");if(e.ambiguousPrecedence)fail("AMBIGUOUS_PRECEDENCE");
 if(e.operationalEffects||e.persistence)fail("FOUNDATION_BOUNDARY_VIOLATION");
}
const zeros=()=>({created:0 as const,issued:0 as const,activated:0 as const,suspended:0 as const,revoked:0 as const,renewed:0 as const,delegated:0 as const,transferred:0 as const,persisted:0 as const,requests:0 as const,bundles:0 as const,workspaces:0 as const,plans:0 as const,scenarios:0 as const,captures:0 as const,results:0 as const,evidence:0 as const,candidate:0 as const,adapter:0 as const,network:0 as const,process:0 as const,stage:0 as const,commit:0 as const,tag:0 as const,push:0 as const});
export function projectAuthorizationReadiness(e:Envelope):Projection{validateAuthorizationEnvelope(e);const base={requestId:e.requestId,gateStates:AUTHORIZATION_GATES.map(gate=>({gate,state:"PROJECTION_ONLY" as const})),readiness:"PROJECTION_ONLY" as const,operationalCounters:zeros()};const canonical=canonicalizeAuthorization(base);return{...base,canonical,transientSeal:transientAuthorizationSeal(canonical)}}
export function createTestOwnedDecision(e:Envelope):SuppliedDecision{const canonicalEnvelope=canonicalizeAuthorization(e);return{fixtureOwner:"TEST",decisionId:"TEST-DECISION-"+e.requestId,requestId:e.requestId,canonicalEnvelope,transientSeal:transientAuthorizationSeal(canonicalEnvelope),controls:Object.fromEntries(AUTHORIZATION_GATES.map(g=>[g,true])),outcome:"AUTHORIZATION_APPROVED_PROJECTED"}}
export function evaluateSuppliedDecision(e:Envelope,d:SuppliedDecision):"AUTHORIZATION_APPROVED_PROJECTED"{validateAuthorizationEnvelope(e);const c=canonicalizeAuthorization(e);if(d.fixtureOwner!=="TEST"||d.requestId!==e.requestId||d.canonicalEnvelope!==c||d.transientSeal!==transientAuthorizationSeal(c))fail("SUPPLIED_DECISION_INVALID");if(AUTHORIZATION_GATES.some(g=>d.controls[g]!==true))fail("CONTROL_MISMATCH");return d.outcome}
export function projectReplayAgreement(a:Projection,b:Projection):"REPLAY_AGREEMENT"|"REPLAY_MISMATCH"{return a.canonical===b.canonical&&a.transientSeal===b.transientSeal?"REPLAY_AGREEMENT":"REPLAY_MISMATCH"}
const forbidden=(code:FailureCode)=>(..._args:readonly unknown[]):never=>fail(code);
export const createAuthorization=forbidden("AUTHORIZATION_CREATION_FORBIDDEN");
export const issueAuthorization=forbidden("AUTHORIZATION_ISSUANCE_FORBIDDEN");
export const activateAuthorization=forbidden("AUTHORIZATION_ACTIVATION_FORBIDDEN");
export const suspendAuthorization=forbidden("AUTHORIZATION_SUSPENSION_FORBIDDEN");
export const revokeAuthorization=forbidden("AUTHORIZATION_REVOCATION_FORBIDDEN");
export const renewAuthorization=forbidden("AUTHORIZATION_RENEWAL_FORBIDDEN");
export const delegateAuthorization=forbidden("AUTHORIZATION_DELEGATION_FORBIDDEN");
export const transferAuthorization=forbidden("AUTHORIZATION_TRANSFER_FORBIDDEN");
export const widenAuthorizationScope=forbidden("SCOPE_WIDENING_FORBIDDEN");
export const persistAuthorizationEnvelope=forbidden("AUTHORIZATION_PERSISTENCE_FORBIDDEN");
export const createControlledRunRequest=forbidden("CONTROLLED_RUN_REQUEST_CREATION_FORBIDDEN");
export const materializeExecutableBundle=forbidden("EXECUTABLE_BUNDLE_MATERIALIZATION_FORBIDDEN");
export const allocateWorkspace=forbidden("WORKSPACE_ALLOCATION_FORBIDDEN");
export const materializeInvocationPlan=forbidden("INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN");
export const executeScenario=forbidden("SCENARIO_EXECUTION_FORBIDDEN");
export const constructOperationalCapture=forbidden("OPERATIONAL_CAPTURE_CONSTRUCTION_FORBIDDEN");
export const constructOperationalResult=forbidden("OPERATIONAL_RESULT_CONSTRUCTION_FORBIDDEN");
export const admitEvidence=forbidden("EVIDENCE_ADMISSION_FORBIDDEN");
export const mutateCandidateState=forbidden("CANDIDATE_STATE_MUTATION_FORBIDDEN");
export const executeCandidate=forbidden("CANDIDATE_EXECUTION_FORBIDDEN");
export const executeAdapter=forbidden("ADAPTER_EXECUTION_FORBIDDEN");
export const accessNetwork=forbidden("NETWORK_ACCESS_FORBIDDEN");
export const executeExternalProcess=forbidden("EXTERNAL_PROCESS_FORBIDDEN");
export const stageFoundation=forbidden("STAGE_FORBIDDEN");
export const commitFoundation=forbidden("COMMIT_FORBIDDEN");
export const tagFoundation=forbidden("TAG_FORBIDDEN");
export const pushFoundation=forbidden("PUSH_FORBIDDEN");
