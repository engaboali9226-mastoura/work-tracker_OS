/**
 * Shared AsyncResult primitive.
 */

import type { Result } from "./result";

export type AsyncResult<T, E> =
  Promise<Result<T, E>>;

export async function fromPromise<T>(
  operation: Promise<T>,
): AsyncResult<T, unknown> {
  try {
    const value = await operation;

    return {
      ok: true,
      value,
    };
  } catch (error) {
    return {
      ok: false,
      error,
    };
  }
}
