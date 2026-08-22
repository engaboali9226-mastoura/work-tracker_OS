import {
  CryptographicEntitlementIdGenerator,
  CryptographicSessionIdGenerator,
  FixedSessionLifetimePolicy,
  SupabaseAuthenticationVerifier,
  SupabasePostgresAuthenticationAccountLinkageResolver,
  SupabasePostgresAuthenticationAccountUserResolver,
  SupabasePostgresEntitlementRepository,
  SupabasePostgresSessionRepository,
  SystemClock,
  createNoorPrivilegedSupabaseClient,
} from "@worktracker/infrastructure";

import type {
  NoorAuthenticationAccountLinkageDatabase,
  NoorAuthenticationAccountUserDatabase,
  NoorEntitlementDatabase,
  NoorProductionRuntimeConfiguration,
  NoorSessionDatabase,
} from "@worktracker/infrastructure";

import {
  AdhanPrayerTimeCalculator,
  CryptographicIdGenerator,
  IntlTimeZoneAdapter,
  IntlUmmAlQuraHijriDateCalculator,
  SupabasePostgresPersonalFoundationPersistence,
  SystemClock as PersonalSystemClock,
  VersionedApprovedIslamicHistoryCatalog,
} from "@noor/personal";

import type {
  NoorPersonalFoundationDatabase,
} from "@noor/personal";

import {
  PLATFORM_COMPOSITION_STATES,
  createPlatformCompositionRoot,
} from "@worktracker/platform";

import type {
  PlatformCompositionRoot,
  PlatformCompositionState,
} from "@worktracker/platform";

import {
  PersonalTodayOperation,
} from "./personal-today-operation.js";

import {
  PrivilegedRouteAccessEvidenceOperation,
} from "./privileged-route-access-evidence-operation.js";

import {
  PrivilegedSessionEstablishmentOperation,
} from "./privileged-session-establishment-operation.js";

export interface PrivilegedPlatformRuntimeOperations {
  readonly sessionEstablishment:
    PrivilegedSessionEstablishmentOperation;

  readonly personalToday:
    PersonalTodayOperation;

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

    public readonly personalToday:
      PersonalTodayOperation,
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

  private personalPersistenceReady =
    false;

  public constructor(
    private readonly root:
      PlatformCompositionRoot<string>,

    private readonly personalPersistence:
      SupabasePostgresPersonalFoundationPersistence,

    private readonly accountUserResolver:
      SupabasePostgresAuthenticationAccountUserResolver,
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
  Promise<PrivilegedPlatformRuntimeOperations> {
    try {
      const platform =
        await this.root
          .bootstrap();

      await this.personalPersistence
        .initialize();

      this.personalPersistenceReady =
        true;

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

      const personalToday =
        new PersonalTodayOperation({
          isRuntimeRunning,

          resolveSession:
            platform
              .services
              .session
              .resolve,

          authorize:
            platform
              .services
              .authorization
              .authorize,

          accountUserResolver:
            this.accountUserResolver,

          foundation:
            this.personalPersistence,

          ensureToday: {
            clock:
              new PersonalSystemClock(),
            idGenerator:
              new CryptographicIdGenerator(),
            timeZone:
              new IntlTimeZoneAdapter(),
            prayerCalculator:
              new AdhanPrayerTimeCalculator(),
            hijriCalculator:
              new IntlUmmAlQuraHijriDateCalculator(),
            historyCatalog:
              new VersionedApprovedIslamicHistoryCatalog(),
          },
        });

      const operation =
        new DefaultPrivilegedPlatformRuntimeOperations(
          routeAccess,
          sessionEstablishment,
          personalToday,
        );

      this.activeOperation =
        operation;

      this.acceptingAccess =
        true;

      return operation;
    } catch (error) {
      this.acceptingAccess =
        false;

      this.activeOperation =
        undefined;

      if (
        this.personalPersistenceReady
      ) {
        try {
          await this.personalPersistence
            .close();
        } catch {
        }

        this.personalPersistenceReady =
          false;
      }

      try {
        await this.root
          .shutdown();
      } catch {
      }

      throw error;
    }
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

    let failed =
      false;

    if (
      this.personalPersistenceReady
    ) {
      try {
        await this.personalPersistence
          .close();
      } catch {
        failed =
          true;
      }

      this.personalPersistenceReady =
        false;
    }

    try {
      await this.root
        .shutdown();
    } catch {
      failed =
        true;
    }

    if (failed) {
      throw new Error(
        "Noor privileged platform runtime shutdown failed.",
      );
    }
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

  const accountUserClient =
    createNoorPrivilegedSupabaseClient<
      NoorAuthenticationAccountUserDatabase
    >(
      configuration,
    );

  const personalFoundationClient =
    createNoorPrivilegedSupabaseClient<
      NoorPersonalFoundationDatabase
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

  const accountUserResolver =
    new SupabasePostgresAuthenticationAccountUserResolver(
      accountUserClient,
    );

  const personalPersistence =
    new SupabasePostgresPersonalFoundationPersistence(
      personalFoundationClient,
    );

  return new DefaultPrivilegedPlatformRuntimeHost(
    root,
    personalPersistence,
    accountUserResolver,
  );
}
