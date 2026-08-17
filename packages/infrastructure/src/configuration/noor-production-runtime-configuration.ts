const INVALID_CONFIGURATION_MESSAGE =
  "Noor production runtime configuration is invalid.";

export type NoorProductionRuntimeConfiguration = {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly expectedIssuer: string;
  readonly expectedAudience: string;
  readonly expectedAlgorithm: "ES256" | "RS256";
  readonly sessionLifetimeMs: number;
};

type NoorProductionRuntimeConfigurationInput = {
  readonly supabaseUrl?: unknown;
  readonly supabaseServiceRoleKey?: unknown;
  readonly expectedIssuer?: unknown;
  readonly expectedAudience?: unknown;
  readonly expectedAlgorithm?: unknown;
  readonly sessionLifetimeMs?: unknown;
};

function throwInvalidConfiguration(): never {
  throw new TypeError(
    INVALID_CONFIGURATION_MESSAGE,
  );
}

function requireExactString(
  value: unknown,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim().length === 0
    || value.trim() !== value
  ) {
    throwInvalidConfiguration();
  }

  return value;
}

function requireUrl(
  value: unknown,
): string {
  const exactValue =
    requireExactString(
      value,
    );

  try {
    new URL(
      exactValue,
    );
  } catch {
    throwInvalidConfiguration();
  }

  return exactValue;
}

function requireExpectedIssuer(
  value: unknown,
): string {
  const exactValue =
    requireExactString(
      value,
    );

  let issuer: URL;

  try {
    issuer =
      new URL(
        exactValue,
      );
  } catch {
    throwInvalidConfiguration();
  }

  if (
    issuer.protocol !== "https:"
    || issuer.username.length !== 0
    || issuer.password.length !== 0
    || issuer.search.length !== 0
    || issuer.hash.length !== 0
  ) {
    throwInvalidConfiguration();
  }

  return exactValue;
}

function requireExpectedAlgorithm(
  value: unknown,
): "ES256" | "RS256" {
  if (
    value !== "ES256"
    && value !== "RS256"
  ) {
    throwInvalidConfiguration();
  }

  return value;
}

function requireSessionLifetimeMs(
  value: unknown,
): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(
      value,
    )
    || !Number.isInteger(
      value,
    )
    || !Number.isSafeInteger(
      value,
    )
    || value <= 0
  ) {
    throwInvalidConfiguration();
  }

  return value;
}

export function createNoorProductionRuntimeConfiguration(
  input: unknown,
): NoorProductionRuntimeConfiguration {
  if (
    input === null
    || typeof input !== "object"
    || Array.isArray(
      input,
    )
  ) {
    throwInvalidConfiguration();
  }

  const configuration =
    input as NoorProductionRuntimeConfigurationInput;

  return Object.freeze({
    supabaseUrl:
      requireUrl(
        configuration.supabaseUrl,
      ),
    supabaseServiceRoleKey:
      requireExactString(
        configuration.supabaseServiceRoleKey,
      ),
    expectedIssuer:
      requireExpectedIssuer(
        configuration.expectedIssuer,
      ),
    expectedAudience:
      requireExactString(
        configuration.expectedAudience,
      ),
    expectedAlgorithm:
      requireExpectedAlgorithm(
        configuration.expectedAlgorithm,
      ),
    sessionLifetimeMs:
      requireSessionLifetimeMs(
        configuration.sessionLifetimeMs,
      ),
  });
}
