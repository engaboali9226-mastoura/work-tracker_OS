export const NOOR_RUNTIME_HTTP_ENVIRONMENT_KEYS =
  Object.freeze({
    listenHost:
      "NOOR_RUNTIME_LISTEN_HOST",
    listenPort:
      "NOOR_RUNTIME_LISTEN_PORT",
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
}

const DEFAULT_LISTEN_HOST =
  "127.0.0.1";

const DEFAULT_LISTEN_PORT =
  8787;

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
    throw new Error(
      "Noor runtime HTTP configuration is invalid.",
    );
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
    throw new Error(
      "Noor runtime HTTP configuration is invalid.",
    );
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
    throw new Error(
      "Noor runtime HTTP configuration is invalid.",
    );
  }

  return port;
}

export function readNoorRuntimeHttpConfigurationFromEnvironment(
  environment:
    NoorRuntimeHttpEnvironment =
      process.env,
): NoorRuntimeHttpConfiguration {
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
  });
}
