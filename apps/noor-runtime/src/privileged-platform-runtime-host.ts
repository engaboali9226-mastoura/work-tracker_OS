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

export interface PrivilegedPlatformRuntimeHost {
  start():
  Promise<PrivilegedRouteAccessEvidenceOperation>;

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
    PrivilegedRouteAccessEvidenceOperation
    | undefined;

  private startRequest:
    Promise<PrivilegedRouteAccessEvidenceOperation>
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
  Promise<PrivilegedRouteAccessEvidenceOperation> {
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
            const routeAccess =
              new PrivilegedRouteAccessEvidenceOperation({
                applicationCatalog:
                  platform
                    .services
                    .applicationCatalog,

                isRuntimeRunning:
                  () =>
                    (
                      this.acceptingAccess
                      && this.root.getState()
                        === PLATFORM_COMPOSITION_STATES
                          .RUNNING
                    ),

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

            this.activeOperation =
              routeAccess;

            this.acceptingAccess =
              true;

            return routeAccess;
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
        // PlatformCompositionRoot owns
        // canonical bootstrap failure state.
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
