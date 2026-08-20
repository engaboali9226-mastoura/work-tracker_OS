import type {
  NoorRuntimeHttpConfiguration,
} from "./runtime-http-environment.js";

import {
  createRouteAccessHttpServer,
} from "./route-access-http-server.js";

import type {
  RouteAccessEvidenceExecutor,
  RouteAccessHttpServer,
  RouteAccessHttpServerOptions,
} from "./route-access-http-server.js";

import type {
  SessionEstablishmentExecutor,
} from "./session-establishment-http-handler.js";

const RUNTIME_FAILURE_MESSAGE =
  "Noor privileged transport runtime failed.";

export interface PrivilegedTransportExecutor
extends RouteAccessEvidenceExecutor {
  readonly sessionEstablishment:
    SessionEstablishmentExecutor;
}

export interface PrivilegedTransportHost {
  start():
  Promise<PrivilegedTransportExecutor>;

  shutdown():
  Promise<void>;
}

export type RouteAccessHttpServerFactory =
  (
    executor:
      RouteAccessEvidenceExecutor,
    options:
      RouteAccessHttpServerOptions,
  ) => RouteAccessHttpServer;

export interface PrivilegedTransportRuntimeDependencies {
  readonly host:
    PrivilegedTransportHost;

  readonly httpConfiguration:
    NoorRuntimeHttpConfiguration;

  readonly createHttpServer?:
    RouteAccessHttpServerFactory;
}

export interface PrivilegedTransportRuntime {
  start():
  Promise<void>;

  shutdown():
  Promise<void>;
}

class DefaultPrivilegedTransportRuntime
implements PrivilegedTransportRuntime {
  private startRequest:
    Promise<void> | undefined;

  private shutdownRequest:
    Promise<void> | undefined;

  private server:
    RouteAccessHttpServer | undefined;

  private running =
    false;

  private failed =
    false;

  public constructor(
    private readonly dependencies:
      PrivilegedTransportRuntimeDependencies,
  ) {}

  public start():
  Promise<void> {
    if (
      this.failed
      || this.shutdownRequest
    ) {
      return Promise.reject(
        new Error(
          RUNTIME_FAILURE_MESSAGE,
        ),
      );
    }

    if (this.running) {
      return Promise.resolve();
    }

    if (this.startRequest) {
      return this.startRequest;
    }

    const request =
      this.startInternal();

    this.startRequest =
      request;

    void request.then(
      () => {
        if (
          this.startRequest
          === request
        ) {
          this.startRequest =
            undefined;
        }
      },
      () => {
        if (
          this.startRequest
          === request
        ) {
          this.startRequest =
            undefined;
        }
      },
    );

    return request;
  }

  private async startInternal():
  Promise<void> {
    try {
      const executor =
        await this.dependencies
          .host
          .start();

      const serverFactory =
        this.dependencies
          .createHttpServer
        ?? createRouteAccessHttpServer;

      const server =
        serverFactory(
          executor,
          {
            sessionEstablishment: {
              executor:
                executor
                  .sessionEstablishment,
              publicOrigin:
                this.dependencies
                  .httpConfiguration
                  .publicOrigin,
              secureCookie:
                this.dependencies
                  .httpConfiguration
                  .secureCookie,
            },
          },
        );

      this.server =
        server;

      await server.listen(
        this.dependencies
          .httpConfiguration,
      );

      this.running =
        true;
    } catch {
      this.failed =
        true;

      const server =
        this.server;

      this.server =
        undefined;

      if (server) {
        try {
          await server.close();
        } catch {
        }
      }

      try {
        await this.dependencies
          .host
          .shutdown();
      } catch {
      }

      throw new Error(
        RUNTIME_FAILURE_MESSAGE,
      );
    }
  }

  public shutdown():
  Promise<void> {
    if (this.shutdownRequest) {
      return this.shutdownRequest;
    }

    const request =
      this.shutdownInternal();

    this.shutdownRequest =
      request;

    return request;
  }

  private async shutdownInternal():
  Promise<void> {
    const pendingStart =
      this.startRequest;

    if (pendingStart) {
      try {
        await pendingStart;
      } catch {
      }
    }

    const server =
      this.server;

    this.server =
      undefined;

    this.running =
      false;

    let failed =
      false;

    if (server) {
      try {
        await server.close();
      } catch {
        failed =
          true;
      }
    }

    try {
      await this.dependencies
        .host
        .shutdown();
    } catch {
      failed =
        true;
    }

    if (failed) {
      this.failed =
        true;

      throw new Error(
        RUNTIME_FAILURE_MESSAGE,
      );
    }
  }
}

export function createPrivilegedTransportRuntime(
  dependencies:
    PrivilegedTransportRuntimeDependencies,
): PrivilegedTransportRuntime {
  return new DefaultPrivilegedTransportRuntime(
    dependencies,
  );
}
