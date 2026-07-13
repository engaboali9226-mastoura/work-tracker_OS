import type {
    Repository,
} from "@worktracker/core";

/**
 * Generic in-memory Repository adapter.
 *
 * Provides deterministic provider-independent persistence behavior
 * through the canonical Core Repository contract.
 */
export class InMemoryRepository<
    TEntity,
    TId,
>
implements Repository<TEntity, TId> {

    private readonly entities =
        new Map<TId, TEntity>();

    constructor(
        private readonly selectId:
            (entity: TEntity) => TId,
    ) {}

    async findById(
        id: TId,
    ): Promise<TEntity | null> {

        if (
            !this.entities.has(id)
        ) {

            return null;

        }

        const entity =
            this.entities.get(id);

        return entity as TEntity;

    }

    async save(
        entity: TEntity,
    ): Promise<void> {

        const id =
            this.selectId(entity);

        this.entities.set(
            id,
            entity,
        );

    }

    async delete(
        id: TId,
    ): Promise<void> {

        this.entities.delete(id);

    }

}
