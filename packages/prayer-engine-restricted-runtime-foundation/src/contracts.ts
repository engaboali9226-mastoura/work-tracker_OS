export const CANDIDATE_IDS = [
  "C-01",
  "C-02",
  "C-03",
  "C-04",
] as const;

export type CandidateId=(typeof CANDIDATE_IDS)[number];

export const RUNTIME_PHASES = [
  "R-01_AUTHORIZATION_PREFLIGHT",
  "R-02_WORKSPACE_MATERIALIZATION",
  "R-03_ENVIRONMENT_SANITIZATION",
  "R-04_RESTRICTION_ACTIVATION",
  "R-05_FIXTURE_MATERIALIZATION",
  "R-06_PACKAGE_MATERIALIZATION",
  "R-07_WORKER_BOOT",
  "R-08_IPC_HANDSHAKE",
  "R-09_RESTRICTED_INVOCATION",
  "R-10_RAW_EVIDENCE_CAPTURE",
  "R-11_RESULT_SEALING",
  "R-12_CLEANUP_AND_ATTESTATION",
] as const;

export type RuntimePhase=(typeof RUNTIME_PHASES)[number];

export const RUNTIME_FAILURE_CODES = [
  "AUTHORIZATION_MISSING",
  "SCOPE_VIOLATION",
  "BASELINE_MISMATCH",
  "COHORT_MISMATCH",
  "INVALID_RUN_IDENTITY",
  "INVALID_STATE_TRANSITION",
  "WORKSPACE_NOT_ISOLATED",
  "WORKSPACE_REUSE_DETECTED",
  "ENVIRONMENT_LEAK",
  "NETWORK_DENIAL_UNPROVEN",
  "FILESYSTEM_CONTAINMENT_UNPROVEN",
  "FIXTURE_INTEGRITY_FAILURE",
  "PACKAGE_INTEGRITY_FAILURE",
  "WORKER_BOOT_FAILURE",
  "IPC_HANDSHAKE_FAILURE",
  "TIMEOUT_EXCEEDED",
  "RESOURCE_LIMIT_EXCEEDED",
  "EVIDENCE_INCOMPLETE",
  "RESULT_SEAL_MISMATCH",
  "CLEANUP_INCOMPLETE",
  "REPOSITORY_MUTATION_DETECTED",
] as const;

export type RuntimeFailureCode=(typeof RUNTIME_FAILURE_CODES)[number];
export interface Authorization{runtimeFoundationImplementation:boolean;candidateInstallation:boolean;candidateExecution:boolean;candidateSelection:boolean;dependencySelection:boolean;productionAdapterImplementation:boolean;commit:boolean;tag:boolean;push:boolean}
export interface RunIntent{runId:string;candidateId:CandidateId;fixtureId:string;requirementsHash:string;designHash:string;protocolHash:string;foundationHash:string;createdAt:string}
export interface Limits{initializationTimeoutMs:number;handshakeTimeoutMs:number;calculationTimeoutMs:number;shutdownTimeoutMs:number;stdoutBytes:number;stderrBytes:number;resultBytes:number;telemetryBytes:number;generatedFileCount:number;generatedFileBytes:number;automaticRetry:false}
export interface Controls{isolationSubstrate:string|null;networkDenialMechanism:string|null;filesystemRestrictionMechanism:string|null;ipcTransport:string|null;clockControlMechanism:string|null}
export interface Workspace{root:string;inputDirectory:string;packageDirectory:string;outputDirectory:string;telemetryDirectory:string;sealDirectory:string}
export interface Transition{from:RuntimePhase|null;to:RuntimePhase;controllerTimestamp:string}
export interface LifecycleSnapshot{runId:string;phase:RuntimePhase;terminal:boolean;primaryFailure:RuntimeFailureCode|null;secondaryFailures:readonly RuntimeFailureCode[];transitions:readonly Transition[]}
export interface IpcRequest{schemaVersion:"1";protocolVersion:string;operation:"handshake"|"invoke"|"shutdown";runId:string;payloadSha256:string;payloadBytes:number}
export interface Manifest{schemaVersion:"1";runIntent:RunIntent;lifecycle:LifecycleSnapshot;workspace:Workspace;limits:Limits;controls:Controls;controllerTimestamp:string;repositoryMutation:false;networkUsed:false;dependencyInstallation:false;candidateInstallation:false;candidateExecution:false;candidateSelection:false;dependencySelection:false;productionAdapterImplementation:false;commit:false;tag:false;push:false}
