import { InvalidAuthorizationRequestError } from "./authorization-errors.js";

declare const authorizationResourceTypeBrand: unique symbol;

export type AuthorizationResourceType = string & {
  readonly [authorizationResourceTypeBrand]: "AuthorizationResourceType";
};

const AUTHORIZATION_RESOURCE_TYPE_PATTERN = /^[A-Za-z0-9._:-]{1,64}$/;

export function createAuthorizationResourceType(
  value: unknown,
): AuthorizationResourceType {
  if (
    typeof value !== "string"
    || !AUTHORIZATION_RESOURCE_TYPE_PATTERN.test(value)
  ) {
    throw new InvalidAuthorizationRequestError();
  }

  return value as AuthorizationResourceType;
}
