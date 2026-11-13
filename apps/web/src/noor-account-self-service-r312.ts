import { createBrowserPublicSupabaseAccountClient } from "./public-supabase-authentication-client.js";
import type { PublicSupabaseAccountClient } from "./public-supabase-authentication-client.js";
import type { PublicAuthenticationConfiguration } from "./public-authentication-environment.js";

/** Only publishable Supabase keys; never persist provider tokens in browser storage. */
export type NoorAccountResultR312 =
  "sent" | "updated" | "invalid" | "unavailable";

export type NoorAccountSelfServiceR312 = Readonly<{
  requestPasswordReset(email:string,redirectTo:string):Promise<NoorAccountResultR312>;
  registerPendingAccount(email:string,password:string,redirectTo:string,name?:string):Promise<NoorAccountResultR312>;
  completePasswordRecovery(password:string):Promise<NoorAccountResultR312>;
  requestEmailChange(currentEmail:string,currentPassword:string,newEmail:string):Promise<NoorAccountResultR312>;
}>;

const validEmail=(email:string)=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
const validPassword=(password:string)=>typeof password==="string"&&password.length>=8&&password.length<=128;
/** Explicitly scope links to the live application's own origin, not a caller-provided host. */
export function noorRecoveryRedirectR312(origin:string):string {
  const url=new URL(origin);
  if(url.origin!==origin||!["https:","http:"].includes(url.protocol)
    ||(url.protocol!=="https:"&&!["localhost","127.0.0.1","[::1]"].includes(url.hostname)))
    throw Error("NOOR_UNSAFE_RECOVERY_ORIGIN");
  return new URL("/?auth=recovery",url.origin).toString();
}
export function createNoorAccountSelfServiceR312(
  config:PublicAuthenticationConfiguration,
  factory:(detectSessionInUrl:boolean)=>PublicSupabaseAccountClient=(detectSessionInUrl)=>
    createBrowserPublicSupabaseAccountClient(config,detectSessionInUrl),
):NoorAccountSelfServiceR312 {
  const client=factory(false);
  return {
    async requestPasswordReset(email,redirectTo){
      if(!validEmail(email)||!redirectTo.startsWith("https://")&&!redirectTo.startsWith("http://localhost"))return "invalid";
      try{
        const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo});
        return error?"unavailable":"sent";
      }catch{return "unavailable";}
    },
    async registerPendingAccount(email,password,redirectTo,name){
      if(!validEmail(email)||!validPassword(password)||!redirectTo.startsWith("https://")&&!redirectTo.startsWith("http://localhost")||
        name!==undefined&&(!name.trim()||name.trim().length<2||name.length>120))return "invalid";
      try{
        const {error}=await client.auth.signUp({
          email:email.trim(),password,
          options:{emailRedirectTo:redirectTo,
            // Marker is user-editable and never authorizes access. Only the
            // independent super_admin may approve a verified email.
            data:{noor_registration_request:true,...(name?{name:name.trim()}:{})},
          },
        });
        // Signup does not grant a Noor account linkage or any permissions.
        await client.auth.signOut().catch(()=>{});
        return error?"unavailable":"sent";
      }catch{return "unavailable";}
    },
    async completePasswordRecovery(password){
      if(!validPassword(password))return "invalid";
      const recovery=factory(true);
      try{
        const {data,error}=await recovery.auth.getUser();
        if(error||!data.user)return "invalid";
        const update=await recovery.auth.updateUser({password});
        await recovery.auth.signOut().catch(()=>{});
        return update.error?"unavailable":"updated";
      }catch{return "unavailable";}
    },
    async requestEmailChange(currentEmail,currentPassword,newEmail){
      if(!validEmail(currentEmail)||!validEmail(newEmail)||!currentPassword||currentEmail.trim().toLowerCase()===newEmail.trim().toLowerCase())return "invalid";
      const account=factory(false);
      try{
        const signed=await account.auth.signInWithPassword({email:currentEmail.trim(),password:currentPassword});
        if(signed.error||!signed.data.user)return "invalid";
        const updated=await account.auth.updateUser({email:newEmail.trim()});
        return updated.error?"unavailable":"sent";
      }catch{return "unavailable";}
      finally{await account.auth.signOut().catch(()=>{});}
    },
  };
}
