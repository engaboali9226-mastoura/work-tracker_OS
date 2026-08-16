import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  test,
} from "node:test";

import {
  AuthenticationUnavailableError,
  InvalidCredentialsError,
  UserId,
  createAuthenticationAccountId,
} from "@worktracker/core";

import {
  SignJWT,
  exportJWK,
  generateKeyPair,
} from "jose";

import {
  AuthenticationAccountLinkage,
} from "../src/authentication/authentication-account-linkage.js";

import type {
  AuthenticationAccountLinkageResolver,
} from "../src/authentication/authentication-account-linkage-resolver.js";

import {
  SupabaseAuthenticationVerifier,
  type SupabaseAuthenticationAlgorithm,
} from "../src/authentication/supabase-authentication-verifier.js";

import {
  VerifiedExternalIdentity,
} from "../src/authentication/verified-external-identity.js";

const ISSUER =
  "https://project-ref.supabase.co/auth/v1";

const AUDIENCE =
  "authenticated";

interface KeyFixture {
  readonly privateKey:
    Awaited<
      ReturnType<typeof generateKeyPair>
    >["privateKey"];

  readonly publicJwk:
    Record<string, unknown>;
}

interface TokenOptions {
  readonly algorithm?:
    SupabaseAuthenticationAlgorithm;

  readonly issuer?: string;
  readonly audience?: string;

  readonly subject?:
    string
    | null;

  readonly kid?:
    string
    | null;

  readonly expiration?:
    number
    | null;

  readonly notBefore?: number;

  readonly claims?:
    Readonly<
      Record<string, unknown>
    >;
}

async function createKey(
  kid: string,
  algorithm:
    SupabaseAuthenticationAlgorithm =
      "ES256",
): Promise<KeyFixture> {
  const pair =
    await generateKeyPair(
      algorithm,
      {
        extractable:
          true,
      },
    );

  const jwk =
    await exportJWK(
      pair.publicKey,
    );

  return {
    privateKey:
      pair.privateKey,
    publicJwk: {
      ...jwk,
      kid,
      alg:
        algorithm,
      use:
        "sig",
    },
  };
}

async function issueToken(
  key:
    KeyFixture["privateKey"],
  options:
    TokenOptions = {},
): Promise<string> {
  const now =
    Math.floor(
      Date.now() / 1000,
    );

  const algorithm =
    options.algorithm
    ?? "ES256";

  const claims = {
    role:
      "authenticated",
    session_id:
      "session-0001",
    is_anonymous:
      false,
    email:
      "ignored@example.test",
    ...options.claims,
  };

  const header =
    options.kid === null
      ? {
          alg:
            algorithm,
        }
      : {
          alg:
            algorithm,
          kid:
            options.kid
            ?? "key-1",
        };

  const token =
    new SignJWT(
      claims,
    )
      .setProtectedHeader(
        header,
      )
      .setIssuer(
        options.issuer
        ?? ISSUER,
      )
      .setAudience(
        options.audience
        ?? AUDIENCE,
      )
      .setIssuedAt(
        now,
      );

  if (
    options.subject !== null
  ) {
    token.setSubject(
      options.subject
      ?? "Subject-ABC-123",
    );
  }

  if (
    options.expiration !== null
  ) {
    token.setExpirationTime(
      options.expiration
      ?? now + 600,
    );
  }

  if (
    options.notBefore
    !== undefined
  ) {
    token.setNotBefore(
      options.notBefore,
    );
  }

  return token.sign(
    key,
  );
}

function linkage(
  accountId: string,
  userId: string,
): AuthenticationAccountLinkage {
  return AuthenticationAccountLinkage.create(
    createAuthenticationAccountId(
      accountId,
    ),
    new UserId(
      userId,
    ),
  );
}

class RecordingResolver
implements AuthenticationAccountLinkageResolver {
  public readonly identities:
    VerifiedExternalIdentity[] = [];

  public constructor(
    private readonly resolveWith:
      (
        identity:
          VerifiedExternalIdentity,
      ) =>
        AuthenticationAccountLinkage
        | null
        | Promise<
            AuthenticationAccountLinkage
            | null
          >,
  ) {}

  public async resolve(
    identity:
      VerifiedExternalIdentity,
  ): Promise<
    AuthenticationAccountLinkage
    | null
  > {
    this.identities.push(
      identity,
    );

    return this.resolveWith(
      identity,
    );
  }
}

function candidate(
  resolver:
    AuthenticationAccountLinkageResolver,
  algorithm:
    SupabaseAuthenticationAlgorithm =
      "ES256",
): SupabaseAuthenticationVerifier {
  return new SupabaseAuthenticationVerifier(
    {
      expectedIssuer:
        ISSUER,
      expectedAudience:
        AUDIENCE,
      expectedAlgorithm:
        algorithm,
    },
    resolver,
  );
}

function jwksFetch(
  responses:
    readonly (
      Record<string, unknown>
      | Error
    )[],
) {
  let calls =
    0;

  const fetcher:
    typeof globalThis.fetch =
      async () => {
        const index =
          Math.min(
            calls,
            responses.length - 1,
          );

        const response =
          responses[index];

        calls +=
          1;

        if (response === undefined) {
          throw new Error(
            "Missing JWKS test response.",
          );
        }

        if (response instanceof Error) {
          throw response;
        }

        return new Response(
          JSON.stringify(
            response,
          ),
          {
            status:
              200,
            headers: {
              "content-type":
                "application/json",
            },
          },
        );
      };

  return {
    fetcher,
    calls:
      () =>
        calls,
  };
}

async function usingFetch<T>(
  fetcher:
    typeof globalThis.fetch,
  body:
    () => Promise<T>,
): Promise<T> {
  const original =
    globalThis.fetch;

  globalThis.fetch =
    fetcher;

  try {
    return await body();
  } finally {
    globalThis.fetch =
      original;
  }
}

async function expectError(
  promise:
    Promise<unknown>,
  ErrorType:
    new () => Error,
): Promise<Error> {
  try {
    await promise;

    assert.fail(
      "Expected verifier rejection.",
    );
  } catch (error: unknown) {
    assert.ok(
      error instanceof ErrorType,
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        error,
        "cause",
      ),
      false,
    );

    return error;
  }
}

function hs256Proof():
  string {
  const encode =
    (
      value: unknown,
    ) =>
      Buffer
        .from(
          JSON.stringify(
            value,
          ),
        )
        .toString(
          "base64url",
        );

  return [
    encode({
      alg:
        "HS256",
      kid:
        "attacker",
    }),
    encode({
      iss:
        ISSUER,
      aud:
        AUDIENCE,
      sub:
        "Subject-ABC-123",
      exp:
        Math.floor(
          Date.now() / 1000,
        ) + 600,
      role:
        "authenticated",
      session_id:
        "session-1",
      is_anonymous:
        false,
    }),
    "AA",
  ].join(".");
}

test(
  "configuration remains asymmetric and source contains no provider fallback or manual JWKS reload",
  () => {
    const resolver =
      new RecordingResolver(
        () =>
          null,
      );

    assert.throws(
      () =>
        new SupabaseAuthenticationVerifier(
          {
            expectedIssuer:
              "http://project-ref.supabase.co/auth/v1",
            expectedAudience:
              AUDIENCE,
            expectedAlgorithm:
              "ES256",
          },
          resolver,
        ),
      TypeError,
    );

    assert.throws(
      () =>
        new SupabaseAuthenticationVerifier(
          {
            expectedIssuer:
              ISSUER,
            expectedAudience:
              AUDIENCE,
            expectedAlgorithm:
              "HS256" as unknown as
                SupabaseAuthenticationAlgorithm,
          },
          resolver,
        ),
      TypeError,
    );

    const source =
      readFileSync(
        new URL(
          "../src/authentication/supabase-authentication-verifier.ts",
          import.meta.url,
        ),
        "utf8",
      );

    assert.doesNotMatch(
      source,
      /\.reload\s*\(/,
    );

    assert.doesNotMatch(
      source,
      /signInWithPassword|getUser\s*\(|@supabase\/supabase-js|refresh[_-]?token/iu,
    );

    assert.doesNotMatch(
      source,
      /\bemail\b/iu,
    );

    assert.match(
      source,
      /timeoutDuration:\s*JWKS_TIMEOUT_MS/,
    );

    assert.match(
      source,
      /cooldownDuration:\s*JWKS_COOLDOWN_MS/,
    );

    assert.match(
      source,
      /cacheMaxAge:\s*JWKS_CACHE_MAX_AGE_MS/,
    );
  },
);

test(
  "valid ES256 token preserves exact issuer subject accountId and canonical UserId",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    const expected =
      linkage(
        "account-es256",
        "user-es256",
      );

    const resolver =
      new RecordingResolver(
        identity => {
          assert.equal(
            identity.issuer,
            ISSUER,
          );

          assert.equal(
            identity.subject,
            "Subject-Case-ABC",
          );

          return expected;
        },
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const token =
      await issueToken(
        key.privateKey,
        {
          subject:
            "Subject-Case-ABC",
          claims: {
            email:
              "different@example.test",
            user_metadata: {
              sub:
                "ignored",
            },
          },
        },
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const result =
          await candidate(
            resolver,
          ).verify(
            token,
          );

        assert.equal(
          result.accountId,
          expected.accountId,
        );

        assert.equal(
          result.userId,
          expected.userId,
        );

        assert.equal(
          resolver.identities.length,
          1,
        );

        assert.equal(
          network.calls(),
          1,
        );
      },
    );
  },
);

test(
  "explicit RS256 configuration verifies RS256 without widening algorithm policy",
  async () => {
    const key =
      await createKey(
        "rsa-key",
        "RS256",
      );

    const expected =
      linkage(
        "account-rs256",
        "user-rs256",
      );

    const resolver =
      new RecordingResolver(
        () =>
          expected,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const token =
      await issueToken(
        key.privateKey,
        {
          algorithm:
            "RS256",
          kid:
            "rsa-key",
        },
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const result =
          await candidate(
            resolver,
            "RS256",
          ).verify(
            token,
          );

        assert.equal(
          result.accountId,
          expected.accountId,
        );

        assert.equal(
          resolver.identities.length,
          1,
        );
      },
    );
  },
);

test(
  "invalid proof signature algorithm issuer audience time and user claims never reach linkage",
  async () => {
    const trusted =
      await createKey(
        "key-1",
      );

    const attacker =
      await createKey(
        "attacker",
      );

    const resolver =
      new RecordingResolver(
        () =>
          linkage(
            "unused-account",
            "unused-user",
          ),
      );

    const network =
      jwksFetch([
        {
          keys: [
            trusted.publicJwk,
          ],
        },
      ]);

    const now =
      Math.floor(
        Date.now() / 1000,
      );

    const invalidProofs = [
      42 as unknown as string,
      "not-a-jwt",
      hs256Proof(),

      await issueToken(
        attacker.privateKey,
        {
          kid:
            "key-1",
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          issuer:
            "https://Project-Ref.supabase.co/auth/v1",
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          audience:
            "other-audience",
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          expiration:
            now - 1,
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          notBefore:
            now + 600,
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          subject:
            null,
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          subject:
            " Subject-ABC-123 ",
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          claims: {
            role:
              "service_role",
          },
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          claims: {
            role:
              undefined,
          },
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          claims: {
            session_id:
              "",
          },
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          claims: {
            session_id:
              undefined,
          },
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          claims: {
            is_anonymous:
              true,
          },
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          claims: {
            is_anonymous:
              undefined,
          },
        },
      ),

      await issueToken(
        trusted.privateKey,
        {
          expiration:
            null,
        },
      ),
    ];

    await usingFetch(
      network.fetcher,
      async () => {
        const verifier =
          candidate(
            resolver,
          );

        for (
          const proof
          of invalidProofs
        ) {
          await expectError(
            verifier.verify(
              proof,
            ),
            InvalidCredentialsError,
          );
        }

        assert.equal(
          resolver.identities.length,
          0,
        );
      },
    );
  },
);

test(
  "missing linkage is invalid credentials and resolver failure is unavailable",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    const token =
      await issueToken(
        key.privateKey,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    await usingFetch(
      network.fetcher,
      async () => {
        const missing =
          new RecordingResolver(
            () =>
              null,
          );

        await expectError(
          candidate(
            missing,
          ).verify(
            token,
          ),
          InvalidCredentialsError,
        );

        assert.equal(
          missing.identities.length,
          1,
        );

        const failed =
          new RecordingResolver(
            async () => {
              throw new Error(
                "provider-sensitive-linkage-detail",
              );
            },
          );

        const error =
          await expectError(
            candidate(
              failed,
            ).verify(
              token,
            ),
            AuthenticationUnavailableError,
          );

        assert.equal(
          error.message,
          "Authentication is temporarily unavailable.",
        );

        assert.doesNotMatch(
          error.message,
          /provider-sensitive/iu,
        );

        assert.equal(
          failed.identities.length,
          1,
        );
      },
    );
  },
);

test(
  "JWKS network malformed and ambiguous trust-material failures are unavailable before linkage",
  async () => {
    const key1 =
      await createKey(
        "key-1",
      );

    const key2 =
      await createKey(
        "key-2",
      );

    const resolver =
      new RecordingResolver(
        () =>
          linkage(
            "unused-account",
            "unused-user",
          ),
      );

    const token =
      await issueToken(
        key1.privateKey,
      );

    const networkFailure =
      jwksFetch([
        new Error(
          "provider-network-detail",
        ),
      ]);

    await usingFetch(
      networkFailure.fetcher,
      async () => {
        const error =
          await expectError(
            candidate(
              resolver,
            ).verify(
              token,
            ),
            AuthenticationUnavailableError,
          );

        assert.equal(
          error.message,
          "Authentication is temporarily unavailable.",
        );
      },
    );

    const timeout =
      new Error(
        "provider-timeout-detail",
      );

    timeout.name =
      "TimeoutError";

    const timeoutFailure =
      jwksFetch([
        timeout,
      ]);

    await usingFetch(
      timeoutFailure.fetcher,
      async () => {
        await expectError(
          candidate(
            resolver,
          ).verify(
            token,
          ),
          AuthenticationUnavailableError,
        );
      },
    );

    const malformed =
      jwksFetch([
        {
          keys:
            "not-an-array",
        },
      ]);

    await usingFetch(
      malformed.fetcher,
      async () => {
        await expectError(
          candidate(
            resolver,
          ).verify(
            token,
          ),
          AuthenticationUnavailableError,
        );
      },
    );

    const ambiguous =
      jwksFetch([
        {
          keys: [
            key1.publicJwk,
            key2.publicJwk,
          ],
        },
      ]);

    const noKidToken =
      await issueToken(
        key1.privateKey,
        {
          kid:
            null,
        },
      );

    await usingFetch(
      ambiguous.fetcher,
      async () => {
        await expectError(
          candidate(
            resolver,
          ).verify(
            noKidToken,
          ),
          AuthenticationUnavailableError,
        );
      },
    );

    assert.equal(
      resolver.identities.length,
      0,
    );
  },
);

test(
  "unknown kid during cooldown is unavailable and same token succeeds once rotated key becomes discoverable",
  async () => {
    const key1 =
      await createKey(
        "key-1",
      );

    const key2 =
      await createKey(
        "key-2",
      );

    const firstLink =
      linkage(
        "account-original",
        "user-original",
      );

    const rotatedLink =
      linkage(
        "account-rotated",
        "user-rotated",
      );

    const resolver =
      new RecordingResolver(
        identity =>
          identity.subject
            === "Subject-Rotated"
            ? rotatedLink
            : firstLink,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key1.publicJwk,
          ],
        },
        {
          keys: [
            key1.publicJwk,
            key2.publicJwk,
          ],
        },
      ]);

    const first =
      await issueToken(
        key1.privateKey,
        {
          subject:
            "Subject-Original",
        },
      );

    const rotated =
      await issueToken(
        key2.privateKey,
        {
          kid:
            "key-2",
          subject:
            "Subject-Rotated",
        },
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const verifier =
          candidate(
            resolver,
          );

        await verifier.verify(
          first,
        );

        assert.equal(
          network.calls(),
          1,
        );

        assert.equal(
          resolver.identities.length,
          1,
        );

        await expectError(
          verifier.verify(
            rotated,
          ),
          AuthenticationUnavailableError,
        );

        assert.equal(
          network.calls(),
          1,
          "cooldown must suppress attacker-driven JWKS refetch",
        );

        assert.equal(
          resolver.identities.length,
          1,
        );

        const realNow =
          Date.now;

        const base =
          realNow();

        Date.now =
          () =>
            base + 31_000;

        let result;

        try {
          result =
            await verifier.verify(
              rotated,
            );
        } finally {
          Date.now =
            realNow;
        }

        assert.equal(
          network.calls(),
          2,
        );

        assert.equal(
          resolver.identities.length,
          2,
        );

        assert.equal(
          resolver.identities[1]?.subject,
          "Subject-Rotated",
        );

        assert.equal(
          result.accountId,
          rotatedLink.accountId,
        );

        assert.equal(
          result.userId,
          rotatedLink.userId,
        );
      },
    );
  },
);

test(
  "unknown kid after cooldown remains unavailable when refreshed JWKS still lacks the key",
  async () => {
    const key1 =
      await createKey(
        "key-1",
      );

    const key2 =
      await createKey(
        "key-2",
      );

    const resolver =
      new RecordingResolver(
        () =>
          linkage(
            "unused-account",
            "unused-user",
          ),
      );

    const network =
      jwksFetch([
        {
          keys: [
            key1.publicJwk,
          ],
        },
        {
          keys: [
            key1.publicJwk,
          ],
        },
      ]);

    const first =
      await issueToken(
        key1.privateKey,
      );

    const unknown =
      await issueToken(
        key2.privateKey,
        {
          kid:
            "key-2",
        },
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const verifier =
          candidate(
            resolver,
          );

        await verifier.verify(
          first,
        );

        const realNow =
          Date.now;

        const base =
          realNow();

        Date.now =
          () =>
            base + 31_000;

        try {
          await expectError(
            verifier.verify(
              unknown,
            ),
            AuthenticationUnavailableError,
          );
        } finally {
          Date.now =
            realNow;
        }

        assert.equal(
          network.calls(),
          2,
        );

        assert.equal(
          resolver.identities.length,
          1,
        );
      },
    );
  },
);

test(
  "repeated concurrent verification retains no per-user authentication state",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    const linkA =
      linkage(
        "account-a",
        "user-a",
      );

    const linkB =
      linkage(
        "account-b",
        "user-b",
      );

    const resolver =
      new RecordingResolver(
        async identity => {
          await Promise.resolve();

          return identity.subject
            === "Subject-A"
            ? linkA
            : linkB;
        },
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const tokenA =
      await issueToken(
        key.privateKey,
        {
          subject:
            "Subject-A",
        },
      );

    const tokenB =
      await issueToken(
        key.privateKey,
        {
          subject:
            "Subject-B",
        },
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const verifier =
          candidate(
            resolver,
          );

        const [
          resultA,
          resultB,
        ] =
          await Promise.all([
            verifier.verify(
              tokenA,
            ),
            verifier.verify(
              tokenB,
            ),
          ]);

        assert.equal(
          resultA.accountId,
          linkA.accountId,
        );

        assert.equal(
          resultA.userId,
          linkA.userId,
        );

        assert.equal(
          resultB.accountId,
          linkB.accountId,
        );

        assert.equal(
          resultB.userId,
          linkB.userId,
        );

        assert.deepEqual(
          resolver.identities
            .map(
              identity =>
                identity.subject,
            )
            .sort(),
          [
            "Subject-A",
            "Subject-B",
          ],
        );
      },
    );
  },
);

// REPAIR_001_ADVERSARIAL_LINKAGE_TESTS

test(
  "forged AuthenticationAccountLinkage prototype fails closed without authentication success",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    const forged =
      Object.create(
        AuthenticationAccountLinkage.prototype,
      ) as AuthenticationAccountLinkage;

    const resolver =
      new RecordingResolver(
        () =>
          forged,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const token =
      await issueToken(
        key.privateKey,
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const error =
          await expectError(
            candidate(
              resolver,
            ).verify(
              token,
            ),
            AuthenticationUnavailableError,
          );

        assert.equal(
          error.message,
          "Authentication is temporarily unavailable.",
        );

        assert.equal(
          resolver.identities.length,
          1,
        );
      },
    );
  },
);

test(
  "proxy linkage cannot substitute accountId or UserId through overridable property access",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    const realLinkage =
      linkage(
        "account-real",
        "user-real",
      );

    const fakeAccountId =
      createAuthenticationAccountId(
        "account-forged",
      );

    const fakeUserId =
      new UserId(
        "user-forged",
      );

    const observedProperties:
      PropertyKey[] = [];

    const proxied =
      new Proxy(
        realLinkage,
        {
          get(
            target,
            property,
            receiver,
          ) {
            observedProperties.push(
              property,
            );

            if (
              property ===
              "accountId"
            ) {
              return fakeAccountId;
            }

            if (
              property ===
              "userId"
            ) {
              return fakeUserId;
            }

            return Reflect.get(
              target,
              property,
              receiver,
            );
          },
        },
      );

    const resolver =
      new RecordingResolver(
        () =>
          proxied,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const token =
      await issueToken(
        key.privateKey,
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const error =
          await expectError(
            candidate(
              resolver,
            ).verify(
              token,
            ),
            AuthenticationUnavailableError,
          );

        assert.equal(
          error.message,
          "Authentication is temporarily unavailable.",
        );

        assert.equal(
          observedProperties.includes(
            "accountId",
          ),
          false,
          "canonical extraction must not invoke the Proxy accountId trap",
        );

        assert.equal(
          observedProperties.includes(
            "userId",
          ),
          false,
          "canonical extraction must not invoke the Proxy userId trap",
        );

        assert.equal(
          resolver.identities.length,
          1,
        );
      },
    );
  },
);

test(
  "throwing forged linkage getters are never invoked and cannot leak non-canonical errors",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    let maliciousGetterCalls =
      0;

    const forged =
      Object.create(
        AuthenticationAccountLinkage.prototype,
      ) as AuthenticationAccountLinkage;

    Object.defineProperties(
      forged,
      {
        accountId: {
          configurable:
            true,
          get() {
            maliciousGetterCalls +=
              1;

            throw new Error(
              "provider-sensitive-account-getter",
            );
          },
        },

        userId: {
          configurable:
            true,
          get() {
            maliciousGetterCalls +=
              1;

            throw new Error(
              "provider-sensitive-user-getter",
            );
          },
        },
      },
    );

    const resolver =
      new RecordingResolver(
        () =>
          forged,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const token =
      await issueToken(
        key.privateKey,
      );

    await usingFetch(
      network.fetcher,
      async () => {
        const error =
          await expectError(
            candidate(
              resolver,
            ).verify(
              token,
            ),
            AuthenticationUnavailableError,
          );

        assert.equal(
          error.message,
          "Authentication is temporarily unavailable.",
        );

        assert.doesNotMatch(
          error.message,
          /provider-sensitive/iu,
        );

        assert.equal(
          maliciousGetterCalls,
          0,
          "forged own getters must not participate in canonical linkage extraction",
        );

        assert.equal(
          resolver.identities.length,
          1,
        );
      },
    );
  },
);

// REPAIR_003_REFLECT_APPLY_TAMPERING_TEST

test(
  "thenable assimilation cannot replace canonical Reflect.apply and forge linkage identity",
  async () => {
    const key =
      await createKey(
        "key-1",
      );

    const realLinkage =
      linkage(
        "account-real-reflect",
        "user-real-reflect",
      );

    const fakeAccountId =
      createAuthenticationAccountId(
        "account-forged-reflect",
      );

    const fakeUserId =
      new UserId(
        "user-forged-reflect",
      );

    const originalReflectApply =
      Reflect.apply;

    let thenTrapCalls =
      0;

    let forgedApplyCalls =
      0;

    let proxied:
      AuthenticationAccountLinkage;

    const maliciousApply =
      ((
        target:
          Function,
        thisArgument:
          unknown,
        argumentsList:
          ArrayLike<unknown>,
      ) => {
        if (
          thisArgument === proxied
          && argumentsList.length === 0
        ) {
          forgedApplyCalls +=
            1;

          if (
            forgedApplyCalls === 1
          ) {
            return fakeAccountId;
          }

          if (
            forgedApplyCalls === 2
          ) {
            return fakeUserId;
          }
        }

        return originalReflectApply(
          target,
          thisArgument,
          argumentsList,
        );
      }) as typeof Reflect.apply;

    proxied =
      new Proxy(
        realLinkage,
        {
          get(
            target,
            property,
            receiver,
          ) {
            if (
              property === "then"
            ) {
              thenTrapCalls +=
                1;

              Reflect.apply =
                maliciousApply;
            }

            return Reflect.get(
              target,
              property,
              receiver,
            );
          },
        },
      );

    const resolver =
      new RecordingResolver(
        () =>
          proxied,
      );

    const network =
      jwksFetch([
        {
          keys: [
            key.publicJwk,
          ],
        },
      ]);

    const token =
      await issueToken(
        key.privateKey,
      );

    try {
      await usingFetch(
        network.fetcher,
        async () => {
          const error =
            await expectError(
              candidate(
                resolver,
              ).verify(
                token,
              ),
              AuthenticationUnavailableError,
            );

          assert.equal(
            error.message,
            "Authentication is temporarily unavailable.",
          );

          assert.equal(
            Object.prototype.hasOwnProperty.call(
              error,
              "cause",
            ),
            false,
          );

          assert.ok(
            thenTrapCalls >= 1,
            "the adversarial thenable-assimilation side effect must actually execute",
          );

          assert.equal(
            Reflect.apply,
            maliciousApply,
            "the global Reflect.apply replacement must be active during verifier completion",
          );

          assert.equal(
            forgedApplyCalls,
            0,
            "canonical linkage extraction must not use the tampered global Reflect.apply",
          );

          assert.equal(
            resolver.identities.length,
            1,
          );
        },
      );
    } finally {
      Reflect.apply =
        originalReflectApply;
    }

    assert.equal(
      Reflect.apply,
      originalReflectApply,
      "test must restore Reflect.apply even after adversarial execution",
    );
  },
);

