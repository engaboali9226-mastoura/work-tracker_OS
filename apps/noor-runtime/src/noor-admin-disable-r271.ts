import {mayDisableAdminAccountR271} from "./noor-admin-policy-r271.js";

export interface AdminDisableAccountStoreR271 {
  countActiveSuperAdmins():Promise<number>;
  getAccount(accountId:string):Promise<Readonly<{
    accountId:string;isSuperAdmin:boolean;enabled:boolean;
  }> | null>;
  disableIfUnchanged(input:Readonly<{
    accountId:string;expectedActiveSuperAdminCount:number;
  }>):Promise<boolean>;
}
export interface AdminDisableAuditR271 {
  record(input:Readonly<{actorAccountId:string;targetAccountId:string;outcome:"denied"|"success"}>):Promise<void>;
}
/**
 * Preflight for account disable. The store MUST enforce an atomic conditional
 * update (transaction/lock) to prevent two concurrent requests disabling
 * the final administrators. Never replace with a read-then-write update.
 */
export async function disableAdminAccountR271(
  input:Readonly<{actorAccountId:string;targetAccountId:string}>,
  dependencies:Readonly<{store:AdminDisableAccountStoreR271;audit:AdminDisableAuditR271}>,
):Promise<"disabled"|"denied"|"unavailable"> {
  if(!input.actorAccountId || !input.targetAccountId ||
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
    const changed=await dependencies.store.disableIfUnchanged({
      accountId:input.targetAccountId,expectedActiveSuperAdminCount:count,
    });
    if(!changed) return "denied";
    await dependencies.audit.record({
      actorAccountId:input.actorAccountId,targetAccountId:input.targetAccountId,
      outcome:"success",
    });
    return "disabled";
  } catch {
    return "unavailable";
  }
}
