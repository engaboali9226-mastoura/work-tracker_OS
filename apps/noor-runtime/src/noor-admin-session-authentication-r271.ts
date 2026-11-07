import type {SupabaseClient} from "@supabase/supabase-js";
import {NoorAdminSessionTokenBindingR271} from "./noor-admin-session-token-binding-r271.js";

interface PlatformSessionResolverR271 {
  execute(input:Readonly<{sessionId:string}>):Promise<Readonly<{accountId:{toString():string}}>>;
}
interface AdminAccountStoreR271 {
  findActiveByAccountId(accountId:string):Promise<Readonly<{
    enabled:boolean;role:"super_admin"|"admin";authUserId:string;
  }> | null>;
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Server-only proof exchange: an existing Noor session is linked to a signed,
 * MFA-verified Supabase Auth session ONLY if both resolve to the SAME active
 * administrator. No email or client-provided role is used for authorization.
 * Call only from a same-origin, CSRF-protected route with a real Noor cookie.
 * Tokens are never returned to clients, logged, or written to the database.
 */
export class NoorAdminSessionAuthenticationR271 {
  public constructor(
    private readonly dependencies:Readonly<{
      platformSession:PlatformSessionResolverR271;
      adminStore:AdminAccountStoreR271;
      auth:Pick<SupabaseClient["auth"],"getUser"|"getClaims">;
      bindings:NoorAdminSessionTokenBindingR271;
      now?:()=>number;
    }>,
  ){}
  public async authenticate(input:Readonly<{
    platformSessionId:string;accessToken:string;
  }>):Promise<"authenticated"|"denied"|"unavailable">{
    if(!input || typeof input!=="object")return "denied";
    const {platformSessionId,accessToken}=input;
    if(typeof platformSessionId!=="string" || !platformSessionId ||
       platformSessionId.length>256 || typeof accessToken!=="string" ||
       !accessToken || accessToken.length>8192) return "denied";
    try{
      const platform=await this.dependencies.platformSession.execute({sessionId:platformSessionId});
      const accountId=platform.accountId.toString();
      if(!accountId || accountId.length>256)return "denied";
      const admin=await this.dependencies.adminStore.findActiveByAccountId(accountId);
      if(!admin || !admin.enabled || !UUID.test(admin.authUserId) ||
         (admin.role!=="super_admin" && admin.role!=="admin"))return "denied";
      const [user,verified]=await Promise.all([
        this.dependencies.auth.getUser(accessToken),
        this.dependencies.auth.getClaims(accessToken),
      ]);
      if(user.error || verified.error || !user.data.user ||
         user.data.user.id!==admin.authUserId)return "denied";
      const claims=verified.data?.claims;
      if(!claims || claims.sub!==admin.authUserId || claims.aal!=="aal2" ||
         typeof claims.session_id!=="string" || !UUID.test(claims.session_id))return "denied";
      const now=(this.dependencies.now??Date.now)();
      const nowSeconds=Math.floor(now/1000);
      if(typeof claims.exp!=="number" || !Number.isSafeInteger(claims.exp) ||
         claims.exp<=nowSeconds || typeof claims.iat!=="number" ||
         !Number.isSafeInteger(claims.iat) || claims.iat>nowSeconds+60)return "denied";
      const expiry=Math.min(claims.exp*1000,now+5*60_000);
      return this.dependencies.bindings.bind({
        platformSessionId,platformAccountId:accountId,
        authUserId:admin.authUserId,authSessionId:claims.session_id,
        accessToken,expiresAtMs:expiry,
      })?"authenticated":"denied";
    }catch{return "unavailable";}
  }
}
