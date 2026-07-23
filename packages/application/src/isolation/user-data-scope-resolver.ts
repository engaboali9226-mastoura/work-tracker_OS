import {
    UserDataScope,
    UserDataUnavailableError,
} from "@worktracker/core";

import type { UserContext } from "../context/user-context.js";

export class UserDataScopeResolver {
    public resolve(context: UserContext): UserDataScope {
        const candidate =
            context as Partial<UserContext> | null | undefined;

        const userId =
            candidate?.userId;

        if (typeof userId !== "string") {
            throw new UserDataUnavailableError();
        }

        return new UserDataScope(userId);
    }
}
