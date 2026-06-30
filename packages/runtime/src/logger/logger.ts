/**
 * Runtime Logger
 *
 * Defines the logging contract used by the Runtime.
 */
export interface RuntimeLogger {

    debug(
        message: string,
        context?: unknown,
    ): void;

    info(
        message: string,
        context?: unknown,
    ): void;

    warn(
        message: string,
        context?: unknown,
    ): void;

    error(
        message: string,
        error?: Error,
        context?: unknown,
    ): void;

}
