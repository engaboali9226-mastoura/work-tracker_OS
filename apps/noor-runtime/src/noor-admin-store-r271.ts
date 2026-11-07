import type {SupabaseClient} from "@supabase/supabase-js";

export interface NoorAdminDatabaseR271 {
  readonly public:{
    readonly Tables:{
      readonly noor_admin_accounts_r271:{
        readonly Row:{
          readonly auth_user_id:string;
          readonly account_id:string;
          readonly role:"super_admin"|"admin";
          readonly enabled:boolean;
          readonly created_at:string;
          readonly updated_at:string;
        };
        readonly Insert:{
          readonly auth_user_id:string;
          readonly account_id:string;
          readonly role:"super_admin"|"admin";
          readonly enabled?:boolean;
          readonly created_at?:string;
          readonly updated_at?:string;
        };
        readonly Update:{
          readonly role?:"super_admin"|"admin";
          readonly enabled?:boolean;
          readonly updated_at?:string;
        };
        readonly Relationships:[];
      };
    };
    readonly Views:Record<string,never>;
    readonly Functions:Record<string,never>;
  };
}
/** Service-role only. The database has no anon/authenticated RLS policies. */
export class NoorAdminAccountStoreR271 {
  public constructor(private readonly client:SupabaseClient<NoorAdminDatabaseR271>) {}
  public async findActiveByAccountId(accountId:string) {
    if (!accountId || accountId.length>256) return null;
    const {data,error}=await this.client
      .from("noor_admin_accounts_r271")
      .select("auth_user_id,role,enabled")
      .eq("account_id",accountId)
      .eq("enabled",true)
      .maybeSingle();
    if(error) throw new Error("NOOR_ADMIN_LOOKUP_UNAVAILABLE");
    if(!data || data.enabled!==true ||
       (data.role!=="super_admin" && data.role!=="admin") ||
       !data.auth_user_id) return null;
    return {enabled:true,role:data.role,authUserId:data.auth_user_id};
  }
}
