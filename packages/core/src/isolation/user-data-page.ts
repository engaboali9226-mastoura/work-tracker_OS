import type { UserDataCursor } from "./user-data-cursor.js";

export interface UserDataPage<TEntity> {
    readonly items: readonly TEntity[];
    readonly nextCursor: UserDataCursor | null;
}
