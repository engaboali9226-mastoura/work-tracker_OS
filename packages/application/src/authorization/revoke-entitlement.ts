import {
  AuthorizationUnavailableError,
  InvalidAuthorizationRequestError,
  createEntitlementId,
} from "@worktracker/core";
import type {
  Clock,
  EntitlementRepository,
} from "@worktracker/core";

export type RevokeEntitlementRequest = Readonly<{
  entitlementId: unknown;
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

export class RevokeEntitlement {
  public constructor(
    private readonly clock: Clock,
    private readonly repository: EntitlementRepository,
  ) {}

  public async execute(
    request: RevokeEntitlementRequest,
  ): Promise<void> {
    const record =
      asRequestRecord(
        request,
      );

    const entitlementId =
      createEntitlementId(
        record.entitlementId,
      );

    let revokedAtEpochMs: number;

    try {
      revokedAtEpochMs =
        toEpochMs(
          this.clock,
        );
    } catch {
      throw new AuthorizationUnavailableError();
    }

    try {
      await this.repository.revoke(
        entitlementId,
        revokedAtEpochMs,
      );
    } catch {
      throw new AuthorizationUnavailableError();
    }
  }
}
