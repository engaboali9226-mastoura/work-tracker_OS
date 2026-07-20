import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
  InvalidCredentialsError,
  VerifiedAuthentication,
  createAuthenticationAccountId,
} from "../src/authentication";

import {
  UserId,
} from "../src/identity";

const INVALID_ACCOUNT_ID_MESSAGE =
  "AuthenticationAccountId value must be a non-empty string without surrounding whitespace.";

test(
  "AuthenticationAccountId accepts one exact valid value",
  () => {

    const accountId =
      createAuthenticationAccountId(
        "account-123",
      );

    assert.equal(
      accountId,
      "account-123",
    );

  },
);

test(
  "AuthenticationAccountId rejects invalid values without trimming",
  () => {

    for (
      const value
      of [
        "",
        " ",
        " account-123",
        "account-123 ",
      ]
    ) {

      assert.throws(
        () =>
          createAuthenticationAccountId(
            value,
          ),
        {
          name:
            "TypeError",
          message:
            INVALID_ACCOUNT_ID_MESSAGE,
        },
      );

    }

  },
);

test(
  "VerifiedAuthentication preserves exact account and UserId references",
  () => {

    const accountId =
      createAuthenticationAccountId(
        "account-123",
      );

    const userId =
      new UserId(
        "user-123",
      );

    const verified =
      new VerifiedAuthentication(
        accountId,
        userId,
      );

    assert.equal(
      verified.accountId,
      accountId,
    );

    assert.equal(
      verified.userId,
      userId,
    );

    assert.equal(
      Object.isFrozen(
        verified,
      ),
      true,
    );

  },
);

test(
  "Authentication errors expose fixed provider-neutral names and messages",
  () => {

    const cases = [
      [
        new InvalidAuthenticationRequestError(),
        "InvalidAuthenticationRequestError",
        "Authentication request is invalid.",
      ],
      [
        new InvalidCredentialsError(),
        "InvalidCredentialsError",
        "Authentication credentials are invalid.",
      ],
      [
        new AuthenticationUnavailableError(),
        "AuthenticationUnavailableError",
        "Authentication is temporarily unavailable.",
      ],
    ] as const;

    for (
      const [
        error,
        name,
        message,
      ]
      of cases
    ) {

      assert.equal(
        error.name,
        name,
      );

      assert.equal(
        error.message,
        message,
      );

      assert.equal(
        "cause" in error,
        false,
      );

    }

  },
);
