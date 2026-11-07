import assert from "node:assert/strict";
import test from "node:test";
import {inviteNoorAdminCandidateR271} from "../src/noor-admin-invitation-r271.js";

const authority = {
  sessionActive:true, accountActive:true, verifiedAdminGrant:true,
  assuranceLevel:"aal2" as const, reauthenticated:true,
};
test("R271 invitation never sends email without verified privileged authority", async () => {
  let calls = 0;
  const result = await inviteNoorAdminCandidateR271({
    actorAccountId:"actor", email:"candidate@example.org",
    authority:{...authority, verifiedAdminGrant:false},
  }, {
    provider:{inviteUserByEmail:async () => {calls++;return {userId:"id",error:null};}},
    audit:{record:async () => {calls++;}},
  });
  assert.equal(result.kind,"denied");
  assert.equal(calls,0);
});

test("R271 invitation audits verified identity and never assigns admin role", async () => {
  const events:string[]=[];
  const result = await inviteNoorAdminCandidateR271({
    actorAccountId:"actor",email:"Candidate@Example.org",authority,
  }, {
    provider:{inviteUserByEmail:async email => {
      events.push("invite:"+email);return {userId:"auth-uuid",error:null};
    }},
    audit:{record:async input => {events.push("audit:"+input.invitedUserId);}},
  });
  assert.deepEqual(events,["invite:candidate@example.org","audit:auth-uuid"]);
  assert.deepEqual(result,{kind:"invited",userId:"auth-uuid"});
});

test("R271 invitation fails closed on audit error",async () => {
  const result = await inviteNoorAdminCandidateR271({
    actorAccountId:"actor",email:"candidate@example.org",authority,
  },{
    provider:{inviteUserByEmail:async()=>({userId:"auth-uuid",error:null})},
    audit:{record:async()=>{throw Error("audit unavailable");}},
  });
  assert.deepEqual(result,{kind:"unavailable"});
});
