import type {SupabaseClient} from "@supabase/supabase-js";
import {createNoorAdminSecureCompositionR271} from "./noor-admin-secure-composition-r271.js";
import {NoorAdminDirectoryR271} from "./noor-admin-directory-r271.js";
import {NoorAdminSupabaseTotpProviderR271} from "./noor-admin-totp-provider-r271.js";
import {NoorSupabasePasswordRecoveryProviderR271} from "./noor-admin-supabase-password-recovery-r271.js";
import {NoorPasswordRecoveryAuditAdapterR271} from "./noor-admin-password-recovery-audit-r271.js";
import {NoorAdminAuditStoreR271} from "./noor-admin-audit-store-r271.js";
import type {NoorAdminDatabaseR271} from "./noor-admin-store-r271.js";
import type {NoorAdminAuditDatabaseR271} from "./noor-admin-audit-store-r271.js";

/**
 * This module is server-only and is constructed ONLY with a privileged
 * service-role client. It never grants administrators automatically.
 * All mutation routes stay disabled unless independently enabled later.
 */
export function createNoorAdminPrivilegedAssemblyR271(input:Readonly<{
  serviceClient:SupabaseClient<NoorAdminDatabaseR271>;
  session:Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<Readonly<{accountId:{toString():string}}>>}>;
  supabaseUrl:string;
  publicKey:string;
  expectedOrigin:string;
  allowPasswordRecovery?:boolean;
}>){
  if(!/^https:\/\//u.test(input.expectedOrigin) ||
     new URL(input.expectedOrigin).origin!==input.expectedOrigin)
    throw Error("NOOR_ADMIN_ORIGIN_INVALID");

  const composition=createNoorAdminSecureCompositionR271({
    client:input.serviceClient,
    session:input.session,
    useServiceRoleSessionRpc:true,
    totpProvider:new NoorAdminSupabaseTotpProviderR271(input.supabaseUrl,input.publicKey),
  });
  if(!composition.stepUp)throw Error("NOOR_ADMIN_STEP_UP_UNAVAILABLE");

  const directory=new NoorAdminDirectoryR271(
    input.serviceClient as unknown as SupabaseClient,
  );
  const audit=new NoorAdminAuditStoreR271(
    input.serviceClient as unknown as SupabaseClient<NoorAdminAuditDatabaseR271>,
  );
  const recovery=new NoorSupabasePasswordRecoveryProviderR271(
    input.serviceClient as unknown as SupabaseClient,
  );
  return Object.freeze({
    accountRoute:Object.freeze({
      expectedOrigin:input.expectedOrigin,
      resolveAuthority:composition.resolveAuthority,
      listAccounts:()=>directory.listAccounts(),
    }),
    authRoute:Object.freeze({
      expectedOrigin:input.expectedOrigin,
      operation:composition.authentication,
      revokeSession:composition.revokeSession,
    }),
    stepUpRoute:Object.freeze({
      expectedOrigin:input.expectedOrigin,
      operation:composition.stepUp,
    }),
    recoveryRoute:input.allowPasswordRecovery===true?Object.freeze({
      expectedOrigin:input.expectedOrigin,
      resolveActor:composition.resolveActor,
      authorizeSensitiveAction:composition.authorizeSensitiveAction,
      provider:recovery,
      createAudit:()=>new NoorPasswordRecoveryAuditAdapterR271(
        new (class {
          public async findActiveByAccountId(id:string){
            const result=await input.serviceClient
              .from("noor_admin_accounts_r271")
              .select("auth_user_id,role,enabled")
              .eq("account_id",id).eq("enabled",true).maybeSingle();
            if(result.error || !result.data)return null;
            return {authUserId:result.data.auth_user_id,
              enabled:result.data.enabled,role:result.data.role};
          }
        })(),
        audit,
      ),
    }):undefined,
    revokeSession:composition.revokeSession,
    shutdown:composition.shutdown,
  });
}
