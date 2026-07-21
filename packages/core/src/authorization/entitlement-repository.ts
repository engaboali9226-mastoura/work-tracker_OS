import type { AuthenticationAccountId } from "../authentication/authentication-account-id.js";
import type { AuthorizationAction } from "./authorization-action.js";
import type { AuthorizationResourceId } from "./authorization-resource-id.js";
import type { AuthorizationResourceType } from "./authorization-resource-type.js";
import type { EntitlementGrant } from "./entitlement-grant.js";
import type { EntitlementId } from "./entitlement-id.js";

export type EntitlementScope = Readonly<{
  accountId: AuthenticationAccountId;
  action: AuthorizationAction;
  resourceType: AuthorizationResourceType;
  resourceId: AuthorizationResourceId;
}>;

export interface EntitlementRepository {
  create(grant: EntitlementGrant): Promise<void>;

  findByExactScope(
    scope: EntitlementScope,
  ): Promise<EntitlementGrant | null>;

  revoke(
    id: EntitlementId,
    revokedAtEpochMs: number,
  ): Promise<void>;
}
