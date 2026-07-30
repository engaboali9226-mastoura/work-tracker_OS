export const PLATFORM_COMPOSITION_ERROR_CODES =
  Object.freeze({
    INVALID_CONFIGURATION:
      "PLATFORM_COMPOSITION_INVALID_CONFIGURATION",
    BOOTSTRAP_FAILED:
      "PLATFORM_COMPOSITION_BOOTSTRAP_FAILED",
    ROLLBACK_FAILED:
      "PLATFORM_COMPOSITION_ROLLBACK_FAILED",
    SHUTDOWN_FAILED:
      "PLATFORM_COMPOSITION_SHUTDOWN_FAILED",
    FAILED_CLOSED:
      "PLATFORM_COMPOSITION_FAILED_CLOSED",
  } as const);

export type PlatformCompositionErrorCode =
  (typeof PLATFORM_COMPOSITION_ERROR_CODES)[
    keyof typeof PLATFORM_COMPOSITION_ERROR_CODES
  ];

const PLATFORM_COMPOSITION_ERROR_MESSAGES =
  Object.freeze({
    INVALID_CONFIGURATION:
      "Platform composition configuration is invalid.",
    BOOTSTRAP_FAILED:
      "Platform bootstrap failed.",
    ROLLBACK_FAILED:
      "Platform bootstrap rollback failed; the composition is closed.",
    SHUTDOWN_FAILED:
      "Platform shutdown failed; the composition is closed.",
    FAILED_CLOSED:
      "Platform composition is closed after an incomplete cleanup.",
  } as const);

export class PlatformCompositionError
extends Error {
  public readonly code:
    PlatformCompositionErrorCode;

  protected constructor(
    code: PlatformCompositionErrorCode,
    message: string,
  ) {
    super(message);

    this.name =
      "PlatformCompositionError";
    this.code =
      code;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

export class InvalidPlatformCompositionError
extends PlatformCompositionError {
  public constructor() {
    super(
      PLATFORM_COMPOSITION_ERROR_CODES
        .INVALID_CONFIGURATION,
      PLATFORM_COMPOSITION_ERROR_MESSAGES
        .INVALID_CONFIGURATION,
    );

    this.name =
      "InvalidPlatformCompositionError";
  }
}

export class PlatformBootstrapError
extends PlatformCompositionError {
  public constructor() {
    super(
      PLATFORM_COMPOSITION_ERROR_CODES
        .BOOTSTRAP_FAILED,
      PLATFORM_COMPOSITION_ERROR_MESSAGES
        .BOOTSTRAP_FAILED,
    );

    this.name =
      "PlatformBootstrapError";
  }
}

export class PlatformRollbackError
extends PlatformCompositionError {
  public constructor() {
    super(
      PLATFORM_COMPOSITION_ERROR_CODES
        .ROLLBACK_FAILED,
      PLATFORM_COMPOSITION_ERROR_MESSAGES
        .ROLLBACK_FAILED,
    );

    this.name =
      "PlatformRollbackError";
  }
}

export class PlatformShutdownError
extends PlatformCompositionError {
  public constructor() {
    super(
      PLATFORM_COMPOSITION_ERROR_CODES
        .SHUTDOWN_FAILED,
      PLATFORM_COMPOSITION_ERROR_MESSAGES
        .SHUTDOWN_FAILED,
    );

    this.name =
      "PlatformShutdownError";
  }
}

export class PlatformFailedClosedError
extends PlatformCompositionError {
  public constructor() {
    super(
      PLATFORM_COMPOSITION_ERROR_CODES
        .FAILED_CLOSED,
      PLATFORM_COMPOSITION_ERROR_MESSAGES
        .FAILED_CLOSED,
    );

    this.name =
      "PlatformFailedClosedError";
  }
}
