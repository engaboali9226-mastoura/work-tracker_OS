import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthenticationSessionController,
} from "../src/authentication-session-controller.js";

function deferred<T>() {
  let resolve:
    (value: T) => void =
      () => {};

  const promise =
    new Promise<T>(
      innerResolve => {
        resolve =
          innerResolve;
      },
    );

  return {
    promise,
    resolve,
  };
}

test(
  "successful provider proof establishes NOOR session then triggers route refresh",
  async () => {
    const proofs:
      string[] =
      [];

    let refreshes =
      0;

    const controller =
      createAuthenticationSessionController({
        authenticationClient: {
          async authenticate() {
            return {
              kind:
                "authenticated",
              proof:
                "provider-proof",
            };
          },
        },

        sessionClient:
          async proof => {
            proofs.push(
              proof,
            );

            return "authenticated";
          },

        onAuthenticated:
          () => {
            refreshes +=
              1;
          },
      });

    await controller.signIn({
      email:
        "user@example.com",
      password:
        "password",
    });

    assert.deepEqual(
      proofs,
      [
        "provider-proof",
      ],
    );

    assert.equal(
      refreshes,
      1,
    );

    assert.deepEqual(
      controller.snapshot(),
      {
        kind:
          "authenticated",
      },
    );
  },
);

test(
  "stale provider completion cannot overwrite a newer authentication attempt",
  async () => {
    const first =
      deferred<
        Readonly<{
          kind:
            "authenticated";
          proof:
            string;
        }>
      >();

    let call =
      0;

    const controller =
      createAuthenticationSessionController({
        authenticationClient: {
          authenticate() {
            call +=
              1;

            if (call === 1) {
              return first.promise;
            }

            return Promise.resolve({
              kind:
                "invalid-credentials",
            });
          },
        },

        sessionClient:
          async () =>
            "authenticated",

        onAuthenticated:
          () => {},
      });

    const firstRequest =
      controller.signIn({
        email:
          "first@example.com",
        password:
          "password",
      });

    await controller.signIn({
      email:
        "second@example.com",
      password:
        "wrong",
    });

    first.resolve({
      kind:
        "authenticated",
      proof:
        "stale-proof",
    });

    await firstRequest;

    assert.deepEqual(
      controller.snapshot(),
      {
        kind:
          "invalid-credentials",
      },
    );
  },
);


test(
  "superseded in-flight session establishment is aborted and settles before the newer request can own the final browser session",
  async () => {
    const firstCompletion =
      deferred<
        "authenticated"
      >();

    const secondCompletion =
      deferred<
        "authenticated"
      >();

    const sessionCalls:
      Array<
        Readonly<{
          proof:
            string;
          signal:
            AbortSignal | undefined;
        }>
      > =
      [];

    let browserSessionAuthority:
      string | undefined;

    let refreshes =
      0;

    const controller =
      createAuthenticationSessionController({
        authenticationClient: {
          async authenticate(
            credentials,
          ) {
            return {
              kind:
                "authenticated",
              proof:
                credentials.email,
            };
          },
        },

        sessionClient:
          (
            proof,
            signal,
          ) => {
            sessionCalls.push(
              Object.freeze({
                proof,
                signal,
              }),
            );

            const completion =
              proof ===
                "first@example.com"
                ? firstCompletion.promise
                : secondCompletion.promise;

            return completion.then(
              result => {
                if (
                  result ===
                  "authenticated"
                ) {
                  browserSessionAuthority =
                    proof;
                }

                return result;
              },
            );
          },

        onAuthenticated:
          () => {
            refreshes +=
              1;
          },
      });

    const firstRequest =
      controller.signIn({
        email:
          "first@example.com",
        password:
          "password",
      });

    for (
      let attempt = 0;
      attempt < 20
        && sessionCalls.length < 1;
      attempt += 1
    ) {
      await Promise.resolve();
    }

    assert.equal(
      sessionCalls.length,
      1,
    );

    assert.equal(
      sessionCalls[0]?.proof,
      "first@example.com",
    );

    assert.equal(
      sessionCalls[0]?.signal
        ?.aborted,
      false,
    );

    const secondRequest =
      controller.signIn({
        email:
          "second@example.com",
        password:
          "password",
      });

    for (
      let attempt = 0;
      attempt < 20
        && sessionCalls[0]
          ?.signal
          ?.aborted !== true;
      attempt += 1
    ) {
      await Promise.resolve();
    }

    assert.equal(
      sessionCalls[0]?.signal
        ?.aborted,
      true,
    );

    await Promise.resolve();

    assert.equal(
      sessionCalls.length,
      1,
      "newer session establishment must wait for the superseded request to settle",
    );

    firstCompletion.resolve(
      "authenticated",
    );

    for (
      let attempt = 0;
      attempt < 20
        && sessionCalls.length < 2;
      attempt += 1
    ) {
      await Promise.resolve();
    }

    assert.equal(
      browserSessionAuthority,
      "first@example.com",
    );

    assert.equal(
      sessionCalls.length,
      2,
    );

    assert.equal(
      sessionCalls[1]?.proof,
      "second@example.com",
    );

    assert.equal(
      sessionCalls[1]?.signal
        ?.aborted,
      false,
    );

    secondCompletion.resolve(
      "authenticated",
    );

    await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    assert.equal(
      browserSessionAuthority,
      "second@example.com",
      "a superseded response must not be able to become the final browser session authority",
    );

    assert.equal(
      refreshes,
      1,
    );

    assert.deepEqual(
      controller.snapshot(),
      {
        kind:
          "authenticated",
      },
    );
  },
);
