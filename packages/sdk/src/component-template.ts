import type {
    ComponentManifest,
} from "./component-manifest.js";

import type {
    ComponentBuilder,
} from "./component-builder.js";

/**
 * Component Template
 *
 * Defines the complete description required
 * to publish a runtime component.
 */
export interface ComponentTemplate {

    readonly manifest: ComponentManifest;

    readonly builder: ComponentBuilder;

}
