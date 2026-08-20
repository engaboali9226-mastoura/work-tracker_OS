export const PUBLIC_AUTHENTICATION_ENVIRONMENT_KEYS =
  Object.freeze({
    supabaseUrl:
      "VITE_NOOR_SUPABASE_URL",
    supabasePublishableKey:
      "VITE_NOOR_SUPABASE_PUBLISHABLE_KEY",
  } as const);

export interface PublicAuthenticationConfiguration {
  readonly supabaseUrl:
    string;

  readonly supabasePublishableKey:
    string;
}

export type PublicAuthenticationEnvironment =
Readonly<
  Record<
    string,
    string | undefined
  >
>;

function invalidConfiguration():
never {
  throw new Error(
    "Public authentication configuration is invalid.",
  );
}

function isExplicitLoopbackHost(
  hostname:
    string,
): boolean {
  return (
    hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname === "[::1]"
  );
}

function readSupabaseUrl(
  value:
    string | undefined,
): string {
  if (
    value === undefined
    || value.length === 0
    || value.trim() !== value
  ) {
    return invalidConfiguration();
  }

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        value,
      );
  } catch {
    return invalidConfiguration();
  }

  if (
    parsed.username.length > 0
    || parsed.password.length > 0
    || parsed.pathname !== "/"
    || parsed.search.length > 0
    || parsed.hash.length > 0
  ) {
    return invalidConfiguration();
  }

  if (parsed.protocol === "https:") {
    return parsed.origin;
  }

  if (
    parsed.protocol === "http:"
    && isExplicitLoopbackHost(
      parsed.hostname,
    )
  ) {
    return parsed.origin;
  }

  return invalidConfiguration();
}

function decodeJwtRole(
  value:
    string,
): string | undefined {
  const parts =
    value.split(
      ".",
    );

  if (parts.length !== 3) {
    return undefined;
  }

  const encoded =
    parts[1];

  if (!encoded) {
    return undefined;
  }

  const decoder =
    globalThis.atob;

  if (typeof decoder !== "function") {
    return undefined;
  }

  try {
    const normalized =
      encoded
        .replace(
          /-/gu,
          "+",
        )
        .replace(
          /_/gu,
          "/",
        );

    const padded =
      normalized.padEnd(
        Math.ceil(
          normalized.length / 4,
        ) * 4,
        "=",
      );

    const payload =
      JSON.parse(
        decoder(
          padded,
        ),
      ) as
        Record<string, unknown>;

    return (
      typeof payload.role === "string"
        ? payload.role
        : undefined
    );
  } catch {
    return undefined;
  }
}

function readPublishableKey(
  value:
    string | undefined,
): string {
  if (
    value === undefined
    || value.length === 0
    || value.trim() !== value
    || /\s/u.test(
      value,
    )
    || value.startsWith(
      "sb_secret_",
    )
    || decodeJwtRole(
      value,
    ) === [
      "service",
      "role",
    ].join(
      "_",
    )
  ) {
    return invalidConfiguration();
  }

  return value;
}

export function readPublicAuthenticationConfiguration(
  environment:
    PublicAuthenticationEnvironment,
): PublicAuthenticationConfiguration {
  return Object.freeze({
    supabaseUrl:
      readSupabaseUrl(
        environment[
          PUBLIC_AUTHENTICATION_ENVIRONMENT_KEYS
            .supabaseUrl
        ],
      ),

    supabasePublishableKey:
      readPublishableKey(
        environment[
          PUBLIC_AUTHENTICATION_ENVIRONMENT_KEYS
            .supabasePublishableKey
        ],
      ),
  });
}

export function readBrowserPublicAuthenticationConfiguration():
PublicAuthenticationConfiguration {
  const environment =
    (
      import.meta as ImportMeta & {
        readonly env?:
          Record<
            string,
            string | undefined
          >;
      }
    ).env
    ?? {};

  return readPublicAuthenticationConfiguration(
    environment,
  );
}
