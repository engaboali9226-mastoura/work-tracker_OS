import type { SystemArchitecture } from "./system-architecture.js";
import type { Relationship } from "./relationship.js";
import type { ArchitectureMetadata } from "./architecture-metadata.js";

export interface ArchitectureModel {

    readonly system: SystemArchitecture;

    readonly relationships: readonly Relationship[];

    readonly metadata: ArchitectureMetadata;

}

