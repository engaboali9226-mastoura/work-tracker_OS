export interface ComponentManifest {

    readonly apiVersion: string;

    readonly kind: string;

    readonly metadata: ComponentManifestMetadata;

    readonly spec: ComponentManifestSpec;

    readonly runtime: ComponentManifestRuntime;

    readonly status: ComponentManifestStatus;

}

export interface ComponentManifestMetadata {

    readonly name: string;

    readonly displayName: string;

    readonly version: string;

    readonly description: string;

}

export interface ComponentManifestSpec {

    readonly owner: string;

    readonly category: string;

    readonly dependencies: readonly string[];

    readonly services: readonly string[];

    readonly capabilities: readonly string[];

}

export interface ComponentManifestRuntime {

    readonly health: boolean;

    readonly metrics: boolean;

    readonly logging: boolean;

    readonly tracing: boolean;

}

export interface ComponentManifestStatus {

    readonly phase: string;

}
