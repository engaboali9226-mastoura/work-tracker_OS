import {
  createAuthenticationAccountId,
  createSessionSnapshot,
  InvalidSessionRequestError,
  SessionUnavailableError,
  type AuthenticationAccountId,
  type Clock,
  type SessionId,
  type SessionIdGenerator,
  type SessionLifetimePolicy,
  type SessionRepository,
  type SessionSnapshot,
  type VerifiedAuthentication,
} from "@worktracker/core";
import type { UseCase } from "../use-case/use-case.js";

export interface CreateSessionRequest {
  readonly authentication: VerifiedAuthentication;
}

function requireAuthenticationAccountId(
  input: CreateSessionRequest,
): AuthenticationAccountId {
  if (
    input === null ||
    typeof input !== "object"
  ) {
    throw new InvalidSessionRequestError();
  }

  const authentication =
    (
      input as {
        readonly authentication?: unknown;
      }
    ).authentication;

  if (
    authentication === null ||
    typeof authentication !== "object"
  ) {
    throw new InvalidSessionRequestError();
  }

  const accountId =
    (
      authentication as {
        readonly accountId?: unknown;
      }
    ).accountId;

  try {
    return createAuthenticationAccountId(
      accountId as string,
    );
  } catch {
    throw new InvalidSessionRequestError();
  }
}

function readClockEpochMs(
  clock: Clock,
): number {
  const epochMs =
    clock
      .now()
      .toDate()
      .getTime();

  if (
    !Number.isSafeInteger(
      epochMs,
    ) ||
    epochMs < 0
  ) {
    throw new Error(
      "Clock returned an invalid timestamp.",
    );
  }

  return epochMs;
}

export class CreateSession
implements UseCase<CreateSessionRequest, SessionSnapshot> {
  public constructor(
    private readonly sessionIdGenerator: SessionIdGenerator,
    private readonly clock: Clock,
    private readonly lifetimePolicy: SessionLifetimePolicy,
    private readonly repository: SessionRepository,
  ) {}

  public async execute(
    input: CreateSessionRequest,
  ): Promise<SessionSnapshot> {
    const accountId =
      requireAuthenticationAccountId(
        input,
      );

    let id: SessionId;

    try {
      id =
        await this.sessionIdGenerator.generate();
    } catch {
      throw new SessionUnavailableError();
    }

    let createdAtEpochMs: number;

    try {
      createdAtEpochMs =
        readClockEpochMs(
          this.clock,
        );
    } catch {
      throw new SessionUnavailableError();
    }

    let expiresAtEpochMs: number;

    try {
      expiresAtEpochMs =
        this.lifetimePolicy.calculateExpirationEpochMs(
          createdAtEpochMs,
        );
    } catch {
      throw new SessionUnavailableError();
    }

    let session: SessionSnapshot;

    try {
      session =
        createSessionSnapshot({
          id,
          accountId,
          createdAtEpochMs,
          expiresAtEpochMs,
          revokedAtEpochMs:
            null,
        });
    } catch {
      throw new SessionUnavailableError();
    }

    try {
      await this.repository.create(
        session,
      );
    } catch {
      throw new SessionUnavailableError();
    }

    return session;
  }
}
