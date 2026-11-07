import type {SupabaseClient} from "@supabase/supabase-js";

/**
 * Privileged-only, bounded directory projection. This is NOT a grant source:
 * role and account authority always come from the trusted admin store.
 * Never include metadata, identities, tokens or personal workspace data.
 */
export class NoorAdminDirectoryR271 {
  public constructor(private readonly client:SupabaseClient) {}

  public async listAccounts():Promise<readonly Readonly<{
    id:string;email:string;enabled:boolean;
  }>[]> {
    const accounts:Array<{id:string;email:string;enabled:boolean}> = [];
    const seen=new Set<string>();
    for(let page=1;page<=10;page++){
      const {data,error}=await this.client.auth.admin.listUsers({page,perPage:100});
      if(error || !data || !Array.isArray(data.users)) {
        throw Error("NOOR_ADMIN_DIRECTORY_UNAVAILABLE");
      }
      for(const user of data.users){
        if(!user.id || seen.has(user.id)) {
          throw Error("NOOR_ADMIN_DIRECTORY_DUPLICATE");
        }
        seen.add(user.id);
        accounts.push({
          id:user.id,
          email:user.email??"",
          enabled:user.banned_until===undefined || user.banned_until===null ||
            user.banned_until==="none" ||
            (Number.isFinite(Date.parse(user.banned_until)) &&
             Date.parse(user.banned_until)<=Date.now()),
        });
      }
      if(data.users.length<100) return accounts;
    }
    // An explicit limit prevents unbounded service-role enumeration.
    throw Error("NOOR_ADMIN_DIRECTORY_PAGINATION_REQUIRED");
  }
}
