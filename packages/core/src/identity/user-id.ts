import {
  Identifier,
} from "@worktracker/shared";

const INVALID_USER_ID_MESSAGE =
  "UserId value must be a non-empty string without surrounding whitespace.";

export class InvalidUserIdError
extends Error {

  public constructor() {

    super(
      INVALID_USER_ID_MESSAGE,
    );

    this.name =
      "InvalidUserIdError";

  }

}

export class UserId {

  private readonly identifier:
    Identifier<string>;

  public constructor(
    value: string,
  ) {

    if (value.length === 0) {

      throw new InvalidUserIdError();

    }

    if (value.trim().length === 0) {

      throw new InvalidUserIdError();

    }

    if (value.trim() !== value) {

      throw new InvalidUserIdError();

    }

    this.identifier =
      new Identifier<string>(
        value,
      );

  }

  public getValue(): string {

    return this.identifier
      .getValue();

  }

  public equals(
    other: UserId,
  ): boolean {

    return this.identifier
      .equals(
        other.identifier,
      );

  }

  public toString(): string {

    return this.identifier
      .toString();

  }

}
