import {
  createSessionId,
  InvalidSessionError,
  InvalidSessionRequestError,
  SessionUnavailableError,
  type Clock,
  type SessionId,
  type SessionRepository,
  type SessionSnapshot,
} from "@worktracker/core";
import type { UseCase } from "../use-case/use-case.js";

export interface ResolveSessionRequest {
  readonly sessionId: string;
}

function requireSessionId(
  input: ResolveSessionRequest,
): SessionId {
  if (
    input === null ||
    typeof input !== "object"
  ) {
    throw new InvalidSessionRequestError();
  }

  try {
    return createSessionId(
      (
        input as {
          readonly sessionId?: unknown;
        }
      ).sessionId as string,
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

export class ResolveSession
implements UseCase<ResolveSessionRequest, SessionSnapshot> {
  public constructor(
    private readonly repository: SessionRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: ResolveSessionRequest,
  ): Promise<SessionSnapshot> {
    const id =
      requireSessionId(
        input,
      );

    let session: SessionSnapshot | null;

    try {
      session =
        await this.repository.findById(
          id,
        );
    } catch {
      throw new SessionUnavailableError();
    }

    if (
      session === null ||
      session.revokedAtEpochMs !== null
    ) {
      throw new InvalidSessionError();
    }

    let nowEpochMs: number;

    try {
      nowEpochMs =
        readClockEpochMs(
          this.clock,
        );
    } catch {
      throw new SessionUnavailableError();
    }

    if (
      nowEpochMs >= session.expiresAtEpochMs
    ) {
      throw new InvalidSessionError();
    }

    return session;
  }
}
