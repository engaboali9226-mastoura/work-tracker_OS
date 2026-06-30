export interface Repository<TEntity> {

    save(entity: TEntity): Promise<void>;

}
