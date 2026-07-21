export const USER_CONTEXT_ERROR_CODES = {
  MISSING: "USER_CONTEXT_MISSING",
  INVALID: "USER_CONTEXT_INVALID",
  MISMATCH: "USER_CONTEXT_MISMATCH",
  SCOPE_VIOLATION: "USER_CONTEXT_SCOPE_VIOLATION",
} as const;

export type UserContextErrorCode =
  (typeof USER_CONTEXT_ERROR_CODES)[keyof typeof USER_CONTEXT_ERROR_CODES];

export class UserContextError extends Error {
  public readonly code: UserContextErrorCode;
  public readonly field?: string;

  public constructor(
    code: UserContextErrorCode,
    message: string,
    field?: string,
  ) {
    super(message);
    this.name = "UserContextError";
    this.code = code;

    if (field !== undefined) {
      this.field = field;
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UserContextMissingError extends UserContextError {
  public constructor(message = "A required user context is missing.") {
    super(USER_CONTEXT_ERROR_CODES.MISSING, message);
    this.name = "UserContextMissingError";
  }
}

export class UserContextInvalidError extends UserContextError {
  public constructor(message: string, field?: string) {
    super(USER_CONTEXT_ERROR_CODES.INVALID, message, field);
    this.name = "UserContextInvalidError";
  }
}

export class UserContextMismatchError extends UserContextError {
  public constructor(
    message = "The nested user context does not match the root execution context.",
  ) {
    super(USER_CONTEXT_ERROR_CODES.MISMATCH, message);
    this.name = "UserContextMismatchError";
  }
}

export class UserContextScopeViolationError extends UserContextError {
  public constructor(
    message = "The user context is outside its valid execution scope.",
  ) {
    super(USER_CONTEXT_ERROR_CODES.SCOPE_VIOLATION, message);
    this.name = "UserContextScopeViolationError";
  }
}
