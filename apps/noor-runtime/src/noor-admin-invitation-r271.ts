/**
 * R271 trusted invitation boundary. Invitation is NOT role assignment.
 * The verified identity must be explicitly bootstrapped in a separate,
 * audited server-only transaction after mailbox ownership and MFA enrollment.
 */
export interface AdminInvitationProviderR271 {
  inviteUserByEmail(email: string): Promise<Readonly<{
    userId: string | null;
    error: string | null;
  }>>;
}
export interface AdminInvitationAuditR271 {
  record(input: Readonly<{
    actorAccountId: string;
    email: string;
    invitedUserId: string;
    action: "admin-invitation";
  }>): Promise<void>;
}
export interface AdminInvitationInputR271 {
  readonly actorAccountId: string;
  readonly email: string;
  readonly authority: import("./noor-admin-policy-r271.js").AdminAuthorityR271;
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
export async function inviteNoorAdminCandidateR271(
  input: AdminInvitationInputR271,
  dependencies: Readonly<{
    provider: AdminInvitationProviderR271;
    audit: AdminInvitationAuditR271;
  }>,
): Promise<Readonly<{kind: "invited"; userId: string} | {kind: "denied" | "unavailable"}>> {
  const {authorizeAdminActionR271} = await import("./noor-admin-policy-r271.js");
  if (!authorizeAdminActionR271(input.authority, "entitlements:manage") ||
      typeof input.actorAccountId !== "string" || !input.actorAccountId.trim() ||
      typeof input.email !== "string" || input.email.length > 254 ||
      !EMAIL.test(input.email)) {
    return {kind:"denied"};
  }
  try {
    const email = input.email.trim().toLowerCase();
    const result = await dependencies.provider.inviteUserByEmail(email);
    if (result.error || !result.userId) return {kind:"unavailable"};
    await dependencies.audit.record({
      actorAccountId:input.actorAccountId, email,
      invitedUserId:result.userId, action:"admin-invitation",
    });
    return {kind:"invited", userId:result.userId};
  } catch {
    return {kind:"unavailable"};
  }
}
