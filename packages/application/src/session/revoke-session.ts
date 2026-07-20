import {
  createSessionId,
  InvalidSessionRequestError,
  SessionUnavailableError,
  type Clock,
  type SessionId,
  type SessionRepository,
} from "@worktracker/core";
import type { UseCase } from "../use-case/use-case.js";

export interface RevokeSessionRequest {
  readonly sessionId: string;
}

export type RevokeSessionOutput = void;

function requireSessionId(
  input: RevokeSessionRequest,
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

export class RevokeSession
implements UseCase<RevokeSessionRequest, RevokeSessionOutput> {
  public constructor(
    private readonly clock: Clock,
    private readonly repository: SessionRepository,
  ) {}

  public async execute(
    input: RevokeSessionRequest,
  ): Promise<RevokeSessionOutput> {
    const id =
      requireSessionId(
        input,
      );

    let revokedAtEpochMs: number;

    try {
      revokedAtEpochMs =
        readClockEpochMs(
          this.clock,
        );
    } catch {
      throw new SessionUnavailableError();
    }

    try {
      await this.repository.revoke({
        id,
        revokedAtEpochMs,
      });
    } catch {
      throw new SessionUnavailableError();
    }
  }
}
