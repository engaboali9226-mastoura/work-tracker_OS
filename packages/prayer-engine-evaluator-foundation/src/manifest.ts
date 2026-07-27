import {
  FAILURE_CODES,
  type EvidenceManifest,
  type FailureCode,
  type RawArtifactDescriptor,
} from "./contracts.js";
import { EvaluatorFoundationError } from "./errors.js";

const FORBIDDEN_DECISION_KEYS = new Set([
  "score",
  "scores",
  "rank",
  "ranking",
  "recommendation",
  "recommendedCandidate",
  "selectedCandidate",
  "gateQualification",
]);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    const source = value as Readonly<Record<string, unknown>>;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(source).sort()) {
      if (FORBIDDEN_DECISION_KEYS.has(key)) {
        throw new EvaluatorFoundationError(
          "SCOPE_VIOLATION",
          `Evidence-only manifests must not contain ${key}.`,
        );
      }

      const item = source[key];

      if (item !== undefined) {
        result[key] = canonicalize(item);
      }
    }

    return result;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  throw new EvaluatorFoundationError(
    "INVALID_INVOCATION_CONTRACT",
    "Canonical evidence contains an unsupported value.",
  );
}

export function canonicalJson(value: unknown): string {
  const serialized = JSON.stringify(canonicalize(value));

  if (serialized === undefined) {
    throw new EvaluatorFoundationError(
      "INVALID_INVOCATION_CONTRACT",
      "Canonical evidence could not be serialized.",
    );
  }

  return serialized;
}

export function orderFailureEvidence(
  failures: readonly FailureCode[],
): readonly FailureCode[] {
  const order = new Map(
    FAILURE_CODES.map((code, position) => [code, position] as const),
  );

  return Object.freeze(
    [...new Set(failures)].sort(
      (left, right) =>
        (order.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(right) ?? Number.MAX_SAFE_INTEGER),
    ),
  );
}

export function orderArtifacts(
  artifacts: readonly RawArtifactDescriptor[],
): readonly RawArtifactDescriptor[] {
  return Object.freeze(
    [...artifacts].sort((left, right) => {
      const channelOrder = left.channel.localeCompare(right.channel);

      return channelOrder !== 0
        ? channelOrder
        : left.relativePath.localeCompare(right.relativePath);
    }),
  );
}

export function validateEvidenceManifest(manifest: EvidenceManifest): void {
  canonicalJson(manifest);

  if (manifest.schemaVersion !== "1") {
    throw new EvaluatorFoundationError(
      "INVALID_INVOCATION_CONTRACT",
      "Unsupported evidence manifest schema version.",
    );
  }

  if (manifest.repositoryMutation !== false) {
    throw new EvaluatorFoundationError(
      "REPOSITORY_MUTATION_DETECTED",
      "Evidence manifest reports repository mutation.",
    );
  }

  if (
    manifest.candidateInstallation !== false ||
    manifest.candidateExecution !== false ||
    manifest.candidateSelection !== false ||
    manifest.dependencySelection !== false ||
    manifest.productionAdapterImplementation !== false ||
    manifest.commit !== false ||
    manifest.tag !== false ||
    manifest.push !== false
  ) {
    throw new EvaluatorFoundationError(
      "SCOPE_VIOLATION",
      "Evidence manifest contains an unauthorized capability result.",
    );
  }

  for (const artifact of manifest.artifacts) {
    if (!/^[a-f0-9]{64}$/u.test(artifact.sha256) || artifact.bytes < 0) {
      throw new EvaluatorFoundationError(
        "EVIDENCE_INCOMPLETE",
        "Evidence artifact descriptor is incomplete.",
        { relativePath: artifact.relativePath },
      );
    }
  }
}
