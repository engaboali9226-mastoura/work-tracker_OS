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
    const {data,error}=await this.client.auth.admin.listUsers({
      page:1,perPage:100,
    });
    if(error || !data || !Array.isArray(data.users)) {
      throw Error("NOOR_ADMIN_DIRECTORY_UNAVAILABLE");
    }
    // Do not present a truncated directory as a complete account list.
    // A cursor-based API must be introduced before serving larger tenants.
    if(data.users.length>=100) throw Error("NOOR_ADMIN_DIRECTORY_PAGINATION_REQUIRED");
    return data.users.map(user=>({
      id:user.id,
      email:user.email??"",
      enabled:user.banned_until===undefined || user.banned_until===null ||
        new Date(user.banned_until).getTime()<=Date.now(),
    }));
  }
}
