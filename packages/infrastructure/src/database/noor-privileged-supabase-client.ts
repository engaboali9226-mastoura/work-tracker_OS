import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type {
  NoorProductionRuntimeConfiguration,
} from "../configuration/noor-production-runtime-configuration.js";

const INVALID_CONFIGURATION_MESSAGE =
  "Noor privileged Supabase client configuration is invalid.";

export type NoorPrivilegedSupabaseClientConfiguration =
  Readonly<
    Pick<
      NoorProductionRuntimeConfiguration,
      "supabaseUrl"
      | "supabaseServiceRoleKey"
    >
  >;

type RuntimeConfigurationInput = {
  readonly supabaseUrl?: unknown;
  readonly supabaseServiceRoleKey?: unknown;
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

function requireSupabaseOrigin(
  value: unknown,
): string {
  const exactValue =
    requireExactString(
      value,
    );

  let url: URL;

  try {
    url =
      new URL(
        exactValue,
      );
  } catch {
    throwInvalidConfiguration();
  }

  if (
    url.protocol !== "https:"
    || url.username.length !== 0
    || url.password.length !== 0
    || url.pathname !== "/"
    || url.search.length !== 0
    || url.hash.length !== 0
  ) {
    throwInvalidConfiguration();
  }

  return exactValue;
}

export function createNoorPrivilegedSupabaseClient<
  Database
>(
  configuration:
    NoorPrivilegedSupabaseClientConfiguration,
): SupabaseClient<Database> {
  if (
    typeof configuration !== "object"
    || configuration === null
    || Array.isArray(
      configuration,
    )
  ) {
    throwInvalidConfiguration();
  }

  const input =
    configuration as
      RuntimeConfigurationInput;

  const supabaseUrl =
    requireSupabaseOrigin(
      input.supabaseUrl,
    );

  const supabaseServiceRoleKey =
    requireExactString(
      input.supabaseServiceRoleKey,
    );

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken:
          false,
        persistSession:
          false,
        detectSessionInUrl:
          false,
      },
    },
  );
}
