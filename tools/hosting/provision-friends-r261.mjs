/**
 * NOOR R261: one-shot provisioning of named, isolated demo identities.
 * Only the trusted Render server can use Supabase Auth Admin API.
 * Passwords are environment secrets and NEVER logged or committed to source.
 * Creates Auth identities only; each requires a distinct owner-scoped Noor
 * linkage, entitlement and location/policy foundation before use.
 */
import {createClient} from '@supabase/supabase-js';

const specs=Object.freeze([
  {key:'abusufyan',email:'abusufyan@noor.com',passwordKey:'NOOR_FRIEND_ABUSUFYAN_PASSWORD',shared:false},
  {key:'abdulghani',email:'abdulghani@noor.com',passwordKey:'NOOR_FRIEND_ABDULGHANI_PASSWORD',shared:false},
  {key:'noor',email:'noor@noor.com',passwordKey:'NOOR_FRIEND_NOOR_PASSWORD',shared:true},
]);

export async function provisionFriendsOnce(env=process.env){
  if(env.NOOR_INVITE_CREATE_ONCE!=='YES') return 'disabled';
  const url=env.SUPABASE_URL;
  const serviceRoleKey=env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey=env.VITE_NOOR_SUPABASE_PUBLISHABLE_KEY;
  if(typeof url!=='string'||!url.startsWith('https://')||typeof serviceRoleKey!=='string'||!serviceRoleKey||
     typeof publishableKey!=='string'||!publishableKey)throw Error('FRIENDS_CONFIG_INVALID');
  // Fail before any write unless all three credentials are present and distinct.
  const passwords=specs.map(s=>env[s.passwordKey]);
  if(passwords.some(p=>typeof p!=='string'||p.length<6)||
     new Set(passwords).size!==specs.length)throw Error('FRIENDS_PASSWORD_CONFIG_INVALID');
  const admin=createClient(url,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:100});
  if(error||!Array.isArray(data?.users)||data.users.length>=100)throw Error('FRIENDS_ADMIN_LOOKUP_FAILED');
  // Prevent adopting any unrelated existing identity.
  for(const s of specs){
    const matches=data.users.filter(u=>u.email?.toLowerCase()===s.email);
    if(matches.length>1)throw Error('FRIENDS_IDENTITY_AMBIGUOUS');
    if(matches[0]&&(matches[0].app_metadata?.noor_demo_reviewer!==true||
       matches[0].app_metadata?.noor_invite_key!==s.key))throw Error('FRIENDS_IDENTITY_ALREADY_OCCUPIED');
  }
  const publicAuth=createClient(url,publishableKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const statuses=[];
  for(const s of specs){
    const password=env[s.passwordKey];
    let user=data.users.find(u=>u.email?.toLowerCase()===s.email);
    let created=false;
    if(!user){
      const result=await admin.auth.admin.createUser({
        email:s.email,password,email_confirm:true,
        app_metadata:{noor_demo_reviewer:true,noor_invite_key:s.key,noor_shared_demo:s.shared},
      });
      if(result.error||!result.data?.user)throw Error('FRIENDS_CREATE_FAILED_'+s.key);
      user=result.data.user;created=true;
    }
    if(user.app_metadata?.noor_demo_reviewer!==true||
      user.app_metadata?.noor_invite_key!==s.key)throw Error('FRIENDS_MARKER_MISMATCH_'+s.key);
    const check=await publicAuth.auth.signInWithPassword({email:s.email,password});
    if(check.error||!check.data?.session||check.data.user?.id!==user.id)
      throw Error('FRIENDS_LOGIN_FAILED_'+s.key);
    await publicAuth.auth.signOut();
    statuses.push(s.key+':'+(created?'created':'existing')+'_verified');
  }
  return statuses.join(',');
}
