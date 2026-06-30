/**
 * Runtime Kernel Contract
 *
 * The Runtime Kernel is the central coordinator of
 * Work Tracker OS.
 *
 * This file defines the contract only.
 * No implementation is allowed here.
 */

export interface RuntimeKernel {

    /**
     * Boot the runtime.
     */
    boot(): Promise<void>;

    /**
     * Shutdown the runtime.
     */
    shutdown(): Promise<void>;

    /**
     * Register a component.
     */
    registerComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Remove a component.
     */
    unregisterComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Start a registered component.
     */
    startComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Stop a running component.
     */
    stopComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Returns true if runtime is active.
     */
    isRunning(): boolean;

}
