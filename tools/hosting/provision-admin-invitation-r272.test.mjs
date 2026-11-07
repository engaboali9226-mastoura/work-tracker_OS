import assert from 'node:assert/strict';
import test from 'node:test';
import {provisionAdminInvitationR272} from './provision-admin-invitation-r272.mjs';

const approved={
 NOOR_ADMIN_INVITE_CREATE_ONCE:'YES',
 NOOR_ADMIN_INVITE_EMAIL:'eng92fa64@gmail.com',
 SUPABASE_URL:'https://example.supabase.co',
 SUPABASE_SERVICE_ROLE_KEY:'test-service-credential',
 NOOR_PUBLIC_ORIGIN:'https://noor-personal.onrender.com',
};
test('R272 refuses unapproved mailbox and disabled invocation without any Auth writes',async()=>{
 let clients=0;
 const factory=()=>{clients++;throw Error('should not be called');};
 assert.equal(await provisionAdminInvitationR272({},factory),'disabled');
 await assert.rejects(provisionAdminInvitationR272({
   ...approved,NOOR_ADMIN_INVITE_EMAIL:'other@example.invalid',
 },factory),/ADMIN_INVITE_CONFIG_DENIED/);
 assert.equal(clients,0);
});
test('R272 only sends approved invitation with safe admin callback and no role',async()=>{
 const calls=[];
 const clientFactory=(_url,_key,options)=>{
  assert.equal(options.auth.persistSession,false);
  return {auth:{admin:{
   listUsers:async()=>({data:{users:[]},error:null}),
   inviteUserByEmail:async(email,opts)=>{
    calls.push({email,opts});
    return {data:{user:{email,id:'synthetic-user'}},error:null};
   },
  }}};
 };
 assert.equal(await provisionAdminInvitationR272(approved,clientFactory),
   'invitation_requested_no_grants');
 assert.deepEqual(calls,[{email:approved.NOOR_ADMIN_INVITE_EMAIL,
   opts:{redirectTo:'https://noor-personal.onrender.com/admin'}}]);
});
test('R272 existing Auth identity is never re-invited or promoted',async()=>{
 let invites=0;
 const clientFactory=()=>({auth:{admin:{
  listUsers:async()=>({data:{users:[{email:approved.NOOR_ADMIN_INVITE_EMAIL}]},error:null}),
  inviteUserByEmail:async()=>{invites++;throw Error('should not be called');},
 }}});
 assert.equal(await provisionAdminInvitationR272(approved,clientFactory),
   'existing_identity_no_changes');
 assert.equal(invites,0);
});
test('R272 unknown directory size and failed invite deny without fallback',async()=>{
 const clientFactory=()=>({auth:{admin:{
  listUsers:async()=>({data:{users:[]},error:null}),
  inviteUserByEmail:async()=>({data:{user:null},error:{message:'auth unavailable'}}),
 }}});
 await assert.rejects(provisionAdminInvitationR272(approved,clientFactory),
   /ADMIN_INVITE_DELIVERY_UNAVAILABLE/);
});
