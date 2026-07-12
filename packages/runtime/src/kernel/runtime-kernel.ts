import type {
    ComponentState,
} from "../component/component-state.js";

/**
 * Runtime Kernel Contract
 *
 * The Runtime Kernel is the central execution coordinator of
 * Work Tracker OS.
 */
export interface RuntimeKernel {

    /**
     * Activate the runtime.
     *
     * Boot does not automatically discover, register,
     * load or start components.
     */
    boot(): Promise<void>;

    /**
     * Stop every currently running component in reverse
     * registration order and deactivate the runtime.
     */
    shutdown(): Promise<void>;

    /**
     * Resolve, validate and register an executable component.
     */
    registerComponent(
        componentId: string,
    ): Promise<void>;

    /**
     * Remove a non-running component from the live runtime.
     */
    unregisterComponent(
        componentId: string,
    ): Promise<void>;

    /**
     * Start a registered component.
     */
    startComponent(
        componentId: string,
    ): Promise<void>;

    /**
     * Stop a running component.
     */
    stopComponent(
        componentId: string,
    ): Promise<void>;

    /**
     * Return the runtime state of a registered component.
     */
    getComponentState(
        componentId: string,
    ): ComponentState | undefined;

    /**
     * Returns true when the runtime is active.
     */
    isRunning(): boolean;

}
