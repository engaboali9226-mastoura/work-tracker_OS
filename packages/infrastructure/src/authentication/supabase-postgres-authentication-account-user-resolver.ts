import { UserId } from "@worktracker/core";
import type { AuthenticationAccountId } from "@worktracker/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticationAccountUserResolver } from "./authentication-account-user-resolver.js";

export interface NoorAuthenticationAccountUserDatabase { readonly public: { readonly Tables: { readonly noor_authentication_account_linkages: { readonly Row: { readonly account_id: string; readonly user_id: string; }; readonly Insert: never; readonly Update: never; readonly Relationships: []; }; }; readonly Views: Record<string, never>; readonly Functions: Record<string, never>; }; }

export class SupabasePostgresAuthenticationAccountUserResolver implements AuthenticationAccountUserResolver {
  public constructor(private readonly client: SupabaseClient<NoorAuthenticationAccountUserDatabase>) {}
  public async resolve(accountId: AuthenticationAccountId): Promise<UserId | null> {
    const requested = String(accountId);
    try {
      const response = await this.client.from("noor_authentication_account_linkages").select("account_id,user_id").eq("account_id", requested);
      if (response.error || response.data === null || response.data.length === 0) return null;
      const ids = new Set<string>();
      for (const row of response.data) {
        if (!row || row.account_id !== requested || typeof row.user_id !== "string" || row.user_id.trim() === "") return null;
        try { ids.add(new UserId(row.user_id).toString()); } catch { return null; }
      }
      return ids.size === 1 ? new UserId([...ids][0]!) : null;
    } catch { return null; }
  }
}
