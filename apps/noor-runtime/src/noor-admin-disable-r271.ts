import {authorizeAdminActionR271,mayDisableAdminAccountR271,type AdminAuthorityR271} from "./noor-admin-policy-r271.js";

export interface AdminDisableAccountStoreR271 {
  countActiveSuperAdmins():Promise<number>;
  getAccount(accountId:string):Promise<Readonly<{
    accountId:string;isSuperAdmin:boolean;enabled:boolean;
  }> | null>;
  /** Atomic transaction: conditional disable AND audit insert, or neither. */
  disableAndAuditAtomically(input:Readonly<{
    accountId:string;actorAccountId:string;expectedActiveSuperAdminCount:number;
  }>):Promise<boolean>;
}
/**
 * Preflight for account disable. The store MUST enforce an atomic conditional
 * update (transaction/lock) to prevent two concurrent requests disabling
 * the final administrators. Never replace with a read-then-write update.
 */
export async function disableAdminAccountR271(
  input:Readonly<{actorAccountId:string;targetAccountId:string;authority:AdminAuthorityR271|null}>,
  dependencies:Readonly<{store:AdminDisableAccountStoreR271}>,
):Promise<"disabled"|"denied"|"unavailable"> {
  if(!authorizeAdminActionR271(input.authority,"accounts:disable") ||
     !input.actorAccountId || !input.targetAccountId ||
     input.actorAccountId===input.targetAccountId) return "denied";
  try {
    const [target,count]=await Promise.all([
      dependencies.store.getAccount(input.targetAccountId),
      dependencies.store.countActiveSuperAdmins(),
    ]);
    if(!target || !target.enabled || target.accountId!==input.targetAccountId ||
       !mayDisableAdminAccountR271({
         actorAccountId:input.actorAccountId,targetAccountId:input.targetAccountId,
         activeSuperAdminCount:count,targetIsSuperAdmin:target.isSuperAdmin,
       })) return "denied";
    const changed=await dependencies.store.disableAndAuditAtomically({
      accountId:input.targetAccountId,actorAccountId:input.actorAccountId,
      expectedActiveSuperAdminCount:count,
    });
    if(!changed) return "denied";
    return "disabled";
  } catch {
    return "unavailable";
  }
}
