import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
  InvalidCredentialsError,
  VerifiedAuthentication,
  createAuthenticationAccountId,
  type AuthenticationVerifier,
} from "@worktracker/core";

import {
  UserId,
} from "@worktracker/core";

import {
  Authenticate,
} from "../src/authentication/authenticate.js";

import type {
  AuthenticationRequest,
} from "../src/authentication/authentication-request.js";

function verified(
  account:
    string,
  user:
    string,
): VerifiedAuthentication {

  return new VerifiedAuthentication(
    createAuthenticationAccountId(
      account,
    ),
    new UserId(
      user,
    ),
  );

}

test(
  "Authenticate returns the exact verifier result and canonical UserId",
  async () => {

    const proof = {
      secret:
        "opaque-proof",
    };

    const expected =
      verified(
        "account-1",
        "user-1",
      );

    let received:
      typeof proof | undefined;

    let calls =
      0;

    const verifier:
      AuthenticationVerifier<typeof proof> = {
        async verify(
          candidate,
        ) {

          calls +=
            1;

          received =
            candidate;

          return expected;

        },
      };

    const authenticate =
      new Authenticate(
        verifier,
      );

    const actual =
      await authenticate.execute({
        proof,
      });

    assert.equal(
      actual,
      expected,
    );

    assert.equal(
      actual.userId,
      expected.userId,
    );

    assert.equal(
      received,
      proof,
    );

    assert.equal(
      calls,
      1,
    );

  },
);

test(
  "Authenticate awaits asynchronous verifier completion",
  async () => {

    const expected =
      verified(
        "account-2",
        "user-2",
      );

    let resolveVerification:
      (
        value:
          VerifiedAuthentication
      ) => void =
        () => {};

    const pending =
      new Promise<VerifiedAuthentication>(
        resolve => {

          resolveVerification =
            resolve;

        },
      );

    let settled =
      false;

    const authenticate =
      new Authenticate<string>({
        verify() {

          return pending;

        },
      });

    const execution =
      authenticate
        .execute({
          proof:
            "proof",
        })
        .then(
          result => {

            settled =
              true;

            return result;

          },
        );

    await Promise.resolve();

    assert.equal(
      settled,
      false,
    );

    resolveVerification(
      expected,
    );

    assert.equal(
      await execution,
      expected,
    );

  },
);

test(
  "Authenticate rejects invalid request shapes before verifier invocation",
  async () => {

    let calls =
      0;

    const authenticate =
      new Authenticate<string>({
        async verify() {

          calls +=
            1;

          return verified(
            "account-invalid",
            "user-invalid",
          );

        },
      });

    const invalidRequests = [
      null,
      42,
      "proof",
      {},
      {
        proof:
          undefined,
      },
    ];

    for (const request of invalidRequests) {

      await assert.rejects(
        () =>
          authenticate.execute(
            request as unknown as
              AuthenticationRequest<string>,
          ),
        InvalidAuthenticationRequestError,
      );

    }

    assert.equal(
      calls,
      0,
    );

  },
);

test(
  "Unknown account and incorrect secret are externally indistinguishable",
  async () => {

    for (
      const internalReason
      of [
        "unknown-account",
        "incorrect-secret",
      ]
    ) {

      const authenticate =
        new Authenticate<string>({
          async verify() {

            void internalReason;

            throw new InvalidCredentialsError();

          },
        });

      await assert.rejects(
        () =>
          authenticate.execute({
            proof:
              internalReason,
          }),
        {
          name:
            "InvalidCredentialsError",
          message:
            "Authentication credentials are invalid.",
        },
      );

    }

  },
);

test(
  "Authenticate preserves canonical invalid-credentials and unavailable failures",
  async () => {

    const invalidCredentials =
      new InvalidCredentialsError();

    const unavailable =
      new AuthenticationUnavailableError();

    const invalidAuthenticate =
      new Authenticate<string>({
        async verify() {

          throw invalidCredentials;

        },
      });

    const unavailableAuthenticate =
      new Authenticate<string>({
        async verify() {

          throw unavailable;

        },
      });

    await assert.rejects(
      () =>
        invalidAuthenticate.execute({
          proof:
            "proof",
        }),
      error =>
        error === invalidCredentials,
    );

    await assert.rejects(
      () =>
        unavailableAuthenticate.execute({
          proof:
            "proof",
        }),
      error =>
        error === unavailable,
    );

  },
);

test(
  "Authenticate maps unknown verifier failures without exposing a cause",
  async () => {

    const providerFailure =
      new Error(
        "provider-sensitive-details",
      );

    const authenticate =
      new Authenticate<string>({
        async verify() {

          throw providerFailure;

        },
      });

    await assert.rejects(
      async () => {

        try {

          await authenticate.execute({
            proof:
              "proof",
          });

        } catch (error: unknown) {

          assert.equal(
            error instanceof
              AuthenticationUnavailableError,
            true,
          );

          assert.equal(
            error === providerFailure,
            false,
          );

          assert.equal(
            error instanceof Error
              && "cause" in error,
            false,
          );

          throw error;

        }

      },
      AuthenticationUnavailableError,
    );

  },
);

test(
  "Repeated authentication executions perform one independent verification each",
  async () => {

    const results = [
      verified(
        "account-repeat-1",
        "user-repeat-1",
      ),
      verified(
        "account-repeat-2",
        "user-repeat-2",
      ),
    ];

    const proofs:
      string[] = [];

    let calls =
      0;

    const authenticate =
      new Authenticate<string>({
        async verify(
          proof,
        ) {

          proofs.push(
            proof,
          );

          const result =
            results[calls];

          calls +=
            1;

          if (!result) {

            throw new Error(
              "Unexpected authentication call.",
            );

          }

          return result;

        },
      });

    assert.equal(
      await authenticate.execute({
        proof:
          "proof-1",
      }),
      results[0],
    );

    assert.equal(
      await authenticate.execute({
        proof:
          "proof-2",
      }),
      results[1],
    );

    assert.deepEqual(
      proofs,
      [
        "proof-1",
        "proof-2",
      ],
    );

    assert.equal(
      calls,
      2,
    );

  },
);

test(
  "Concurrent authentication executions preserve independent results and failures",
  async () => {

    const success =
      verified(
        "account-concurrent",
        "user-concurrent",
      );

    const authenticate =
      new Authenticate<string>({
        async verify(
          proof,
        ) {

          if (
            proof ===
              "success"
          ) {

            await Promise.resolve();

            return success;

          }

          throw new InvalidCredentialsError();

        },
      });

    const [
      successful,
      failed,
    ] =
      await Promise.allSettled([
        authenticate.execute({
          proof:
            "success",
        }),
        authenticate.execute({
          proof:
            "failure",
        }),
      ]);

    assert.equal(
      successful.status,
      "fulfilled",
    );

    if (
      successful.status ===
        "fulfilled"
    ) {

      assert.equal(
        successful.value,
        success,
      );

    }

    assert.equal(
      failed.status,
      "rejected",
    );

    if (
      failed.status ===
        "rejected"
    ) {

      assert.equal(
        failed.reason instanceof
          InvalidCredentialsError,
        true,
      );

    }

  },
);

test(
  "Authenticate retains no request, result, session or current-user state",
  async () => {

    const authenticate =
      new Authenticate<string>({
        async verify() {

          throw new InvalidCredentialsError();

        },
      });

    const keysBefore =
      Object.keys(
        authenticate,
      );

    await assert.rejects(
      () =>
        authenticate.execute({
          proof:
            "sensitive-proof",
        }),
      InvalidCredentialsError,
    );

    const keysAfter =
      Object.keys(
        authenticate,
      );

    assert.deepEqual(
      keysAfter,
      keysBefore,
    );

    assert.deepEqual(
      keysAfter,
      [
        "verifier",
      ],
    );

  },
);
