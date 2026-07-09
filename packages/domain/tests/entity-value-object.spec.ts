import assert from "node:assert/strict";
import test from "node:test";

import {
    AggregateRoot,
    Entity,
    ValueObject,
} from "../src/index.ts";

class TestEntity
extends Entity<string> {

    public constructor(
        id: string,
    ) {

        super(
            id,
        );

    }

}

class TestValueObject<TValue>
extends ValueObject<TValue> {

    public constructor(
        value: TValue,
    ) {

        super(
            value,
        );

    }

}

class TestAggregateRoot
extends AggregateRoot<string> {

    public constructor(
        id: string,
    ) {

        super(
            id,
        );

    }

}

test(
    "Entity preserves and exposes the original id",
    () => {

        const entity =
            new TestEntity(
                "entity-100",
            );

        assert.equal(
            entity.id,
            "entity-100",
        );

    },
);

test(
    "ValueObject preserves and exposes the original value",
    () => {

        const value = {
            code:
                "priority-high",
        };

        const valueObject =
            new TestValueObject(
                value,
            );

        assert.equal(
            valueObject.value,
            value,
        );

    },
);

test(
    "AggregateRoot inherits Entity identity storage",
    () => {

        const aggregate =
            new TestAggregateRoot(
                "aggregate-100",
            );

        assert.equal(
            aggregate.id,
            "aggregate-100",
        );

        assert.equal(
            aggregate instanceof Entity,
            true,
        );

    },
);
