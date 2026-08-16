import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

import {
  NoorAuthenticationAccountLinkageDatabase,
  SupabasePostgresAuthenticationAccountLinkageResolver,
} from "../src/authentication/supabase-postgres-authentication-account-linkage-resolver.js";

import {
  VerifiedExternalIdentity,
} from "../src/authentication/verified-external-identity.js";

type Row = {
  readonly issuer: unknown;
  readonly subject: unknown;
  readonly account_id: unknown;
  readonly user_id: unknown;
};

type RecordedRequest = {
  readonly method: string;
  readonly url: URL;
};

function response(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function providerError(message: string): Response {
  return response({
    code: "PGRST000",
    details: "",
    hint: "",
    message,
  }, 400);
}

function createResolver(): {
  readonly requests: RecordedRequest[];
  readonly responses: Response[];
  readonly resolver: SupabasePostgresAuthenticationAccountLinkageResolver;
} {
  const requests: RecordedRequest[] = [];
  const responses: Response[] = [];
  const client = createClient<NoorAuthenticationAccountLinkageDatabase>(
    "https://supabase.test",
    "test-key",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: async (input, init) => {
          const request = new Request(input, init);
          requests.push({
            method: request.method,
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
    requests,
    responses,
    resolver: new SupabasePostgresAuthenticationAccountLinkageResolver(client),
  };
}

function identity(
  issuer = "https://issuer.example/tenant-a",
  subject = "subject-a",
): VerifiedExternalIdentity {
  return VerifiedExternalIdentity.create(issuer, subject);
}

function rowFor(
  externalIdentity: VerifiedExternalIdentity,
): Row {
  return {
    issuer: externalIdentity.issuer,
    subject: externalIdentity.subject,
    account_id: "account-0000000001",
    user_id: "user-0000000001",
  };
}

function assertExactReadOnlyLookup(
  request: RecordedRequest | undefined,
  externalIdentity: VerifiedExternalIdentity,
): void {
  assert.equal(request?.method, "GET");
  assert.equal(request?.url.pathname, "/rest/v1/noor_authentication_account_linkages");
  assert.equal(request?.url.searchParams.get("issuer"), `eq.${externalIdentity.issuer}`);
  assert.equal(request?.url.searchParams.get("subject"), `eq.${externalIdentity.subject}`);
  assert.equal(request?.url.searchParams.get("select"), "issuer,subject,account_id,user_id");
}

test("resolves exactly one linkage using both issuer and subject read-only predicates", async () => {
  const candidate = createResolver();
  const externalIdentity = identity();
  candidate.responses.push(response([rowFor(externalIdentity)]));

  const linkage = await candidate.resolver.resolve(externalIdentity);

  assert.equal(linkage?.accountId, "account-0000000001");
  assert.equal(linkage?.userId.getValue(), "user-0000000001");
  assert.equal(candidate.requests.length, 1);
  assertExactReadOnlyLookup(candidate.requests[0], externalIdentity);
});

test("issuer isolation includes the exact issuer predicate", async () => {
  const candidate = createResolver();
  const requested = identity("https://issuer.example/tenant-b", "shared-subject");
  candidate.responses.push(response([]));

  assert.equal(await candidate.resolver.resolve(requested), null);
  assertExactReadOnlyLookup(candidate.requests[0], requested);
  assert.notEqual(candidate.requests[0]?.url.searchParams.get("issuer"), "eq.https://issuer.example/tenant-a");
});

test("subject isolation includes the exact subject predicate", async () => {
  const candidate = createResolver();
  const requested = identity("https://issuer.example/tenant-a", "subject-b");
  candidate.responses.push(response([]));

  assert.equal(await candidate.resolver.resolve(requested), null);
  assertExactReadOnlyLookup(candidate.requests[0], requested);
  assert.notEqual(candidate.requests[0]?.url.searchParams.get("subject"), "eq.subject-a");
});

test("returns null only when the exact lookup finds no rows", async () => {
  const candidate = createResolver();
  candidate.responses.push(response([]));

  assert.equal(await candidate.resolver.resolve(identity()), null);
});

test("rejects provider failures rather than treating them as absent", async () => {
  const candidate = createResolver();
  candidate.responses.push(providerError("query failed"));

  await assert.rejects(candidate.resolver.resolve(identity()));
});

test("rejects malformed canonical account and user identifiers", async () => {
  const malformedAccount = createResolver();
  malformedAccount.responses.push(response([{
    ...rowFor(identity()),
    account_id: " account ",
  }]));
  await assert.rejects(malformedAccount.resolver.resolve(identity()), TypeError);

  const malformedUser = createResolver();
  malformedUser.responses.push(response([{
    ...rowFor(identity()),
    user_id: " user ",
  }]));
  await assert.rejects(malformedUser.resolver.resolve(identity()));
});

test("rejects ambiguous results without selecting a linkage", async () => {
  const candidate = createResolver();
  const externalIdentity = identity();
  candidate.responses.push(response([
    rowFor(externalIdentity),
    { ...rowFor(externalIdentity), account_id: "account-0000000002" },
  ]));

  await assert.rejects(candidate.resolver.resolve(externalIdentity));
});
