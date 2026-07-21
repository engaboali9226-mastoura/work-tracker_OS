export const USER_CONTEXT_PRINCIPAL_KINDS = [
  "user",
  "service",
] as const;

export type UserContextPrincipalKind =
  (typeof USER_CONTEXT_PRINCIPAL_KINDS)[number];

export interface UserContext {
  readonly userId: string;
  readonly principalKind: UserContextPrincipalKind;
  readonly sessionId?: string;
  readonly authorizationScope?: string;
  readonly correlationId: string;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface UserContextCandidate {
  readonly userId?: unknown;
  readonly principalKind?: unknown;
  readonly sessionId?: unknown;
  readonly authorizationScope?: unknown;
  readonly correlationId?: unknown;
  readonly attributes?: unknown;
}

export interface UserContextIdentity {
  readonly userId: string;
  readonly principalKind: UserContextPrincipalKind;
  readonly authorizationScope?: string;
}

export function hasSameUserContextIdentity(
  left: UserContextIdentity,
  right: UserContextIdentity,
): boolean {
  return left.userId === right.userId
    && left.principalKind === right.principalKind
    && left.authorizationScope === right.authorizationScope;
}
