import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeAdminActionR271,
  mayDisableAdminAccountR271,
  type AdminAuthorityR271,
} from "../src/noor-admin-policy-r271.js";

const valid: AdminAuthorityR271 = {
  sessionActive: true,
  accountActive: true,
  verifiedAdminGrant: true,
  assuranceLevel: "aal2",
  reauthenticated: true,
};

test("R271 denies missing, revoked, inactive, ungranted and weak-MFA authorities", () => {
  assert.equal(authorizeAdminActionR271(null, "accounts:list"), false);
  for (const authority of [
    {...valid, sessionActive: false},
    {...valid, accountActive: false},
    {...valid, verifiedAdminGrant: false},
    {...valid, assuranceLevel: "aal1" as const},
    {...valid, assuranceLevel: null},
  ]) {
    assert.equal(authorizeAdminActionR271(authority, "accounts:list"), false);
  }
});

test("R271 requires fresh reauthentication for sensitive operations", () => {
  const stale = {...valid, reauthenticated: false};
  assert.equal(authorizeAdminActionR271(stale, "accounts:list"), true);
  for (const action of ["accounts:delete", "accounts:reset-password", "entitlements:manage"] as const) {
    assert.equal(authorizeAdminActionR271(stale, action), false);
    assert.equal(authorizeAdminActionR271(valid, action), true);
  }
});

test("R271 protects the actor and last active super-admin", () => {
  const input = {
    actorAccountId: "actor",
    targetAccountId: "target",
    activeSuperAdminCount: 1,
    targetIsSuperAdmin: true,
  };
  assert.equal(mayDisableAdminAccountR271(input), false);
  assert.equal(mayDisableAdminAccountR271({...input, activeSuperAdminCount: 2}), true);
  assert.equal(mayDisableAdminAccountR271({...input, targetIsSuperAdmin: false}), true);
  assert.equal(mayDisableAdminAccountR271({...input, targetAccountId: "actor"}), false);
  assert.equal(mayDisableAdminAccountR271({...input, activeSuperAdminCount: 0}), false);
});
