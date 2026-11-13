import {createBrowserPublicSupabaseAccountClient} from "./public-supabase-authentication-client.js";
import type {PublicSupabaseAccountClient} from "./public-supabase-authentication-client.js";
import type {PublicAuthenticationConfiguration} from "./public-authentication-environment.js";

/**
 * R315 is authentication-factor enrollment only. Successful AAL2 MUST NOT
 * create an administrator role or enable a privileged API endpoint.
 * Backend role provisioning and audited authorization remain R313 gates.
 */
export type NoorMfaSignInR315="enroll-needed"|"challenge-needed"|"invalid"|"unavailable";
export type NoorMfaVerificationR315="aal2"|"invalid"|"unavailable";
export type NoorMfaEnrollmentR315=Readonly<{qrSvg:string;factorId:string;secret:string}>;

export function createNoorAdminMfaSetupR315(
  config:PublicAuthenticationConfiguration,
  client:PublicSupabaseAccountClient=createBrowserPublicSupabaseAccountClient(config,false),
){
 let factorId:string|null=null;
 let signedIn=false;
 return Object.freeze({
   async signIn(email:string,password:string):Promise<NoorMfaSignInR315>{
     if(signedIn)return "unavailable";
     if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<1)return "invalid";
     try{
       const signIn=await client.auth.signInWithPassword({email:email.trim(),password});
       if(signIn.error||!signIn.data.user||!signIn.data.session)return "invalid";
       signedIn=true;
       const factors=await client.auth.mfa.listFactors();
       if(factors.error) {await client.auth.signOut();signedIn=false;return "unavailable";}
       const current=factors.data.totp.find(f=>f.status==="verified");
       if(current){factorId=current.id;return "challenge-needed";}
       return "enroll-needed";
     }catch{
       signedIn=false;await client.auth.signOut().catch(()=>{});return "unavailable";
     }
   },
   async enroll():Promise<NoorMfaEnrollmentR315|null>{
     if(!signedIn||factorId!==null)return null;
     try{
       const {data,error}=await client.auth.mfa.enroll({factorType:"totp",friendlyName:"NOOR Administrator"});
       if(error||!data?.id||!data.totp||(!data.totp.qr_code&&!data.totp.secret))return null;
       factorId=data.id;
       return Object.freeze({
         factorId,qrSvg:data.totp.qr_code??"",
         // TOTP enrollment secret is kept only in transient browser component state.
         secret:data.totp.secret??"",
       });
     }catch{return null;}
   },
   async verify(code:string):Promise<NoorMfaVerificationR315>{
     if(!signedIn||!factorId||!/^\d{6}$/.test(code))return "invalid";
     try{
       const result=await client.auth.mfa.challengeAndVerify({factorId,code});
       if(result.error)return "invalid";
       const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
       return !assurance.error&&assurance.data.currentLevel==="aal2"?"aal2":"unavailable";
     }catch{return "unavailable";}
   },
   async accessToken():Promise<string|null>{
     if(!signedIn)return null;
     try{
       const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
       if(assurance.error||assurance.data.currentLevel!=="aal2")return null;
       const result=await client.auth.getSession();
       return result.error?null:result.data.session?.access_token??null;
     }catch{return null;}
   },
   async signOut():Promise<void>{
     factorId=null;signedIn=false;
     await client.auth.signOut().catch(()=>{});
   },
 });
}
