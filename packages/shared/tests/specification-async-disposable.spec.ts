import assert from "node:assert/strict";
import test from "node:test";

import {
  CompositeSpecification,
  disposeAll,
  disposeAllAsync,
  fromPromise,
} from "../src/primitives/index.ts";

class NumberSpecification
  extends CompositeSpecification<number> {

  public constructor(
    private readonly predicate:
      (candidate: number) => boolean,
  ) {
    super();
  }

  public isSatisfiedBy(
    candidate: number,
  ): boolean {
    return this.predicate(candidate);
  }
}

test(
  "CompositeSpecification.and requires both specifications",
  () => {
    const positive =
      new NumberSpecification(
        value => value > 0,
      );

    const even =
      new NumberSpecification(
        value => value % 2 === 0,
      );

    const specification =
      positive.and(even);

    assert.equal(
      specification.isSatisfiedBy(4),
      true,
    );

    assert.equal(
      specification.isSatisfiedBy(3),
      false,
    );

    assert.equal(
      specification.isSatisfiedBy(-2),
      false,
    );
  },
);

test(
  "CompositeSpecification.or accepts either specification",
  () => {
    const negative =
      new NumberSpecification(
        value => value < 0,
      );

    const even =
      new NumberSpecification(
        value => value % 2 === 0,
      );

    const specification =
      negative.or(even);

    assert.equal(
      specification.isSatisfiedBy(-3),
      true,
    );

    assert.equal(
      specification.isSatisfiedBy(4),
      true,
    );

    assert.equal(
      specification.isSatisfiedBy(3),
      false,
    );
  },
);

test(
  "CompositeSpecification.not negates the specification",
  () => {
    const positive =
      new NumberSpecification(
        value => value > 0,
      );

    const specification =
      positive.not();

    assert.equal(
      specification.isSatisfiedBy(-1),
      true,
    );

    assert.equal(
      specification.isSatisfiedBy(1),
      false,
    );
  },
);

test(
  "fromPromise converts a resolved promise into success",
  async () => {
    const result =
      await fromPromise(
        Promise.resolve("done"),
      );

    assert.deepEqual(
      result,
      {
        ok: true,
        value: "done",
      },
    );
  },
);

test(
  "fromPromise converts a rejected promise into failure",
  async () => {
    const error =
      new Error("rejected");

    const result =
      await fromPromise(
        Promise.reject(error),
      );

    assert.equal(
      result.ok,
      false,
    );

    if (!result.ok) {
      assert.equal(
        result.error,
        error,
      );
    }
  },
);

test(
  "disposeAll invokes every synchronous disposable",
  () => {
    const calls: string[] = [];

    disposeAll(
      {
        dispose() {
          calls.push("first");
        },
      },
      {
        dispose() {
          calls.push("second");
        },
      },
    );

    assert.deepEqual(
      calls,
      [
        "first",
        "second",
      ],
    );
  },
);

test(
  "disposeAllAsync awaits every asynchronous disposable",
  async () => {
    const calls: string[] = [];

    await disposeAllAsync(
      {
        async dispose() {
          await Promise.resolve();
          calls.push("first");
        },
      },
      {
        async dispose() {
          await Promise.resolve();
          calls.push("second");
        },
      },
    );

    assert.deepEqual(
      calls,
      [
        "first",
        "second",
      ],
    );
  },
);
