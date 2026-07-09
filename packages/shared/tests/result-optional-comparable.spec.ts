import assert from "node:assert/strict";
import test from "node:test";

import {
  equals,
  failure,
  greaterThan,
  lessThan,
  none,
  some,
  success,
} from "../src/primitives/index.ts";

import type {
  Comparable,
} from "../src/primitives/index.ts";

class NumberComparable
  implements Comparable<NumberComparable> {

  public constructor(
    private readonly value: number,
  ) {}

  public compareTo(
    other: NumberComparable,
  ): number {
    return this.value - other.value;
  }
}

test(
  "some returns a populated Optional",
  () => {
    const result = some({
      task: "TASK-100",
    });

    assert.equal(
      result.hasValue,
      true,
    );

    assert.deepEqual(
      result.value,
      {
        task: "TASK-100",
      },
    );
  },
);

test(
  "none returns an empty Optional",
  () => {
    assert.deepEqual(
      none(),
      {
        hasValue: false,
      },
    );
  },
);

test(
  "success returns a successful Result with the original value",
  () => {
    assert.deepEqual(
      success(42),
      {
        ok: true,
        value: 42,
      },
    );
  },
);

test(
  "failure returns a failed Result with the original error",
  () => {
    const error = new Error("failed");

    const result = failure(error);

    assert.equal(
      result.ok,
      false,
    );

    assert.equal(
      result.error,
      error,
    );
  },
);

test(
  "equals returns true when compareTo returns zero",
  () => {
    assert.equal(
      equals(
        new NumberComparable(10),
        new NumberComparable(10),
      ),
      true,
    );
  },
);

test(
  "greaterThan returns true for a greater comparable value",
  () => {
    assert.equal(
      greaterThan(
        new NumberComparable(20),
        new NumberComparable(10),
      ),
      true,
    );
  },
);

test(
  "lessThan returns true for a smaller comparable value",
  () => {
    assert.equal(
      lessThan(
        new NumberComparable(5),
        new NumberComparable(10),
      ),
      true,
    );
  },
);
