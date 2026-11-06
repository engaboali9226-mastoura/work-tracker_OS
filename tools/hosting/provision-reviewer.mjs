/**
 * R260: one-time, opt-in, server-only reviewer Auth bootstrap.
 * Runs exclusively on the trusted Render host when NOOR_REVIEWER_CREATE_ONCE=YES.
 * Email/password and the service-role key live in Render secrets, never in Git.
 * NO application entitlements are granted here; operator creates a separate
 * owner-scoped Noor linkage only after authenticating the new account.
 */
import {createClient} from '@supabase/supabase-js';

export async function provisionReviewerAuthOnce(env=process.env){
  if(env.NOOR_REVIEWER_CREATE_ONCE!=='YES')return 'disabled';
  const email=env.NOOR_REVIEWER_EMAIL?.trim().toLowerCase();
  const password=env.NOOR_REVIEWER_PASSWORD;
  const url=env.SUPABASE_URL;
  const serviceRoleKey=env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey=env.VITE_NOOR_SUPABASE_PUBLISHABLE_KEY;
  if(!email||email!=='diaa@noor.com'||typeof password!=='string'||password.length<8
    ||typeof url!=='string'||!url.startsWith('https://')
    ||typeof serviceRoleKey!=='string'||!serviceRoleKey
    ||typeof publishableKey!=='string'||!publishableKey)throw Error('REVIEWER_BOOTSTRAP_CONFIGURATION_INVALID');
  const admin=createClient(url,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const {data:users,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:100});
  if(listError||!Array.isArray(users?.users))throw Error('REVIEWER_ADMIN_LOOKUP_FAILED');
  const matches=users.users.filter(user=>user.email?.toLowerCase()===email);
  if(matches.length>1)throw Error('REVIEWER_EMAIL_AMBIGUOUS');
  let target=matches[0];
  if(target && target.app_metadata?.noor_demo_reviewer!==true)throw Error('REVIEWER_EMAIL_ALREADY_OCCUPIED');
  const created=!target;
  if(!target){
    const response=await admin.auth.admin.createUser({
      email,password,email_confirm:true,
      app_metadata:{noor_demo_reviewer:true},
    });
    if(response.error||!response.data?.user)throw Error('REVIEWER_AUTH_CREATION_FAILED');
    target=response.data.user;
  }
  if(target.app_metadata?.noor_demo_reviewer!==true)throw Error('REVIEWER_MARKER_MISSING');
  const browserClient=createClient(url,publishableKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const check=await browserClient.auth.signInWithPassword({email,password});
  if(check.error||!check.data?.session||check.data.user?.id!==target.id)throw Error('REVIEWER_AUTH_SIGNIN_VERIFICATION_FAILED');
  await browserClient.auth.signOut();
  return created?'created_and_signin_verified':'existing_and_signin_verified';
}
