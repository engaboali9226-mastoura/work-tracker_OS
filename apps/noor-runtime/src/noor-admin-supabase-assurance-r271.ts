import type {SupabaseClient} from "@supabase/supabase-js";

/**
 * Server-only MFA assurance. The token MUST come from a trusted, server-side
 * binding to the Noor session ID; never from request body, browser headers,
 * or an unverified cookie. No binding => no administrator authority.
 */
export interface NoorAdminSessionTokenStoreR271 {
  getAccessTokenForSession(sessionId:string):Promise<string|null>;
  getBindingForSession(sessionId:string):Promise<Readonly<{
    platformAccountId:string;authUserId:string;authSessionId:string;
  }> | null>;
}
export class NoorSupabaseAssuranceVerifierR271 {
  public constructor(
    private readonly client:SupabaseClient,
    private readonly tokens:NoorAdminSessionTokenStoreR271,
    private readonly now:()=>number=()=>Date.now(),
  ){}
  public async verify(sessionId:string,authUserId:string):Promise<Readonly<{
    aal:"aal1"|"aal2"|null;reauthenticated:boolean;
  }> | null>{
    if(!sessionId || sessionId.length>256 ||
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(authUserId)) return null;
    try{
      const [token,binding]=await Promise.all([
        this.tokens.getAccessTokenForSession(sessionId),
        this.tokens.getBindingForSession(sessionId),
      ]);
      if(!token || token.length>8192 || !binding || binding.authUserId!==authUserId) return null;
      const [userResult,claimsResult]=await Promise.all([
        this.client.auth.getUser(token),
        this.client.auth.getClaims(token),
      ]);
      if(userResult.error || claimsResult.error || !userResult.data.user ||
         userResult.data.user.id!==authUserId ||
         !claimsResult.data?.claims) return null;
      const claims=claimsResult.data.claims;
      if(claims.sub!==authUserId || claims.aal!=="aal2") return null;
      // Require the signed token to identify the same Supabase Auth session.
      if(typeof claims.session_id!=="string" || !claims.session_id ||
         claims.session_id.length>256 || claims.session_id!==binding.authSessionId) return null;
      const nowSeconds=Math.floor(this.now()/1000);
      if(typeof claims.exp!=="number" || claims.exp<=nowSeconds ||
         typeof claims.iat!=="number" || claims.iat>nowSeconds+60) return null;
      // AAL2 alone is NOT proof of recent reauthentication.
      // A separate verified step-up challenge is required for sensitive actions.
      return {aal:"aal2",reauthenticated:false};
    }catch{
      return null;
    }
  }
}
