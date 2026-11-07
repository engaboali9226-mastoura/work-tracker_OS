import {createHash} from "node:crypto";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminStepUpR271} from "./noor-admin-step-up-r271.js";
import type {NoorAdminTotpProviderR271} from "./noor-admin-totp-provider-r271.js";
import type {NoorAdminSessionTokenStoreR271,NoorAdminAuthSessionRegistryR271} from "./noor-admin-supabase-assurance-r271.js";
import type {AdminAuthorityR271} from "./noor-admin-policy-r271.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
interface VerifiedActor {
  readonly actorAccountId:string;
  readonly authority:AdminAuthorityR271;
}

/**
 * Server-owned recent TOTP step-up. The request supplies ONLY a Noor session
 * cookie resolved by the HTTP host, a factor UUID and six-digit TOTP code.
 * Admin identity and Supabase access tokens come solely from trusted stores.
 * A fresh challenge is created AND verified by Supabase on the server.
 * No received assertion of reauthentication is trusted.
 */
export class NoorAdminServerStepUpR271 {
  private readonly inFlight=new Set<string>();
  private readonly cancelled=new Set<string>();
  public revokeSession(platformSessionId:string):void{
    if(typeof platformSessionId!=="string" || !platformSessionId || platformSessionId.length>256)return;
    const key=createHash("sha256").update(platformSessionId,"utf8").digest("hex");
    if(this.inFlight.has(key))this.cancelled.add(key);
  }
  public shutdown():void{
    for(const key of this.inFlight)this.cancelled.add(key);
  }
  public constructor(private readonly dependencies:Readonly<{
    tokens:NoorAdminSessionTokenStoreR271;
    resolveActor:(platformSessionId:string)=>Promise<VerifiedActor|null>;
    assurance:Readonly<{verify:(sessionId:string,authUserId:string,accountId:string)=>Promise<Readonly<{aal:"aal1"|"aal2"|null;reauthenticated:boolean}>|null>}>;
    registry:NoorAdminAuthSessionRegistryR271;
    auth:Pick<SupabaseClient["auth"],"getUser"|"getClaims">;
    provider:NoorAdminTotpProviderR271;
    proofs:Pick<NoorAdminStepUpR271,"recordVerifiedChallenge">;
    now?:()=>number;
  }>){}
  public async verify(input:Readonly<{
    platformSessionId:string;factorId:string;code:string;
  }>):Promise<boolean>{
    if(!input || typeof input.platformSessionId!=="string" ||
       !input.platformSessionId || input.platformSessionId.length>256 ||
       typeof input.factorId!=="string" || !UUID.test(input.factorId) ||
       typeof input.code!=="string" || !/^\d{6}$/.test(input.code))return false;
    const key=createHash("sha256").update(input.platformSessionId,"utf8").digest("hex");
    if(this.inFlight.has(key) || this.inFlight.size>=4096)return false;
    this.inFlight.add(key);
    try{
      const actor=await this.dependencies.resolveActor(input.platformSessionId);
      if(!actor || !actor.actorAccountId ||
         !actor.authority.sessionActive || !actor.authority.accountActive ||
         !actor.authority.verifiedAdminGrant ||
         actor.authority.assuranceLevel!=="aal2" ||
         (actor.authority.role!=="super_admin" && actor.authority.role!=="admin"))return false;
      const [binding,token]=await Promise.all([
        this.dependencies.tokens.getBindingForSession(input.platformSessionId),
        this.dependencies.tokens.getAccessTokenForSession(input.platformSessionId),
      ]);
      if(!binding || binding.platformAccountId!==actor.actorAccountId ||
         !UUID.test(binding.authUserId) || !UUID.test(binding.authSessionId) ||
         !token || token.length>8192)return false;
      const assurance=await this.dependencies.assurance.verify(
        input.platformSessionId,binding.authUserId,binding.platformAccountId,
      );
      if(!assurance || assurance.aal!=="aal2")return false;
      const verifiedToken=await this.dependencies.provider.verify({
        accessToken:token,factorId:input.factorId,code:input.code,
      });
      if(!verifiedToken || verifiedToken.length>8192)return false;
      const [user,claimsResult]=await Promise.all([
        this.dependencies.auth.getUser(verifiedToken),
        this.dependencies.auth.getClaims(verifiedToken),
      ]);
      if(user.error || claimsResult.error ||
         user.data.user?.id!==binding.authUserId ||
         !claimsResult.data?.claims)return false;
      const claims=claimsResult.data.claims;
      const now=(this.dependencies.now??Date.now)();
      if(claims.sub!==binding.authUserId || claims.aal!=="aal2" ||
         claims.session_id!==binding.authSessionId ||
         typeof claims.exp!=="number" || claims.exp<=Math.floor(now/1000) ||
         typeof claims.iat!=="number" || claims.iat>Math.floor(now/1000)+60)return false;
      // Recheck the live Auth session AFTER the TOTP challenge as well.
      if(!(await this.dependencies.registry.isActive({
        authSessionId:binding.authSessionId,authUserId:binding.authUserId,
      })))return false;
      // A concurrent revoke/disable must not resurrect administrator privileges.
      const [stillBound,stillActor]=await Promise.all([
        this.dependencies.tokens.getBindingForSession(input.platformSessionId),
        this.dependencies.resolveActor(input.platformSessionId),
      ]);
      if(this.cancelled.has(key) || !stillBound || !stillActor ||
         stillBound.authUserId!==binding.authUserId ||
         stillBound.authSessionId!==binding.authSessionId ||
         stillBound.platformAccountId!==actor.actorAccountId ||
         stillActor.actorAccountId!==actor.actorAccountId ||
         !stillActor.authority.verifiedAdminGrant ||
         !stillActor.authority.accountActive ||
         stillActor.authority.assuranceLevel!=="aal2")return false;
      return this.dependencies.proofs.recordVerifiedChallenge({
        platformSessionId:input.platformSessionId,
        authUserId:binding.authUserId,
        authSessionId:binding.authSessionId,
        challengeVerifiedAtMs:now,
      });
    }catch{return false;}
    finally{this.inFlight.delete(key);this.cancelled.delete(key);}
  }
}
