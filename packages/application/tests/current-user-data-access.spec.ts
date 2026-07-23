import assert from "node:assert/strict";
import test from "node:test";

import {
    UserDataCursor,
    UserDataScope,
    UserDataUnavailableError,
    type UserDataPage,
    type UserOwnedRecord,
    type UserScopedRepository,
} from "@worktracker/core";

import type {
    UserContext,
} from "../src/context/user-context.js";

import {
    CurrentUserDataAccess,
} from "../src/isolation/index.js";

interface RecordFixture
extends UserOwnedRecord {
    readonly id: string;
    readonly value: string;
}

interface QueryFixture {
    readonly prefix: string;
}

function context(
    userId: string,
): UserContext {
    return Object.freeze({
        userId,
        principalKind:
            "user" as UserContext["principalKind"],
        correlationId:
            `correlation-${userId}`,
        attributes:
            Object.freeze({}),
    });
}

class RepositorySpy
implements UserScopedRepository<
    RecordFixture,
    string,
    QueryFixture
> {
    public readonly scopes:
        UserDataScope[] = [];

    public insertCalls = 0;
    public updateCalls = 0;
    public updateManyCalls = 0;

    public throwUnknown = false;

    public async findById(
        scope: UserDataScope,
        id: string,
    ): Promise<RecordFixture | null> {
        this.capture(scope);

        if (this.throwUnknown) {
            throw new Error("provider detail");
        }

        return Object.freeze({
            id,
            ownerUserId:
                scope.userId,
            value:
                "found",
        });
    }

    public async findMany(
        scope: UserDataScope,
        ids: readonly string[],
    ): Promise<readonly RecordFixture[]> {
        this.capture(scope);

        return ids.map(
            id =>
                Object.freeze({
                    id,
                    ownerUserId:
                        scope.userId,
                    value:
                        "many",
                }),
        );
    }

    public async query(
        scope: UserDataScope,
        _query: QueryFixture,
        _cursor: UserDataCursor | null,
        _limit: number,
    ): Promise<UserDataPage<RecordFixture>> {
        this.capture(scope);

        return Object.freeze({
            items:
                Object.freeze([]),
            nextCursor:
                null,
        });
    }

    public async count(
        scope: UserDataScope,
        _query: QueryFixture,
    ): Promise<number> {
        this.capture(scope);
        return 2;
    }

    public async insert(
        scope: UserDataScope,
        _entity: RecordFixture,
    ): Promise<void> {
        this.capture(scope);
        this.insertCalls += 1;
    }

    public async update(
        scope: UserDataScope,
        _entity: RecordFixture,
    ): Promise<boolean> {
        this.capture(scope);
        this.updateCalls += 1;
        return true;
    }

    public async updateMany(
        scope: UserDataScope,
        _entities: readonly RecordFixture[],
    ): Promise<boolean> {
        this.capture(scope);
        this.updateManyCalls += 1;
        return true;
    }

    public async delete(
        scope: UserDataScope,
        _id: string,
    ): Promise<boolean> {
        this.capture(scope);
        return true;
    }

    public async deleteMany(
        scope: UserDataScope,
        _ids: readonly string[],
    ): Promise<boolean> {
        this.capture(scope);
        return true;
    }

    private capture(
        scope: UserDataScope,
    ): void {
        this.scopes.push(scope);
    }
}

test("DT-08 create injects the trusted current user identity", async () => {
    const repository =
        new RepositorySpy();

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    const created =
        await access.create(
            context("user-a"),
            ownerUserId =>
                Object.freeze({
                    id:
                        "record-1",
                    ownerUserId,
                    value:
                        "created",
                }),
        );

    assert.equal(
        created.ownerUserId,
        "user-a",
    );

    assert.equal(
        repository.insertCalls,
        1,
    );

    assert.equal(
        repository.scopes[0]?.userId,
        "user-a",
    );
});

test("DT-09 read query and count derive one scope per operation", async () => {
    const repository =
        new RepositorySpy();

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    const current =
        context("user-a");

    await access.findById(
        current,
        "record-1",
    );

    await access.findMany(
        current,
        ["record-1"],
    );

    await access.query(
        current,
        {
            prefix:
                "r",
        },
        null,
        10,
    );

    const count =
        await access.count(
            current,
            {
                prefix:
                    "r",
            },
        );

    assert.equal(count, 2);
    assert.equal(repository.scopes.length, 4);

    assert.deepEqual(
        repository.scopes.map(
            scope => scope.userId,
        ),
        [
            "user-a",
            "user-a",
            "user-a",
            "user-a",
        ],
    );
});

test("DT-10 update and delete operations preserve repository outcomes", async () => {
    const repository =
        new RepositorySpy();

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    const current =
        context("user-a");

    const entity =
        Object.freeze({
            id:
                "record-1",
            ownerUserId:
                "user-a",
            value:
                "updated",
        });

    assert.equal(
        await access.update(
            current,
            entity,
        ),
        true,
    );

    assert.equal(
        await access.updateMany(
            current,
            [entity],
        ),
        true,
    );

    assert.equal(
        await access.delete(
            current,
            "record-1",
        ),
        true,
    );

    assert.equal(
        await access.deleteMany(
            current,
            ["record-1"],
        ),
        true,
    );
});

test("DN-07 create cannot substitute a foreign owner", async () => {
    const repository =
        new RepositorySpy();

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    await assert.rejects(
        () =>
            access.create(
                context("user-a"),
                () =>
                    Object.freeze({
                        id:
                            "record-1",
                        ownerUserId:
                            "user-b",
                        value:
                            "foreign",
                    }),
            ),
        UserDataUnavailableError,
    );

    assert.equal(
        repository.insertCalls,
        0,
    );
});

test("DN-08 foreign update is rejected before repository access", async () => {
    const repository =
        new RepositorySpy();

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    await assert.rejects(
        () =>
            access.update(
                context("user-a"),
                Object.freeze({
                    id:
                        "record-1",
                    ownerUserId:
                        "user-b",
                    value:
                        "foreign",
                }),
            ),
        UserDataUnavailableError,
    );

    assert.equal(
        repository.updateCalls,
        0,
    );
});

test("DN-09 mixed-owner bulk update is rejected atomically", async () => {
    const repository =
        new RepositorySpy();

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    await assert.rejects(
        () =>
            access.updateMany(
                context("user-a"),
                [
                    Object.freeze({
                        id:
                            "record-1",
                        ownerUserId:
                            "user-a",
                        value:
                            "allowed",
                    }),
                    Object.freeze({
                        id:
                            "record-2",
                        ownerUserId:
                            "user-b",
                        value:
                            "foreign",
                    }),
                ],
            ),
        UserDataUnavailableError,
    );

    assert.equal(
        repository.updateManyCalls,
        0,
    );
});

test("DN-10 unknown repository failures expose no provider detail", async () => {
    const repository =
        new RepositorySpy();

    repository.throwUnknown = true;

    const access =
        new CurrentUserDataAccess(
            repository,
        );

    await assert.rejects(
        () =>
            access.findById(
                context("user-a"),
                "record-1",
            ),
        error => {
            assert.equal(
                error
                    instanceof UserDataUnavailableError,
                true,
            );

            const unavailableError =
                error as UserDataUnavailableError;

            assert.equal(
                unavailableError.message,
                "User data is unavailable.",
            );

            return true;
        },
    );
});
