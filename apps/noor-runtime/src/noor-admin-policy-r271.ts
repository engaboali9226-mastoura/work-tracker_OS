/**
 * R271: pure, fail-closed policy for the independent administrator control plane.
 * This is NOT an authorization endpoint. Callers MUST obtain the identity, live
 * session, MFA assurance and grants from trusted server-side sources.
 */
export type AdminActionR271 =
  | "accounts:list"
  | "accounts:create"
  | "accounts:disable"
  | "accounts:enable"
  | "accounts:delete"
  | "accounts:reset-password"
  | "entitlements:manage"
  | "sessions:revoke"
  | "audit:list";

export interface AdminAuthorityR271 {
  readonly sessionActive: boolean;
  readonly accountActive: boolean;
  readonly verifiedAdminGrant: boolean;
  readonly assuranceLevel: "aal1" | "aal2" | null;
  readonly reauthenticated: boolean;
}

const SENSITIVE_ACTIONS = new Set<AdminActionR271>([
  "accounts:delete",
  "accounts:reset-password",
  "entitlements:manage",
]);

export function authorizeAdminActionR271(
  authority: AdminAuthorityR271 | null,
  action: AdminActionR271,
): boolean {
  if (!authority || !authority.sessionActive || !authority.accountActive ||
      !authority.verifiedAdminGrant || authority.assuranceLevel !== "aal2") {
    return false;
  }
  return !SENSITIVE_ACTIONS.has(action) || authority.reauthenticated === true;
}

export function mayDisableAdminAccountR271(input: Readonly<{
  actorAccountId: string;
  targetAccountId: string;
  activeSuperAdminCount: number;
  targetIsSuperAdmin: boolean;
}>): boolean {
  if (!input.actorAccountId || !input.targetAccountId ||
      input.actorAccountId === input.targetAccountId ||
      !Number.isSafeInteger(input.activeSuperAdminCount) ||
      input.activeSuperAdminCount < 1) {
    return false;
  }
  return !input.targetIsSuperAdmin || input.activeSuperAdminCount > 1;
}
