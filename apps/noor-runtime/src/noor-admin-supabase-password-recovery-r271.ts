import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminPasswordRecoveryProviderR271} from "./noor-admin-password-recovery-r271.js";

/**
 * Privileged server-only adapter. Resolve the mailbox from the Auth user
 * record, never from browser input. The Auth service delivers a recovery
 * email; no recovery token or new password is returned to an administrator.
 */
export class NoorSupabasePasswordRecoveryProviderR271
implements NoorAdminPasswordRecoveryProviderR271 {
  public constructor(private readonly client:SupabaseClient) {}
  public async sendRecoveryEmailForUserId(authUserId:string):Promise<boolean> {
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(authUserId)) {
      return false;
    }
    try {
      const {data,error}=await this.client.auth.admin.getUserById(authUserId);
      const email=data.user?.email;
      if(error || data.user?.id!==authUserId || !email ||
         data.user.email_confirmed_at===undefined ||
         !data.user.email_confirmed_at) return false;
      const sent=await this.client.auth.resetPasswordForEmail(email);
      return !sent.error;
    }catch {
      return false;
    }
  }
}
