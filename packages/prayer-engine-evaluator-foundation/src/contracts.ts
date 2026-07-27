export const CANDIDATE_IDS = [
  "C-01",
  "C-02",
  "C-03",
  "C-04",
] as const;

export type CandidateId = (typeof CANDIDATE_IDS)[number];

export const EXECUTION_PHASES = [
  "P-01_AUTHORIZATION_PREFLIGHT",
  "P-02_WORKSPACE_MATERIALIZATION",
  "P-03_ENVIRONMENT_SANITIZATION",
  "P-04_RESTRICTION_ACTIVATION",
  "P-05_FIXTURE_MATERIALIZATION",
  "P-06_CANDIDATE_SHIM_LOADING",
  "P-07_RESTRICTED_INVOCATION",
  "P-08_RAW_EVIDENCE_CAPTURE",
  "P-09_RESULT_SEALING",
  "P-10_CLEANUP_AND_ATTESTATION",
] as const;

export type ExecutionPhase = (typeof EXECUTION_PHASES)[number];

export const FAILURE_CODES = [
  "AUTHORIZATION_MISSING",
  "SCOPE_VIOLATION",
  "BASELINE_MISMATCH",
  "COHORT_MISMATCH",
  "NETWORK_ACCESS_ATTEMPT",
  "FILESYSTEM_ESCAPE_ATTEMPT",
  "ENVIRONMENT_LEAK",
  "NONDETERMINISTIC_FIXTURE",
  "INVALID_INVOCATION_CONTRACT",
  "PROCESS_SPAWN_DENIED",
  "TIMEOUT_EXCEEDED",
  "RESOURCE_LIMIT_EXCEEDED",
  "RAW_OUTPUT_MISSING",
  "RAW_OUTPUT_MUTATED",
  "RESULT_SEAL_MISMATCH",
  "CLEANUP_INCOMPLETE",
  "REPOSITORY_MUTATION_DETECTED",
  "EVIDENCE_INCOMPLETE",
] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];

export interface AuthorizationState {
  readonly evaluatorImplementation: boolean;
  readonly candidateInstallation: boolean;
  readonly candidateExecution: boolean;
  readonly candidateSelection: boolean;
  readonly dependencySelection: boolean;
  readonly productionAdapterImplementation: boolean;
  readonly commit: boolean;
  readonly tag: boolean;
  readonly push: boolean;
}

export interface RunIntent {
  readonly runId: string;
  readonly candidateId: CandidateId;
  readonly fixtureId: string;
  readonly requirementsHash: string;
  readonly designHash: string;
  readonly protocolHash: string;
  readonly createdAt: string;
}

export interface ResourceLimits {
  readonly initializationTimeoutMs: number;
  readonly calculationTimeoutMs: number;
  readonly stdoutBytes: number;
  readonly stderrBytes: number;
  readonly resultBytes: number;
  readonly generatedFileCount: number;
  readonly generatedFileBytes: number;
}

export interface RawArtifactDescriptor {
  readonly channel: "stdout" | "stderr" | "native-result" | "telemetry";
  readonly relativePath: string;
  readonly sha256: string;
  readonly bytes: number;
}

export interface EvidenceManifest {
  readonly schemaVersion: "1";
  readonly runIntent: RunIntent;
  readonly phase: ExecutionPhase;
  readonly primaryFailure: FailureCode | null;
  readonly secondaryFailures: readonly FailureCode[];
  readonly limits: ResourceLimits;
  readonly artifacts: readonly RawArtifactDescriptor[];
  readonly controllerTimestamp: string;
  readonly repositoryMutation: false;
  readonly candidateInstallation: false;
  readonly candidateExecution: false;
  readonly candidateSelection: false;
  readonly dependencySelection: false;
  readonly productionAdapterImplementation: false;
  readonly commit: false;
  readonly tag: false;
  readonly push: false;
}
