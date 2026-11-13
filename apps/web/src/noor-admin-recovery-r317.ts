import {createNoorAccountSelfServiceR312,type NoorAccountSelfServiceR312} from "./noor-account-self-service-r312.js";
import type {PublicAuthenticationConfiguration} from "./public-authentication-environment.js";

/** R317 password recovery never grants an admin role, Auth app_metadata,
 * an NOOR session, or a linked application entitlement. */
export const NOOR_ADMIN_RECOVERY_PATH_R317="/admin/security?auth=recovery";

export function adminRecoveryRedirectR317(origin:string):string{
 let url:URL;
 try{url=new URL(origin);}catch{throw new TypeError("R317_UNSAFE_RECOVERY_ORIGIN");}
 if(url.origin!==origin||url.username||url.password||url.search||url.hash||
   (url.protocol!=="https:"&&!(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname))))
   throw new TypeError("R317_UNSAFE_RECOVERY_ORIGIN");
 return new URL(NOOR_ADMIN_RECOVERY_PATH_R317,url.origin).toString();
}

export function createNoorAdminRecoveryR317(
 config:PublicAuthenticationConfiguration,
 service:NoorAccountSelfServiceR312=createNoorAccountSelfServiceR312(config),
){
 return Object.freeze({
  /** Email is sent only by Supabase Auth. Treat the result as non-enumerating. */
  async send(email:string,origin:string):Promise<"sent"|"unavailable">{
   let target:string;
   try{target=adminRecoveryRedirectR317(origin);}catch{return "unavailable";}
   const result=await service.requestPasswordReset(email,target);
   return result==="sent"?"sent":"unavailable";
  },
  /** User must hold a valid, freshly issued recovery link in their browser. */
  async complete(password:string):Promise<"updated"|"invalid"|"unavailable">{
   const result=await service.completePasswordRecovery(password);
   return result==="updated"?"updated":result==="invalid"?"invalid":"unavailable";
  },
 });
}
