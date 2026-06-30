import {
    ComponentState,
} from "../component/component-state.js";

/**
 * Lifecycle Contract
 *
 * Defines the lifecycle operations supported by
 * the Runtime.
 */

export interface Lifecycle {

    initialize(): Promise<void>;

    start(): Promise<void>;

    pause(): Promise<void>;

    resume(): Promise<void>;

    stop(): Promise<void>;

    fail(
        reason?: Error
    ): Promise<void>;

    getState(): ComponentState;

}
