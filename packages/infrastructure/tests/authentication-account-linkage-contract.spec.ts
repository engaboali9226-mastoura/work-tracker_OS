import assert from "node:assert/strict";
import {
  test,
} from "node:test";

import {
  UserId,
  createAuthenticationAccountId,
  type AuthenticationAccountId,
} from "@worktracker/core";

import {
  AuthenticationAccountLinkage,
} from "../src/authentication/authentication-account-linkage.js";

import type {
  AuthenticationAccountLinkageResolver,
} from "../src/authentication/authentication-account-linkage-resolver.js";

import {
  VerifiedExternalIdentity,
} from "../src/authentication/verified-external-identity.js";

class StubLinkageResolver
implements AuthenticationAccountLinkageResolver {
  public constructor(
    private readonly result:
      AuthenticationAccountLinkage | null,
    private readonly failure?: Error,
  ) {}

  public async resolve(
    identity: VerifiedExternalIdentity,
  ): Promise<AuthenticationAccountLinkage | null> {
    assert.ok(
      identity instanceof VerifiedExternalIdentity,
    );

    if (this.failure) {
      throw this.failure;
    }

    return this.result;
  }
}

test(
  "VerifiedExternalIdentity preserves exact trusted issuer and subject",
  () => {
    const identity =
      VerifiedExternalIdentity.create(
        "https://Identity.Example/tenant",
        "Subject-ABC-123",
      );

    assert.equal(
      identity.issuer,
      "https://Identity.Example/tenant",
    );

    assert.equal(
      identity.subject,
      "Subject-ABC-123",
    );

    assert.equal(
      Object.isFrozen(identity),
      true,
    );
  },
);

test(
  "VerifiedExternalIdentity rejects empty whitespace-only and surrounding-whitespace values",
  () => {
    const invalidValues = [
      "",
      " ",
      " issuer",
      "issuer ",
      "\tissuer",
      "issuer\n",
    ];

    for (const value of invalidValues) {
      assert.throws(
        () =>
          VerifiedExternalIdentity.create(
            value,
            "subject",
          ),
        TypeError,
      );

      assert.throws(
        () =>
          VerifiedExternalIdentity.create(
            "issuer",
            value,
          ),
        TypeError,
      );
    }
  },
);

test(
  "issuer participates in identity and the same subject under different issuers remains distinct",
  () => {
    const first =
      VerifiedExternalIdentity.create(
        "issuer-a",
        "same-subject",
      );

    const second =
      VerifiedExternalIdentity.create(
        "issuer-b",
        "same-subject",
      );

    assert.notEqual(
      first.issuer,
      second.issuer,
    );

    assert.equal(
      first.subject,
      second.subject,
    );
  },
);

test(
  "subject participates in identity and different subjects under one issuer remain distinct",
  () => {
    const first =
      VerifiedExternalIdentity.create(
        "same-issuer",
        "subject-a",
      );

    const second =
      VerifiedExternalIdentity.create(
        "same-issuer",
        "subject-b",
      );

    assert.equal(
      first.issuer,
      second.issuer,
    );

    assert.notEqual(
      first.subject,
      second.subject,
    );
  },
);

test(
  "AuthenticationAccountLinkage preserves the exact existing account identity and UserId",
  () => {
    const accountId =
      createAuthenticationAccountId(
        "opaque-account-1",
      );

    const userId =
      new UserId(
        "canonical-user-1",
      );

    const linkage =
      AuthenticationAccountLinkage.create(
        accountId,
        userId,
      );

    assert.equal(
      linkage.accountId,
      accountId,
    );

    assert.equal(
      linkage.userId,
      userId,
    );

    assert.equal(
      Object.isFrozen(linkage),
      true,
    );
  },
);

test(
  "AuthenticationAccountLinkage rejects malformed account identity",
  () => {
    const userId =
      new UserId(
        "canonical-user-2",
      );

    const malformed =
      " bad-account " as
        AuthenticationAccountId;

    assert.throws(
      () =>
        AuthenticationAccountLinkage.create(
          malformed,
          userId,
        ),
      TypeError,
    );
  },
);

test(
  "AuthenticationAccountLinkage rejects a non-UserId value",
  () => {
    const accountId =
      createAuthenticationAccountId(
        "opaque-account-3",
      );

    assert.throws(
      () =>
        AuthenticationAccountLinkage.create(
          accountId,
          {} as UserId,
        ),
      TypeError,
    );
  },
);

test(
  "resolver returns the exact pre-existing linkage on successful lookup",
  async () => {
    const identity =
      VerifiedExternalIdentity.create(
        "issuer",
        "subject",
      );

    const linkage =
      AuthenticationAccountLinkage.create(
        createAuthenticationAccountId(
          "opaque-account-4",
        ),
        new UserId(
          "canonical-user-4",
        ),
      );

    const resolver =
      new StubLinkageResolver(
        linkage,
      );

    const resolved =
      await resolver.resolve(
        identity,
      );

    assert.equal(
      resolved,
      linkage,
    );
  },
);

test(
  "resolver represents legitimate missing linkage as null",
  async () => {
    const resolver =
      new StubLinkageResolver(
        null,
      );

    const result =
      await resolver.resolve(
        VerifiedExternalIdentity.create(
          "issuer",
          "unlinked-subject",
        ),
      );

    assert.equal(
      result,
      null,
    );
  },
);

test(
  "resolver rejection remains distinct from legitimate null absence",
  async () => {
    const failure =
      new Error(
        "internal lookup failure",
      );

    const resolver =
      new StubLinkageResolver(
        null,
        failure,
      );

    await assert.rejects(
      resolver.resolve(
        VerifiedExternalIdentity.create(
          "issuer",
          "subject",
        ),
      ),
      error =>
        error === failure,
    );
  },
);
