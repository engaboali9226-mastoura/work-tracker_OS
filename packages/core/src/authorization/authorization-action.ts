import { InvalidAuthorizationRequestError } from "./authorization-errors.js";

declare const authorizationActionBrand: unique symbol;

export type AuthorizationAction = string & {
  readonly [authorizationActionBrand]: "AuthorizationAction";
};

const AUTHORIZATION_ACTION_PATTERN = /^[A-Za-z0-9._:-]{3,128}$/;

export function createAuthorizationAction(value: unknown): AuthorizationAction {
  if (
    typeof value !== "string"
    || !AUTHORIZATION_ACTION_PATTERN.test(value)
  ) {
    throw new InvalidAuthorizationRequestError();
  }

  return value as AuthorizationAction;
}
