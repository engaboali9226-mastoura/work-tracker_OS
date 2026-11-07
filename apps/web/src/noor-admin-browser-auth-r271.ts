import {createNoorAdminUserAuthClientR271} from "./public-supabase-authentication-client.js";
import type {PublicNoorAdminSupabaseClientR271} from "./public-supabase-authentication-client.js";
import {readBrowserPublicAuthenticationConfiguration} from "./public-authentication-environment.js";

export type NoorAdminBrowserFactorR271=Readonly<{id:string;label:string}>;
export interface NoorAdminBrowserAuthR271 {
  signIn(email:string,password:string):Promise<readonly NoorAdminBrowserFactorR271[]>;
  enroll():Promise<Readonly<{id:string;qrCode:string}>>;
  acceptInvitation(password:string):Promise<readonly NoorAdminBrowserFactorR271[]>;
  hasVerifiedRecoverySession():Promise<boolean>;
  verifyEnrollment(factorId:string,code:string):Promise<void>;
  authenticate(factorId:string,code:string):Promise<void>;
  stepUp(factorId:string,code:string):Promise<void>;
  revoke():Promise<void>;
  reset():Promise<void>;
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
function validTotp(factorId:string,code:string):boolean {
  return UUID.test(factorId) && /^\d{6}$/.test(code);
}
async function submit(path:string,body:unknown):Promise<void>{
  const response=await fetch(path,{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),redirect:"error",
  });
  if(response.status!==204)throw Error("NOOR_ADMIN_AUTHORIZATION_DENIED");
}
export function createNoorAdminBrowserAuthR271(
  client?:PublicNoorAdminSupabaseClientR271,
  exchange: (path:string,body:unknown)=>Promise<void>=submit,
):NoorAdminBrowserAuthR271{
  const authClient=client??createNoorAdminUserAuthClientR271(
    readBrowserPublicAuthenticationConfiguration(),
  );
  let signedIn=false;
  async function verifyUserTotp(factorId:string,code:string):Promise<string>{
    if(!signedIn || !validTotp(factorId,code))
      throw Error("NOOR_ADMIN_MFA_INPUT_INVALID");
    const challenge=await authClient.auth.mfa.challenge({factorId});
    if(challenge.error || !challenge.data?.id)
      throw Error("NOOR_ADMIN_MFA_CHALLENGE_DENIED");
    const verified=await authClient.auth.mfa.verify({
      factorId,challengeId:challenge.data.id,code,
    });
    const proof=verified.data?.access_token;
    if(verified.error || !proof || proof.length>8192)
      throw Error("NOOR_ADMIN_MFA_VERIFY_DENIED");
    return proof;
  }
  async function verifiedFactors():Promise<readonly NoorAdminBrowserFactorR271[]>{
    const factors=await authClient.auth.mfa.listFactors();
    if(factors.error || !factors.data)throw Error("NOOR_ADMIN_MFA_UNAVAILABLE");
    return factors.data.totp.filter(f=>f.status==="verified")
      .map(f=>({id:f.id,label:f.friendly_name??"تطبيق المصادقة"}));
  }
  return Object.freeze({
    async signIn(email:string,password:string){
      if(!EMAIL.test(email) || email.length>254 || !password)
        throw Error("NOOR_ADMIN_CREDENTIALS_INVALID");
      signedIn=false;
      const result=await authClient.auth.signInWithPassword({email,password});
      if(result.error || !result.data.session?.access_token)
        throw Error("NOOR_ADMIN_CREDENTIALS_DENIED");
      signedIn=true;
      return verifiedFactors();
    },
    async enroll(){
      if(!signedIn)throw Error("NOOR_ADMIN_SESSION_REQUIRED");
      const result=await authClient.auth.mfa.enroll({factorType:"totp"});
      if(result.error || !result.data || result.data.type!=="totp")
        throw Error("NOOR_ADMIN_MFA_ENROLL_DENIED");
      return {id:result.data.id,qrCode:result.data.totp.qr_code};
    },
    async authenticate(factorId:string,code:string){
      const proof=await verifyUserTotp(factorId,code);
      await exchange("/api/noor/admin/authenticate",{accessToken:proof});
    },
    async verifyEnrollment(factorId:string,code:string){
      await verifyUserTotp(factorId,code);
    },
    async hasVerifiedRecoverySession(){
      const current=await authClient.auth.getSession();
      return !current.error &&
        !!current.data.session?.user?.email_confirmed_at;
    },
    async acceptInvitation(password:string){
      if(typeof password!=="string" || password.length<12 || password.length>128)
        throw Error("NOOR_ADMIN_NEW_PASSWORD_INVALID");
      const current=await authClient.auth.getSession();
      if(current.error || !current.data.session ||
         !current.data.session.user?.email_confirmed_at)
        throw Error("NOOR_ADMIN_INVITATION_NOT_VERIFIED");
      const updated=await authClient.auth.updateUser({password});
      if(updated.error || !updated.data.user ||
         updated.data.user.id!==current.data.session.user.id)
        throw Error("NOOR_ADMIN_INVITATION_PASSWORD_DENIED");
      signedIn=true;
      // Never leave access/refresh tokens from an invite redirect in the URL.
      if(typeof window!=="undefined" &&
         /(?:access_token|refresh_token)=/u.test(window.location.hash)){
        window.history.replaceState(window.history.state,"",
          window.location.pathname+window.location.search);
      }
      return verifiedFactors();
    },
    async stepUp(factorId:string,code:string){
      if(!signedIn || !validTotp(factorId,code))
        throw Error("NOOR_ADMIN_STEP_UP_INPUT_INVALID");
      await exchange("/api/noor/admin/step-up",{factorId,code});
    },
    async revoke(){
      const response=await fetch("/api/noor/admin/revoke",{
        method:"POST",credentials:"same-origin",cache:"no-store",redirect:"error",
      });
      if(response.status!==204 && response.status!==404)
        throw Error("NOOR_ADMIN_REVOKE_UNAVAILABLE");
      signedIn=false;
      await authClient.auth.signOut({scope:"local"});
    },
    async reset(){
      signedIn=false;
      await authClient.auth.signOut({scope:"local"});
    },
  });
}
