import { InvalidAuthorizationRequestError } from "./authorization-errors.js";

declare const entitlementIdBrand: unique symbol;

export type EntitlementId = string & {
  readonly [entitlementIdBrand]: "EntitlementId";
};

const ENTITLEMENT_ID_PATTERN = /^[A-Za-z0-9._~-]{16,256}$/;

export function createEntitlementId(value: unknown): EntitlementId {
  if (
    typeof value !== "string"
    || !ENTITLEMENT_ID_PATTERN.test(value)
  ) {
    throw new InvalidAuthorizationRequestError();
  }

  return value as EntitlementId;
}
