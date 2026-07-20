import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthenticationAccountId,
  createSessionId,
  SessionUnavailableError,
  type Clock,
  type SessionId,
  type SessionIdGenerator,
  type SessionLifetimePolicy,
  type SessionRepository,
  type SessionSnapshot,
  type VerifiedAuthentication,
} from "@worktracker/core";
import type { Timestamp } from "@worktracker/shared";
import {
  CreateSession,
  type CreateSessionRequest,
} from "../src/session/create-session.js";

const accountId =
  createAuthenticationAccountId(
    "account-0000000000000001",
  );

const authentication =
  Object.freeze({
    accountId,
  }) as VerifiedAuthentication;

const generatedId =
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

class FixedGenerator implements SessionIdGenerator {
  public calls = 0;

  public constructor(
    private readonly id: SessionId,
  ) {}

  public async generate(): Promise<SessionId> {
    this.calls +=
      1;

    return this.id;
  }
}

class FixedPolicy implements SessionLifetimePolicy {
  public calls = 0;
  public receivedCreatedAt: number | null = null;

  public constructor(
    private readonly lifetimeMs: number,
  ) {}

  public calculateExpirationEpochMs(
    createdAtEpochMs: number,
  ): number {
    this.calls +=
      1;

    this.receivedCreatedAt =
      createdAtEpochMs;

    return createdAtEpochMs +
      this.lifetimeMs;
  }
}

class RecordingRepository implements SessionRepository {
  public createCalls = 0;
  public created: SessionSnapshot | null = null;

  public async create(
    session: SessionSnapshot,
  ): Promise<void> {
    this.createCalls +=
      1;

    this.created =
      session;
  }

  public async findById(): Promise<SessionSnapshot | null> {
    return null;
  }

  public async revoke(): Promise<void> {}
}

test(
  "CreateSession creates, persists and returns the exact same snapshot",
  async () => {
    const generator =
      new FixedGenerator(
        generatedId,
      );

    const clock =
      new FixedClock(
        1_000,
      );

    const policy =
      new FixedPolicy(
        5_000,
      );

    const repository =
      new RecordingRepository();

    const useCase =
      new CreateSession(
        generator,
        clock,
        policy,
        repository,
      );

    const result =
      await useCase.execute({
        authentication,
      });

    assert.equal(
      generator.calls,
      1,
    );

    assert.equal(
      clock.calls,
      1,
    );

    assert.equal(
      policy.calls,
      1,
    );

    assert.equal(
      policy.receivedCreatedAt,
      1_000,
    );

    assert.equal(
      repository.createCalls,
      1,
    );

    assert.equal(
      result,
      repository.created,
    );

    assert.equal(
      result.id,
      generatedId,
    );

    assert.equal(
      result.accountId,
      accountId,
    );

    assert.equal(
      result.createdAtEpochMs,
      1_000,
    );

    assert.equal(
      result.expiresAtEpochMs,
      6_000,
    );

    assert.equal(
      result.revokedAtEpochMs,
      null,
    );

    assert.equal(
      Object.isFrozen(
        result,
      ),
      true,
    );
  },
);

test(
  "CreateSession rejects invalid input before invoking collaborators",
  async () => {
    const generator =
      new FixedGenerator(
        generatedId,
      );

    const clock =
      new FixedClock(
        1_000,
      );

    const policy =
      new FixedPolicy(
        5_000,
      );

    const repository =
      new RecordingRepository();

    const useCase =
      new CreateSession(
        generator,
        clock,
        policy,
        repository,
      );

    await assert.rejects(
      () =>
        useCase.execute(
          undefined as unknown as CreateSessionRequest,
        ),
      {
        name:
          "InvalidSessionRequestError",
        message:
          "Invalid session request.",
      },
    );

    assert.equal(
      generator.calls,
      0,
    );

    assert.equal(
      clock.calls,
      0,
    );

    assert.equal(
      policy.calls,
      0,
    );

    assert.equal(
      repository.createCalls,
      0,
    );
  },
);

test(
  "CreateSession maps an invalid lifetime result to unavailable and does not persist",
  async () => {
    const generator =
      new FixedGenerator(
        generatedId,
      );

    const clock =
      new FixedClock(
        1_000,
      );

    const policy: SessionLifetimePolicy = {
      calculateExpirationEpochMs:
        createdAtEpochMs =>
          createdAtEpochMs,
    };

    const repository =
      new RecordingRepository();

    const useCase =
      new CreateSession(
        generator,
        clock,
        policy,
        repository,
      );

    await assert.rejects(
      () =>
        useCase.execute({
          authentication,
        }),
      SessionUnavailableError,
    );

    assert.equal(
      repository.createCalls,
      0,
    );
  },
);

test(
  "CreateSession translates generator, clock, policy and repository failures",
  async () => {
    const validClock =
      new FixedClock(
        1_000,
      );

    const validPolicy =
      new FixedPolicy(
        5_000,
      );

    const validRepository =
      new RecordingRepository();

    const failingGenerator: SessionIdGenerator = {
      async generate(): Promise<SessionId> {
        throw new Error(
          "generator detail",
        );
      },
    };

    await assert.rejects(
      () =>
        new CreateSession(
          failingGenerator,
          validClock,
          validPolicy,
          validRepository,
        ).execute({
          authentication,
        }),
      error => {
        assert.equal(
          error instanceof SessionUnavailableError,
          true,
        );

        assert.equal(
          (
            error as Error
          ).message,
          "Session service is unavailable.",
        );

        assert.equal(
          "cause" in (
            error as object
          ),
          false,
        );

        return true;
      },
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
        new CreateSession(
          new FixedGenerator(
            generatedId,
          ),
          failingClock,
          validPolicy,
          validRepository,
        ).execute({
          authentication,
        }),
      SessionUnavailableError,
    );

    const failingPolicy: SessionLifetimePolicy = {
      calculateExpirationEpochMs(): number {
        throw new Error(
          "policy detail",
        );
      },
    };

    await assert.rejects(
      () =>
        new CreateSession(
          new FixedGenerator(
            generatedId,
          ),
          new FixedClock(
            1_000,
          ),
          failingPolicy,
          validRepository,
        ).execute({
          authentication,
        }),
      SessionUnavailableError,
    );

    const failingRepository: SessionRepository = {
      async create(): Promise<void> {
        throw new Error(
          "repository detail",
        );
      },

      async findById(): Promise<SessionSnapshot | null> {
        return null;
      },

      async revoke(): Promise<void> {},
    };

    await assert.rejects(
      () =>
        new CreateSession(
          new FixedGenerator(
            generatedId,
          ),
          new FixedClock(
            1_000,
          ),
          new FixedPolicy(
            5_000,
          ),
          failingRepository,
        ).execute({
          authentication,
        }),
      SessionUnavailableError,
    );
  },
);
