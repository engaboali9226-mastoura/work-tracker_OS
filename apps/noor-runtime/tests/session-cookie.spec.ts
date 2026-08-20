import assert from "node:assert/strict";
import test from "node:test";

import {
  serializeNoorSessionClearingCookie,
  serializeNoorSessionCookie,
} from "../src/session-cookie.js";

const session =
  Object.freeze({
    id:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    expiresAtEpochMs:
      1_900_000_000_999,
  });

test(
  "session issuance is host-only HttpOnly Strict and floors Expires without Max-Age",
  () => {
    const cookie =
      serializeNoorSessionCookie(
        session,
        {
          secure:
            true,
        },
      );

    assert.match(
      cookie,
      /^noor_session=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;/u,
    );

    assert.match(
      cookie,
      /Path=\//u,
    );

    assert.match(
      cookie,
      /HttpOnly/u,
    );

    assert.match(
      cookie,
      /SameSite=Strict/u,
    );

    assert.match(
      cookie,
      /Secure/u,
    );

    assert.doesNotMatch(
      cookie,
      /Domain=/u,
    );

    assert.doesNotMatch(
      cookie,
      /Max-Age=/u,
    );

    assert.match(
      cookie,
      new RegExp(
        `Expires=${new Date(
          1_900_000_000_000,
        ).toUTCString()}`,
        "u",
      ),
    );
  },
);

test(
  "loopback issuance omits Secure and future clearing uses the canonical cookie identity",
  () => {
    const issuance =
      serializeNoorSessionCookie(
        session,
        {
          secure:
            false,
        },
      );

    assert.doesNotMatch(
      issuance,
      /(?:^|;\s*)Secure(?:;|$)/u,
    );

    const clearing =
      serializeNoorSessionClearingCookie({
        secure:
          true,
      });

    assert.match(
      clearing,
      /^noor_session=;/u,
    );

    assert.match(
      clearing,
      /Max-Age=0/u,
    );

    assert.match(
      clearing,
      /Expires=Thu, 01 Jan 1970 00:00:00 GMT/u,
    );

    assert.match(
      clearing,
      /Secure/u,
    );

    assert.doesNotMatch(
      clearing,
      /Domain=/u,
    );
  },
);
