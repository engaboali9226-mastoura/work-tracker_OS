import assert from "node:assert/strict";
import test from "node:test";

import {
    InMemoryRepository,
} from "../src/repository/in-memory-repository.js";

interface TestEntity {

    readonly id: string;

    readonly value: string;

}

function createRepository():
InMemoryRepository<
    TestEntity,
    string
> {

    return new InMemoryRepository(
        entity => entity.id,
    );

}

test(
    "1. missing lookup returns null",
    async () => {

        const repository =
            createRepository();

        const result =
            await repository.findById(
                "missing",
            );

        assert.equal(
            result,
            null,
        );

    },
);

test(
    "2. save then lookup returns the exact stored entity reference",
    async () => {

        const repository =
            createRepository();

        const entity: TestEntity = {
            id: "entity-100",
            value: "original",
        };

        await repository.save(
            entity,
        );

        const result =
            await repository.findById(
                "entity-100",
            );

        assert.equal(
            result,
            entity,
        );

    },
);

test(
    "3. saving the same selected id replaces the previous entity reference",
    async () => {

        const repository =
            createRepository();

        const original: TestEntity = {
            id: "entity-100",
            value: "original",
        };

        const replacement: TestEntity = {
            id: "entity-100",
            value: "replacement",
        };

        await repository.save(
            original,
        );

        await repository.save(
            replacement,
        );

        const result =
            await repository.findById(
                "entity-100",
            );

        assert.equal(
            result,
            replacement,
        );

        assert.notEqual(
            result,
            original,
        );

    },
);

test(
    "4. different ids remain independent",
    async () => {

        const repository =
            createRepository();

        const alpha: TestEntity = {
            id: "alpha",
            value: "Alpha",
        };

        const beta: TestEntity = {
            id: "beta",
            value: "Beta",
        };

        await repository.save(alpha);
        await repository.save(beta);

        assert.equal(
            await repository.findById(
                "alpha",
            ),
            alpha,
        );

        assert.equal(
            await repository.findById(
                "beta",
            ),
            beta,
        );

    },
);

test(
    "5. deleting a known id removes the entity and future lookup returns null",
    async () => {

        const repository =
            createRepository();

        const entity: TestEntity = {
            id: "entity-100",
            value: "stored",
        };

        await repository.save(
            entity,
        );

        await repository.delete(
            "entity-100",
        );

        assert.equal(
            await repository.findById(
                "entity-100",
            ),
            null,
        );

    },
);

test(
    "6. deleting an unknown id resolves successfully and preserves existing storage state",
    async () => {

        const repository =
            createRepository();

        const entity: TestEntity = {
            id: "entity-100",
            value: "stored",
        };

        await repository.save(
            entity,
        );

        await repository.delete(
            "missing",
        );

        assert.equal(
            await repository.findById(
                "entity-100",
            ),
            entity,
        );

        assert.equal(
            await repository.findById(
                "missing",
            ),
            null,
        );

    },
);

test(
    "7. repeated delete of the same id remains deterministic and successful",
    async () => {

        const repository =
            createRepository();

        const entity: TestEntity = {
            id: "entity-100",
            value: "stored",
        };

        await repository.save(
            entity,
        );

        await repository.delete(
            "entity-100",
        );

        await repository.delete(
            "entity-100",
        );

        await repository.delete(
            "entity-100",
        );

        assert.equal(
            await repository.findById(
                "entity-100",
            ),
            null,
        );

    },
);

test(
    "8. arbitrary generic id types are supported",
    async () => {

        interface NumericEntity {

            readonly sequence: number;

            readonly value: string;

        }

        const repository =
            new InMemoryRepository<
                NumericEntity,
                number
            >(
                entity =>
                    entity.sequence,
            );

        const entity: NumericEntity = {
            sequence: 42,
            value: "numeric identity",
        };

        await repository.save(
            entity,
        );

        assert.equal(
            await repository.findById(
                42,
            ),
            entity,
        );

        assert.equal(
            await repository.findById(
                43,
            ),
            null,
        );

    },
);

test(
    "9. the selector result determines storage identity instead of entity field conventions",
    async () => {

        interface CustomIdentityEntity {

            readonly id: string;

            readonly storageKey: string;

            readonly value: string;

        }

        const repository =
            new InMemoryRepository<
                CustomIdentityEntity,
                string
            >(
                entity =>
                    entity.storageKey,
            );

        const entity:
            CustomIdentityEntity = {
                id: "entity-conventional-id",
                storageKey:
                    "selected-storage-key",
                value: "stored",
            };

        await repository.save(
            entity,
        );

        assert.equal(
            await repository.findById(
                "selected-storage-key",
            ),
            entity,
        );

        assert.equal(
            await repository.findById(
                "entity-conventional-id",
            ),
            null,
        );

    },
);

test(
    "10. selector failure rejects with the original error and preserves existing storage state",
    async () => {

        interface SelectableEntity {

            readonly id: string;

            readonly value: string;

            readonly failSelection?:
                boolean;

        }

        const failure =
            new Error(
                "selector failed",
            );

        const repository =
            new InMemoryRepository<
                SelectableEntity,
                string
            >(
                entity => {

                    if (
                        entity.failSelection
                    ) {

                        throw failure;

                    }

                    return entity.id;

                },
            );

        const existing:
            SelectableEntity = {
                id: "existing",
                value: "preserved",
            };

        await repository.save(
            existing,
        );

        let caught:
            unknown;

        try {

            await repository.save({
                id: "failed",
                value:
                    "must not be stored",
                failSelection: true,
            });

        } catch (error) {

            caught = error;

        }

        assert.equal(
            caught,
            failure,
        );

        assert.equal(
            await repository.findById(
                "existing",
            ),
            existing,
        );

        assert.equal(
            await repository.findById(
                "failed",
            ),
            null,
        );

    },
);

test(
    "11. findById, save and delete preserve the Promise-based Repository contract",
    async () => {

        const repository =
            createRepository();

        const entity: TestEntity = {
            id: "entity-100",
            value: "stored",
        };

        const findPromise =
            repository.findById(
                "missing",
            );

        assert.equal(
            findPromise instanceof Promise,
            true,
        );

        await findPromise;

        const savePromise =
            repository.save(
                entity,
            );

        assert.equal(
            savePromise instanceof Promise,
            true,
        );

        await savePromise;

        const deletePromise =
            repository.delete(
                "entity-100",
            );

        assert.equal(
            deletePromise instanceof Promise,
            true,
        );

        await deletePromise;

    },
);

test(
    "12. the public method surface exposes only canonical Repository operations and no public collection-returning API",
    () => {

        const methods =
            Object.getOwnPropertyNames(
                InMemoryRepository.prototype,
            ).sort();

        assert.deepEqual(
            methods,
            [
                "constructor",
                "delete",
                "findById",
                "save",
            ],
        );

    },
);
