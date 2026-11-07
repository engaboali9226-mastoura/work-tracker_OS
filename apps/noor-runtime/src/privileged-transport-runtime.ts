import { assembleLabPrivateJournalR196 } from "./noor-private-journal-assembly-r196.js";
import type { NoorLabPrivateJournalDependenciesR196 } from "./noor-private-journal-assembly-r196.js";
import type { PersonalControlOperation } from "./personal-control-operation.js";

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
  readonly sessionRevocation?: Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<void>}>;
  readonly personalToday?: import("./personal-today-operation.js").PersonalTodayExecutor;
  readonly personalControl?: import("./personal-control-operation.js").PersonalControlExecutor;
  readonly teacherWork?: import("./noor-work-teacher-operation-r264.js").NoorWorkTeacherOperationR264;
  readonly adminR271?: import("./noor-admin-http-r271.js").AdminHttpDependenciesR271;
  readonly adminRecoveryR271?: import("./noor-admin-password-recovery-http-r271.js").NoorAdminRecoveryHttpDependenciesR271;
  readonly trustedPrivateJournalR221?: import("./noor-private-journal-r185.js").NoorPrivateJournalOperationR185 | undefined;
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

  /** Explicit local-only injection. Production main does not supply this. */
  readonly labPrivateJournalR196?: NoorLabPrivateJournalDependenciesR196;
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

      const logoutOptions:Pick<RouteAccessHttpServerOptions,"sessionLogoutR269"> =
        executor.sessionRevocation===undefined ? {} : {
          sessionLogoutR269:{
            revokeSession:executor.sessionRevocation,
            expectedOrigin:this.dependencies.httpConfiguration.publicOrigin,
            secureCookie:this.dependencies.httpConfiguration.secureCookie,
          },
        };

      const personalTodayOptions =
        executor.personalToday
          === undefined
          ? {}
          : {
              personalToday:
                executor.personalToday,
            };

      const adminOptions:Pick<RouteAccessHttpServerOptions,"adminR271"> =
        executor.adminR271===undefined ? {} :
        executor.adminR271.expectedOrigin===this.dependencies.httpConfiguration.publicOrigin
          ? {adminR271:executor.adminR271}
          : (()=>{throw Error("R271_ADMIN_ORIGIN_MISMATCH");})();

      const adminRecoveryOptions:Pick<RouteAccessHttpServerOptions,"adminRecoveryR271"> =
        executor.adminRecoveryR271===undefined ? {} :
        executor.adminRecoveryR271.expectedOrigin===this.dependencies.httpConfiguration.publicOrigin
          ? {adminRecoveryR271:executor.adminRecoveryR271}
          : (()=>{throw Error("R271_ADMIN_RECOVERY_ORIGIN_MISMATCH");})();

      const teacherWorkOptions: Pick<RouteAccessHttpServerOptions,"teacherWorkR264"> =
        executor.teacherWork===undefined ? {} : {teacherWorkR264:{operation:executor.teacherWork,expectedOrigin:this.dependencies.httpConfiguration.publicOrigin}};

      const personalControlOptions =
        executor.personalControl
          === undefined
          ? {}
          : {
              personalControl:
                executor.personalControl,
            };

      // No environmental fallback and no privileged production port.
      // A missing dependency fails startup; normal runtime remains unchanged.
      let labJournalOptions: Pick<RouteAccessHttpServerOptions, "labPrivateJournalR193"> = {};
      if (this.dependencies.labPrivateJournalR196 !== undefined) {
        const conf = this.dependencies.httpConfiguration;
        if (conf.host !== "127.0.0.1" || conf.port === 8787 ||
            conf.port < 1024 || conf.port > 65535 ||
            conf.publicOrigin !== `http://127.0.0.1:${conf.port}` || conf.secureCookie) {
          throw new Error("R196_PRODUCTION_RUNTIME_JOURNAL_FORBIDDEN");
        }
        const control = executor.personalControl;
        if (!control || !("resolveAuthorizedJournalUser" in control) ||
            typeof control.resolveAuthorizedJournalUser !== "function" ||
            !("resolveAuthorizedJournalPersonalDay" in control) ||
            typeof control.resolveAuthorizedJournalPersonalDay !== "function") {
          throw new Error("R196_VERIFIED_PERSONAL_CONTROL_MISSING");
        }
        const personalControl = control as typeof control & Pick<PersonalControlOperation, "resolveAuthorizedJournalUser" | "resolveAuthorizedJournalPersonalDay">;
        labJournalOptions = {
          labPrivateJournalR193: assembleLabPrivateJournalR196(
            personalControl,
            this.dependencies.labPrivateJournalR196,
            conf.publicOrigin,
          ),
        };
      }

      const trustedJournalOptions: Pick<RouteAccessHttpServerOptions,"trustedPrivateJournalR221"> =
        executor.trustedPrivateJournalR221 === undefined ? {} : {
          trustedPrivateJournalR221: {
            operation:executor.trustedPrivateJournalR221,
            expectedOrigin:this.dependencies.httpConfiguration.publicOrigin,
          },
        };
      if (executor.trustedPrivateJournalR221 && this.dependencies.labPrivateJournalR196) {
        throw Error("R221_PRODUCTION_AND_LAB_JOURNAL_CONFLICT");
      }

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
            ...personalTodayOptions,
            ...logoutOptions,
            ...personalControlOptions,
            ...teacherWorkOptions,
            ...adminOptions,
            ...adminRecoveryOptions,
            ...labJournalOptions,
            ...trustedJournalOptions,
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
