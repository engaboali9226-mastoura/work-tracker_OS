import { EvaluatorFoundationError } from "./errors.js";

export interface SanitizedEnvironment {
  readonly effective: Readonly<Record<string, string>>;
  readonly removedKeys: readonly string[];
}

const SENSITIVE_KEY_PATTERN =
  /(?:TOKEN|SECRET|PASSWORD|PASSWD|COOKIE|AUTH|CREDENTIAL|PRIVATE|PROXY|AWS_|AZURE_|GCP_|GOOGLE_|GITHUB_|GITLAB_|NPM_|YARN_)/iu;

export function sanitizeEnvironment(
  source: Readonly<Record<string, string | undefined>>,
  allowlist: readonly string[],
): SanitizedEnvironment {
  const allowed = new Set(allowlist);
  const effective: Record<string, string> = {};
  const removed = new Set<string>();

  for (const [key, value] of Object.entries(source)) {
    if (
      value !== undefined &&
      allowed.has(key) &&
      !SENSITIVE_KEY_PATTERN.test(key)
    ) {
      effective[key] = value;
    } else {
      removed.add(key);
    }
  }

  for (const key of Object.keys(effective)) {
    if (!allowed.has(key)) {
      throw new EvaluatorFoundationError(
        "ENVIRONMENT_LEAK",
        "An undeclared environment key reached the worker environment.",
        { key },
      );
    }
  }

  const sortedEffective = Object.fromEntries(
    Object.entries(effective).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );

  return Object.freeze({
    effective: Object.freeze(sortedEffective),
    removedKeys: Object.freeze([...removed].sort()),
  });
}
