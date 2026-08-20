import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
} from "@worktracker/core";

import {
  PrivilegedSessionEstablishmentOperation,
} from "../src/privileged-session-establishment-operation.js";

test(
  "exact VerifiedAuthentication returned by Authenticate is passed directly to CreateSession",
  async () => {
    const authentication =
      Object.freeze({
        accountId:
          "account-0001",
        userId:
          "user-0001",
      }) as never;

    const session =
      Object.freeze({
        id:
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        accountId:
          "account-0001",
        createdAtEpochMs:
          1_900_000_000_000,
        expiresAtEpochMs:
          1_900_000_060_000,
        revokedAtEpochMs:
          null,
      }) as never;

    let createInput:
      unknown;

    const operation =
      new PrivilegedSessionEstablishmentOperation({
        isRuntimeRunning:
          () =>
            true,

        authenticate: {
          async execute(
            request,
          ) {
            assert.deepEqual(
              request,
              {
                proof:
                  "provider-proof",
              },
            );

            return authentication;
          },
        },

        createSession: {
          async execute(
            request,
          ) {
            createInput =
              request;

            assert.equal(
              request.authentication,
              authentication,
            );

            return session;
          },
        },
      });

    assert.equal(
      await operation.execute({
        proof:
          "provider-proof",
      }),
      session,
    );

    assert.equal(
      (
        createInput as {
          authentication:
            unknown;
        }
      ).authentication,
      authentication,
    );
  },
);

test(
  "runtime-unavailable and malformed proof requests fail before authentication authority executes",
  async () => {
    let calls =
      0;

    const unavailable =
      new PrivilegedSessionEstablishmentOperation({
        isRuntimeRunning:
          () =>
            false,
        authenticate: {
          async execute() {
            calls +=
              1;

            throw new Error();
          },
        },
        createSession: {
          async execute() {
            throw new Error();
          },
        },
      });

    await assert.rejects(
      unavailable.execute({
        proof:
          "proof",
      }),
      AuthenticationUnavailableError,
    );

    assert.equal(
      calls,
      0,
    );

    const invalid =
      new PrivilegedSessionEstablishmentOperation({
        isRuntimeRunning:
          () =>
            true,
        authenticate: {
          async execute() {
            calls +=
              1;

            throw new Error();
          },
        },
        createSession: {
          async execute() {
            throw new Error();
          },
        },
      });

    await assert.rejects(
      invalid.execute({
        proof:
          "",
      }),
      InvalidAuthenticationRequestError,
    );

    assert.equal(
      calls,
      0,
    );
  },
);
