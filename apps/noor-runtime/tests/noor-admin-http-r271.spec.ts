import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleAdminAccountsR271, type AdminHttpDependenciesR271} from "../src/noor-admin-http-r271.js";

const authority = {
  sessionActive: true, accountActive: true, verifiedAdminGrant: true,
  assuranceLevel: "aal2" as const, reauthenticated: false,
  role: "admin" as const,
};
async function serve(
  callback: (origin: string) => Promise<void>,
  resolve: AdminHttpDependenciesR271["resolveAuthority"],
) {
  let origin = "";
  let reads = 0;
  const server = createServer((req, res) => {
    void handleAdminAccountsR271(req, res, req.headers.cookie === "noor_session=valid" ? "valid" : null, {
      expectedOrigin: origin, resolveAuthority: resolve,
      listAccounts: async () => {reads++; return [{id:"one", email:"example@test.invalid", enabled:true}];},
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw Error("LOOPBACK_UNAVAILABLE");
  origin = "http://127.0.0.1:" + address.port;
  try { await callback(origin); } finally {server.close(); await once(server, "close");}
  return reads;
}
const call = (origin: string, options: {origin?: string; cookie?: string; method?: string} = {}) =>
  fetch(origin + "/api/noor/admin/accounts", {
    method: options.method ?? "POST",
    headers: {
      Origin: options.origin ?? origin,
      ...(options.cookie ? {Cookie: options.cookie} : {}),
    },
  });

test("R271 rejects anonymous sessions without consulting authority", async () => {
  let checked = 0;
  const reads = await serve(async origin => {
    assert.equal((await call(origin)).status, 401);
  }, async () => {checked++; return authority;});
  assert.equal(checked, 0);
  assert.equal(reads, 0);
});

test("R271 rejects ordinary accounts, invalid MFA, and revoked sessions", async () => {
  for (const denied of [
    null,
    {...authority, verifiedAdminGrant: false},
    {...authority, assuranceLevel: "aal1" as const},
    {...authority, sessionActive: false},
  ]) {
    const reads = await serve(async origin => {
      assert.equal((await call(origin, {cookie:"noor_session=valid"})).status, 403);
    }, async () => denied);
    assert.equal(reads, 0);
  }
});

test("R271 rejects cross-origin requests and backend failures", async () => {
  let checked = 0;
  const reads = await serve(async origin => {
    assert.equal((await call(origin, {cookie:"noor_session=valid", origin:"https://evil.example"})).status, 403);
    assert.equal((await call(origin, {cookie:"noor_session=valid"})).status, 503);
  }, async () => {checked++; throw Error("offline");});
  assert.equal(checked, 1);
  assert.equal(reads, 0);
});

test("R271 allows verified admin to list accounts with no-store response", async () => {
  const reads = await serve(async origin => {
    const response = await call(origin, {cookie:"noor_session=valid"});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json()).accounts.length, 1);
  }, async () => authority);
  assert.equal(reads, 1);
});
