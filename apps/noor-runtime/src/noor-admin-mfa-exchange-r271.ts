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
  private inFlight=false;
  private async exchange(path:"/api/noor/admin/authenticate"|"/api/noor/admin/renew",factorId:string,code:string):Promise<void>{
    if(this.inFlight)throw new Error("NOOR_ADMIN_MFA_EXCHANGE_IN_PROGRESS");
    this.inFlight=true;
    try{
      const token=await this.mfa.verifyTotp(factorId,code);
      if(!token || token.length>8192)throw new Error("NOOR_ADMIN_MFA_PROOF_DENIED");
      const response=await this.transport.post(path,{accessToken:token});
      if(response.status!==204)throw new Error(path.endsWith("/renew")?"NOOR_ADMIN_MFA_RENEWAL_DENIED":"NOOR_ADMIN_MFA_BINDING_DENIED");
    }finally{this.inFlight=false;}
  }
  public async authenticate(factorId:string,code:string):Promise<void>{
    return this.exchange("/api/noor/admin/authenticate",factorId,code);
  }
  public async renew(factorId:string,code:string):Promise<void>{
    return this.exchange("/api/noor/admin/renew",factorId,code);
  }
}
