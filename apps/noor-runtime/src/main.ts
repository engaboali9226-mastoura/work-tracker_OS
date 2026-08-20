import {
  createPrivilegedPlatformRuntimeHost,
} from "./privileged-platform-runtime-host.js";

import {
  createPrivilegedTransportRuntime,
} from "./privileged-transport-runtime.js";

import {
  readNoorProductionRuntimeConfigurationFromEnvironment,
} from "./runtime-environment.js";

import {
  readNoorRuntimeHttpConfigurationFromEnvironment,
} from "./runtime-http-environment.js";

async function run():
Promise<void> {
  let runtime:
    ReturnType<
      typeof createPrivilegedTransportRuntime
    >
    | undefined;

  let shutdownRequest:
    Promise<void> | undefined;

  const removeSignalHandlers =
    () => {
      process.off(
        "SIGINT",
        onSigint,
      );

      process.off(
        "SIGTERM",
        onSigterm,
      );
    };

  const requestShutdown =
    (): Promise<void> => {
      if (shutdownRequest) {
        return shutdownRequest;
      }

      removeSignalHandlers();

      const request =
        runtime
          ? runtime
              .shutdown()
              .catch(
                () => {
                  process.exitCode =
                    1;
                },
              )
          : Promise.resolve();

      shutdownRequest =
        request;

      return request;
    };

  const onSigint =
    () => {
      void requestShutdown();
    };

  const onSigterm =
    () => {
      void requestShutdown();
    };

  try {
    const privilegedConfiguration =
      readNoorProductionRuntimeConfigurationFromEnvironment();

    const httpConfiguration =
      readNoorRuntimeHttpConfigurationFromEnvironment();

    const host =
      createPrivilegedPlatformRuntimeHost(
        privilegedConfiguration,
      );

    runtime =
      createPrivilegedTransportRuntime({
        host,
        httpConfiguration,
      });

    process.once(
      "SIGINT",
      onSigint,
    );

    process.once(
      "SIGTERM",
      onSigterm,
    );

    await runtime.start();
  } catch {
    process.exitCode =
      1;

    await requestShutdown();
  }
}

void run();
