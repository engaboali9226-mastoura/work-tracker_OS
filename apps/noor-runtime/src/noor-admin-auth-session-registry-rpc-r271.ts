import type {NoorAdminAuthSessionRegistryR271} from "./noor-admin-supabase-assurance-r271.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const RPC_NAME="noor_admin_auth_session_active_r271" as const;

/**
 * A privileged SERVER-SIDE Supabase client is required. This narrow RPC
 * bridge is intentionally not available to anon or authenticated DB roles.
 * A restricted SECURITY INVOKER wrapper calls an internal SECURITY DEFINER
 * function; no browser or PostgREST schema may expose auth.sessions itself.
 */
export interface NoorAdminServiceRoleRpcClientR271 {
  rpc(
    functionName:typeof RPC_NAME,
    parameters:Readonly<{
      p_auth_session_id:string;
      p_auth_user_id:string;
    }>,
  ):PromiseLike<Readonly<{data:unknown;error:unknown}>>;
}

export class NoorAdminAuthSessionRegistryRpcR271 implements NoorAdminAuthSessionRegistryR271 {
  public constructor(private readonly serverClient:NoorAdminServiceRoleRpcClientR271){}
  public async isActive(input:Readonly<{authSessionId:string;authUserId:string}>):Promise<boolean>{
    if(!input || typeof input.authSessionId!=="string" ||
       typeof input.authUserId!=="string" ||
       !UUID.test(input.authSessionId) || !UUID.test(input.authUserId))return false;
    try{
      const result=await this.serverClient.rpc(RPC_NAME,{
        p_auth_session_id:input.authSessionId,
        p_auth_user_id:input.authUserId,
      });
      // Do not coerce truthy responses or accept HTTP 200 without a true boolean.
      return result?.error==null && result.data===true;
    }catch{return false;}
  }
}
