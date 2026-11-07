import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleAdminAccountsR271} from "../src/noor-admin-http-r271.js";

test("R271 admin list refuses method confusion and nonempty request bodies", async () => {
  let origin = "";
  let lookups = 0;
  const server = createServer((request, response) => {
    void handleAdminAccountsR271(request, response, "valid", {
      expectedOrigin: origin,
      resolveAuthority: async () => {
        lookups++;
        return {sessionActive:true, accountActive:true, verifiedAdminGrant:true,
          assuranceLevel:"aal2", reauthenticated:true};
      },
      listAccounts: async () => [],
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw Error("LOOPBACK_UNAVAILABLE");
  origin = "http://127.0.0.1:" + address.port;
  try {
    const get = await fetch(origin + "/api/noor/admin/accounts", {method:"GET"});
    assert.equal(get.status, 405);
    const body = await fetch(origin + "/api/noor/admin/accounts", {
      method:"POST", headers:{Origin:origin,"Content-Type":"application/json"},
      body: JSON.stringify({action:"delete-all"}),
    });
    assert.equal(body.status, 400);
    assert.equal(lookups, 0);
  } finally {
    server.close();
    await once(server, "close");
  }
});
