import {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
  InvalidCredentialsError,
  type AuthenticationVerifier,
  type VerifiedAuthentication,
} from "@worktracker/core";

import type {
  UseCase,
} from "../use-case/use-case.js";

import type {
  AuthenticationRequest,
} from "./authentication-request.js";

export class Authenticate<
  Proof
>
implements UseCase<
  AuthenticationRequest<Proof>,
  VerifiedAuthentication
> {

  public constructor(
    private readonly verifier:
      AuthenticationVerifier<Proof>,
  ) {}

  public async execute(
    request:
      AuthenticationRequest<Proof>,
  ): Promise<VerifiedAuthentication> {

    if (
      typeof request !== "object"
      || request === null
      || !Object.prototype.hasOwnProperty.call(
        request,
        "proof",
      )
      || request.proof === undefined
    ) {

      throw new InvalidAuthenticationRequestError();

    }

    try {

      return await this.verifier.verify(
        request.proof,
      );

    } catch (error: unknown) {

      if (
        error instanceof InvalidCredentialsError
        || error instanceof AuthenticationUnavailableError
      ) {

        throw error;

      }

      throw new AuthenticationUnavailableError();

    }

  }

}
