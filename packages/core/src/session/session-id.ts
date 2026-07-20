import { InvalidSessionRequestError } from "./session-errors.js";

declare const sessionIdBrand: unique symbol;

export type SessionId = string & {
  readonly [sessionIdBrand]: "SessionId";
};

const SESSION_ID_PATTERN = /^[A-Za-z0-9._~-]+$/;
const SESSION_ID_MIN_LENGTH = 16;
const SESSION_ID_MAX_LENGTH = 256;

export function createSessionId(value: string): SessionId {
  if (
    typeof value !== "string" ||
    value.length < SESSION_ID_MIN_LENGTH ||
    value.length > SESSION_ID_MAX_LENGTH ||
    !SESSION_ID_PATTERN.test(value)
  ) {
    throw new InvalidSessionRequestError();
  }

  return value as SessionId;
}
