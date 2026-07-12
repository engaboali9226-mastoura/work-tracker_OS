import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Runtime Component Factory
 *
 * Narrow construction boundary used by the first operational
 * runtime loader implementation.
 *
 * Dependencies required by a future component may be captured
 * explicitly by the factory closure.
 */
export type RuntimeComponentFactory =
    () =>
        RuntimeComponent |
        Promise<RuntimeComponent>;
