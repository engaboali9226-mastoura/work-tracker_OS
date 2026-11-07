import type {SupabaseClient} from "@supabase/supabase-js";

/**
 * Runs on an authenticated Supabase user client, never the service-role client.
 * The returned JWT must still be verified and bound by the privileged Noor
 * authentication operation. This helper never grants an admin role.
 */
export class NoorAdminMfaClientR271 {
  public constructor(private readonly client:Pick<SupabaseClient,"auth">){}
  public async enrollTotp(){
    const result=await this.client.auth.mfa.enroll({factorType:"totp"});
    if(result.error || !result.data || result.data.type!=="totp")throw new Error("NOOR_MFA_ENROLL_DENIED");
    return {factorId:result.data.id,qrCode:result.data.totp.qr_code};
  }
  public async verifyTotp(factorId:string,code:string):Promise<string>{
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(factorId) || !/^\d{6}$/.test(code))
      throw new Error("NOOR_MFA_INVALID_INPUT");
    const challenge=await this.client.auth.mfa.challenge({factorId});
    if(challenge.error || !challenge.data?.id)throw new Error("NOOR_MFA_CHALLENGE_DENIED");
    const result=await this.client.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});
    if(result.error || !result.data?.access_token)throw new Error("NOOR_MFA_VERIFY_DENIED");
    return result.data.access_token;
  }
  public async verifiedFactors(){
    const result=await this.client.auth.mfa.listFactors();
    if(result.error || !result.data)throw new Error("NOOR_MFA_FACTORS_UNAVAILABLE");
    return result.data.totp.filter(f=>f.status==="verified").map(f=>({id:f.id,friendlyName:f.friendly_name}));
  }
}
