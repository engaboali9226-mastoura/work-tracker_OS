import type { UserDataCursor } from "./user-data-cursor.js";
import type { UserDataPage } from "./user-data-page.js";
import type { UserDataScope } from "./user-data-scope.js";
import type { UserOwnedRecord } from "./user-owned-record.js";

export interface UserScopedRepository<
    TEntity extends UserOwnedRecord,
    TId,
    TQuery
> {
    findById(
        scope: UserDataScope,
        id: TId,
    ): Promise<TEntity | null>;

    findMany(
        scope: UserDataScope,
        ids: readonly TId[],
    ): Promise<readonly TEntity[]>;

    query(
        scope: UserDataScope,
        query: TQuery,
        cursor: UserDataCursor | null,
        limit: number,
    ): Promise<UserDataPage<TEntity>>;

    count(
        scope: UserDataScope,
        query: TQuery,
    ): Promise<number>;

    insert(
        scope: UserDataScope,
        entity: TEntity,
    ): Promise<void>;

    update(
        scope: UserDataScope,
        entity: TEntity,
    ): Promise<boolean>;

    updateMany(
        scope: UserDataScope,
        entities: readonly TEntity[],
    ): Promise<boolean>;

    delete(
        scope: UserDataScope,
        id: TId,
    ): Promise<boolean>;

    deleteMany(
        scope: UserDataScope,
        ids: readonly TId[],
    ): Promise<boolean>;
}
