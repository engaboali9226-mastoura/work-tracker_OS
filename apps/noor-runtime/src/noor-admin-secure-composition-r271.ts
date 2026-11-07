import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorAdminSessionTokenBindingR271} from "./noor-admin-session-token-binding-r271.js";
import {NoorAdminSessionAuthenticationR271} from "./noor-admin-session-authentication-r271.js";
import {NoorSupabaseAssuranceVerifierR271} from "./noor-admin-supabase-assurance-r271.js";
import {createNoorAdminAuthorityResolverR271,createNoorAdminVerifiedActorResolverR271} from "./noor-admin-authority-r271.js";
import type {NoorAdminDatabaseR271} from "./noor-admin-store-r271.js";
import {NoorAdminAccountStoreR271} from "./noor-admin-store-r271.js";

/**
 * Composition boundary for an authenticated admin. Must be created by the
 * privileged server with its service-role client and platform session resolver.
 * It does NOT grant admin rights or activate HTTP routes by itself.
 */
export function createNoorAdminSecureCompositionR271(input:Readonly<{
  client:SupabaseClient<NoorAdminDatabaseR271>;
  session:Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<Readonly<{accountId:{toString():string}}>>}>;
  now?:()=>number;
}>){
  const bindings=new NoorAdminSessionTokenBindingR271(input.now);
  const store=new NoorAdminAccountStoreR271(input.client);
  const authentication=new NoorAdminSessionAuthenticationR271({
    platformSession:input.session,
    adminStore:store,
    auth:input.client.auth,
    bindings,
    now:input.now,
  });
  const assurance=new NoorSupabaseAssuranceVerifierR271(input.client,bindings,input.now);
  const dependencies={session:input.session,store,assurance};
  const resolveAuthority=createNoorAdminAuthorityResolverR271(dependencies);
  const resolveActor=createNoorAdminVerifiedActorResolverR271(dependencies);
  return Object.freeze({
    authentication,resolveAuthority,resolveActor,
    revokeSession:(sessionId:string)=>bindings.revoke(sessionId),
    shutdown:()=>bindings.revokeAll(),
  });
}
