/**
 * Component Manifest
 *
 * Metadata describing a runtime component.
 */
export interface ComponentManifest {

    readonly id: string;

    readonly name: string;

    readonly version: string;

    readonly description?: string;

    readonly dependencies: readonly string[];

    readonly inputs: readonly string[];

    readonly outputs: readonly string[];

}
