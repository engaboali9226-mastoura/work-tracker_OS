/**
 * R272: one-time, server-only invitation to the independently approved owner
 * mailbox. NO admin role, Noor account linkage or entitlement is created here.
 * The mailbox owner must accept the invitation and verify MFA separately.
 * Do not print emails, tokens, Auth IDs, credentials or service keys.
 */
import {createClient} from '@supabase/supabase-js';

const APPROVED_EMAIL='eng92fa64@gmail.com';

export async function provisionAdminInvitationR272(env=process.env,clientFactory=createClient){
  if(env.NOOR_ADMIN_INVITE_CREATE_ONCE!=='YES')return 'disabled';
  const email=env.NOOR_ADMIN_INVITE_EMAIL?.trim().toLowerCase();
  const projectUrl=env.SUPABASE_URL;
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  const publicOrigin=env.NOOR_PUBLIC_ORIGIN;
  let url,origin;
  try{
    url=new URL(projectUrl);
    origin=new URL(publicOrigin);
  }catch{throw Error('ADMIN_INVITE_CONFIG_DENIED');}
  if(email!==APPROVED_EMAIL ||
     url.protocol!=='https:' || !url.hostname.endsWith('.supabase.co') ||
     url.username || url.password || url.search || url.hash ||
     origin.protocol!=='https:' || origin.origin!==publicOrigin ||
     !key || typeof key!=='string' || key.length>8192 ||
     key.startsWith('sb_publishable_'))
    throw Error('ADMIN_INVITE_CONFIG_DENIED');

  const client=clientFactory(url.origin,key,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  let matching=0;
  for(let page=1;page<=10;page++){
    const result=await client.auth.admin.listUsers({page,perPage:100});
    if(result.error || !Array.isArray(result.data?.users))
      throw Error('ADMIN_INVITE_LIST_UNAVAILABLE');
    matching+=result.data.users.filter(user=>
      typeof user.email==='string' && user.email.toLowerCase()===email
    ).length;
    if(matching>1)throw Error('ADMIN_INVITE_DUPLICATE_IDENTITY');
    if(result.data.users.length<100){
      if(matching===1)return 'existing_identity_no_changes';
      const invited=await client.auth.admin.inviteUserByEmail(email,{
        redirectTo:publicOrigin+'/admin',
      });
      if(invited.error || !invited.data?.user || invited.data.user.email?.toLowerCase()!==email)
        throw Error('ADMIN_INVITE_DELIVERY_UNAVAILABLE');
      return 'invitation_requested_no_grants';
    }
  }
  // Never invite when the full identity directory could not be inspected.
  throw Error('ADMIN_INVITE_LIST_PAGINATION_UNAVAILABLE');
}
