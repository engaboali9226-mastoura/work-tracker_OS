/**
 * Privileged server-only Supabase Auth TOTP challenge + verify.
 * Uses an already verified and server-bound USER access token; the API key
 * is publishable/anon, NEVER service_role. No browser-supplied challenge ID,
 * Supabase URL, user ID, or access token is accepted.
 */
export interface NoorAdminTotpProviderR271 {
  verify(input:Readonly<{
    accessToken:string;factorId:string;code:string;
  }>):Promise<string|null>;
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const TOKEN_MAX=8192;

export class NoorAdminSupabaseTotpProviderR271 implements NoorAdminTotpProviderR271 {
  private readonly base:string;
  public constructor(
    projectUrl:string,
    private readonly publishableKey:string,
    private readonly request:typeof fetch=fetch,
  ){
    const url=new URL(projectUrl);
    // Accept only public Supabase keys; never send service-role or secret keys.
    let publicKey=publishableKey.startsWith("sb_publishable_");
    if(!publicKey && publishableKey.split(".").length===3){
      try{
        const payload:unknown=JSON.parse(Buffer.from(publishableKey.split(".")[1]??"","base64url").toString("utf8"));
        publicKey=!!payload && typeof payload==="object" && "role" in payload && payload.role==="anon";
      }catch{publicKey=false;}
    }
    if(url.protocol!=="https:" ||
       !/^[a-z0-9-]+\.supabase\.co$/iu.test(url.hostname) ||
       url.username || url.password || url.port ||
       (url.pathname!=="/" && url.pathname!=="") || url.search || url.hash ||
       !publicKey || publishableKey.length>4096)
      throw new Error("NOOR_ADMIN_TOTP_CONFIGURATION_DENIED");
    this.base=url.origin+"/auth/v1/factors/";
  }
  public async verify(input:Readonly<{accessToken:string;factorId:string;code:string}>):Promise<string|null>{
    if(!input || !UUID.test(input.factorId) ||
       !/^\d{6}$/.test(input.code) ||
       !input.accessToken || input.accessToken.length>TOKEN_MAX) return null;
    const route=this.base+input.factorId;
    const headers={
      "apikey":this.publishableKey,
      "Authorization":"Bearer "+input.accessToken,
      "Content-Type":"application/json",
    };
    try{
      const challenge=await this.request(route+"/challenge",{
        method:"POST",headers,body:"{}",redirect:"error",cache:"no-store",
        signal:AbortSignal.timeout(8000),
      });
      if(!challenge.ok)return null;
      const challenged:unknown=await challenge.json();
      if(!challenged || typeof challenged!=="object" || !("id" in challenged) ||
         typeof challenged.id!=="string" || !UUID.test(challenged.id))return null;
      const verified=await this.request(route+"/verify",{
        method:"POST",headers,
        body:JSON.stringify({challenge_id:challenged.id,code:input.code}),
        redirect:"error",cache:"no-store",signal:AbortSignal.timeout(8000),
      });
      if(!verified.ok)return null;
      const result:unknown=await verified.json();
      if(!result || typeof result!=="object" || !("access_token" in result) ||
         typeof result.access_token!=="string" ||
         !result.access_token || result.access_token.length>TOKEN_MAX)return null;
      return result.access_token;
    }catch{return null;}
  }
}
