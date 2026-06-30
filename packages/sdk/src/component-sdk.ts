import type {
    RuntimeComponent,
} from "../../runtime/src/component/component.js";

/**
 * Component SDK
 *
 * Entry point used by every Work Tracker OS component.
 */
export interface ComponentSDK {

    /**
     * Register the component in the Runtime.
     */
    register(
        component: RuntimeComponent,
    ): Promise<void>;

    /**
     * Unregister the component.
     */
    unregister(
        componentId: string,
    ): Promise<void>;

}
