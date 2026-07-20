import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthenticationAccountId,
  createSessionId,
  createSessionSnapshot,
  InvalidSessionError,
  SessionUnavailableError,
  type Clock,
  type RevokeSessionRecordInput,
  type SessionId,
  type SessionRepository,
  type SessionSnapshot,
} from "@worktracker/core";
import type { Timestamp } from "@worktracker/shared";
import {
  ResolveSession,
} from "../src/session/resolve-session.js";

const accountId =
  createAuthenticationAccountId(
    "account-0000000000000001",
  );

const sessionId =
  createSessionId(
    "session-0000000001",
  );

function snapshot(
  values?: {
    readonly expiresAtEpochMs?: number;
    readonly revokedAtEpochMs?: number | null;
  },
): SessionSnapshot {
  return createSessionSnapshot({
    id:
      sessionId,
    accountId,
    createdAtEpochMs:
      1_000,
    expiresAtEpochMs:
      values?.expiresAtEpochMs ?? 5_000,
    revokedAtEpochMs:
      values?.revokedAtEpochMs ?? null,
  });
}

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
  public findCalls = 0;
  public createCalls = 0;
  public revokeCalls = 0;

  public constructor(
    private readonly stored: SessionSnapshot | null,
  ) {}

  public async create(): Promise<void> {
    this.createCalls +=
      1;
  }

  public async findById(
    id: SessionId,
  ): Promise<SessionSnapshot | null> {
    this.findCalls +=
      1;

    assert.equal(
      id,
      sessionId,
    );

    return this.stored;
  }

  public async revoke(
    _input: RevokeSessionRecordInput,
  ): Promise<void> {
    this.revokeCalls +=
      1;
  }
}

test(
  "ResolveSession returns the exact active stored snapshot after one lookup",
  async () => {
    const stored =
      snapshot();

    const repository =
      new RecordingRepository(
        stored,
      );

    const clock =
      new FixedClock(
        4_999,
      );

    const result =
      await new ResolveSession(
        repository,
        clock,
      ).execute({
        sessionId,
      });

    assert.equal(
      result,
      stored,
    );

    assert.equal(
      repository.findCalls,
      1,
    );

    assert.equal(
      repository.createCalls,
      0,
    );

    assert.equal(
      repository.revokeCalls,
      0,
    );

    assert.equal(
      clock.calls,
      1,
    );

    assert.equal(
      result.expiresAtEpochMs,
      5_000,
    );
  },
);

test(
  "ResolveSession makes unknown, revoked and expired sessions indistinguishable",
  async () => {
    const scenarios = [
      {
        stored:
          null,
        now:
          4_000,
        expectedClockCalls:
          0,
      },
      {
        stored:
          snapshot({
            revokedAtEpochMs:
              2_000,
          }),
        now:
          4_000,
        expectedClockCalls:
          0,
      },
      {
        stored:
          snapshot({
            expiresAtEpochMs:
              5_000,
          }),
        now:
          5_000,
        expectedClockCalls:
          1,
      },
      {
        stored:
          snapshot({
            expiresAtEpochMs:
              5_000,
          }),
        now:
          5_001,
        expectedClockCalls:
          1,
      },
    ];

    for (const scenario of scenarios) {
      const repository =
        new RecordingRepository(
          scenario.stored,
        );

      const clock =
        new FixedClock(
          scenario.now,
        );

      await assert.rejects(
        () =>
          new ResolveSession(
            repository,
            clock,
          ).execute({
            sessionId,
          }),
        error => {
          assert.equal(
            error instanceof InvalidSessionError,
            true,
          );

          assert.equal(
            (
              error as Error
            ).message,
            "Invalid session.",
          );

          return true;
        },
      );

      assert.equal(
        repository.findCalls,
        1,
      );

      assert.equal(
        clock.calls,
        scenario.expectedClockCalls,
      );
    }
  },
);

test(
  "ResolveSession rejects malformed identifiers before repository lookup",
  async () => {
    const repository =
      new RecordingRepository(
        snapshot(),
      );

    const clock =
      new FixedClock(
        2_000,
      );

    await assert.rejects(
      () =>
        new ResolveSession(
          repository,
          clock,
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
      repository.findCalls,
      0,
    );

    assert.equal(
      clock.calls,
      0,
    );
  },
);

test(
  "ResolveSession translates repository and clock failures",
  async () => {
    const failingRepository: SessionRepository = {
      async create(): Promise<void> {},

      async findById(): Promise<SessionSnapshot | null> {
        throw new Error(
          "repository detail",
        );
      },

      async revoke(): Promise<void> {},
    };

    await assert.rejects(
      () =>
        new ResolveSession(
          failingRepository,
          new FixedClock(
            2_000,
          ),
        ).execute({
          sessionId,
        }),
      SessionUnavailableError,
    );

    const failingClock: Clock = {
      now(): Timestamp {
        throw new Error(
          "clock detail",
        );
      },
    };

    await assert.rejects(
      () =>
        new ResolveSession(
          new RecordingRepository(
            snapshot(),
          ),
          failingClock,
        ).execute({
          sessionId,
        }),
      SessionUnavailableError,
    );
  },
);
