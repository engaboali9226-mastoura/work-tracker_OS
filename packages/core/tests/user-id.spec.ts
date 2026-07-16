import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidUserIdError,
  UserId,
} from "../src/index.ts";

const INVALID_USER_ID_MESSAGE =
  "UserId value must be a non-empty string without surrounding whitespace.";

function assertInvalidUserId(
  value: string,
): void {

  assert.throws(
    () => {

      new UserId(
        value,
      );

    },
    (
      error: unknown,
    ) => {

      assert.equal(
        error instanceof InvalidUserIdError,
        true,
      );

      if (
        !(
          error instanceof
          InvalidUserIdError
        )
      ) {

        return false;

      }

      assert.equal(
        error.name,
        "InvalidUserIdError",
      );

      assert.equal(
        error.message,
        INVALID_USER_ID_MESSAGE,
      );

      return true;

    },
  );

}

test(
  "UserId accepts a valid caller-supplied value",
  () => {

    const userId =
      new UserId(
        "user-100",
      );

    assert.equal(
      userId instanceof UserId,
      true,
    );

  },
);

test(
  "UserId getValue returns the exact accepted value",
  () => {

    const userId =
      new UserId(
        "User-Alpha_100",
      );

    assert.equal(
      userId.getValue(),
      "User-Alpha_100",
    );

  },
);

test(
  "UserId toString returns the exact accepted value",
  () => {

    const userId =
      new UserId(
        "user-100",
      );

    assert.equal(
      userId.toString(),
      "user-100",
    );

  },
);

test(
  "UserIds with the same exact value compare equal",
  () => {

    const first =
      new UserId(
        "user-100",
      );

    const same =
      new UserId(
        "user-100",
      );

    assert.equal(
      first.equals(
        same,
      ),
      true,
    );

  },
);

test(
  "UserIds with different values compare unequal",
  () => {

    const first =
      new UserId(
        "user-100",
      );

    const different =
      new UserId(
        "user-200",
      );

    assert.equal(
      first.equals(
        different,
      ),
      false,
    );

  },
);

test(
  "UserId equality is case-sensitive",
  () => {

    const lowerCase =
      new UserId(
        "user-100",
      );

    const upperCase =
      new UserId(
        "USER-100",
      );

    assert.equal(
      lowerCase.equals(
        upperCase,
      ),
      false,
    );

  },
);

test(
  "UserId rejects an empty string",
  () => {

    assertInvalidUserId(
      "",
    );

  },
);

test(
  "UserId rejects a whitespace-only string",
  () => {

    assertInvalidUserId(
      " \t\n ",
    );

  },
);

test(
  "UserId rejects leading whitespace without trimming",
  () => {

    assertInvalidUserId(
      " user-100",
    );

  },
);

test(
  "UserId rejects trailing whitespace without trimming",
  () => {

    assertInvalidUserId(
      "user-100 ",
    );

  },
);
