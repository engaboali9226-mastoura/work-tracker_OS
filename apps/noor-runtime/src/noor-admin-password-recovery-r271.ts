import {authorizeAdminActionR271,type AdminAuthorityR271} from "./noor-admin-policy-r271.js";

/**
 * Password recovery is delivered to the account owner's verified mailbox.
 * The admin never sees, selects, stores or receives another user's password
 * or a recovery token. Never use auth.admin.updateUserById to set plaintext
 * credentials from an administrative browser.
 */
export interface NoorAdminPasswordRecoveryProviderR271 {
  /** Resolve mailbox from the trusted Auth user ID, never a browser-provided email. */
  sendRecoveryEmailForUserId(authUserId:string):Promise<boolean>;
}
export interface NoorAdminPasswordRecoveryAuditR271 {
  record(input:Readonly<{
    actorAccountId:string;targetAuthUserId:string;action:"accounts:reset-password";
    outcome:"initiated"|"requested"|"failed";
  }>):Promise<void>;
}
export async function requestNoorAdminPasswordRecoveryR271(
  input:Readonly<{
    actorAccountId:string;
    targetAuthUserId:string;
    authority:AdminAuthorityR271|null;
  }>,
  dependencies:Readonly<{
    provider:NoorAdminPasswordRecoveryProviderR271;
    audit:NoorAdminPasswordRecoveryAuditR271;
  }>,
):Promise<"requested"|"denied"|"unavailable">{
  if(!authorizeAdminActionR271(input.authority,"accounts:reset-password") ||
     !input.actorAccountId || !input.targetAuthUserId ||
     input.targetAuthUserId.length>128) return "denied";
  try{
    await dependencies.audit.record({
      actorAccountId:input.actorAccountId,targetAuthUserId:input.targetAuthUserId,
      action:"accounts:reset-password",outcome:"initiated",
    });
    const delivered=await dependencies.provider.sendRecoveryEmailForUserId(input.targetAuthUserId);
    await dependencies.audit.record({
      actorAccountId:input.actorAccountId,targetAuthUserId:input.targetAuthUserId,
      action:"accounts:reset-password",outcome:delivered?"requested":"failed",
    });
    return delivered?"requested":"unavailable";
  }catch{
    return "unavailable";
  }
}
