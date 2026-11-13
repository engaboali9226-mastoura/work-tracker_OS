/**
 * R316: privileged account lifecycle. No feature flag or super_admin+AAL2 means
 * no accounts are visible or mutable. Service-role secrets NEVER reach browsers.
 * Soft-deletes Auth identity and revokes app access, retaining owner data.
 */
import {randomUUID} from "node:crypto";
import type {SupabaseClient} from "@supabase/supabase-js";

type Json=null|boolean|number|string|Json[]|{[key:string]:Json};
type Table<Row,Insert,Update>={Row:Row;Insert:Insert;Update:Update;Relationships:[]};
type Link={issuer:string;subject:string;account_id:string;user_id:string};
type Grant={id:string;account_id:string;action:string;resource_type:string;resource_id:string;granted_at_epoch_ms:number;revoked_at_epoch_ms:number|null};
type Admin={auth_user_id:string;account_id:string;role:string;enabled:boolean;created_at:string;updated_at:string};
type Audit={id:string;actor_auth_user_id:string;target_auth_user_id:string|null;action:string;outcome:string;request_id:string;occurred_at:string;details:Json};
type Session={id:string;account_id:string;created_at_epoch_ms:number;expires_at_epoch_ms:number;revoked_at_epoch_ms:number|null};
export interface NoorAdminDatabaseR316 {
 public:{Tables:{
  noor_admin_accounts_r271:Table<Admin,Partial<Admin>&Pick<Admin,"auth_user_id"|"account_id"|"role">,Partial<Admin>>;
  noor_admin_audit_r271:Table<Audit,Omit<Audit,"occurred_at"> & {occurred_at?:string},Partial<Audit>>;
  noor_authentication_account_linkages:Table<Link,Link,Partial<Link>>;
  noor_entitlement_grants:Table<Grant,Grant,Partial<Grant>>;
  noor_sessions:Table<Session,Session,Partial<Session>>;
 };Views:Record<string,never>;Functions:Record<string,never>};
}
export type NoorAdminResultR316=Readonly<{status:200|201|400|401|403|404|409|429|503;body?:unknown}>;
export interface NoorAdminAccountManagementR316 {
 execute(operation:"list"|"create"|"delete", token:string|null, payload:unknown):Promise<NoorAdminResultR316>;
}
export interface NoorAdminDepsR316 {
 client:SupabaseClient<NoorAdminDatabaseR316>;
 expectedIssuer:string;
 expectedAudience:string;
 isRuntimeRunning:()=>boolean;
 enabled:boolean;
}
const uuid=(s:unknown):s is string=>typeof s==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const exact=(o:Record<string,unknown>,keys:string[])=>Object.keys(o).sort().join("|")===keys.sort().join("|");
const apps=(a:unknown):a is Array<"noor-personal"|"noor-work">=>Array.isArray(a)&&a.length>0&&a.length<=2&&new Set(a).size===a.length&&a.every(x=>x==="noor-personal"||x==="noor-work");
const okEmail=(v:unknown):v is string=>typeof v==="string"&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v===v.trim();
function jwtClaims(token:string):Record<string,unknown>|null{
 try{const pieces=token.split(".");if(pieces.length!==3)return null;
 const parsed:unknown=JSON.parse(Buffer.from(pieces[1]!,"base64url").toString("utf8"));return obj(parsed)?parsed:null;
 }catch{return null;}
}
export function createNoorAdminAccountManagementR316(d:NoorAdminDepsR316):NoorAdminAccountManagementR316{
 const throttles=new Map<string,{minute:number;count:number}>();
 async function actor(token:string|null):Promise<{id:string}|{status:401|403|404|503|429}>{
  if(!d.enabled)return {status:404};
  if(!d.isRuntimeRunning())return {status:503};
  if(typeof token!=="string"||token.length<100||token.length>8192)return {status:401};
  const claims=jwtClaims(token);
  // The claims have NO authority until Supabase Auth verifies the complete token.
  if(!claims||claims.aal!=="aal2"||claims.iss!==d.expectedIssuer||claims.aud!==d.expectedAudience||
     !uuid(claims.sub)||!uuid(claims.session_id)||typeof claims.exp!=="number"||claims.exp*1000<=Date.now())return {status:403};
  try{
   const verified=await d.client.auth.getUser(token);
   if(verified.error||!verified.data.user||verified.data.user.id!==claims.sub)return {status:401};
   const role=await d.client.from("noor_admin_accounts_r271").select("role,enabled")
     .eq("auth_user_id",verified.data.user.id).limit(2);
   if(role.error||!role.data||role.data.length>1)return {status:503};
   if(role.data[0]?.enabled!==true||role.data[0]?.role!=="super_admin")return {status:403};
   return {id:verified.data.user.id};
  }catch{return {status:503};}
 }
 const audit=async(id:string,outcome:"success"|"failure")=>{
  const r=await d.client.from("noor_admin_audit_r271").update({outcome}).eq("id",id);
  return !r.error;
 };
 async function initiated(requestId:string,actorId:string,action:string,accountId:string):Promise<boolean>{
  const r=await d.client.from("noor_admin_audit_r271").insert({
   id:requestId,actor_auth_user_id:actorId,target_auth_user_id:null,
   action,outcome:"initiated",request_id:requestId,details:{accountId},
  });
  return !r.error;
 }
 async function list(page:number):Promise<NoorAdminResultR316>{
  try{
   const linked=await d.client.from("noor_authentication_account_linkages")
     .select("account_id,subject,user_id").eq("issuer",d.expectedIssuer)
     .order("account_id",{ascending:true}).range((page-1)*20,page*20-1);
   if(linked.error||!linked.data)return {status:503};
   const protectedIds=await d.client.from("noor_admin_accounts_r271").select("auth_user_id");
   if(protectedIds.error||!protectedIds.data)return {status:503};
   const excludes=new Set(protectedIds.data.map(x=>x.auth_user_id));
   const rows=await Promise.all(linked.data.filter(x=>!excludes.has(x.subject)).map(async row=>{
    const [profile,grants]=await Promise.all([
     d.client.auth.admin.getUserById(row.subject),
     d.client.from("noor_entitlement_grants").select("resource_id").eq("account_id",row.account_id)
      .eq("action","access").eq("resource_type","application").is("revoked_at_epoch_ms",null),
    ]);
    if(profile.error||!profile.data.user||grants.error||!grants.data)throw Error("R316_LIST_FAILED");
    const u=profile.data.user;return {
     id:u.id,accountId:row.account_id,email:u.email??"",
     name:typeof u.user_metadata?.name==="string"?u.user_metadata.name:"",
     createdAt:u.created_at,
     applications:grants.data.map(x=>x.resource_id).filter(x=>x==="noor-personal"||x==="noor-work"),
    };
   }));
   return {status:200,body:{page,accounts:rows,hasMore:linked.data.length===20}};
  }catch{return {status:503};}
 }
 async function create(actorId:string,p:Record<string,unknown>):Promise<NoorAdminResultR316>{
  if(!exact(p,["requestId","name","email","password","applications"])||!uuid(p.requestId)||
     typeof p.name!=="string"||p.name.trim().length<2||p.name.length>120||
     !okEmail(p.email)||typeof p.password!=="string"||p.password.length<12||
     p.password.length>128||/[\u0000-\u001f]/.test(p.password)||!apps(p.applications))return {status:400};
  const accountId="noor-account-"+randomUUID();
  if(!await initiated(p.requestId,actorId,"account_create",accountId))return {status:409};
  let userId:string|null=null;
  let linked=false;
  try{
   const created=await d.client.auth.admin.createUser({
    email:p.email.toLowerCase(),password:p.password,email_confirm:true,
    user_metadata:{name:p.name.trim()},
    app_metadata:{noor_managed_account:true},
   });
   if(created.error||!created.data.user||!uuid(created.data.user.id)){
    await audit(p.requestId,"failure");return {status:409};
   }
   userId=created.data.user.id;
   const linkage=await d.client.from("noor_authentication_account_linkages").insert({
    issuer:d.expectedIssuer,subject:userId,account_id:accountId,user_id:userId,
   });
   if(linkage.error)throw Error("R316_LINK_FAILED");
   linked=true;
   const now=Date.now();
   const grants=p.applications.map(application=>({
    id:"grant-"+randomUUID(),account_id:accountId,action:"access",resource_type:"application",
    resource_id:application,granted_at_epoch_ms:now,revoked_at_epoch_ms:null,
   }));
   const entitled=await d.client.from("noor_entitlement_grants").insert(grants);
   if(entitled.error)throw Error("R316_ENTITLE_FAILED");
   if(!await audit(p.requestId,"success"))throw Error("R316_AUDIT_FAILED");
   return {status:201,body:{accountId,userId,email:p.email,applications:p.applications}};
  }catch{
   // Compensating rollback: this UUID was freshly created by THIS request.
   // Any compensation failure is signalled as 503, NEVER claimed successful.
   await d.client.from("noor_entitlement_grants").delete().eq("account_id",accountId);
   if(linked)await d.client.from("noor_authentication_account_linkages").delete()
    .eq("issuer",d.expectedIssuer).eq("account_id",accountId);
   if(userId)await d.client.auth.admin.deleteUser(userId).catch(()=>{});
   await audit(p.requestId,"failure").catch(()=>{});
   return {status:503};
  }
 }
 async function remove(actorId:string,p:Record<string,unknown>):Promise<NoorAdminResultR316>{
  if(!exact(p,["requestId","userId","confirmEmail","confirmation"])||!uuid(p.requestId)||
    !uuid(p.userId)||!okEmail(p.confirmEmail)||p.confirmation!=="DELETE")return {status:400};
  if(actorId===p.userId)return {status:403};
  try{
   const protectedRole=await d.client.from("noor_admin_accounts_r271").select("auth_user_id")
     .eq("auth_user_id",p.userId).limit(1);
   if(protectedRole.error||!protectedRole.data)return {status:503};
   if(protectedRole.data.length)return {status:403};
   const link=await d.client.from("noor_authentication_account_linkages")
    .select("account_id,subject").eq("issuer",d.expectedIssuer).eq("subject",p.userId).limit(2);
   if(link.error||!link.data||link.data.length>1)return {status:503};
   if(!link.data.length)return {status:404};
   const accountId=link.data[0]!.account_id;
   const profile=await d.client.auth.admin.getUserById(p.userId);
   if(profile.error||!profile.data.user)return {status:503};
   if(profile.data.user.email?.toLowerCase()!==p.confirmEmail.toLowerCase())return {status:409};
   if(!await initiated(p.requestId,actorId,"account_delete",accountId))return {status:409};
   const now=Date.now();
   // All live NOOR cookies for this owner fail immediately after revocation.
   const sessions=await d.client.from("noor_sessions").update({revoked_at_epoch_ms:now})
     .eq("account_id",accountId).is("revoked_at_epoch_ms",null);
   if(sessions.error){await audit(p.requestId,"failure");return {status:503};}
   const grants=await d.client.from("noor_entitlement_grants").update({revoked_at_epoch_ms:now})
     .eq("account_id",accountId).is("revoked_at_epoch_ms",null);
   if(grants.error){await audit(p.requestId,"failure");return {status:503};}
   // Soft delete preserves owner data, but removes login ability and credentials.
   const deleted=await d.client.auth.admin.deleteUser(p.userId,true);
   if(deleted.error){await audit(p.requestId,"failure");return {status:503};}
   const unlinked=await d.client.from("noor_authentication_account_linkages").delete()
     .eq("issuer",d.expectedIssuer).eq("subject",p.userId).eq("account_id",accountId);
   if(unlinked.error){await audit(p.requestId,"failure");return {status:503};}
   if(!await audit(p.requestId,"success"))return {status:503};
   return {status:200,body:{deleted:true,personalDataRetained:true}};
  }catch{return {status:503};}
 }
 return Object.freeze({
  async execute(operation,token,payload):Promise<NoorAdminResultR316>{
   const identity=await actor(token);if("status" in identity)return identity;
   if(!obj(payload))return {status:400};
   if(operation==="list"){
    if(!exact(payload,["page"])||!Number.isInteger(payload.page)||
       (payload.page as number)<1||(payload.page as number)>1000)return {status:400};
    return list(payload.page as number);
   }
   const minute=Math.floor(Date.now()/60000),prior=throttles.get(identity.id);
   const count=prior?.minute===minute?prior.count+1:1;
   throttles.set(identity.id,{minute,count});
   if(count>12)return {status:429};
   if(operation==="create")return create(identity.id,payload);
   if(operation==="delete")return remove(identity.id,payload);
   return {status:404};
  },
 });
}
