import type {NoorAdminAuthSessionRegistryR271} from "./noor-admin-supabase-assurance-r271.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Privileged SQL-only lookup; auth.sessions must never be exposed to
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
        `select exists (
          select 1 from auth.sessions
          where id = $1::uuid and user_id = $2::uuid
            and (not_after is null or not_after > now())
        ) as active`,
        [input.authSessionId,input.authUserId],
      );
      return rows.length===1 && rows[0]?.active===true;
    }catch{return false;}
  }
}
