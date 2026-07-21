import {
  AuthorizationUnavailableError,
  EntitlementConflictError,
  EntitlementGrant,
  InvalidAuthorizationRequestError,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createEntitlementId,
  createAuthenticationAccountId,
} from "@worktracker/core";
import type {
  AuthenticationAccountId,
  Clock,
  EntitlementIdGenerator,
  EntitlementRepository,
} from "@worktracker/core";

export type GrantEntitlementRequest = Readonly<{
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


function toEpochMs(
  clock: Clock,
): number {
  const timestamp =
    clock.now();

  const date =
    timestamp.toDate();

  const epochMs =
    date.getTime();

  if (
    !Number.isSafeInteger(epochMs)
    || epochMs < 0
  ) {
    throw new AuthorizationUnavailableError();
  }

  return epochMs;
}

export class GrantEntitlement {
  public constructor(
    private readonly generator: EntitlementIdGenerator,
    private readonly clock: Clock,
    private readonly repository: EntitlementRepository,
  ) {}

  public async execute(
    request: GrantEntitlementRequest,
  ): Promise<EntitlementGrant> {
    const record =
      asRequestRecord(
        request,
      );

    const accountId =
      createCanonicalAccountId(
        record.accountId,
      );

    const action =
      createAuthorizationAction(
        record.action,
      );

    const resourceType =
      createAuthorizationResourceType(
        record.resourceType,
      );

    const resourceId =
      createAuthorizationResourceId(
        record.resourceId,
      );

    let generatedId: Awaited<
      ReturnType<EntitlementIdGenerator["generate"]>
    >;

    try {
      generatedId =
        await this.generator.generate();
    } catch {
      throw new AuthorizationUnavailableError();
    }

    let grant: EntitlementGrant;

    try {
      const id =
        createEntitlementId(
          generatedId,
        );

      const grantedAtEpochMs =
        toEpochMs(
          this.clock,
        );

      grant =
        EntitlementGrant.create({
          id,
          accountId,
          action,
          resourceType,
          resourceId,
          grantedAtEpochMs,
          revokedAtEpochMs:
            null,
        });
    } catch {
      throw new AuthorizationUnavailableError();
    }

    try {
      await this.repository.create(
        grant,
      );
    } catch (error) {
      if (
        error
        instanceof EntitlementConflictError
      ) {
        throw error;
      }

      throw new AuthorizationUnavailableError();
    }

    return grant;
  }
}
