import { UserDataUnavailableError } from "./user-data-isolation.errors.js";

function assertExactUserId(userId: string): void {
    if (
        typeof userId !== "string"
        || userId.length === 0
        || userId.trim() !== userId
    ) {
        throw new UserDataUnavailableError();
    }
}

export class UserDataScope {
    public readonly userId: string;

    public constructor(userId: string) {
        assertExactUserId(userId);
        this.userId = userId;
        Object.freeze(this);
    }

    public equals(other: UserDataScope): boolean {
        return (
            other instanceof UserDataScope
            && this.userId === other.userId
        );
    }
}
