import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createAuthenticationAccountId,
  createSessionId,
  createSessionSnapshot,
  InvalidSessionRequestError,
  type SessionSnapshot,
} from "@worktracker/core";

import {
  NoorSessionDatabase,
  SupabasePostgresSessionRepository,
} from "../src/session/supabase-postgres-session-repository.js";

function constructWithRealSupabaseClient(
  client: SupabaseClient<NoorSessionDatabase>,
): SupabasePostgresSessionRepository {
  return new SupabasePostgresSessionRepository(client);
}

type Row = {
  readonly id: unknown;
  readonly account_id: unknown;
  readonly created_at_epoch_ms: unknown;
  readonly expires_at_epoch_ms: unknown;
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

function createRepository(): {
  readonly client: {
    readonly requests: RecordedRequest[];
    readonly responses: Response[];
  };
  readonly repository: SupabasePostgresSessionRepository;
} {
  const requests: RecordedRequest[] = [];
  const responses: Response[] = [];
  const client = createClient<NoorSessionDatabase>(
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
            throw new Error("Unexpected Supabase request.");
          }

          return nextResponse;
        },
      },
    },
  );

  return {
    client: { requests, responses },
    repository: new SupabasePostgresSessionRepository(client),
  };
}

const session = createSessionSnapshot({
  id: createSessionId("session-0000000001"),
  accountId: createAuthenticationAccountId("account-0000000000000001"),
  createdAtEpochMs: 1_000,
  expiresAtEpochMs: 2_000,
  revokedAtEpochMs: null,
});

function rowFor(snapshot: SessionSnapshot): Row {
  return {
    id: snapshot.id,
    account_id: snapshot.accountId,
    created_at_epoch_ms: snapshot.createdAtEpochMs,
    expires_at_epoch_ms: snapshot.expiresAtEpochMs,
    revoked_at_epoch_ms: snapshot.revokedAtEpochMs,
  };
}

function providerError(message: string): Response {
  return response({
    code: "PGRST000",
    details: "",
    hint: "",
    message,
  }, 400);
}

test("create inserts the exact snapshot using noor_sessions", async () => {
  const { client, repository } = createRepository();
  client.responses.push(response(null, 201));

  await repository.create(session);

  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0]?.method, "POST");
  assert.equal(client.requests[0]?.url.pathname, "/rest/v1/noor_sessions");
  assert.equal(client.requests[0]?.prefer, null);
  assert.deepEqual(JSON.parse(client.requests[0]?.body ?? ""), {
    id: session.id,
    account_id: session.accountId,
    created_at_epoch_ms: session.createdAtEpochMs,
    expires_at_epoch_ms: session.expiresAtEpochMs,
    revoked_at_epoch_ms: session.revokedAtEpochMs,
  });
});

test("create propagates provider errors including duplicate inserts", async () => {
  const { client, repository } = createRepository();
  client.responses.push(providerError("duplicate key"));

  await assert.rejects(repository.create(session));
});

test("findById filters by exact id, selects exact columns, and returns null when absent", async () => {
  const { client, repository } = createRepository();
  client.responses.push(response([]));

  assert.equal(await repository.findById(session.id), null);
  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0]?.method, "GET");
  assert.equal(client.requests[0]?.url.pathname, "/rest/v1/noor_sessions");
  assert.equal(client.requests[0]?.url.searchParams.get("id"), `eq.${session.id}`);
  assert.equal(
    client.requests[0]?.url.searchParams.get("select"),
    "id,account_id,created_at_epoch_ms,expires_at_epoch_ms,revoked_at_epoch_ms",
  );
});

test("findById maps active and revoked rows exactly", async () => {
  const active = createRepository();
  active.client.responses.push(response([rowFor(session)]));

  assert.deepEqual(await active.repository.findById(session.id), session);

  const revoked = createSessionSnapshot({ ...session, revokedAtEpochMs: 1_500 });
  const revokedRepository = createRepository();
  revokedRepository.client.responses.push(response([rowFor(revoked)]));

  assert.deepEqual(await revokedRepository.repository.findById(session.id), revoked);
});

test("findById rejects malformed and multiple rows and propagates query errors", async () => {
  const malformedId = createRepository();
  malformedId.client.responses.push(response([{ ...rowFor(session), id: "invalid" }]));
  await assert.rejects(malformedId.repository.findById(session.id), InvalidSessionRequestError);

  const malformedAccount = createRepository();
  malformedAccount.client.responses.push(response([{ ...rowFor(session), account_id: " account " }]));
  await assert.rejects(malformedAccount.repository.findById(session.id), TypeError);

  const malformedEpoch = createRepository();
  malformedEpoch.client.responses.push(response([{
    ...rowFor(session),
    created_at_epoch_ms: Number.MAX_SAFE_INTEGER + 1,
  }]));
  await assert.rejects(malformedEpoch.repository.findById(session.id), InvalidSessionRequestError);

  const multipleRows = createRepository();
  multipleRows.client.responses.push(response([rowFor(session), rowFor(session)]));
  await assert.rejects(multipleRows.repository.findById(session.id));

  const providerFailure = createRepository();
  providerFailure.client.responses.push(providerError("query failed"));
  await assert.rejects(providerFailure.repository.findById(session.id));
});

test("revoke conditionally updates only an unrevoked record without reading", async () => {
  const { client, repository } = createRepository();
  client.responses.push(response(null));

  await repository.revoke({ id: session.id, revokedAtEpochMs: 1_500 });

  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0]?.method, "PATCH");
  assert.equal(client.requests[0]?.url.searchParams.get("id"), `eq.${session.id}`);
  assert.equal(client.requests[0]?.url.searchParams.get("revoked_at_epoch_ms"), "is.null");
  assert.deepEqual(JSON.parse(client.requests[0]?.body ?? ""), {
    revoked_at_epoch_ms: 1_500,
  });
});

test("revoke accepts zero matches and propagates provider errors", async () => {
  const zeroMatches = createRepository();
  zeroMatches.client.responses.push(response(null));
  await assert.doesNotReject(zeroMatches.repository.revoke({
    id: session.id,
    revokedAtEpochMs: 1_500,
  }));

  const providerFailure = createRepository();
  providerFailure.client.responses.push(providerError("update failed"));
  await assert.rejects(providerFailure.repository.revoke({
    id: session.id,
    revokedAtEpochMs: 1_500,
  }));
});
