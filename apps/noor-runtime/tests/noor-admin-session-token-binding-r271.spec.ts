import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminSessionTokenBindingR271} from "../src/noor-admin-session-token-binding-r271.js";
const id="11111111-1111-4111-8111-111111111111";
const authSession="22222222-2222-4222-8222-222222222222";
const initial=1794060000000;
const fixture={platformSessionId:"noor-session",platformAccountId:"account-one",
  authUserId:id,authSessionId:authSession,accessToken:"verified-access-token",
  expiresAtMs:initial+120000};
test("R271 server-side Auth token binding is short-lived, scoped and revocable",async()=>{
  let now=initial;
  const store=new NoorAdminSessionTokenBindingR271(()=>now);
  assert.equal(store.bind(fixture),true);
  assert.equal(await store.getAccessTokenForSession("noor-session"),"verified-access-token");
  assert.equal(await store.getAccessTokenForSession("another-session"),null);
  assert.deepEqual(await store.getBindingForSession("noor-session"),{
    platformAccountId:"account-one",authUserId:id,authSessionId:authSession,
  });
  assert.equal(store.bind({...fixture,authUserId:authSession}),false);
  now+=120001;
  assert.equal(await store.getAccessTokenForSession("noor-session"),null);
  assert.equal(store.bind({...fixture,expiresAtMs:now+60000}),true);
  store.revoke("noor-session");
  assert.equal(await store.getAccessTokenForSession("noor-session"),null);
});
test("R271 refuses malformed, stale and long-lived bindings",async()=>{
  const store=new NoorAdminSessionTokenBindingR271(()=>initial);
  for(const invalid of [
    {...fixture,platformSessionId:""},
    {...fixture,authUserId:"not-uuid"},
    {...fixture,authSessionId:"not-uuid"},
    {...fixture,accessToken:""},
    {...fixture,expiresAtMs:initial-1},
    {...fixture,expiresAtMs:initial+300001},
  ])assert.equal(store.bind(invalid),false);
  assert.equal(await store.getAccessTokenForSession("noor-session"),null);
});
test("R271 revocation clears all Auth session bindings",async()=>{
  const store=new NoorAdminSessionTokenBindingR271(()=>initial);
  assert.equal(store.bind(fixture),true);
  store.revokeAll();
  assert.equal(await store.getAccessTokenForSession("noor-session"),null);
});
