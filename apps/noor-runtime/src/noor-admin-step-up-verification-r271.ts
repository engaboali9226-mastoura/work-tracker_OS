import {createHash} from "node:crypto";
import type {NoorAdminStepUpR271} from "./noor-admin-step-up-r271.js";

export interface NoorAdminTrustedChallengeVerifierR271 {
  /** Server-side verifier must independently verify a fresh MFA challenge.
   * No browser-provided timestamp, session ID, or role may count as proof.
   */
  verify(input:Readonly<{
    platformSessionId:string;
    authUserId:string;
    authSessionId:string;
    challengeId:string;
  }>):Promise<Readonly<{verifiedAtMs:number}>|null>;
}

/**
 * Deliberately not exposed as an HTTP route. A production verifier must
 * authenticate the challenge independently and bind it to the trusted
 * platform/Auth sessions before this method is wired.
 */
export class NoorAdminVerifiedStepUpIssuerR271 {
  private readonly consumedChallenges=new Set<string>();
  public constructor(
    private readonly verifier:NoorAdminTrustedChallengeVerifierR271,
    private readonly proofs:Pick<NoorAdminStepUpR271,"recordVerifiedChallenge">,
  ){}
  public async issue(input:Readonly<{
    platformSessionId:string;
    authUserId:string;
    authSessionId:string;
    challengeId:string;
  }>):Promise<boolean>{
    if(!input || !input.platformSessionId || !input.challengeId ||
       input.challengeId.length>256)return false;
    const key=createHash("sha256").update(JSON.stringify([
      input.authUserId,input.authSessionId,input.challengeId,
    ])).digest("hex");
    // Reserve before awaiting the verifier to deny concurrent replay.
    if(this.consumedChallenges.has(key) || this.consumedChallenges.size>=4096)return false;
    this.consumedChallenges.add(key);
    try{
      const evidence=await this.verifier.verify(input);
      if(!evidence || !Number.isSafeInteger(evidence.verifiedAtMs))return false;
      return this.proofs.recordVerifiedChallenge({
        platformSessionId:input.platformSessionId,
        authUserId:input.authUserId,
        authSessionId:input.authSessionId,
        challengeVerifiedAtMs:evidence.verifiedAtMs,
      });
    }catch{return false;}
  }
}
