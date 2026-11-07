import {authorizeAdminActionR271,type AdminActionR271,type AdminAuthorityR271} from "./noor-admin-policy-r271.js";
import type {NoorAdminStepUpR271} from "./noor-admin-step-up-r271.js";

const SENSITIVE=new Set<AdminActionR271>([
  "accounts:delete","accounts:reset-password","entitlements:manage",
]);
/**
 * The step-up grant is consumed exactly once for a sensitive action.
 * This adapter never accepts a caller-supplied reauthenticated flag.
 * The caller must first resolve a live, signed, MFA-verified administrator
 * and a trusted server-bound Supabase Auth session ID.
 */
export function authorizeNoorAdminSensitiveActionR271(input:Readonly<{
  action:AdminActionR271;
  authority:AdminAuthorityR271|null;
  platformSessionId:string;
  authUserId:string;
  authSessionId:string;
}>,proofs:Pick<NoorAdminStepUpR271,"consume">):boolean{
  if(!input || !input.authority || !input.platformSessionId ||
     !input.authUserId || !input.authSessionId)return false;
  // A client-provided reauthenticated=true is never accepted as evidence.
  const base={...input.authority,reauthenticated:false};
  if(!authorizeAdminActionR271({...base,reauthenticated:true},input.action))return false;
  if(!SENSITIVE.has(input.action))return authorizeAdminActionR271(base,input.action);
  if(!proofs.consume({
    platformSessionId:input.platformSessionId,
    authUserId:input.authUserId,
    authSessionId:input.authSessionId,
  }))return false;
  return authorizeAdminActionR271({...base,reauthenticated:true},input.action);
}
