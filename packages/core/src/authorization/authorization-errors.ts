"use strict";

export class InvalidAuthorizationRequestError extends Error {
  public constructor() {
    super("Invalid authorization request.");
    this.name = "InvalidAuthorizationRequestError";
  }
}

export class AuthorizationDeniedError extends Error {
  public constructor() {
    super("Authorization denied.");
    this.name = "AuthorizationDeniedError";
  }
}

export class EntitlementConflictError extends Error {
  public constructor() {
    super("Entitlement already exists.");
    this.name = "EntitlementConflictError";
  }
}

export class AuthorizationUnavailableError extends Error {
  public constructor() {
    super("Authorization service is unavailable.");
    this.name = "AuthorizationUnavailableError";
  }
}
