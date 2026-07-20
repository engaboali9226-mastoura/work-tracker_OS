const INVALID_AUTHENTICATION_ACCOUNT_ID_MESSAGE =
  "AuthenticationAccountId value must be a non-empty string without surrounding whitespace.";

declare const authenticationAccountIdBrand:
  unique symbol;

export type AuthenticationAccountId =
  string & {
    readonly [authenticationAccountIdBrand]:
      true;
  };

export function createAuthenticationAccountId(
  value: string,
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

  return value as
    AuthenticationAccountId;

}
