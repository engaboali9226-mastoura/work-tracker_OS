import {authorizeAdminActionR271,type AdminAuthorityR271} from "./noor-admin-policy-r271.js";

/**
 * Password recovery is delivered to the account owner's verified mailbox.
 * The admin never sees, selects, stores or receives another user's password
 * or a recovery token. Never use auth.admin.updateUserById to set plaintext
 * credentials from an administrative browser.
 */
export interface NoorAdminPasswordRecoveryProviderR271 {
  sendRecoveryEmail(email:string):Promise<boolean>;
}
export interface NoorAdminPasswordRecoveryAuditR271 {
  record(input:Readonly<{
    actorAccountId:string;targetAuthUserId:string;action:"accounts:reset-password";
    outcome:"requested"|"failed";
  }>):Promise<void>;
}
export async function requestNoorAdminPasswordRecoveryR271(
  input:Readonly<{
    actorAccountId:string;
    targetAuthUserId:string;
    targetEmail:string;
    authority:AdminAuthorityR271|null;
  }>,
  dependencies:Readonly<{
    provider:NoorAdminPasswordRecoveryProviderR271;
    audit:NoorAdminPasswordRecoveryAuditR271;
  }>,
):Promise<"requested"|"denied"|"unavailable">{
  if(!authorizeAdminActionR271(input.authority,"accounts:reset-password") ||
     !input.actorAccountId || !input.targetAuthUserId ||
     typeof input.targetEmail!=="string" ||
     input.targetEmail.length>254 ||
     !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(input.targetEmail)) return "denied";
  try{
    const delivered=await dependencies.provider.sendRecoveryEmail(input.targetEmail);
    await dependencies.audit.record({
      actorAccountId:input.actorAccountId,targetAuthUserId:input.targetAuthUserId,
      action:"accounts:reset-password",outcome:delivered?"requested":"failed",
    });
    return delivered?"requested":"unavailable";
  }catch{
    return "unavailable";
  }
}
