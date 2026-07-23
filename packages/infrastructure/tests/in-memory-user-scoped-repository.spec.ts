import assert from "node:assert/strict";
import test from "node:test";

import {
    UserDataCursor,
    UserDataScope,
    UserDataUnavailableError,
    type UserOwnedRecord,
} from "@worktracker/core";

import {
    InMemoryUserScopedRepository,
} from "../src/repository/in-memory-user-scoped-repository.js";

interface RecordFixture
extends UserOwnedRecord {
    readonly id: string;
    readonly value: string;
}

interface QueryFixture {
    readonly prefix: string;
}

function entity(
    id: string,
    ownerUserId: string,
    value: string,
): RecordFixture {
    return Object.freeze({
        id,
        ownerUserId,
        value,
    });
}

function repository(): InMemoryUserScopedRepository<
    RecordFixture,
    string,
    QueryFixture
> {
    return new InMemoryUserScopedRepository(
        value => value.id,
        (
            value,
            query,
        ) =>
            value.value.startsWith(
                query.prefix,
            ),
    );
}

test("DT-11 insert and lookup preserve the exact same-user reference", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    const record =
        entity(
            "record-1",
            "user-a",
            "alpha",
        );

    await store.insert(
        scope,
        record,
    );

    assert.equal(
        await store.findById(
            scope,
            "record-1",
        ),
        record,
    );
});

test("DT-12 equal record ids remain independent between users", async () => {
    const store =
        repository();

    const firstScope =
        new UserDataScope("user-a");

    const secondScope =
        new UserDataScope("user-b");

    const first =
        entity(
            "record-1",
            "user-a",
            "alpha",
        );

    const second =
        entity(
            "record-1",
            "user-b",
            "beta",
        );

    await store.insert(
        firstScope,
        first,
    );

    await store.insert(
        secondScope,
        second,
    );

    assert.equal(
        await store.findById(
            firstScope,
            "record-1",
        ),
        first,
    );

    assert.equal(
        await store.findById(
            secondScope,
            "record-1",
        ),
        second,
    );
});

test("DT-13 scoped query count and cursor pagination remain isolated", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    await store.insert(
        scope,
        entity(
            "record-1",
            "user-a",
            "alpha-1",
        ),
    );

    await store.insert(
        scope,
        entity(
            "record-2",
            "user-a",
            "alpha-2",
        ),
    );

    await store.insert(
        scope,
        entity(
            "record-3",
            "user-a",
            "alpha-3",
        ),
    );

    const firstPage =
        await store.query(
            scope,
            {
                prefix:
                    "alpha",
            },
            null,
            2,
        );

    assert.equal(firstPage.items.length, 2);
    assert.equal(firstPage.nextCursor?.offset, 2);

    assert.equal(
        firstPage.nextCursor?.userId,
        "user-a",
    );

    assert.equal(
        typeof firstPage.nextCursor
            ?.queryFingerprint,
        "string",
    );

    const secondPage =
        await store.query(
            scope,
            {
                prefix:
                    "alpha",
            },
            firstPage.nextCursor,
            2,
        );

    assert.equal(secondPage.items.length, 1);
    assert.equal(secondPage.nextCursor, null);

    assert.equal(
        await store.count(
            scope,
            {
                prefix:
                    "alpha",
            },
        ),
        3,
    );
});

test("DT-14 findMany preserves requested existing-record order", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    const first =
        entity(
            "record-1",
            "user-a",
            "alpha",
        );

    const second =
        entity(
            "record-2",
            "user-a",
            "beta",
        );

    await store.insert(scope, first);
    await store.insert(scope, second);

    const result =
        await store.findMany(
            scope,
            [
                "record-2",
                "missing",
                "record-1",
            ],
        );

    assert.deepEqual(
        result,
        [
            second,
            first,
        ],
    );

    assert.equal(
        Object.isFrozen(result),
        true,
    );
});

test("DT-15 update and atomic updateMany replace same-scope references", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    await store.insert(
        scope,
        entity(
            "record-1",
            "user-a",
            "old-1",
        ),
    );

    await store.insert(
        scope,
        entity(
            "record-2",
            "user-a",
            "old-2",
        ),
    );

    const firstUpdated =
        entity(
            "record-1",
            "user-a",
            "new-1",
        );

    const secondUpdated =
        entity(
            "record-2",
            "user-a",
            "new-2",
        );

    assert.equal(
        await store.update(
            scope,
            firstUpdated,
        ),
        true,
    );

    assert.equal(
        await store.updateMany(
            scope,
            [
                firstUpdated,
                secondUpdated,
            ],
        ),
        true,
    );

    assert.equal(
        await store.findById(
            scope,
            "record-2",
        ),
        secondUpdated,
    );
});

test("DT-16 delete and atomic deleteMany remove only same-scope data", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    for (const id of [
        "record-1",
        "record-2",
        "record-3",
    ]) {
        await store.insert(
            scope,
            entity(
                id,
                "user-a",
                id,
            ),
        );
    }

    assert.equal(
        await store.delete(
            scope,
            "record-1",
        ),
        true,
    );

    assert.equal(
        await store.deleteMany(
            scope,
            [
                "record-2",
                "record-3",
            ],
        ),
        true,
    );

    assert.equal(
        await store.count(
            scope,
            {
                prefix:
                    "",
            },
        ),
        0,
    );
});

test("DN-11 foreign lookup and absent lookup are indistinguishable", async () => {
    const store =
        repository();

    const ownerScope =
        new UserDataScope("user-a");

    const foreignScope =
        new UserDataScope("user-b");

    await store.insert(
        ownerScope,
        entity(
            "record-1",
            "user-a",
            "alpha",
        ),
    );

    assert.equal(
        await store.findById(
            foreignScope,
            "record-1",
        ),
        null,
    );

    assert.equal(
        await store.findById(
            foreignScope,
            "missing",
        ),
        null,
    );
});

test("DN-12 foreign update returns false and preserves owner data", async () => {
    const store =
        repository();

    const ownerScope =
        new UserDataScope("user-a");

    const foreignScope =
        new UserDataScope("user-b");

    const original =
        entity(
            "record-1",
            "user-a",
            "original",
        );

    await store.insert(
        ownerScope,
        original,
    );

    assert.equal(
        await store.update(
            foreignScope,
            entity(
                "record-1",
                "user-b",
                "foreign",
            ),
        ),
        false,
    );

    assert.equal(
        await store.findById(
            ownerScope,
            "record-1",
        ),
        original,
    );
});

test("DN-13 foreign delete returns false and preserves owner data", async () => {
    const store =
        repository();

    const ownerScope =
        new UserDataScope("user-a");

    const foreignScope =
        new UserDataScope("user-b");

    const original =
        entity(
            "record-1",
            "user-a",
            "original",
        );

    await store.insert(
        ownerScope,
        original,
    );

    assert.equal(
        await store.delete(
            foreignScope,
            "record-1",
        ),
        false,
    );

    assert.equal(
        await store.findById(
            ownerScope,
            "record-1",
        ),
        original,
    );
});

test("DN-14 owner mismatch rejects insert and update generically", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    const foreign =
        entity(
            "record-1",
            "user-b",
            "foreign",
        );

    await assert.rejects(
        () =>
            store.insert(
                scope,
                foreign,
            ),
        UserDataUnavailableError,
    );

    await assert.rejects(
        () =>
            store.update(
                scope,
                foreign,
            ),
        UserDataUnavailableError,
    );
});

test("DN-15 failed bulk operations remain atomic", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    const original =
        entity(
            "record-1",
            "user-a",
            "original",
        );

    await store.insert(
        scope,
        original,
    );

    assert.equal(
        await store.updateMany(
            scope,
            [
                entity(
                    "record-1",
                    "user-a",
                    "changed",
                ),
                entity(
                    "missing",
                    "user-a",
                    "missing",
                ),
            ],
        ),
        false,
    );

    assert.equal(
        await store.findById(
            scope,
            "record-1",
        ),
        original,
    );

    assert.equal(
        await store.deleteMany(
            scope,
            [
                "record-1",
                "missing",
            ],
        ),
        false,
    );

    assert.equal(
        await store.findById(
            scope,
            "record-1",
        ),
        original,
    );
});

test("DN-16 invalid pagination and cross-user cursor reuse fail closed", async () => {
    const store =
        repository();

    const scope =
        new UserDataScope("user-a");

    const first =
        entity(
            "record-1",
            "user-a",
            "alpha-1",
        );

    const second =
        entity(
            "record-2",
            "user-a",
            "alpha-2",
        );

    await store.insert(
        scope,
        first,
    );

    await store.insert(
        scope,
        second,
    );

    await assert.rejects(
        () =>
            store.query(
                scope,
                {
                    prefix:
                        "alpha",
                },
                null,
                0,
            ),
        UserDataUnavailableError,
    );

    const firstPage =
        await store.query(
            scope,
            {
                prefix:
                    "alpha",
            },
            null,
            1,
        );

    const cursor =
        firstPage.nextCursor;

    assert.notEqual(cursor, null);

    if (!cursor) {
        throw new Error(
            "Expected a continuation cursor.",
        );
    }

    await assert.rejects(
        () =>
            store.query(
                new UserDataScope(
                    "user-b",
                ),
                {
                    prefix:
                        "alpha",
                },
                cursor,
                1,
            ),
        UserDataUnavailableError,
    );

    await assert.rejects(
        () =>
            store.query(
                scope,
                {
                    prefix:
                        "beta",
                },
                cursor,
                1,
            ),
        UserDataUnavailableError,
    );

    await assert.rejects(
        () =>
            store.insert(
                scope,
                first,
            ),
        UserDataUnavailableError,
    );

    await assert.rejects(
        () =>
            store.deleteMany(
                scope,
                [
                    "record-1",
                    "record-1",
                ],
            ),
        UserDataUnavailableError,
    );

    assert.equal(
        await store.findById(
            scope,
            "record-1",
        ),
        first,
    );

    assert.equal(
        await store.findById(
            scope,
            "record-2",
        ),
        second,
    );

    assert.equal(
        new UserDataCursor(
            0,
            "user-a",
            "query-alpha",
        ).offset,
        0,
    );
});
