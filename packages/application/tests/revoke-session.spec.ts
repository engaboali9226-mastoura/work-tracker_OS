import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionId,
  SessionUnavailableError,
  type Clock,
  type RevokeSessionRecordInput,
  type SessionId,
  type SessionRepository,
  type SessionSnapshot,
} from "@worktracker/core";
import type { Timestamp } from "@worktracker/shared";
import {
  RevokeSession,
} from "../src/session/revoke-session.js";

const sessionId =
  createSessionId(
    "session-0000000001",
  );

class FixedClock implements Clock {
  public calls = 0;

  public constructor(
    private readonly epochMs: number,
  ) {}

  public now(): Timestamp {
    this.calls +=
      1;

    return {
      toDate: () =>
        new Date(
          this.epochMs,
        ),
    } as Timestamp;
  }
}

class RecordingRepository implements SessionRepository {
  public createCalls = 0;
  public findCalls = 0;
  public revokeCalls = 0;
  public received: RevokeSessionRecordInput | null = null;

  public async create(): Promise<void> {
    this.createCalls +=
      1;
  }

  public async findById(): Promise<SessionSnapshot | null> {
    this.findCalls +=
      1;

    return null;
  }

  public async revoke(
    input: RevokeSessionRecordInput,
  ): Promise<void> {
    this.revokeCalls +=
      1;

    this.received =
      input;
  }
}

test(
  "RevokeSession calls the clock and repository exactly once and returns void",
  async () => {
    const clock =
      new FixedClock(
        9_000,
      );

    const repository =
      new RecordingRepository();

    const result =
      await new RevokeSession(
        clock,
        repository,
      ).execute({
        sessionId,
      });

    assert.equal(
      result,
      undefined,
    );

    assert.equal(
      clock.calls,
      1,
    );

    assert.equal(
      repository.revokeCalls,
      1,
    );

    assert.equal(
      repository.findCalls,
      0,
    );

    assert.equal(
      repository.createCalls,
      0,
    );

    assert.deepEqual(
      repository.received,
      {
        id:
          sessionId,
        revokedAtEpochMs:
          9_000,
      },
    );
  },
);

test(
  "RevokeSession preserves unknown and repeated revocation as idempotent success",
  async () => {
    const repository =
      new RecordingRepository();

    const clock =
      new FixedClock(
        9_000,
      );

    const useCase =
      new RevokeSession(
        clock,
        repository,
      );

    await useCase.execute({
      sessionId,
    });

    await useCase.execute({
      sessionId,
    });

    assert.equal(
      repository.revokeCalls,
      2,
    );

    assert.equal(
      repository.findCalls,
      0,
    );

    assert.equal(
      clock.calls,
      2,
    );
  },
);

test(
  "RevokeSession rejects malformed identifiers before collaborators",
  async () => {
    const repository =
      new RecordingRepository();

    const clock =
      new FixedClock(
        9_000,
      );

    await assert.rejects(
      () =>
        new RevokeSession(
          clock,
          repository,
        ).execute({
          sessionId:
            "bad",
        }),
      {
        name:
          "InvalidSessionRequestError",
        message:
          "Invalid session request.",
      },
    );

    assert.equal(
      clock.calls,
      0,
    );

    assert.equal(
      repository.revokeCalls,
      0,
    );
  },
);

test(
  "RevokeSession translates clock and repository failures",
  async () => {
    const failingClock: Clock = {
      now(): Timestamp {
        throw new Error(
          "clock detail",
        );
      },
    };

    await assert.rejects(
      () =>
        new RevokeSession(
          failingClock,
          new RecordingRepository(),
        ).execute({
          sessionId,
        }),
      SessionUnavailableError,
    );

    const failingRepository: SessionRepository = {
      async create(): Promise<void> {},

      async findById(
        _id: SessionId,
      ): Promise<SessionSnapshot | null> {
        return null;
      },

      async revoke(): Promise<void> {
        throw new Error(
          "repository detail",
        );
      },
    };

    await assert.rejects(
      () =>
        new RevokeSession(
          new FixedClock(
            9_000,
          ),
          failingRepository,
        ).execute({
          sessionId,
        }),
      SessionUnavailableError,
    );
  },
);
