import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthenticationAccountId,
} from "../src/authentication/index.js";
import {
  createSessionId,
  createSessionSnapshot,
  InvalidSessionError,
  InvalidSessionRequestError,
  SessionUnavailableError,
  type SessionId,
} from "../src/session/index.js";

const validAccountId =
  createAuthenticationAccountId(
    "account-0000000000000001",
  );

const validSessionId =
  "session-0000000001";

test(
  "SessionId accepts exact valid values and preserves them",
  () => {
    const id =
      createSessionId(
        validSessionId,
      );

    assert.equal(
      id,
      validSessionId,
    );
  },
);

test(
  "SessionId accepts the exact lower and upper length boundaries",
  () => {
    assert.equal(
      createSessionId(
        "a".repeat(
          16,
        ),
      ),
      "a".repeat(
        16,
      ),
    );

    assert.equal(
      createSessionId(
        "z".repeat(
          256,
        ),
      ),
      "z".repeat(
        256,
      ),
    );
  },
);

test(
  "SessionId rejects invalid values without trimming",
  () => {
    const invalidValues: unknown[] = [
      "",
      " ",
      "a".repeat(
        15,
      ),
      "a".repeat(
        257,
      ),
      ` ${validSessionId}`,
      `${validSessionId} `,
      "session/000000001",
      "session:000000001",
      null,
      undefined,
      123,
    ];

    for (const value of invalidValues) {
      assert.throws(
        () =>
          createSessionId(
            value as string,
          ),
        InvalidSessionRequestError,
      );
    }
  },
);

test(
  "SessionId remains a distinct compile-time type",
  () => {
    const id: SessionId =
      createSessionId(
        validSessionId,
      );

    assert.equal(
      id,
      validSessionId,
    );
  },
);

test(
  "SessionSnapshot is immutable and preserves exact values",
  () => {
    const id =
      createSessionId(
        validSessionId,
      );

    const snapshot =
      createSessionSnapshot({
        id,
        accountId:
          validAccountId,
        createdAtEpochMs:
          1_000,
        expiresAtEpochMs:
          2_000,
      });

    assert.equal(
      snapshot.id,
      id,
    );

    assert.equal(
      snapshot.accountId,
      validAccountId,
    );

    assert.equal(
      snapshot.createdAtEpochMs,
      1_000,
    );

    assert.equal(
      snapshot.expiresAtEpochMs,
      2_000,
    );

    assert.equal(
      snapshot.revokedAtEpochMs,
      null,
    );

    assert.equal(
      Object.isFrozen(
        snapshot,
      ),
      true,
    );
  },
);

test(
  "SessionSnapshot accepts terminal revocation at or after creation",
  () => {
    const id =
      createSessionId(
        validSessionId,
      );

    const atCreation =
      createSessionSnapshot({
        id,
        accountId:
          validAccountId,
        createdAtEpochMs:
          1_000,
        expiresAtEpochMs:
          2_000,
        revokedAtEpochMs:
          1_000,
      });

    assert.equal(
      atCreation.revokedAtEpochMs,
      1_000,
    );
  },
);

test(
  "SessionSnapshot rejects invalid temporal invariants",
  () => {
    const id =
      createSessionId(
        validSessionId,
      );

    const invalidInputs = [
      {
        createdAtEpochMs:
          -1,
        expiresAtEpochMs:
          2_000,
        revokedAtEpochMs:
          null,
      },
      {
        createdAtEpochMs:
          1_000,
        expiresAtEpochMs:
          1_000,
        revokedAtEpochMs:
          null,
      },
      {
        createdAtEpochMs:
          1_000,
        expiresAtEpochMs:
          999,
        revokedAtEpochMs:
          null,
      },
      {
        createdAtEpochMs:
          1_000,
        expiresAtEpochMs:
          2_000,
        revokedAtEpochMs:
          999,
      },
      {
        createdAtEpochMs:
          Number.NaN,
        expiresAtEpochMs:
          2_000,
        revokedAtEpochMs:
          null,
      },
    ];

    for (const input of invalidInputs) {
      assert.throws(
        () =>
          createSessionSnapshot({
            id,
            accountId:
              validAccountId,
            ...input,
          }),
        InvalidSessionRequestError,
      );
    }
  },
);

test(
  "Session errors expose stable names and default public messages",
  () => {
    const invalidRequest =
      new InvalidSessionRequestError();

    const invalidSession =
      new InvalidSessionError();

    const unavailable =
      new SessionUnavailableError();

    assert.equal(
      invalidRequest.name,
      "InvalidSessionRequestError",
    );

    assert.equal(
      invalidRequest.message,
      "Invalid session request.",
    );

    assert.equal(
      invalidSession.name,
      "InvalidSessionError",
    );

    assert.equal(
      invalidSession.message,
      "Invalid session.",
    );

    assert.equal(
      unavailable.name,
      "SessionUnavailableError",
    );

    assert.equal(
      unavailable.message,
      "Session service is unavailable.",
    );

    assert.equal(
      "cause" in unavailable,
      false,
    );
  },
);

test(
  "Session errors ignore caller-controlled message arguments",
  () => {
    const cases: ReadonlyArray<{
      readonly ErrorType: new () => Error;
      readonly expectedName: string;
      readonly expectedMessage: string;
    }> = [
      {
        ErrorType:
          InvalidSessionRequestError,
        expectedName:
          "InvalidSessionRequestError",
        expectedMessage:
          "Invalid session request.",
      },
      {
        ErrorType:
          InvalidSessionError,
        expectedName:
          "InvalidSessionError",
        expectedMessage:
          "Invalid session.",
      },
      {
        ErrorType:
          SessionUnavailableError,
        expectedName:
          "SessionUnavailableError",
        expectedMessage:
          "Session service is unavailable.",
      },
    ];

    for (
      const {
        ErrorType,
        expectedName,
        expectedMessage,
      }
      of cases
    ) {
      const error =
        Reflect.construct(
          ErrorType,
          [
            "Caller-controlled message must be ignored.",
          ],
        ) as Error;

      assert.equal(
        error.name,
        expectedName,
      );

      assert.equal(
        error.message,
        expectedMessage,
      );

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          error,
          "cause",
        ),
        false,
      );
    }
  },
);

