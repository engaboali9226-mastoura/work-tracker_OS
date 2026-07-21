import assert from "node:assert/strict";
import test from "node:test";

import * as core from "@worktracker/core";
import * as application from "../src/index.js";

test("approved Authorization and Entitlements symbols are public", () => {
  const requiredCoreSymbols = [
    "createEntitlementId",
    "createAuthorizationAction",
    "createAuthorizationResourceType",
    "createAuthorizationResourceId",
    "EntitlementGrant",
    "InvalidAuthorizationRequestError",
    "AuthorizationDeniedError",
    "EntitlementConflictError",
    "AuthorizationUnavailableError",
  ];

  const requiredApplicationSymbols = [
    "Authorize",
    "GrantEntitlement",
    "RevokeEntitlement",
  ];

  for (const symbol of requiredCoreSymbols) {
    assert.equal(
      symbol in core,
      true,
      `Missing Core export: ${symbol}`,
    );
  }

  for (const symbol of requiredApplicationSymbols) {
    assert.equal(
      symbol in application,
      true,
      `Missing Application export: ${symbol}`,
    );
  }
});

test("deferred transport, provider and policy symbols remain absent", () => {
  const prohibitedSymbols = [
    "RoleRepository",
    "PolicyEngine",
    "AuthorizationMiddleware",
    "JwtAuthorization",
    "HttpAuthorization",
    "SqlEntitlementRepository",
    "PrismaEntitlementRepository",
    "UserContextProvider",
  ];

  for (const symbol of prohibitedSymbols) {
    assert.equal(
      symbol in core,
      false,
      `Unexpected Core export: ${symbol}`,
    );

    assert.equal(
      symbol in application,
      false,
      `Unexpected Application export: ${symbol}`,
    );
  }
});
