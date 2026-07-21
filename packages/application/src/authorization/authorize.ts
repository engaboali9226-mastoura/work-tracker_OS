import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  EntitlementGrant,
  InvalidAuthorizationRequestError,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createAuthenticationAccountId,
} from "@worktracker/core";
import type {
  AuthenticationAccountId,
  EntitlementRepository,
  EntitlementScope,
} from "@worktracker/core";

export type AuthorizeRequest = Readonly<{
  accountId: unknown;
  action: unknown;
  resourceType: unknown;
  resourceId: unknown;
}>;

function asRequestRecord(
  input: unknown,
): Record<string, unknown> {
  if (
    typeof input !== "object"
    || input === null
    || Array.isArray(input)
  ) {
    throw new InvalidAuthorizationRequestError();
  }

  return input as Record<string, unknown>;
}

function createCanonicalAccountId(
  value: unknown,
): AuthenticationAccountId {
  try {
    return createAuthenticationAccountId(
      value as Parameters<typeof createAuthenticationAccountId>[0],
    );
  } catch {
    throw new InvalidAuthorizationRequestError();
  }
}


function validateRequest(
  request: unknown,
): EntitlementScope {
  const record =
    asRequestRecord(
      request,
    );

  return Object.freeze({
    accountId:
      createCanonicalAccountId(
        record.accountId,
      ),
    action:
      createAuthorizationAction(
        record.action,
      ),
    resourceType:
      createAuthorizationResourceType(
        record.resourceType,
      ),
    resourceId:
      createAuthorizationResourceId(
        record.resourceId,
      ),
  });
}

export class Authorize {
  public constructor(
    private readonly repository: EntitlementRepository,
  ) {}

  public async execute(
    request: AuthorizeRequest,
  ): Promise<EntitlementGrant> {
    const scope =
      validateRequest(
        request,
      );

    let grant: EntitlementGrant | null;

    try {
      grant =
        await this.repository.findByExactScope(
          scope,
        );
    } catch {
      throw new AuthorizationUnavailableError();
    }

    if (grant === null) {
      throw new AuthorizationDeniedError();
    }

    if (
      !(grant instanceof EntitlementGrant)
      || grant.accountId !== scope.accountId
      || grant.action !== scope.action
      || grant.resourceType !== scope.resourceType
      || grant.resourceId !== scope.resourceId
    ) {
      throw new AuthorizationUnavailableError();
    }

    if (grant.revokedAtEpochMs !== null) {
      throw new AuthorizationDeniedError();
    }

    return grant;
  }
}
