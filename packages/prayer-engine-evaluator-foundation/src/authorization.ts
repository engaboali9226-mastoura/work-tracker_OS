import {
  CANDIDATE_IDS,
  type AuthorizationState,
  type RunIntent,
} from "./contracts.js";
import { EvaluatorFoundationError } from "./errors.js";

const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;

export function createFoundationOnlyAuthorization(): AuthorizationState {
  return Object.freeze({
    evaluatorImplementation: true,
    candidateInstallation: false,
    candidateExecution: false,
    candidateSelection: false,
    dependencySelection: false,
    productionAdapterImplementation: false,
    commit: false,
    tag: false,
    push: false,
  });
}

export function assertFoundationImplementationAuthorized(
  authorization: AuthorizationState,
): void {
  if (!authorization.evaluatorImplementation) {
    throw new EvaluatorFoundationError(
      "AUTHORIZATION_MISSING",
      "Evaluator foundation implementation is not authorized.",
    );
  }

  const forbiddenCapabilities = [
    authorization.candidateInstallation,
    authorization.candidateExecution,
    authorization.candidateSelection,
    authorization.dependencySelection,
    authorization.productionAdapterImplementation,
    authorization.commit,
    authorization.tag,
    authorization.push,
  ];

  if (forbiddenCapabilities.some(Boolean)) {
    throw new EvaluatorFoundationError(
      "SCOPE_VIOLATION",
      "Foundation authorization contains a forbidden capability.",
    );
  }
}

export function assertCandidateExecutionAuthorized(
  authorization: AuthorizationState,
): void {
  if (!authorization.candidateExecution) {
    throw new EvaluatorFoundationError(
      "AUTHORIZATION_MISSING",
      "Candidate execution is not authorized.",
    );
  }
}

export function validateRunIntent(intent: RunIntent): void {
  if (!RUN_ID_PATTERN.test(intent.runId)) {
    throw new EvaluatorFoundationError(
      "INVALID_INVOCATION_CONTRACT",
      "Run ID is invalid.",
    );
  }

  if (!CANDIDATE_IDS.includes(intent.candidateId)) {
    throw new EvaluatorFoundationError(
      "COHORT_MISMATCH",
      "Candidate is outside the approved cohort.",
    );
  }

  if (intent.fixtureId.trim().length === 0) {
    throw new EvaluatorFoundationError(
      "NONDETERMINISTIC_FIXTURE",
      "Fixture ID must not be empty.",
    );
  }

  const hashes = [
    ["requirementsHash", intent.requirementsHash],
    ["designHash", intent.designHash],
    ["protocolHash", intent.protocolHash],
  ] as const;

  for (const [name, value] of hashes) {
    if (!HASH_PATTERN.test(value)) {
      throw new EvaluatorFoundationError(
        "BASELINE_MISMATCH",
        `${name} must be a lowercase SHA-256 value.`,
      );
    }
  }

  if (Number.isNaN(Date.parse(intent.createdAt))) {
    throw new EvaluatorFoundationError(
      "INVALID_INVOCATION_CONTRACT",
      "Run intent createdAt is invalid.",
    );
  }
}
