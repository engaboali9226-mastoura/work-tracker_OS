export class UserDataUnavailableError extends Error {
    public constructor() {
        super("User data is unavailable.");
        this.name = "UserDataUnavailableError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
