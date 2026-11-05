import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  InvalidAuthorizationRequestError,
  InvalidSessionError,
  InvalidSessionRequestError,
  SessionUnavailableError,
} from "@worktracker/core";

import type {
  AuthenticationAccountId,
  UserId,
} from "@worktracker/core";

import {
  EnsureTodayService,
  buildPersonalWorkspace,
  ProductionAdapterError,
} from "@noor/personal";

import type {
  EnsureTodayDependencies,
  PersonalFoundationOperationScopeProvider,
  TodayDashboard,
} from "@noor/personal";

import type {
  AuthenticationAccountUserResolver,
} from "@worktracker/infrastructure";

export interface PersonalTodayExecutor {
  execute(
    input:
      Readonly<{
        sessionId:
          string | null;
      }>,
  ):
  Promise<
    Readonly<{
      status:
        200
        | 401
        | 403
        | 409
        | 503;
      body?:
        unknown;
    }>
  >;
}

interface SessionResolver {
  execute(
    input:
      Readonly<{
        sessionId:
          string;
      }>,
  ):
  Promise<
    Readonly<{
      accountId:
        AuthenticationAccountId;
    }>
  >;
}

interface AuthorizationExecutor {
  execute(
    input:
      Readonly<{
        accountId:
          AuthenticationAccountId;
        action:
          "access";
        resourceType:
          "application";
        resourceId:
          "noor-personal";
      }>,
  ):
  Promise<unknown>;
}

type EnsureTodayStableDependencies =
  Omit<
    EnsureTodayDependencies,
    | "locations"
    | "prayerPolicies"
    | "transaction"
  >;

export interface PersonalTodayOperationDependencies {
  readonly isRuntimeRunning:
    () => boolean;

  readonly resolveSession:
    SessionResolver;

  readonly authorize:
    AuthorizationExecutor;

  readonly accountUserResolver:
    AuthenticationAccountUserResolver;

  readonly foundation:
    PersonalFoundationOperationScopeProvider;

  readonly ensureToday:
    EnsureTodayStableDependencies;
}

function empty(
  status:
    401
    | 403
    | 409
    | 503,
) {
  return Object.freeze({
    status,
  });
}

function setupRequired(
  error:
    unknown,
):
boolean {
  return (
    error instanceof Error
    && (
      error.message
        === "ACTIVE_LOCATION_REQUIRED"
      || error.message
        === "PRAYER_POLICY_REQUIRED"
    )
  );
}

export class PersonalTodayOperation
implements PersonalTodayExecutor {
  public constructor(
    private readonly dependencies:
      PersonalTodayOperationDependencies,
  ) {}

  public async execute(
    input:
      Readonly<{
        sessionId:
          string | null;
      }>,
  ):
  Promise<
    Readonly<{
      status:
        200
        | 401
        | 403
        | 409
        | 503;
      body?:
        unknown;
    }>
  > {
    if (
      !this.dependencies
        .isRuntimeRunning()
    ) {
      return empty(
        503,
      );
    }

    if (
      input.sessionId
      === null
      || input.sessionId.length
        === 0
    ) {
      return empty(
        401,
      );
    }

    let accountId:
      AuthenticationAccountId;

    try {
      const session =
        await this.dependencies
          .resolveSession
          .execute({
            sessionId:
              input.sessionId,
          });

      accountId =
        session.accountId;
    } catch (error) {
      if (
        error
          instanceof InvalidSessionRequestError
        || error
          instanceof InvalidSessionError
      ) {
        return empty(
          401,
        );
      }

      if (
        error
        instanceof SessionUnavailableError
      ) {
        return empty(
          503,
        );
      }

      return empty(
        503,
      );
    }

    // Both lookups require the verified account, and neither depends on the other.
    // Authorization must still succeed before any personal foundation is opened.
    const [permissionResult,userResult]=await Promise.allSettled([
      Promise.resolve().then(()=>this.dependencies
        .authorize
        .execute({
          accountId,
          action:
            "access",
          resourceType:
            "application",
          resourceId:
            "noor-personal",
        })),
      Promise.resolve().then(()=>this.dependencies.accountUserResolver.resolve(accountId)),
    ]);
    try {
      if(permissionResult.status==="rejected")throw permissionResult.reason;
    } catch (error) {
      if (
        error
        instanceof AuthorizationDeniedError
      ) {
        return empty(
          403,
        );
      }

      if (
        error
          instanceof AuthorizationUnavailableError
        || error
          instanceof InvalidAuthorizationRequestError
      ) {
        return empty(
          503,
        );
      }

      return empty(
        503,
      );
    }

    let userId:
      UserId | null;

    try {
      if(userResult.status==="rejected")throw userResult.reason;
      userId=userResult.value;
    } catch {
      return empty(
        503,
      );
    }

    if (!userId) {
      return empty(
        503,
      );
    }

    try {
      const scope =
        await this.dependencies
          .foundation
          .openOperation(
            userId.toString(),
          );

      const service =
        new EnsureTodayService({
          ...this.dependencies
            .ensureToday,
          locations:
            scope.locations,
          prayerPolicies:
            scope.prayerPolicies,
          transaction:
            scope.transaction,
        });

      const today:
        TodayDashboard =
          await service.execute(
            userId.toString(),
          );

      // This is an account-owned, read-only projection. Never trust browser
      // coordinates and never expose precise location-profile coordinates.
      // Do not mix an old materialized Personal Day with a new revision.
      const activeLocation=await scope.locations.getEffective(
        userId.toString(),this.dependencies.ensureToday.clock.now(),
      );
      const sameRevision=activeLocation
        && activeLocation.userId===userId.toString()
        && activeLocation.id===today.personalDay.boundary.locationRevisionId
        && activeLocation.timeZone===today.personalDay.boundary.timeZone;
      const location=sameRevision && activeLocation
        && typeof activeLocation.name==="string"
        && activeLocation.name.trim().length>0 && activeLocation.name.length<=96
        && Number.isFinite(activeLocation.latitude) && Math.abs(activeLocation.latitude)<=90
        && Number.isFinite(activeLocation.longitude) && Math.abs(activeLocation.longitude)<=180
        ? {
          name:activeLocation.name.trim(),
          revisionId:activeLocation.id,
          latitude:Math.round(activeLocation.latitude*10)/10,
          longitude:Math.round(activeLocation.longitude*10)/10,
          timeZone:activeLocation.timeZone,
        } : null;

      return Object.freeze({
        status:
          200 as const,
        body:
          {...today,location,workspace:buildPersonalWorkspace(userId.toString(),scope.snapshot)},
      });
    } catch (error) {
      if (
        setupRequired(
          error,
        )
      ) {
        return empty(
          409,
        );
      }

      if (
        error
        instanceof ProductionAdapterError
      ) {
        return empty(
          503,
        );
      }

      return empty(
        503,
      );
    }
  }
}
