import type { UserDataScope } from "./user-data-scope.js";
import { UserDataUnavailableError } from "./user-data-isolation.errors.js";

function assertExactSegment(value: string): void {
    if (
        typeof value !== "string"
        || value.length === 0
        || value.trim() !== value
    ) {
        throw new UserDataUnavailableError();
    }
}

export class UserScopedCacheKey {
    public readonly value: string;

    private constructor(value: string) {
        this.value = value;
        Object.freeze(this);
    }

    public static create(
        scope: UserDataScope,
        namespace: string,
        resourceKey: string,
    ): UserScopedCacheKey {
        assertExactSegment(namespace);
        assertExactSegment(resourceKey);

        return new UserScopedCacheKey(
            JSON.stringify([
                scope.userId,
                namespace,
                resourceKey,
            ]),
        );
    }

    public equals(other: UserScopedCacheKey): boolean {
        return (
            other instanceof UserScopedCacheKey
            && this.value === other.value
        );
    }

    public toString(): string {
        return this.value;
    }
}
