export const NOOR_RUNTIME_HTTP_ENVIRONMENT_KEYS =
  Object.freeze({
    listenHost:
      "NOOR_RUNTIME_LISTEN_HOST",
    listenPort:
      "NOOR_RUNTIME_LISTEN_PORT",
    publicOrigin:
      "NOOR_PUBLIC_ORIGIN",
  } as const);

export type NoorRuntimeHttpEnvironment =
  Readonly<
    Record<
      string,
      string | undefined
    >
  >;

export interface NoorRuntimeHttpConfiguration {
  readonly host:
    string;
  readonly port:
    number;
  readonly publicOrigin:
    string;
  readonly secureCookie:
    boolean;
}

const DEFAULT_LISTEN_HOST =
  "127.0.0.1";

const DEFAULT_LISTEN_PORT =
  8787;

function invalidConfiguration():
never {
  throw new Error(
    "Noor runtime HTTP configuration is invalid.",
  );
}

function readHost(
  value:
    string | undefined,
): string {
  if (value === undefined) {
    return DEFAULT_LISTEN_HOST;
  }

  if (
    value.length === 0
    || value.trim() !== value
    || /\s/u.test(
      value,
    )
  ) {
    return invalidConfiguration();
  }

  return value;
}

function readPort(
  value:
    string | undefined,
): number {
  if (value === undefined) {
    return DEFAULT_LISTEN_PORT;
  }

  if (
    !/^[0-9]+$/u.test(
      value,
    )
  ) {
    return invalidConfiguration();
  }

  const port =
    Number(
      value,
    );

  if (
    !Number.isSafeInteger(
      port,
    )
    || port < 1
    || port > 65_535
  ) {
    return invalidConfiguration();
  }

  return port;
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

function readPublicOrigin(
  value:
    string | undefined,
): Readonly<{
  publicOrigin:
    string;
  secureCookie:
    boolean;
}> {
  if (
    value === undefined
    || value.length === 0
    || value.trim() !== value
    || /\s/u.test(
      value,
    )
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
    return Object.freeze({
      publicOrigin:
        parsed.origin,
      secureCookie:
        true,
    });
  }

  if (
    parsed.protocol === "http:"
    && isExplicitLoopbackHost(
      parsed.hostname,
    )
  ) {
    return Object.freeze({
      publicOrigin:
        parsed.origin,
      secureCookie:
        false,
    });
  }

  return invalidConfiguration();
}

export function readNoorRuntimeHttpConfigurationFromEnvironment(
  environment:
    NoorRuntimeHttpEnvironment =
      process.env,
): NoorRuntimeHttpConfiguration {
  const origin =
    readPublicOrigin(
      environment[
        NOOR_RUNTIME_HTTP_ENVIRONMENT_KEYS
          .publicOrigin
      ],
    );

  return Object.freeze({
    host:
      readHost(
        environment[
          NOOR_RUNTIME_HTTP_ENVIRONMENT_KEYS
            .listenHost
        ],
      ),

    port:
      readPort(
        environment[
          NOOR_RUNTIME_HTTP_ENVIRONMENT_KEYS
            .listenPort
        ],
      ),

    publicOrigin:
      origin.publicOrigin,

    secureCookie:
      origin.secureCookie,
  });
}
