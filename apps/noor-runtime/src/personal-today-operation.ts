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

    try {
      await this.dependencies
        .authorize
        .execute({
          accountId,
          action:
            "access",
          resourceType:
            "application",
          resourceId:
            "noor-personal",
        });
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
      userId =
        await this.dependencies
          .accountUserResolver
          .resolve(
            accountId,
          );
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

      return Object.freeze({
        status:
          200 as const,
        body:
          today,
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
