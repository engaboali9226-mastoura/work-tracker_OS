import type {
  RouteAccessEvidenceRequest,
  RouteAccessEvidenceResponse,
} from "@worktracker/contracts";

import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  InvalidAuthorizationRequestError,
  InvalidSessionError,
  InvalidSessionRequestError,
  SessionUnavailableError,
} from "@worktracker/core";

import type {
  ApplicationCatalog,
  AuthenticationAccountId,
  AuthorizationAction,
  AuthorizationResourceId,
  AuthorizationResourceType,
  SessionSnapshot,
} from "@worktracker/core";

const INVALID_ROUTE_MESSAGE =
  "Route access evidence request is invalid.";

const INVARIANT_FAILURE_MESSAGE =
  "Privileged route access evaluation failed.";

export class InvalidRouteAccessEvidenceRequestError
extends Error {
  public constructor() {
    super(
      INVALID_ROUTE_MESSAGE,
    );

    this.name =
      "InvalidRouteAccessEvidenceRequestError";
  }
}

export class PrivilegedRouteAccessInvariantError
extends Error {
  public constructor() {
    super(
      INVARIANT_FAILURE_MESSAGE,
    );

    this.name =
      "PrivilegedRouteAccessInvariantError";
  }
}

type AuthorizationScope =
  Readonly<{
    accountId:
      AuthenticationAccountId;
    action:
      AuthorizationAction;
    resourceType:
      AuthorizationResourceType;
    resourceId:
      AuthorizationResourceId;
  }>;

export interface PrivilegedRouteAccessEvidenceDependencies {
  readonly applicationCatalog:
    ApplicationCatalog;

  readonly isRuntimeRunning:
    () => boolean;

  readonly resolveSession:
    (
      sessionId: string,
    ) => Promise<SessionSnapshot>;

  readonly authorize:
    (
      scope: AuthorizationScope,
    ) => Promise<void>;
}

export type PrivilegedRouteAccessEvidenceInvocationContext =
  Readonly<{
    sessionId:
      string | null;
  }>;

export type PrivilegedRouteAccessEvidenceOperationInput =
  Readonly<{
    request:
      RouteAccessEvidenceRequest;
    context:
      PrivilegedRouteAccessEvidenceInvocationContext;
  }>;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(
      value,
    )
  );
}

function requireCanonicalApplication(
  catalog:
    ApplicationCatalog,
  request:
    unknown,
) {
  if (!isRecord(request)) {
    throw new InvalidRouteAccessEvidenceRequestError();
  }

  const appKey =
    request.appKey;

  const pathname =
    request.pathname;

  if (
    typeof appKey !== "string"
    || appKey.length === 0
    || appKey.trim() !== appKey
    || typeof pathname !== "string"
    || pathname.length === 0
    || pathname.trim() !== pathname
  ) {
    throw new InvalidRouteAccessEvidenceRequestError();
  }

  const application =
    catalog.findByKey(
      appKey,
    );

  if (
    !application
    || application.status !==
      "experimental"
    || application.route !==
      pathname
  ) {
    throw new InvalidRouteAccessEvidenceRequestError();
  }

  return application;
}

function evidence(
  kind:
    RouteAccessEvidenceResponse["kind"],
  application:
    NonNullable<
      ReturnType<
        ApplicationCatalog["findByKey"]
      >
    >,
): RouteAccessEvidenceResponse {
  return Object.freeze({
    kind,
    appKey:
      application.appKey,
    pathname:
      application.route,
  });
}

function sessionIdFromContext(
  context:
    unknown,
): string | null {
  if (!isRecord(context)) {
    return null;
  }

  const sessionId =
    context.sessionId;

  if (sessionId === null) {
    return null;
  }

  if (typeof sessionId !== "string") {
    return "";
  }

  return sessionId;
}

export class PrivilegedRouteAccessEvidenceOperation {
  public constructor(
    private readonly dependencies:
      PrivilegedRouteAccessEvidenceDependencies,
  ) {}

  public async execute(
    input:
      PrivilegedRouteAccessEvidenceOperationInput,
  ): Promise<RouteAccessEvidenceResponse> {
    const inputRecord:
      Record<string, unknown> =
        isRecord(
          input,
        )
          ? input
          : {};

    const application =
      requireCanonicalApplication(
        this.dependencies
          .applicationCatalog,
        inputRecord.request,
      );

    if (
      !this.dependencies
        .isRuntimeRunning()
    ) {
      throw new PrivilegedRouteAccessInvariantError();
    }

    const sessionId =
      sessionIdFromContext(
        inputRecord.context,
      );

    if (
      sessionId === null
    ) {
      return evidence(
        "authentication-required",
        application,
      );
    }

    let session:
      SessionSnapshot;

    try {
      session =
        await this.dependencies
          .resolveSession(
            sessionId,
          );
    } catch (error: unknown) {
      if (
        error instanceof
          InvalidSessionRequestError
        || error instanceof
          InvalidSessionError
      ) {
        return evidence(
          "authentication-required",
          application,
        );
      }

      if (
        error instanceof
          SessionUnavailableError
      ) {
        return evidence(
          "session-access-unavailable",
          application,
        );
      }

      throw new PrivilegedRouteAccessInvariantError();
    }

    try {
      await this.dependencies
        .authorize({
          accountId:
            session.accountId,
          action:
            application
              .requiredEntitlement
              .action,
          resourceType:
            application
              .requiredEntitlement
              .resourceType,
          resourceId:
            application
              .requiredEntitlement
              .resourceId,
        });
    } catch (error: unknown) {
      if (
        error instanceof
          AuthorizationDeniedError
      ) {
        return evidence(
          "authorization-denied",
          application,
        );
      }

      if (
        error instanceof
          AuthorizationUnavailableError
      ) {
        return evidence(
          "authorization-unavailable",
          application,
        );
      }

      if (
        error instanceof
          InvalidAuthorizationRequestError
      ) {
        throw new PrivilegedRouteAccessInvariantError();
      }

      throw new PrivilegedRouteAccessInvariantError();
    }

    return evidence(
      "authenticated-authorized",
      application,
    );
  }
}
