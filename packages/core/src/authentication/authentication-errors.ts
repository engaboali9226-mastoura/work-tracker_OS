const INVALID_AUTHENTICATION_REQUEST_MESSAGE =
  "Authentication request is invalid.";

const INVALID_CREDENTIALS_MESSAGE =
  "Authentication credentials are invalid.";

const AUTHENTICATION_UNAVAILABLE_MESSAGE =
  "Authentication is temporarily unavailable.";

export class InvalidAuthenticationRequestError
extends Error {

  public constructor() {

    super(
      INVALID_AUTHENTICATION_REQUEST_MESSAGE,
    );

    this.name =
      "InvalidAuthenticationRequestError";

  }

}

export class InvalidCredentialsError
extends Error {

  public constructor() {

    super(
      INVALID_CREDENTIALS_MESSAGE,
    );

    this.name =
      "InvalidCredentialsError";

  }

}

export class AuthenticationUnavailableError
extends Error {

  public constructor() {

    super(
      AUTHENTICATION_UNAVAILABLE_MESSAGE,
    );

    this.name =
      "AuthenticationUnavailableError";

  }

}
