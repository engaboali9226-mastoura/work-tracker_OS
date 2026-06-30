/**
 * Runtime Component Contract
 *
 * Every executable component inside Work Tracker OS
 * must implement this contract.
 */

export interface RuntimeComponent {

    /**
     * Unique component identifier.
     */
    readonly id: string;

    /**
     * Human readable name.
     */
    readonly name: string;

    /**
     * Component version.
     */
    readonly version: string;

    /**
     * Start component.
     */
    start(): Promise<void>;

    /**
     * Stop component.
     */
    stop(): Promise<void>;

}
