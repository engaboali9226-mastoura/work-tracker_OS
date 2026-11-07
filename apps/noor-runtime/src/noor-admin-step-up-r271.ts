import {createHash} from "node:crypto";

/**
 * Server-only, one-use recent step-up proof. Only a privileged server
 * operation that has independently verified a NEW TOTP challenge may call
 * recordVerifiedChallenge. Never accept a browser timestamp or role.
 * A normal AAL2 token refresh is NOT sufficient step-up evidence.
 */
export class NoorAdminStepUpR271 {
  private readonly proofs=new Map<string,{authUserId:string;authSessionId:string;expiresAt:number}>();
  public constructor(private readonly now:()=>number=()=>Date.now()){}
  private key(platformSessionId:string):string{
    return createHash("sha256").update(platformSessionId,"utf8").digest("hex");
  }
  public recordVerifiedChallenge(input:Readonly<{
    platformSessionId:string;authUserId:string;authSessionId:string;
    challengeVerifiedAtMs:number;
  }>):boolean{
    const now=this.now();
    if(!input || !input.platformSessionId || input.platformSessionId.length>256 ||
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.authUserId) ||
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.authSessionId) ||
       !Number.isSafeInteger(input.challengeVerifiedAtMs) ||
       input.challengeVerifiedAtMs>now ||
       now-input.challengeVerifiedAtMs>60_000)return false;
    this.proofs.set(this.key(input.platformSessionId),{
      authUserId:input.authUserId,authSessionId:input.authSessionId,
      expiresAt:Math.min(now+60_000,input.challengeVerifiedAtMs+60_000),
    });
    return true;
  }
  public consume(input:Readonly<{platformSessionId:string;authUserId:string;authSessionId:string}>):boolean{
    if(!input || !input.platformSessionId || input.platformSessionId.length>256)return false;
    const key=this.key(input.platformSessionId);
    const proof=this.proofs.get(key);
    this.proofs.delete(key);
    return !!proof && proof.expiresAt>this.now() &&
      proof.authUserId===input.authUserId && proof.authSessionId===input.authSessionId;
  }
  public revoke(platformSessionId:string):void{
    if(platformSessionId && platformSessionId.length<=256)this.proofs.delete(this.key(platformSessionId));
  }
  public revokeAll():void{this.proofs.clear();}
}
