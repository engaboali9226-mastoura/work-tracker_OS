import {
    UserDataCursor,
    UserDataScope,
    UserDataUnavailableError,
    type UserDataPage,
    type UserOwnedRecord,
    type UserScopedRepository,
} from "@worktracker/core";

import {
    createHash,
} from "node:crypto";

function serializeQueryScope(
    value: unknown,
    active: Set<object>,
): string {
    if (value === null) {
        return "null";
    }

    switch (typeof value) {
        case "string":
            return `string:${JSON.stringify(value)}`;

        case "boolean":
            return value
                ? "boolean:true"
                : "boolean:false";

        case "number":
            if (!Number.isFinite(value)) {
                throw new UserDataUnavailableError();
            }

            return `number:${String(value)}`;

        case "object":
            break;

        default:
            throw new UserDataUnavailableError();
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            throw new UserDataUnavailableError();
        }

        return `date:${value.toISOString()}`;
    }

    if (active.has(value)) {
        throw new UserDataUnavailableError();
    }

    active.add(value);

    try {
        if (Array.isArray(value)) {
            return (
                "array:["
                + value
                    .map(
                        item =>
                            serializeQueryScope(
                                item,
                                active,
                            ),
                    )
                    .join(",")
                + "]"
            );
        }

        const prototype =
            Object.getPrototypeOf(value);

        if (
            prototype !== Object.prototype
            && prototype !== null
        ) {
            throw new UserDataUnavailableError();
        }

        const descriptors =
            Object.getOwnPropertyDescriptors(
                value,
            );

        const keys =
            Reflect.ownKeys(descriptors);

        if (
            keys.some(
                key =>
                    typeof key === "symbol",
            )
        ) {
            throw new UserDataUnavailableError();
        }

        const stringKeys =
            keys
                .map(key => String(key))
                .sort();

        const serializedEntries =
            stringKeys.map(key => {
                const descriptor =
                    descriptors[key];

                if (
                    !descriptor
                    || !("value" in descriptor)
                ) {
                    throw new UserDataUnavailableError();
                }

                return (
                    `${JSON.stringify(key)}:`
                    + serializeQueryScope(
                        descriptor.value,
                        active,
                    )
                );
            });

        return (
            "object:{"
            + serializedEntries.join(",")
            + "}"
        );
    } finally {
        active.delete(value);
    }
}

function createQueryFingerprint(
    query: unknown,
): string {
    const serialized =
        serializeQueryScope(
            query,
            new Set<object>(),
        );

    return createHash("sha256")
        .update(serialized)
        .digest("hex");
}

export type UserScopedEntityIdSelector<
    TEntity,
    TId
> = (
    entity: TEntity,
) => TId;

export type UserScopedQueryMatcher<
    TEntity,
    TQuery
> = (
    entity: TEntity,
    query: TQuery,
) => boolean;

export class InMemoryUserScopedRepository<
    TEntity extends UserOwnedRecord,
    TId,
    TQuery
> implements UserScopedRepository<
    TEntity,
    TId,
    TQuery
> {
    private readonly records =
        new Map<
            string,
            Map<TId, TEntity>
        >();

    public constructor(
        private readonly selectId:
            UserScopedEntityIdSelector<
                TEntity,
                TId
            >,
        private readonly matchesQuery:
            UserScopedQueryMatcher<
                TEntity,
                TQuery
            > =
                () => true,
    ) {}

    public async findById(
        scope: UserDataScope,
        id: TId,
    ): Promise<TEntity | null> {
        return this.execute(() => {
            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            return (
                bucket?.get(id)
                ?? null
            );
        });
    }

    public async findMany(
        scope: UserDataScope,
        ids: readonly TId[],
    ): Promise<readonly TEntity[]> {
        return this.execute(() => {
            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            if (!bucket) {
                return Object.freeze(
                    [] as TEntity[],
                );
            }

            const entities: TEntity[] = [];

            for (const id of ids) {
                const entity =
                    bucket.get(id);

                if (entity) {
                    entities.push(entity);
                }
            }

            return Object.freeze([
                ...entities,
            ]);
        });
    }

    public async query(
        scope: UserDataScope,
        query: TQuery,
        cursor: UserDataCursor | null,
        limit: number,
    ): Promise<UserDataPage<TEntity>> {
        return this.execute(() => {
            const queryFingerprint =
                createQueryFingerprint(query);

            this.assertPagination(
                scope,
                cursor,
                queryFingerprint,
                limit,
            );

            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            const matched =
                bucket
                    ? [...bucket.values()]
                        .filter(
                            entity =>
                                this.matchesQuery(
                                    entity,
                                    query,
                                ),
                        )
                    : [];

            const offset =
                cursor?.offset ?? 0;

            const end =
                Math.min(
                    offset + limit,
                    matched.length,
                );

            const items =
                Object.freeze(
                    matched.slice(
                        offset,
                        end,
                    ),
                );

            const nextCursor =
                end < matched.length
                    ? new UserDataCursor(
                        end,
                        scope.userId,
                        queryFingerprint,
                    )
                    : null;

            return Object.freeze({
                items,
                nextCursor,
            });
        });
    }

    public async count(
        scope: UserDataScope,
        query: TQuery,
    ): Promise<number> {
        return this.execute(() => {
            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            if (!bucket) {
                return 0;
            }

            let count = 0;

            for (
                const entity
                of bucket.values()
            ) {
                if (
                    this.matchesQuery(
                        entity,
                        query,
                    )
                ) {
                    count += 1;
                }
            }

            return count;
        });
    }

    public async insert(
        scope: UserDataScope,
        entity: TEntity,
    ): Promise<void> {
        return this.execute(() => {
            this.assertOwnership(
                scope,
                entity,
            );

            const id =
                this.selectId(entity);

            const bucket =
                this.getRequiredBucket(scope);

            if (bucket.has(id)) {
                throw new UserDataUnavailableError();
            }

            bucket.set(
                id,
                entity,
            );
        });
    }

    public async update(
        scope: UserDataScope,
        entity: TEntity,
    ): Promise<boolean> {
        return this.execute(() => {
            this.assertOwnership(
                scope,
                entity,
            );

            const id =
                this.selectId(entity);

            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            if (
                !bucket
                || !bucket.has(id)
            ) {
                return false;
            }

            bucket.set(
                id,
                entity,
            );

            return true;
        });
    }

    public async updateMany(
        scope: UserDataScope,
        entities: readonly TEntity[],
    ): Promise<boolean> {
        return this.execute(() => {
            const planned =
                entities.map(entity => {
                    this.assertOwnership(
                        scope,
                        entity,
                    );

                    return {
                        id:
                            this.selectId(
                                entity,
                            ),
                        entity,
                    };
                });

            this.assertUniqueIds(
                planned.map(
                    value => value.id,
                ),
            );

            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            if (
                !bucket
                || planned.some(
                    value =>
                        !bucket.has(
                            value.id,
                        ),
                )
            ) {
                return false;
            }

            for (const value of planned) {
                bucket.set(
                    value.id,
                    value.entity,
                );
            }

            return true;
        });
    }

    public async delete(
        scope: UserDataScope,
        id: TId,
    ): Promise<boolean> {
        return this.execute(() => {
            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            if (!bucket) {
                return false;
            }

            return bucket.delete(id);
        });
    }

    public async deleteMany(
        scope: UserDataScope,
        ids: readonly TId[],
    ): Promise<boolean> {
        return this.execute(() => {
            this.assertUniqueIds(ids);

            const bucket =
                this.getBucket(
                    scope,
                    false,
                );

            if (
                !bucket
                || ids.some(
                    id =>
                        !bucket.has(id),
                )
            ) {
                return false;
            }

            for (const id of ids) {
                bucket.delete(id);
            }

            return true;
        });
    }

    private getRequiredBucket(
        scope: UserDataScope,
    ): Map<TId, TEntity> {
        const existing =
            this.getBucket(
                scope,
                true,
            );

        if (!existing) {
            throw new UserDataUnavailableError();
        }

        return existing;
    }

    private getBucket(
        scope: UserDataScope,
        create: boolean,
    ): Map<TId, TEntity> | undefined {
        this.assertScope(scope);

        const existing =
            this.records.get(
                scope.userId,
            );

        if (
            existing
            || !create
        ) {
            return existing;
        }

        const created =
            new Map<TId, TEntity>();

        this.records.set(
            scope.userId,
            created,
        );

        return created;
    }

    private assertScope(
        scope: UserDataScope,
    ): void {
        if (
            !(scope instanceof UserDataScope)
        ) {
            throw new UserDataUnavailableError();
        }
    }

    private assertOwnership(
        scope: UserDataScope,
        entity: TEntity,
    ): void {
        if (
            entity.ownerUserId
            !== scope.userId
        ) {
            throw new UserDataUnavailableError();
        }
    }

    private assertPagination(
        scope: UserDataScope,
        cursor: UserDataCursor | null,
        queryFingerprint: string,
        limit: number,
    ): void {
        if (
            cursor !== null
            && !(cursor instanceof UserDataCursor)
        ) {
            throw new UserDataUnavailableError();
        }

        if (
            cursor !== null
            && (
                cursor.userId !== scope.userId
                || cursor.queryFingerprint
                    !== queryFingerprint
            )
        ) {
            throw new UserDataUnavailableError();
        }

        if (
            !Number.isSafeInteger(limit)
            || limit <= 0
        ) {
            throw new UserDataUnavailableError();
        }
    }

    private assertUniqueIds(
        ids: readonly TId[],
    ): void {
        if (
            new Set(ids).size
            !== ids.length
        ) {
            throw new UserDataUnavailableError();
        }
    }

    private async execute<TResult>(
        operation:
            () => TResult | Promise<TResult>,
    ): Promise<TResult> {
        try {
            return await operation();
        } catch (error) {
            if (
                error
                instanceof UserDataUnavailableError
            ) {
                throw error;
            }

            throw new UserDataUnavailableError();
        }
    }
}
