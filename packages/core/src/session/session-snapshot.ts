import {
  createAuthenticationAccountId,
  type AuthenticationAccountId,
} from "../authentication/index.js";
import { InvalidSessionRequestError } from "./session-errors.js";
import { createSessionId, type SessionId } from "./session-id.js";

export interface SessionSnapshot {
  readonly id: SessionId;
  readonly accountId: AuthenticationAccountId;
  readonly createdAtEpochMs: number;
  readonly expiresAtEpochMs: number;
  readonly revokedAtEpochMs: number | null;
}

export interface CreateSessionSnapshotInput {
  readonly id: SessionId;
  readonly accountId: AuthenticationAccountId;
  readonly createdAtEpochMs: number;
  readonly expiresAtEpochMs: number;
  readonly revokedAtEpochMs?: number | null;
}

function requireEpochMs(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new InvalidSessionRequestError();
  }

  return value;
}

export function createSessionSnapshot(
  input: CreateSessionSnapshotInput,
): SessionSnapshot {
  if (
    input === null ||
    typeof input !== "object"
  ) {
    throw new InvalidSessionRequestError();
  }

  let id: SessionId;
  let accountId: AuthenticationAccountId;

  try {
    id = createSessionId(
      input.id as string,
    );

    accountId = createAuthenticationAccountId(
      input.accountId as string,
    );
  } catch {
    throw new InvalidSessionRequestError();
  }

  const createdAtEpochMs = requireEpochMs(
    input.createdAtEpochMs,
  );

  const expiresAtEpochMs = requireEpochMs(
    input.expiresAtEpochMs,
  );

  if (expiresAtEpochMs <= createdAtEpochMs) {
    throw new InvalidSessionRequestError();
  }

  const revokedAtEpochMs =
    input.revokedAtEpochMs ?? null;

  if (
    revokedAtEpochMs !== null &&
    requireEpochMs(
      revokedAtEpochMs,
    ) < createdAtEpochMs
  ) {
    throw new InvalidSessionRequestError();
  }

  const snapshot: SessionSnapshot = {
    id,
    accountId,
    createdAtEpochMs,
    expiresAtEpochMs,
    revokedAtEpochMs,
  };

  return Object.freeze(
    snapshot,
  );
}
