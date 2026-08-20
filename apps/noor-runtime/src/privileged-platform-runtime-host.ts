import {
  CryptographicEntitlementIdGenerator,
  CryptographicSessionIdGenerator,
  FixedSessionLifetimePolicy,
  SupabaseAuthenticationVerifier,
  SupabasePostgresAuthenticationAccountLinkageResolver,
  SupabasePostgresEntitlementRepository,
  SupabasePostgresSessionRepository,
  SystemClock,
  createNoorPrivilegedSupabaseClient,
} from "@worktracker/infrastructure";

import type {
  NoorAuthenticationAccountLinkageDatabase,
  NoorEntitlementDatabase,
  NoorProductionRuntimeConfiguration,
  NoorSessionDatabase,
} from "@worktracker/infrastructure";

import {
  PLATFORM_COMPOSITION_STATES,
  createPlatformCompositionRoot,
} from "@worktracker/platform";

import type {
  PlatformCompositionRoot,
  PlatformCompositionState,
} from "@worktracker/platform";

import {
  PrivilegedRouteAccessEvidenceOperation,
} from "./privileged-route-access-evidence-operation.js";

import {
  PrivilegedSessionEstablishmentOperation,
} from "./privileged-session-establishment-operation.js";

export interface PrivilegedPlatformRuntimeOperations {
  readonly sessionEstablishment:
    PrivilegedSessionEstablishmentOperation;

  execute(
    input:
      Parameters<
        PrivilegedRouteAccessEvidenceOperation["execute"]
      >[0],
  ):
  ReturnType<
    PrivilegedRouteAccessEvidenceOperation["execute"]
  >;
}

class DefaultPrivilegedPlatformRuntimeOperations
implements PrivilegedPlatformRuntimeOperations {
  public constructor(
    private readonly routeAccess:
      PrivilegedRouteAccessEvidenceOperation,

    public readonly sessionEstablishment:
      PrivilegedSessionEstablishmentOperation,
  ) {}

  public execute(
    input:
      Parameters<
        PrivilegedRouteAccessEvidenceOperation["execute"]
      >[0],
  ):
  ReturnType<
    PrivilegedRouteAccessEvidenceOperation["execute"]
  > {
    return this.routeAccess
      .execute(
        input,
      );
  }
}

export interface PrivilegedPlatformRuntimeHost {
  start():
  Promise<PrivilegedPlatformRuntimeOperations>;

  shutdown():
  Promise<void>;

  getState():
  PlatformCompositionState;
}

class DefaultPrivilegedPlatformRuntimeHost
implements PrivilegedPlatformRuntimeHost {
  private acceptingAccess =
    false;

  private activeOperation:
    PrivilegedPlatformRuntimeOperations
    | undefined;

  private startRequest:
    Promise<PrivilegedPlatformRuntimeOperations>
    | undefined;

  public constructor(
    private readonly root:
      PlatformCompositionRoot<string>,
  ) {}

  public getState():
  PlatformCompositionState {
    return this.root.getState();
  }

  public start():
  Promise<PrivilegedPlatformRuntimeOperations> {
    if (
      this.acceptingAccess
      && this.activeOperation
      && this.root.getState()
        === PLATFORM_COMPOSITION_STATES
          .RUNNING
    ) {
      return Promise.resolve(
        this.activeOperation,
      );
    }

    if (this.startRequest) {
      return this.startRequest;
    }

    const request =
      this.root
        .bootstrap()
        .then(
          platform => {
            const isRuntimeRunning =
              () =>
                (
                  this.acceptingAccess
                  && this.root.getState()
                    === PLATFORM_COMPOSITION_STATES
                      .RUNNING
                );

            const routeAccess =
              new PrivilegedRouteAccessEvidenceOperation({
                applicationCatalog:
                  platform
                    .services
                    .applicationCatalog,

                isRuntimeRunning,

                resolveSession:
                  sessionId =>
                    platform
                      .services
                      .session
                      .resolve
                      .execute({
                        sessionId,
                      }),

                authorize:
                  async scope => {
                    await platform
                      .services
                      .authorization
                      .authorize
                      .execute(
                        scope,
                      );
                  },
              });

            const sessionEstablishment =
              new PrivilegedSessionEstablishmentOperation({
                isRuntimeRunning,

                authenticate:
                  platform
                    .services
                    .authentication
                    .authenticate,

                createSession:
                  platform
                    .services
                    .session
                    .create,
              });

            const operation =
              new DefaultPrivilegedPlatformRuntimeOperations(
                routeAccess,
                sessionEstablishment,
              );

            this.activeOperation =
              operation;

            this.acceptingAccess =
              true;

            return operation;
          },
        );

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

  public async shutdown():
  Promise<void> {
    const pendingStart =
      this.startRequest;

    if (pendingStart) {
      try {
        await pendingStart;
      } catch {
      }
    }

    this.acceptingAccess =
      false;

    this.activeOperation =
      undefined;

    await this.root.shutdown();
  }
}

export function createPrivilegedPlatformRuntimeHost(
  configuration:
    NoorProductionRuntimeConfiguration,
): PrivilegedPlatformRuntimeHost {
  const linkageClient =
    createNoorPrivilegedSupabaseClient<
      NoorAuthenticationAccountLinkageDatabase
    >(
      configuration,
    );

  const sessionClient =
    createNoorPrivilegedSupabaseClient<
      NoorSessionDatabase
    >(
      configuration,
    );

  const entitlementClient =
    createNoorPrivilegedSupabaseClient<
      NoorEntitlementDatabase
    >(
      configuration,
    );

  const linkageResolver =
    new SupabasePostgresAuthenticationAccountLinkageResolver(
      linkageClient,
    );

  const authenticationVerifier =
    new SupabaseAuthenticationVerifier(
      {
        expectedIssuer:
          configuration.expectedIssuer,
        expectedAudience:
          configuration.expectedAudience,
        expectedAlgorithm:
          configuration.expectedAlgorithm,
      },
      linkageResolver,
    );

  const clock =
    new SystemClock();

  const root =
    createPlatformCompositionRoot<string>({
      dependencies: {
        clock,

        authentication: {
          verifier:
            authenticationVerifier,
        },

        session: {
          idGenerator:
            new CryptographicSessionIdGenerator(),
          lifetimePolicy:
            new FixedSessionLifetimePolicy(
              configuration
                .sessionLifetimeMs,
            ),
          repository:
            new SupabasePostgresSessionRepository(
              sessionClient,
            ),
        },

        authorization: {
          entitlementIdGenerator:
            new CryptographicEntitlementIdGenerator(),
          repository:
            new SupabasePostgresEntitlementRepository(
              entitlementClient,
            ),
        },
      },

      runtime: {
        platformComponents:
          [],
        applicationBindings:
          [],
      },
    });

  return new DefaultPrivilegedPlatformRuntimeHost(
    root,
  );
}
