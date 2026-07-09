import assert from "node:assert/strict";
import test from "node:test";

import {
  Guard,
  Identifier,
} from "../src/primitives/index.ts";

test(
  "Identifier returns its original value and string representation",
  () => {
    const identifier = new Identifier(123);

    assert.equal(
      identifier.getValue(),
      123,
    );

    assert.equal(
      identifier.toString(),
      "123",
    );
  },
);

test(
  "Identifier compares equal and different values correctly",
  () => {
    const first = new Identifier("task-100");
    const same = new Identifier("task-100");
    const different = new Identifier("task-200");

    assert.equal(
      first.equals(same),
      true,
    );

    assert.equal(
      first.equals(different),
      false,
    );
  },
);

test(
  "Guard rejects null values",
  () => {
    assert.throws(
      () =>
        Guard.againstNullOrUndefined(
          null,
          "value",
        ),
      /value cannot be null or undefined/,
    );
  },
);

test(
  "Guard rejects undefined values",
  () => {
    assert.throws(
      () =>
        Guard.againstNullOrUndefined(
          undefined,
          "value",
        ),
      /value cannot be null or undefined/,
    );
  },
);

test(
  "Guard rejects empty strings",
  () => {
    assert.throws(
      () =>
        Guard.againstEmptyString(
          "",
          "name",
        ),
      /name cannot be empty/,
    );
  },
);

test(
  "Guard rejects whitespace-only strings",
  () => {
    assert.throws(
      () =>
        Guard.againstEmptyString(
          "   ",
          "name",
        ),
      /name cannot be empty/,
    );
  },
);

test(
  "Guard accepts valid values",
  () => {
    assert.doesNotThrow(
      () =>
        Guard.againstNullOrUndefined(
          "valid",
          "value",
        ),
    );

    assert.doesNotThrow(
      () =>
        Guard.againstEmptyString(
          "valid",
          "name",
        ),
    );
  },
);
