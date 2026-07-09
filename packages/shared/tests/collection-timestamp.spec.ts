import assert from "node:assert/strict";
import test from "node:test";

import {
  Collection,
  Timestamp,
} from "../src/primitives/index.ts";

test(
  "Collection.empty creates an empty collection",
  () => {
    const collection =
      Collection.empty<number>();

    assert.equal(
      collection.size,
      0,
    );

    assert.deepEqual(
      collection.toArray(),
      [],
    );
  },
);

test(
  "Collection copies the input array",
  () => {
    const source = [
      1,
      2,
    ];

    const collection =
      new Collection(source);

    source.push(3);

    assert.deepEqual(
      collection.toArray(),
      [
        1,
        2,
      ],
    );
  },
);

test(
  "Collection.add returns a new collection without mutating the original",
  () => {
    const original =
      new Collection([
        1,
      ]);

    const added =
      original.add(2);

    assert.deepEqual(
      original.toArray(),
      [
        1,
      ],
    );

    assert.deepEqual(
      added.toArray(),
      [
        1,
        2,
      ],
    );
  },
);

test(
  "Collection.remove filters matching items",
  () => {
    const collection =
      new Collection([
        1,
        2,
        3,
        4,
      ]);

    const result =
      collection.remove(
        value => value % 2 === 0,
      );

    assert.deepEqual(
      result.toArray(),
      [
        1,
        3,
      ],
    );
  },
);

test(
  "Collection.map transforms values",
  () => {
    const collection =
      new Collection([
        1,
        2,
        3,
      ]);

    assert.deepEqual(
      collection
        .map(value => value * 10)
        .toArray(),
      [
        10,
        20,
        30,
      ],
    );
  },
);

test(
  "Collection.filter keeps matching values",
  () => {
    const collection =
      new Collection([
        1,
        2,
        3,
        4,
      ]);

    assert.deepEqual(
      collection
        .filter(value => value > 2)
        .toArray(),
      [
        3,
        4,
      ],
    );
  },
);

test(
  "Collection supports iteration",
  () => {
    const collection =
      new Collection([
        "a",
        "b",
        "c",
      ]);

    assert.deepEqual(
      [
        ...collection,
      ],
      [
        "a",
        "b",
        "c",
      ],
    );
  },
);

test(
  "Collection.toArray does not expose internal storage",
  () => {
    const collection =
      new Collection([
        1,
        2,
      ]);

    const snapshot =
      collection.toArray() as number[];

    snapshot.push(3);

    assert.deepEqual(
      collection.toArray(),
      [
        1,
        2,
      ],
    );
  },
);

test(
  "Timestamp preserves a known instant",
  () => {
    const date =
      new Date(
        "2026-07-09T12:34:56.000Z",
      );

    const timestamp =
      new Timestamp(date);

    assert.equal(
      timestamp
        .toDate()
        .getTime(),
      date.getTime(),
    );

    assert.equal(
      timestamp.toISOString(),
      "2026-07-09T12:34:56.000Z",
    );
  },
);

test(
  "Timestamp compares equal and different instants correctly",
  () => {
    const first =
      new Timestamp(
        new Date(
          "2026-07-09T12:00:00.000Z",
        ),
      );

    const same =
      new Timestamp(
        new Date(
          "2026-07-09T12:00:00.000Z",
        ),
      );

    const different =
      new Timestamp(
        new Date(
          "2026-07-09T13:00:00.000Z",
        ),
      );

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
  "Timestamp.toDate does not expose internal Date mutation",
  () => {
    const timestamp =
      new Timestamp(
        new Date(
          "2026-07-09T12:00:00.000Z",
        ),
      );

    const exposed =
      timestamp.toDate();

    exposed.setUTCFullYear(2030);

    assert.equal(
      timestamp.toISOString(),
      "2026-07-09T12:00:00.000Z",
    );
  },
);
