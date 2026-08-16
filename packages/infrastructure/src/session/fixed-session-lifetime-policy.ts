import type {
  SessionLifetimePolicy,
} from "@worktracker/core";

function assertValidDuration(
  durationMs: unknown,
): asserts durationMs is number {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(
      durationMs,
    ) ||
    !Number.isInteger(
      durationMs,
    ) ||
    !Number.isSafeInteger(
      durationMs,
    )
  ) {
    throw new TypeError(
      "Session lifetime duration must be a finite safe integer.",
    );
  }

  if (durationMs <= 0) {
    throw new RangeError(
      "Session lifetime duration must be positive.",
    );
  }
}

function assertValidCreationEpoch(
  createdAtEpochMs: unknown,
): asserts createdAtEpochMs is number {
  if (
    typeof createdAtEpochMs !== "number" ||
    !Number.isFinite(
      createdAtEpochMs,
    ) ||
    !Number.isInteger(
      createdAtEpochMs,
    ) ||
    !Number.isSafeInteger(
      createdAtEpochMs,
    )
  ) {
    throw new TypeError(
      "Session creation epoch must be a finite safe integer.",
    );
  }

  if (createdAtEpochMs < 0) {
    throw new RangeError(
      "Session creation epoch must be non-negative.",
    );
  }
}

export class FixedSessionLifetimePolicy
implements SessionLifetimePolicy {

  private readonly durationMs: number;

  public constructor(
    durationMs: number,
  ) {
    assertValidDuration(
      durationMs,
    );

    this.durationMs =
      durationMs;

    Object.freeze(
      this,
    );
  }

  public calculateExpirationEpochMs(
    createdAtEpochMs: number,
  ): number {
    assertValidCreationEpoch(
      createdAtEpochMs,
    );

    if (
      createdAtEpochMs >
      Number.MAX_SAFE_INTEGER -
        this.durationMs
    ) {
      throw new RangeError(
        "Session expiration exceeds the safe integer range.",
      );
    }

    const expiresAtEpochMs =
      createdAtEpochMs +
      this.durationMs;

    if (
      !Number.isSafeInteger(
        expiresAtEpochMs,
      ) ||
      expiresAtEpochMs <=
        createdAtEpochMs
    ) {
      throw new RangeError(
        "Session expiration is invalid.",
      );
    }

    return expiresAtEpochMs;
  }

}
