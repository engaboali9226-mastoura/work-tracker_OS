import {createHash} from "node:crypto";
import type {NoorAdminSessionTokenStoreR271} from "./noor-admin-supabase-assurance-r271.js";

/**
 * Server-only, short-lived binding between an independently authenticated
 * Supabase Auth session and an already verified Noor platform session.
 * The caller MUST verify both identities before binding. Never accept a
 * browser-supplied platform account ID, Auth user ID, or access token.
 * This in-memory implementation is intentionally NOT production-persistent:
 * restart/revocation drops all bindings and fails closed.
 */
export interface NoorAdminVerifiedSessionBindingR271 {
  readonly platformSessionId:string;
  readonly platformAccountId:string;
  readonly authUserId:string;
  readonly authSessionId:string;
  readonly accessToken:string;
  readonly expiresAtMs:number;
}
type Binding = Readonly<Omit<NoorAdminVerifiedSessionBindingR271,"platformSessionId">>;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
function fingerprint(value:string):string{
  return createHash("sha256").update(value,"utf8").digest("hex");
}
export class NoorAdminSessionTokenBindingR271 implements NoorAdminSessionTokenStoreR271 {
  private readonly bindings=new Map<string,Binding>();
  public constructor(private readonly now:()=>number=()=>Date.now()){}
  public bind(input:NoorAdminVerifiedSessionBindingR271):boolean{
    const time=this.now();
    if(!input || !input.platformSessionId || input.platformSessionId.length>256 ||
       !input.platformAccountId || input.platformAccountId.length>256 ||
       !UUID.test(input.authUserId) || !UUID.test(input.authSessionId) ||
       !input.accessToken || input.accessToken.length>8192 ||
       !Number.isSafeInteger(input.expiresAtMs) ||
       input.expiresAtMs<=time || input.expiresAtMs>time+5*60_000) return false;
    const key=fingerprint(input.platformSessionId);
    // Never overwrite a live binding. Changing Auth identity requires revoke.
    const existing=this.bindings.get(key);
    if(existing && existing.expiresAtMs>time) return false;
    const {platformSessionId:_discard,...binding}=input;
    this.bindings.set(key,Object.freeze(binding));
    return true;
  }
  /**
   * Refresh is allowed only within the same platform account, Auth user,
   * and Supabase Auth session. The caller must independently verify the new
   * signed token first. A failed rotation preserves the existing binding.
   */
  public rotate(input:NoorAdminVerifiedSessionBindingR271):boolean{
    const time=this.now();
    if(!input || typeof input.platformSessionId!=="string" ||
       !input.platformSessionId || input.platformSessionId.length>256 ||
       typeof input.accessToken!=="string" || !input.accessToken ||
       input.accessToken.length>8192 || !Number.isSafeInteger(input.expiresAtMs) ||
       input.expiresAtMs<=time || input.expiresAtMs>time+5*60_000)return false;
    const key=fingerprint(input.platformSessionId);
    const existing=this.bindings.get(key);
    if(!existing || existing.expiresAtMs<=time ||
       existing.platformAccountId!==input.platformAccountId ||
       existing.authUserId!==input.authUserId ||
       existing.authSessionId!==input.authSessionId)return false;
    const {platformSessionId:_discard,...binding}=input;
    this.bindings.set(key,Object.freeze(binding));
    return true;
  }
  public async getAccessTokenForSession(sessionId:string):Promise<string|null>{
    if(typeof sessionId!=="string" || !sessionId || sessionId.length>256)return null;
    const key=fingerprint(sessionId);
    const entry=this.bindings.get(key);
    if(!entry)return null;
    if(entry.expiresAtMs<=this.now()){this.bindings.delete(key);return null;}
    return entry.accessToken;
  }
  public async getBindingForSession(sessionId:string):Promise<Readonly<{
    platformAccountId:string;authUserId:string;authSessionId:string;
  }> | null>{
    const token=await this.getAccessTokenForSession(sessionId);
    if(!token)return null;
    const entry=this.bindings.get(fingerprint(sessionId));
    return entry?{platformAccountId:entry.platformAccountId,authUserId:entry.authUserId,authSessionId:entry.authSessionId}:null;
  }
  public revoke(sessionId:string):void{
    if(typeof sessionId==="string" && sessionId && sessionId.length<=256)
      this.bindings.delete(fingerprint(sessionId));
  }
  public revokeAll():void{this.bindings.clear();}
}
