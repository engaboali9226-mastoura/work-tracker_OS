/**
 * Runtime Metrics
 *
 * Defines the metrics collection contract used
 * by the Runtime.
 */
export interface RuntimeMetrics {

    increment(
        metric: string,
        value?: number,
    ): void;

    gauge(
        metric: string,
        value: number,
    ): void;

    timing(
        metric: string,
        milliseconds: number,
    ): void;

    reset(): void;

}
