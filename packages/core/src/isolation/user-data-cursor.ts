import type { UserDataScope } from "./user-data-scope.js";
import { UserDataUnavailableError } from "./user-data-isolation.errors.js";

function assertExactBinding(
    value: string,
): void {
    if (
        typeof value !== "string"
        || value.length === 0
        || value.trim() !== value
    ) {
        throw new UserDataUnavailableError();
    }
}

export class UserDataCursor {
    public readonly offset: number;
    public readonly userId: string;
    public readonly queryFingerprint: string;

    public constructor(
        offset: number,
        userId: string,
        queryFingerprint: string,
    ) {
        if (
            !Number.isSafeInteger(offset)
            || offset < 0
        ) {
            throw new UserDataUnavailableError();
        }

        assertExactBinding(userId);
        assertExactBinding(queryFingerprint);

        this.offset = offset;
        this.userId = userId;
        this.queryFingerprint = queryFingerprint;

        Object.freeze(this);
    }

    public static start(
        scope: UserDataScope,
        queryFingerprint: string,
    ): UserDataCursor {
        return new UserDataCursor(
            0,
            scope.userId,
            queryFingerprint,
        );
    }

    public matches(
        scope: UserDataScope,
        queryFingerprint: string,
    ): boolean {
        return (
            this.userId === scope.userId
            && this.queryFingerprint === queryFingerprint
        );
    }

    public equals(
        other: UserDataCursor,
    ): boolean {
        return (
            other instanceof UserDataCursor
            && this.offset === other.offset
            && this.userId === other.userId
            && this.queryFingerprint
                === other.queryFingerprint
        );
    }
}
