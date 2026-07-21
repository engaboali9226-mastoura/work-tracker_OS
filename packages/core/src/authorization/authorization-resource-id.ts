import { InvalidAuthorizationRequestError } from "./authorization-errors.js";

declare const authorizationResourceIdBrand: unique symbol;

export type AuthorizationResourceId = string & {
  readonly [authorizationResourceIdBrand]: "AuthorizationResourceId";
};

const AUTHORIZATION_RESOURCE_ID_PATTERN = /^[A-Za-z0-9._:~-]{1,256}$/;

export function createAuthorizationResourceId(
  value: unknown,
): AuthorizationResourceId {
  if (
    typeof value !== "string"
    || !AUTHORIZATION_RESOURCE_ID_PATTERN.test(value)
  ) {
    throw new InvalidAuthorizationRequestError();
  }

  return value as AuthorizationResourceId;
}
