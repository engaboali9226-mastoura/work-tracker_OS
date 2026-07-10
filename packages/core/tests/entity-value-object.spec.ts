import assert from "node:assert/strict";
import test from "node:test";

import {
  Entity,
  ValueObject,
} from "../src/index.ts";

import {
  Identifier,
} from "../../shared/src/index.ts";

class TestEntity
extends Entity<string> {

  public constructor(
    id: Identifier<string>,
  ) {

    super(
      id,
    );

  }

}

class TestValueObject<T>
extends ValueObject<T> {

  public constructor(
    props: T,
  ) {

    super(
      props,
    );

  }

}

test(
  "Entity preserves the exact Identifier reference",
  () => {

    const identifier =
      new Identifier(
        "entity-100",
      );

    const entity =
      new TestEntity(
        identifier,
      );

    assert.equal(
      entity.id,
      identifier,
    );

  },
);

test(
  "Entity compares equal and different identifiers correctly",
  () => {

    const first =
      new TestEntity(
        new Identifier(
          "entity-100",
        ),
      );

    const same =
      new TestEntity(
        new Identifier(
          "entity-100",
        ),
      );

    const different =
      new TestEntity(
        new Identifier(
          "entity-200",
        ),
      );

    assert.equal(
      first.equals(
        same,
      ),
      true,
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
  "ValueObject compares equal and different props correctly",
  () => {

    const first =
      new TestValueObject({
        priority: "high",
        active: true,
      });

    const same =
      new TestValueObject({
        priority: "high",
        active: true,
      });

    const different =
      new TestValueObject({
        priority: "low",
        active: true,
      });

    assert.equal(
      first.equals(
        same,
      ),
      true,
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
  "ValueObject preserves current property-order-sensitive JSON semantics",
  () => {

    const first =
      new TestValueObject({
        a: 1,
        b: 2,
      });

    const differentOrder =
      new TestValueObject({
        b: 2,
        a: 1,
      });

    assert.equal(
      first.equals(
        differentOrder,
      ),
      false,
    );

  },
);
