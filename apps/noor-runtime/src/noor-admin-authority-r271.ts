import type {AdminAuthorityR271} from "./noor-admin-policy-r271.js";

interface SessionResolverR271 {
  execute(input: Readonly<{sessionId:string}>): Promise<Readonly<{accountId:{toString():string}}>>;
}
interface AdminStoreR271 {
  findActiveByAccountId(accountId:string):Promise<Readonly<{
    enabled:boolean;
    role:"super_admin"|"admin";
    authUserId:string;
  }> | null>;
}
interface AssuranceVerifierR271 {
  verify(sessionId:string, authUserId:string):Promise<Readonly<{
    aal:"aal1"|"aal2"|null;
    reauthenticated:boolean;
  }> | null>;
}
/**
 * The platform session and server-side admin record must refer to the same
 * verified identity. Client-provided role, email and MFA claims are ignored.
 * This adapter is not mounted until all three trusted sources are provided.
 */
export function createNoorAdminAuthorityResolverR271(dependencies:Readonly<{
  session:SessionResolverR271;
  store:AdminStoreR271;
  assurance:AssuranceVerifierR271;
}>):(sessionId:string)=>Promise<AdminAuthorityR271|null> {
  return async sessionId => {
    if (typeof sessionId !== "string" || !sessionId || sessionId.length > 256) return null;
    try {
      const session = await dependencies.session.execute({sessionId});
      const accountId = session.accountId.toString();
      if (!accountId || accountId.length > 256) return null;
      const admin = await dependencies.store.findActiveByAccountId(accountId);
      if (!admin || !admin.enabled || !admin.authUserId ||
          (admin.role !== "super_admin" && admin.role !== "admin")) return null;
      const assurance = await dependencies.assurance.verify(sessionId,admin.authUserId);
      if (!assurance || (assurance.aal !== "aal1" && assurance.aal !== "aal2") ||
          typeof assurance.reauthenticated !== "boolean") return null;
      return {
        sessionActive:true,
        accountActive:true,
        verifiedAdminGrant:true,
        role:admin.role,
        assuranceLevel:assurance.aal,
        reauthenticated:assurance.reauthenticated,
      };
    } catch {
      return null;
    }
  };
}
