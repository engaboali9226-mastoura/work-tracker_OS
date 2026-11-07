import type {NoorAdminMfaClientR271} from "./noor-admin-mfa-client-r271.js";

/**
 * User-context MFA to same-origin Noor session exchange. Only the privileged
 * server may decide admin authority; this helper cannot grant permissions.
 * Never persist or log the returned Supabase access token.
 */
export class NoorAdminMfaExchangeR271 {
  public constructor(
    private readonly mfa:Pick<NoorAdminMfaClientR271,"verifyTotp">,
    private readonly transport:Readonly<{
      post(path:string,body:Readonly<{accessToken:string}>):Promise<Readonly<{status:number}>>;
    }>,
  ){}
  public async authenticate(factorId:string,code:string):Promise<void>{
    const token=await this.mfa.verifyTotp(factorId,code);
    if(!token || token.length>8192)throw new Error("NOOR_ADMIN_MFA_PROOF_DENIED");
    const response=await this.transport.post("/api/noor/admin/authenticate",{accessToken:token});
    if(response.status!==204)throw new Error("NOOR_ADMIN_MFA_BINDING_DENIED");
  }
  public async renew(factorId:string,code:string):Promise<void>{
    const token=await this.mfa.verifyTotp(factorId,code);
    if(!token || token.length>8192)throw new Error("NOOR_ADMIN_MFA_PROOF_DENIED");
    const response=await this.transport.post("/api/noor/admin/renew",{accessToken:token});
    if(response.status!==204)throw new Error("NOOR_ADMIN_MFA_RENEWAL_DENIED");
  }
}
