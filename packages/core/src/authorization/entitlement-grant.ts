import type { AuthenticationAccountId } from "../authentication/authentication-account-id.js";
import type { AuthorizationAction } from "./authorization-action.js";
import type { AuthorizationResourceId } from "./authorization-resource-id.js";
import type { AuthorizationResourceType } from "./authorization-resource-type.js";
import type { EntitlementId } from "./entitlement-id.js";
import { InvalidAuthorizationRequestError } from "./authorization-errors.js";

export interface CreateEntitlementGrantInput {
  readonly id: EntitlementId;
  readonly accountId: AuthenticationAccountId;
  readonly action: AuthorizationAction;
  readonly resourceType: AuthorizationResourceType;
  readonly resourceId: AuthorizationResourceId;
  readonly grantedAtEpochMs: number;
  readonly revokedAtEpochMs?: number | null;
}

function isValidEpochMs(value: unknown): value is number {
  return (
    typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 0
  );
}

export class EntitlementGrant {
  public readonly id: EntitlementId;
  public readonly accountId: AuthenticationAccountId;
  public readonly action: AuthorizationAction;
  public readonly resourceType: AuthorizationResourceType;
  public readonly resourceId: AuthorizationResourceId;
  public readonly grantedAtEpochMs: number;
  public readonly revokedAtEpochMs: number | null;

  private constructor(input: Required<CreateEntitlementGrantInput>) {
    this.id = input.id;
    this.accountId = input.accountId;
    this.action = input.action;
    this.resourceType = input.resourceType;
    this.resourceId = input.resourceId;
    this.grantedAtEpochMs = input.grantedAtEpochMs;
    this.revokedAtEpochMs = input.revokedAtEpochMs;

    Object.freeze(this);
  }

  public static create(
    input: CreateEntitlementGrantInput,
  ): EntitlementGrant {
    if (
      !input
      || typeof input !== "object"
      || !isValidEpochMs(input.grantedAtEpochMs)
    ) {
      throw new InvalidAuthorizationRequestError();
    }

    const revokedAtEpochMs =
      input.revokedAtEpochMs ?? null;

    if (
      revokedAtEpochMs !== null
      && (
        !isValidEpochMs(revokedAtEpochMs)
        || revokedAtEpochMs < input.grantedAtEpochMs
      )
    ) {
      throw new InvalidAuthorizationRequestError();
    }

    return new EntitlementGrant({
      ...input,
      revokedAtEpochMs,
    });
  }
}
