import {
  UserId,
  type AuthenticationAccountId,
} from "@worktracker/core";

const INVALID_AUTHENTICATION_ACCOUNT_ID_MESSAGE =
  "Authentication account linkage requires a valid AuthenticationAccountId.";

const INVALID_USER_ID_MESSAGE =
  "Authentication account linkage requires an existing canonical UserId.";

function requireAuthenticationAccountId(
  value: AuthenticationAccountId,
): AuthenticationAccountId {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim().length === 0
    || value.trim() !== value
  ) {
    throw new TypeError(
      INVALID_AUTHENTICATION_ACCOUNT_ID_MESSAGE,
    );
  }

  return value;
}

export class AuthenticationAccountLinkage {
  readonly #accountId:
    AuthenticationAccountId;

  readonly #userId:
    UserId;

  private constructor(
    accountId: AuthenticationAccountId,
    userId: UserId,
  ) {
    this.#accountId =
      requireAuthenticationAccountId(
        accountId,
      );

    if (!(userId instanceof UserId)) {
      throw new TypeError(
        INVALID_USER_ID_MESSAGE,
      );
    }

    this.#userId = userId;

    Object.freeze(this);
  }

  public static create(
    accountId: AuthenticationAccountId,
    userId: UserId,
  ): AuthenticationAccountLinkage {
    return new AuthenticationAccountLinkage(
      accountId,
      userId,
    );
  }

  public get accountId():
    AuthenticationAccountId {
    return this.#accountId;
  }

  public get userId(): UserId {
    return this.#userId;
  }
}
