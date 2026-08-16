import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EntitlementConflictError,
  EntitlementGrant,
  createAuthenticationAccountId,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createEntitlementId,
} from "@worktracker/core";

import {
  NoorEntitlementDatabase,
  SupabasePostgresEntitlementRepository,
} from "../src/authorization/supabase-postgres-entitlement-repository.js";

function constructWithRealSupabaseClient(
  client: SupabaseClient<NoorEntitlementDatabase>,
): SupabasePostgresEntitlementRepository {
  return new SupabasePostgresEntitlementRepository(client);
}

type Row = {
  readonly id: unknown;
  readonly account_id: unknown;
  readonly action: unknown;
  readonly resource_type: unknown;
  readonly resource_id: unknown;
  readonly granted_at_epoch_ms: unknown;
  readonly revoked_at_epoch_ms: unknown;
};

type RecordedRequest = {
  readonly body: string;
  readonly method: string;
  readonly prefer: string | null;
  readonly url: URL;
};

function response(body: object | null, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function providerError(
  message: string,
  details = "",
  code = "PGRST000",
): Response {
  return response({ code, details, hint: "", message }, 400);
}

function createRepository(): {
  readonly client: {
    readonly requests: RecordedRequest[];
    readonly responses: Response[];
  };
  readonly repository: SupabasePostgresEntitlementRepository;
} {
  const requests: RecordedRequest[] = [];
  const responses: Response[] = [];
  const client = createClient<NoorEntitlementDatabase>(
    "https://supabase.test",
    "test-key",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: async (input, init) => {
          const request = new Request(input, init);
          requests.push({
            body: await request.text(),
            method: request.method,
            prefer: request.headers.get("prefer"),
            url: new URL(request.url),
          });
          const nextResponse = responses.shift();

          if (nextResponse === undefined) {
            throw new Error("Unexpected Supabase request; no live network is permitted.");
          }

          return nextResponse;
        },
      },
    },
  );

  return {
    client: { requests, responses },
    repository: new SupabasePostgresEntitlementRepository(client),
  };
}

const grant = EntitlementGrant.create({
  id: createEntitlementId("entitlement-0000000001"),
  accountId: createAuthenticationAccountId("account-0000000000000001"),
  action: createAuthorizationAction("document.read"),
  resourceType: createAuthorizationResourceType("document"),
  resourceId: createAuthorizationResourceId("document-0000000001"),
  grantedAtEpochMs: 1_000,
  revokedAtEpochMs: null,
});

function rowFor(value: EntitlementGrant): Row {
  return {
    id: value.id,
    account_id: value.accountId,
    action: value.action,
    resource_type: value.resourceType,
    resource_id: value.resourceId,
    granted_at_epoch_ms: value.grantedAtEpochMs,
    revoked_at_epoch_ms: value.revokedAtEpochMs,
  };
}

test("create inserts all entitlement fields into noor_entitlement_grants", async () => {
  const { client, repository } = createRepository();
  client.responses.push(response(null, 201));

  await repository.create(grant);

  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0]?.method, "POST");
  assert.equal(client.requests[0]?.url.pathname, "/rest/v1/noor_entitlement_grants");
  assert.equal(client.requests[0]?.prefer, null);
  assert.deepEqual(JSON.parse(client.requests[0]?.body ?? ""), rowFor(grant));
});

test("create maps only ID uniqueness violations to EntitlementConflictError", async () => {
  const idConflict = createRepository();
  idConflict.client.responses.push(providerError(
    "duplicate key value violates unique constraint",
    "Key (id)=(entitlement-0000000001) already exists.",
    "23505",
  ));
  await assert.rejects(idConflict.repository.create(grant), EntitlementConflictError);

  const otherFailure = createRepository();
  otherFailure.client.responses.push(providerError(
    "duplicate key value violates unique constraint",
    "Key (account_id,action)=(account-0000000000000001,document.read) already exists.",
    "23505",
  ));
  await assert.rejects(otherFailure.repository.create(grant));
});

test("findByExactScope constrains the complete scope and returns null for no rows", async () => {
  const { client, repository } = createRepository();
  client.responses.push(response([]));

  assert.equal(await repository.findByExactScope({
    accountId: grant.accountId,
    action: grant.action,
    resourceType: grant.resourceType,
    resourceId: grant.resourceId,
  }), null);
  const request = client.requests[0];
  assert.equal(request?.method, "GET");
  assert.equal(request?.url.pathname, "/rest/v1/noor_entitlement_grants");
  assert.equal(request?.url.searchParams.get("account_id"), `eq.${grant.accountId}`);
  assert.equal(request?.url.searchParams.get("action"), `eq.${grant.action}`);
  assert.equal(request?.url.searchParams.get("resource_type"), `eq.${grant.resourceType}`);
  assert.equal(request?.url.searchParams.get("resource_id"), `eq.${grant.resourceId}`);
  assert.equal(request?.url.searchParams.get("select"), "id,account_id,action,resource_type,resource_id,granted_at_epoch_ms,revoked_at_epoch_ms");
});

test("findByExactScope hydrates active and revoked grants through canonical domain construction", async () => {
  const active = createRepository();
  active.client.responses.push(response([rowFor(grant)]));
  assert.deepEqual(await active.repository.findByExactScope(grant), grant);

  const revoked = EntitlementGrant.create({ ...grant, revokedAtEpochMs: 1_500 });
  const revokedCandidate = createRepository();
  revokedCandidate.client.responses.push(response([rowFor(revoked)]));
  assert.deepEqual(await revokedCandidate.repository.findByExactScope(grant), revoked);
});

test("findByExactScope rejects malformed rows, ambiguity, and provider failures", async () => {
  const malformed = createRepository();
  malformed.client.responses.push(response([{ ...rowFor(grant), id: "invalid" }]));
  await assert.rejects(malformed.repository.findByExactScope(grant));

  const ambiguous = createRepository();
  ambiguous.client.responses.push(response([rowFor(grant), rowFor(grant)]));
  await assert.rejects(ambiguous.repository.findByExactScope(grant));

  const providerFailure = createRepository();
  providerFailure.client.responses.push(providerError("query failed"));
  await assert.rejects(providerFailure.repository.findByExactScope(grant));
});

test("revoke conditionally updates an unrevoked entitlement by ID only", async () => {
  const { client, repository } = createRepository();
  client.responses.push(response(null));

  await repository.revoke(grant.id, 1_500);

  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0]?.method, "PATCH");
  assert.equal(client.requests[0]?.url.searchParams.get("id"), `eq.${grant.id}`);
  assert.equal(client.requests[0]?.url.searchParams.get("revoked_at_epoch_ms"), "is.null");
  assert.deepEqual(JSON.parse(client.requests[0]?.body ?? ""), { revoked_at_epoch_ms: 1_500 });
});

test("revoke accepts zero matches and rejects provider failure", async () => {
  const zeroMatches = createRepository();
  zeroMatches.client.responses.push(response(null));
  await assert.doesNotReject(zeroMatches.repository.revoke(grant.id, 1_500));

  const providerFailure = createRepository();
  providerFailure.client.responses.push(providerError("update failed"));
  await assert.rejects(providerFailure.repository.revoke(grant.id, 1_500));
});
