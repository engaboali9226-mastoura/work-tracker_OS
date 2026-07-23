import {
    UserDataUnavailableError,
    type UserDataCursor,
    type UserDataPage,
    type UserOwnedRecord,
    type UserScopedRepository,
} from "@worktracker/core";

import type { UserContext } from "../context/user-context.js";
import { UserDataScopeResolver } from "./user-data-scope-resolver.js";

export type UserOwnedRecordFactory<
    TEntity extends UserOwnedRecord
> = (
    ownerUserId: string,
) => TEntity;

export class CurrentUserDataAccess<
    TEntity extends UserOwnedRecord,
    TId,
    TQuery
> {
    public constructor(
        private readonly repository: UserScopedRepository<
            TEntity,
            TId,
            TQuery
        >,
        private readonly scopeResolver:
            UserDataScopeResolver =
                new UserDataScopeResolver(),
    ) {}

    public async findById(
        context: UserContext,
        id: TId,
    ): Promise<TEntity | null> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            return this.repository.findById(
                scope,
                id,
            );
        });
    }

    public async findMany(
        context: UserContext,
        ids: readonly TId[],
    ): Promise<readonly TEntity[]> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            return this.repository.findMany(
                scope,
                ids,
            );
        });
    }

    public async query(
        context: UserContext,
        query: TQuery,
        cursor: UserDataCursor | null,
        limit: number,
    ): Promise<UserDataPage<TEntity>> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            return this.repository.query(
                scope,
                query,
                cursor,
                limit,
            );
        });
    }

    public async count(
        context: UserContext,
        query: TQuery,
    ): Promise<number> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            return this.repository.count(
                scope,
                query,
            );
        });
    }

    public async create(
        context: UserContext,
        factory: UserOwnedRecordFactory<TEntity>,
    ): Promise<TEntity> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            const entity =
                factory(scope.userId);

            this.assertOwnership(
                scope.userId,
                entity,
            );

            await this.repository.insert(
                scope,
                entity,
            );

            return entity;
        });
    }

    public async update(
        context: UserContext,
        entity: TEntity,
    ): Promise<boolean> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            this.assertOwnership(
                scope.userId,
                entity,
            );

            return this.repository.update(
                scope,
                entity,
            );
        });
    }

    public async updateMany(
        context: UserContext,
        entities: readonly TEntity[],
    ): Promise<boolean> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            for (const entity of entities) {
                this.assertOwnership(
                    scope.userId,
                    entity,
                );
            }

            return this.repository.updateMany(
                scope,
                entities,
            );
        });
    }

    public async delete(
        context: UserContext,
        id: TId,
    ): Promise<boolean> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            return this.repository.delete(
                scope,
                id,
            );
        });
    }

    public async deleteMany(
        context: UserContext,
        ids: readonly TId[],
    ): Promise<boolean> {
        return this.execute(async () => {
            const scope =
                this.scopeResolver.resolve(context);

            return this.repository.deleteMany(
                scope,
                ids,
            );
        });
    }

    private assertOwnership(
        userId: string,
        entity: TEntity,
    ): void {
        if (entity.ownerUserId !== userId) {
            throw new UserDataUnavailableError();
        }
    }

    private async execute<TResult>(
        operation: () => Promise<TResult>,
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
