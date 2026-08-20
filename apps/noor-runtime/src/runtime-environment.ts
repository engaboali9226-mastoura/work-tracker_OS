import {
  createNoorProductionRuntimeConfiguration,
  type NoorProductionRuntimeConfiguration,
} from "@worktracker/infrastructure";

export const NOOR_RUNTIME_ENVIRONMENT_KEYS =
  Object.freeze({
    supabaseUrl:
      "SUPABASE_URL",
    supabaseServiceRoleKey:
      "SUPABASE_SERVICE_ROLE_KEY",
    expectedIssuer:
      "NOOR_AUTH_EXPECTED_ISSUER",
    expectedAudience:
      "NOOR_AUTH_EXPECTED_AUDIENCE",
    expectedAlgorithm:
      "NOOR_AUTH_EXPECTED_ALGORITHM",
    sessionLifetimeMs:
      "NOOR_SESSION_LIFETIME_MS",
  } as const);

export type NoorRuntimeEnvironment =
  Readonly<
    Record<
      string,
      string | undefined
    >
  >;

function readSessionLifetimeMs(
  value:
    string | undefined,
): unknown {
  if (
    typeof value !== "string"
    || !/^[0-9]+$/u.test(
      value,
    )
  ) {
    return value;
  }

  return Number(
    value,
  );
}

export function readNoorProductionRuntimeConfigurationFromEnvironment(
  environment:
    NoorRuntimeEnvironment =
      process.env,
): NoorProductionRuntimeConfiguration {
  return createNoorProductionRuntimeConfiguration({
    supabaseUrl:
      environment[
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .supabaseUrl
      ],
    supabaseServiceRoleKey:
      environment[
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .supabaseServiceRoleKey
      ],
    expectedIssuer:
      environment[
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .expectedIssuer
      ],
    expectedAudience:
      environment[
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .expectedAudience
      ],
    expectedAlgorithm:
      environment[
        NOOR_RUNTIME_ENVIRONMENT_KEYS
          .expectedAlgorithm
      ],
    sessionLifetimeMs:
      readSessionLifetimeMs(
        environment[
          NOOR_RUNTIME_ENVIRONMENT_KEYS
            .sessionLifetimeMs
        ],
      ),
  });
}
