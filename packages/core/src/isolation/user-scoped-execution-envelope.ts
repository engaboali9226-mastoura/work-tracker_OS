import type { UserDataScope } from "./user-data-scope.js";

export class UserScopedExecutionEnvelope<TPayload> {
    public readonly scope: UserDataScope;
    public readonly payload: TPayload;

    public constructor(
        scope: UserDataScope,
        payload: TPayload,
    ) {
        this.scope = scope;
        this.payload = payload;
        Object.freeze(this);
    }
}
