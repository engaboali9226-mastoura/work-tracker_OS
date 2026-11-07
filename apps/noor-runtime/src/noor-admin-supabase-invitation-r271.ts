import type {SupabaseClient} from "@supabase/supabase-js";
import type {AdminInvitationProviderR271} from "./noor-admin-invitation-r271.js";

/**
 * Service-role-only invitation provider. This creates an Auth invitation,
 * never an admin grant. Call only after trusted authority and audit readiness.
 */
export class NoorSupabaseAdminInvitationProviderR271
implements AdminInvitationProviderR271 {
  public constructor(private readonly client:SupabaseClient) {}
  public async inviteUserByEmail(email:string):Promise<Readonly<{
    userId:string|null;error:string|null;
  }>> {
    if(typeof email!=="string" || email.length>254 ||
       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      return {userId:null,error:"INVALID_EMAIL"};
    }
    try {
      const {data,error}=await this.client.auth.admin.inviteUserByEmail(email);
      if(error || !data.user?.id) {
        return {userId:null,error:"INVITATION_UNAVAILABLE"};
      }
      return {userId:data.user.id,error:null};
    } catch {
      return {userId:null,error:"INVITATION_UNAVAILABLE"};
    }
  }
}
