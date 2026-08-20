import {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
} from "@worktracker/core";

import type {
  SessionSnapshot,
  VerifiedAuthentication,
} from "@worktracker/core";

export interface PrivilegedAuthenticationExecutor {
  execute(
    request:
      Readonly<{
        proof:
          string;
      }>,
  ):
  Promise<VerifiedAuthentication>;
}

export interface PrivilegedSessionCreator {
  execute(
    request:
      Readonly<{
        authentication:
          VerifiedAuthentication;
      }>,
  ):
  Promise<SessionSnapshot>;
}

export interface PrivilegedSessionEstablishmentDependencies {
  readonly isRuntimeRunning:
    () => boolean;

  readonly authenticate:
    PrivilegedAuthenticationExecutor;

  readonly createSession:
    PrivilegedSessionCreator;
}

export class PrivilegedSessionEstablishmentOperation {
  public constructor(
    private readonly dependencies:
      PrivilegedSessionEstablishmentDependencies,
  ) {}

  public async execute(
    input:
      Readonly<{
        proof:
          string;
      }>,
  ): Promise<SessionSnapshot> {
    if (
      !this.dependencies
        .isRuntimeRunning()
    ) {
      throw new AuthenticationUnavailableError();
    }

    if (
      input === null
      || typeof input !== "object"
      || Object.keys(
        input,
      ).length !== 1
      || !Object.prototype.hasOwnProperty.call(
        input,
        "proof",
      )
      || typeof input.proof !== "string"
      || input.proof.length === 0
    ) {
      throw new InvalidAuthenticationRequestError();
    }

    const authentication =
      await this.dependencies
        .authenticate
        .execute({
          proof:
            input.proof,
        });

    return this.dependencies
      .createSession
      .execute({
        authentication,
      });
  }
}
