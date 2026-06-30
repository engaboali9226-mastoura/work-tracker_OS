/**
 * Runtime Health
 *
 * Represents the health monitoring contract of the Runtime.
 */
export interface RuntimeHealth {

    isHealthy(): boolean;

    check(): Promise<void>;

}
