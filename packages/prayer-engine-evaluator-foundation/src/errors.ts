import type { FailureCode } from "./contracts.js";

export class EvaluatorFoundationError extends Error {
  public readonly code: FailureCode;
  public readonly details: Readonly<Record<string, unknown>>;

  public constructor(
    code: FailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "EvaluatorFoundationError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}
