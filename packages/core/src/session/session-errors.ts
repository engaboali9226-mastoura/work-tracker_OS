export class InvalidSessionRequestError extends Error {
  public constructor() {
    super(
      "Invalid session request.",
    );
    this.name = "InvalidSessionRequestError";
  }
}

export class InvalidSessionError extends Error {
  public constructor() {
    super(
      "Invalid session.",
    );
    this.name = "InvalidSessionError";
  }
}

export class SessionUnavailableError extends Error {
  public constructor() {
    super(
      "Session service is unavailable.",
    );
    this.name = "SessionUnavailableError";
  }
}
