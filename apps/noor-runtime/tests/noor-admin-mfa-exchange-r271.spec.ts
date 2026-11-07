import assert from "node:assert/strict";
import test from "node:test";
import {NoorAdminMfaExchangeR271} from "../src/noor-admin-mfa-exchange-r271.js";

test("R271 verified TOTP proof is sent only to the same-origin admin exchange route",async()=>{
  const calls:string[]=[];
  const exchange=new NoorAdminMfaExchangeR271(
    {verifyTotp:async()=>{calls.push("verified");return "signed-aal2-token";}},
    {post:async(path,body)=>{assert.equal(body.accessToken,"signed-aal2-token");calls.push(path);return {status:204};}},
  );
  await exchange.authenticate("factor","123456");
  await exchange.renew("factor","123456");
  assert.deepEqual(calls,["verified","/api/noor/admin/authenticate","verified","/api/noor/admin/renew"]);
});
test("R271 invalid challenge or rejected server binding never reports authentication success",async()=>{
  let posts=0;
  const failed=new NoorAdminMfaExchangeR271(
    {verifyTotp:async()=>{throw Error("invalid TOTP");}},
    {post:async()=>{posts++;return {status:204};}},
  );
  await assert.rejects(failed.authenticate("factor","000000"),/invalid TOTP/);
  assert.equal(posts,0);
  const rejected=new NoorAdminMfaExchangeR271(
    {verifyTotp:async()=> "signed-token"},
    {post:async()=>({status:403})},
  );
  await assert.rejects(rejected.authenticate("factor","123456"),/NOOR_ADMIN_MFA_BINDING_DENIED/);
  await assert.rejects(rejected.renew("factor","123456"),/NOOR_ADMIN_MFA_RENEWAL_DENIED/);
});

test("R271 concurrent MFA exchanges are blocked and failures release the guard",async()=>{
  let release!:()=>void;
  let calls=0;
  const pending=new Promise<void>(resolve=>{release=resolve;});
  const exchange=new NoorAdminMfaExchangeR271(
    {verifyTotp:async()=>{calls++;await pending;return "signed-token";}},
    {post:async()=>({status:204})},
  );
  const first=exchange.authenticate("factor","123456");
  await assert.rejects(exchange.renew("factor","123456"),/NOOR_ADMIN_MFA_EXCHANGE_IN_PROGRESS/);
  assert.equal(calls,1);
  release();
  await first;
  await exchange.renew("factor","123456");
  assert.equal(calls,2);
});
