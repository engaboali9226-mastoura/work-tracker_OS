import {createNoorAdminAccountManagementR316,type NoorAdminDatabaseR316,type NoorAdminAccountManagementR316} from "./noor-admin-account-management-r316.js";
import {
  CryptographicEntitlementIdGenerator,
  CryptographicSessionIdGenerator,
  FixedSessionLifetimePolicy,
  SupabaseAuthenticationVerifier,
  SupabasePostgresAuthenticationAccountLinkageResolver,
  SupabasePostgresAuthenticationAccountUserResolver,
  SupabasePostgresEntitlementRepository,
  SupabasePostgresSessionRepository,
  SupabasePostgresPrivateJournalStoreR221,
  SystemClock,
  createNoorPrivilegedSupabaseClient,
} from "@worktracker/infrastructure";

import type {
  NoorAuthenticationAccountLinkageDatabase,
  NoorAuthenticationAccountUserDatabase,
  NoorEntitlementDatabase,
  NoorProductionRuntimeConfiguration,
  NoorSessionDatabase,
  NoorPrivateJournalDatabaseR221,
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
import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorWorkTeacherOperationR264} from "./noor-work-teacher-operation-r264.js";
import type {NoorWorkTeacherDatabaseR264} from "./noor-work-teacher-operation-r264.js";

import { NoorPrivateJournalOperationR185 } from "./noor-private-journal-r185.js";
import type { JournalKeyRingR188 } from "./noor-private-journal-r185.js";
import { parseJournalServerKeyRingR198 } from "./noor-private-journal-release-guard-r198.js";

import {
  PersonalControlOperation,
} from "./personal-control-operation.js";

import {
  PersonalDailyMaterializationScheduler,
} from "./personal-daily-materialization-scheduler.js";

import {
  PrivilegedRouteAccessEvidenceOperation,
} from "./privileged-route-access-evidence-operation.js";

import {
  PrivilegedSessionEstablishmentOperation,
} from "./privileged-session-establishment-operation.js";

export interface PrivilegedPlatformRuntimeOperations {
  readonly sessionEstablishment:
    PrivilegedSessionEstablishmentOperation;
  readonly sessionRevocation: Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<void>}>;

  readonly personalToday:
    PersonalTodayOperation;

  readonly personalControl:
    PersonalControlOperation;

  readonly teacherWork: NoorWorkTeacherOperationR264;
  readonly adminAccounts?:NoorAdminAccountManagementR316;

  readonly trustedPrivateJournalR221?: NoorPrivateJournalOperationR185 | undefined;

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
    public readonly sessionRevocation: Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<void>}>,

    public readonly personalToday:
      PersonalTodayOperation,

    public readonly personalControl:
      PersonalControlOperation,

    public readonly teacherWork: NoorWorkTeacherOperationR264,

    public readonly trustedPrivateJournalR221: NoorPrivateJournalOperationR185|undefined,
    public readonly adminAccounts:NoorAdminAccountManagementR316|undefined,
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

  private personalScheduler:
    PersonalDailyMaterializationScheduler
    | undefined;

  public constructor(
    private readonly root:
      PlatformCompositionRoot<string>,

    private readonly personalPersistence:
      SupabasePostgresPersonalFoundationPersistence,

    private readonly accountUserResolver:
      SupabasePostgresAuthenticationAccountUserResolver,

    private readonly workClient: SupabaseClient<NoorWorkTeacherDatabaseR264>,
    private readonly adminClient: SupabaseClient<NoorAdminDatabaseR316>,
    private readonly adminExpectedIssuer:string,
    private readonly adminExpectedAudience:string,

    private readonly journalStore?: SupabasePostgresPrivateJournalStoreR221,
    private readonly journalKeyRing?: JournalKeyRingR188,
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

      this.personalScheduler =
        new PersonalDailyMaterializationScheduler({
          foundation:
            this.personalPersistence,
        });

      this.personalScheduler
        .start();

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

      const personalControl =
        new PersonalControlOperation({
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

          clock:
            new PersonalSystemClock(),

          idGenerator:
            new CryptographicIdGenerator(),

          locationChange:{
            timeZone:new IntlTimeZoneAdapter(),
            prayerCalculator:new AdhanPrayerTimeCalculator(),
            hijriCalculator:new IntlUmmAlQuraHijriDateCalculator(),
            historyCatalog:new VersionedApprovedIslamicHistoryCatalog(),
          },
        });

      const teacherWork=new NoorWorkTeacherOperationR264({
        isRuntimeRunning,
        resolveSession:platform.services.session.resolve,
        authorize:platform.services.authorization.authorize,
        accountUserResolver:this.accountUserResolver,
        client:this.workClient,
      });

      // R221: explicit server-only opt-in, no implicit local/browser fallback.
      if (this.journalStore) await this.journalStore.assertAccessible();
      const privateJournal = this.journalStore && this.journalKeyRing
        ? new NoorPrivateJournalOperationR185({
            trust: {
              resolveAuthorizedUser: async sessionId => {
                const result = await personalControl.resolveAuthorizedJournalUser(sessionId);
                return result.kind === "ok"
                  ? {status:200 as const,userId:result.userId}
                  : {status:result.status};
              },
              resolveAuthorizedPersonalDay: async sessionId => {
                const result = await personalControl.resolveAuthorizedJournalPersonalDay(sessionId);
                return result.kind === "ok"
                  ? {status:200 as const,userId:result.userId,localDate:result.localDate}
                  : {status:result.status};
              },
            },
            store: this.journalStore,
            keyRing: this.journalKeyRing,
          }) : undefined;

      const operation =
        new DefaultPrivilegedPlatformRuntimeOperations(
          routeAccess,
          sessionEstablishment,
          platform.services.session.revoke,
          personalToday,
          personalControl,
          teacherWork,
          privateJournal,
          // R316 MUST NOT register a production-only HTTPS admin route when
          // disabled; otherwise local HTTP development could fail to start.
          process.env.NOOR_ADMIN_ACCOUNT_MANAGEMENT_R316==="enabled"
            ? createNoorAdminAccountManagementR316({
                client:this.adminClient,expectedIssuer:this.adminExpectedIssuer,
                expectedAudience:this.adminExpectedAudience,isRuntimeRunning,enabled:true,
              })
            : undefined,
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

      if (this.personalScheduler) {
        try {
          await this.personalScheduler
            .stop();
        } catch {
        }

        this.personalScheduler =
          undefined;
      }

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

    if (this.personalScheduler) {
      try {
        await this.personalScheduler
          .stop();
      } catch {
        failed =
          true;
      }

      this.personalScheduler =
        undefined;
    }

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

  // Explicit release gate: absent/disabled must not register a journal endpoint.
  // The privileged server already handles NOOR sessions and service-role clients.
  // R221 does NOT claim to satisfy the separate R220D restricted-LOGIN gate:
  // the service-role client bypasses PostgreSQL RLS, so owner-bound application
  // enforcement and row encryption are critical and require separate QA.
  const journalRelease = process.env.NOOR_PRIVATE_JOURNAL_RELEASE_R221;
  if (journalRelease !== undefined && journalRelease !== "disabled" && journalRelease !== "enabled") {
    throw new Error("R221_JOURNAL_RELEASE_CONFIGURATION_INVALID");
  }
  const journalKeyRing = journalRelease === "enabled"
    ? parseJournalServerKeyRingR198(process.env)
    : undefined;
  const journalStore = journalKeyRing
    ? new SupabasePostgresPrivateJournalStoreR221(
        createNoorPrivilegedSupabaseClient<NoorPrivateJournalDatabaseR221>(configuration),
      ) : undefined;

  return new DefaultPrivilegedPlatformRuntimeHost(
    root,
    personalPersistence,
    accountUserResolver,
    createNoorPrivilegedSupabaseClient<NoorWorkTeacherDatabaseR264>(configuration),
    createNoorPrivilegedSupabaseClient<NoorAdminDatabaseR316>(configuration),
    configuration.expectedIssuer,configuration.expectedAudience,
    journalStore,
    journalKeyRing,
  );
}
