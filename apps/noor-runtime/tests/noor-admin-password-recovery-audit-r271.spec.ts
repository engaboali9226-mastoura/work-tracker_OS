import assert from "node:assert/strict";
import test from "node:test";
import {NoorPasswordRecoveryAuditAdapterR271} from "../src/noor-admin-password-recovery-audit-r271.js";

test("R271 audit maps platform actor ID to Auth UUID and preserves request correlation",async()=>{
  const events:Array<{actorAuthUserId:string;outcome:string;requestId:string}>=[];
  const adapter=new NoorPasswordRecoveryAuditAdapterR271(
    {findActiveByAccountId:async id=>{
      assert.equal(id,"noor-actor");
      return {authUserId:"11111111-1111-4111-8111-111111111111",enabled:true,role:"super_admin"};
    }},
    {record:async event=>{events.push(event);}},
    "22222222-2222-4222-8222-222222222222",
  );
  for(const outcome of ["initiated","requested"] as const){
    await adapter.record({actorAccountId:"noor-actor",targetAuthUserId:"33333333-3333-4333-8333-333333333333",
      action:"accounts:reset-password",outcome});
  }
  assert.deepEqual(events.map(e=>e.outcome),["initiated","success"]);
  assert.ok(events.every(e=>e.actorAuthUserId==="11111111-1111-4111-8111-111111111111"));
  assert.ok(events.every(e=>e.requestId==="22222222-2222-4222-8222-222222222222"));
});
test("R271 refuses to audit on behalf of a revoked administrator",async()=>{
  let writes=0;
  const adapter=new NoorPasswordRecoveryAuditAdapterR271(
    {findActiveByAccountId:async()=>null},
    {record:async()=>{writes++;}},
  );
  await assert.rejects(()=>adapter.record({actorAccountId:"revoked",targetAuthUserId:"target",
    action:"accounts:reset-password",outcome:"initiated"}),/ACTOR_UNVERIFIED/);
  assert.equal(writes,0);
});
