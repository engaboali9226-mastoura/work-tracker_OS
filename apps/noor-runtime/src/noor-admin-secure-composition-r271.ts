import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorAdminSessionTokenBindingR271} from "./noor-admin-session-token-binding-r271.js";
import {NoorAdminSessionAuthenticationR271} from "./noor-admin-session-authentication-r271.js";
import type {NoorAdminAuthSessionRegistryR271} from "./noor-admin-supabase-assurance-r271.js";
import {NoorSupabaseAssuranceVerifierR271} from "./noor-admin-supabase-assurance-r271.js";
import {createNoorAdminAuthorityResolverR271,createNoorAdminVerifiedActorResolverR271} from "./noor-admin-authority-r271.js";
import type {NoorAdminDatabaseR271} from "./noor-admin-store-r271.js";
import {NoorAdminAccountStoreR271} from "./noor-admin-store-r271.js";
import {NoorAdminStepUpR271} from "./noor-admin-step-up-r271.js";
import {NoorAdminServerStepUpR271} from "./noor-admin-server-step-up-r271.js";
import type {NoorAdminTotpProviderR271} from "./noor-admin-totp-provider-r271.js";
import {authorizeNoorAdminSensitiveActionR271} from "./noor-admin-sensitive-authority-r271.js";
import type {AdminActionR271} from "./noor-admin-policy-r271.js";
import {createNoorAdminPgSessionRegistryR271} from "./noor-admin-pg-session-registry-r271.js";
import type {NoorAdminPgSessionQueryClientR271} from "./noor-admin-pg-session-registry-r271.js";

/**
 * Composition boundary for an authenticated admin. Must be created by the
 * privileged server with its service-role client and platform session resolver.
 * It does NOT grant admin rights or activate HTTP routes by itself.
 */
export function createNoorAdminSecureCompositionR271(input:Readonly<{
  client:SupabaseClient<NoorAdminDatabaseR271>;
  session:Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<Readonly<{accountId:{toString():string}}>>}>;
  now?:()=>number;
  sessionRegistry?:NoorAdminAuthSessionRegistryR271;
  postgresSessionClient?:NoorAdminPgSessionQueryClientR271;
  /** A trusted server-side challenge/verify adapter, never a browser client. */
  totpProvider?:NoorAdminTotpProviderR271;
}>){
  if(input.sessionRegistry && input.postgresSessionClient)
    throw new Error("NOOR_ADMIN_REGISTRY_DUPLICATE_SOURCE");
  const registry=input.sessionRegistry??(
    input.postgresSessionClient?createNoorAdminPgSessionRegistryR271(input.postgresSessionClient):undefined
  );
  const bindings=new NoorAdminSessionTokenBindingR271(input.now);
  const store=new NoorAdminAccountStoreR271(input.client);
  const authentication=new NoorAdminSessionAuthenticationR271({
    platformSession:input.session,
    adminStore:store,
    auth:input.client.auth,
    bindings,
    ...(registry?{sessionRegistry:registry}:{}),
    ...(input.now?{now:input.now}:{}),
  });
  const assurance=new NoorSupabaseAssuranceVerifierR271(input.client,bindings,input.now,registry);
  const dependencies={session:input.session,store,assurance};
  const resolveAuthority=createNoorAdminAuthorityResolverR271(dependencies);
  const resolveActor=createNoorAdminVerifiedActorResolverR271(dependencies);
  const proofs=new NoorAdminStepUpR271(input.now);
  const stepUp=registry && input.totpProvider
    ? new NoorAdminServerStepUpR271({
      tokens:bindings,resolveActor,assurance,
      registry,auth:input.client.auth,
      provider:input.totpProvider,proofs,
      ...(input.now?{now:input.now}:{}),
    })
    : null;
  const sensitiveActions=new Set<AdminActionR271>([
    "accounts:delete","accounts:reset-password","entitlements:manage",
  ]);
  const authorizeSensitiveAction=async(sessionId:string,action:AdminActionR271):Promise<boolean>=>{
    if(!stepUp || !sensitiveActions.has(action))return false;
    try{
      const [actor,binding]=await Promise.all([
        resolveActor(sessionId),bindings.getBindingForSession(sessionId),
      ]);
      if(!actor || !binding || actor.actorAccountId!==binding.platformAccountId)return false;
      return authorizeNoorAdminSensitiveActionR271({
        action,authority:actor.authority,platformSessionId:sessionId,
        authUserId:binding.authUserId,authSessionId:binding.authSessionId,
      },proofs);
    }catch{return false;}
  };
  return Object.freeze({
    authentication,resolveAuthority,resolveActor,stepUp,authorizeSensitiveAction,
    revokeSession:(sessionId:string)=>{
      stepUp?.revokeSession(sessionId);
      proofs.revoke(sessionId);
      bindings.revoke(sessionId);
    },
    shutdown:()=>{
      stepUp?.shutdown();
      proofs.revokeAll();
      bindings.revokeAll();
    },
  });
}
