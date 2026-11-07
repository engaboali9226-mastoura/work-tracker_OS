import type {NoorAdminAuthSessionRegistryR271} from "./noor-admin-supabase-assurance-r271.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Privileged SQL-only lookup through a private SECURITY DEFINER function;
 * direct service_role SELECT on auth.sessions is unavailable. auth.sessions must never be exposed to
 * PostgREST. The executor must use parameterized SQL, not interpolation.
 * This adapter never creates, deletes, or revokes Supabase sessions.
 */
export class NoorAdminAuthSessionRegistrySqlR271 implements NoorAdminAuthSessionRegistryR271 {
  public constructor(private readonly query:Readonly<{
    execute(sql:string,parameters:readonly string[]):Promise<ReadonlyArray<Readonly<{active:boolean}>>>;
  }>){}
  public async isActive(input:Readonly<{authSessionId:string;authUserId:string}>):Promise<boolean>{
    if(!input || !UUID.test(input.authSessionId) || !UUID.test(input.authUserId))return false;
    try{
      const rows=await this.query.execute(
        `select noor_admin_internal.noor_admin_auth_session_active_r271(
          $1::uuid, $2::uuid
        ) as active`,
        [input.authSessionId,input.authUserId],
      );
      return rows.length===1 && rows[0]?.active===true;
    }catch{return false;}
  }
}
