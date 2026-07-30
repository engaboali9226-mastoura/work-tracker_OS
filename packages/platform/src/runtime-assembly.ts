import {
  DefaultComponentLoader,
  DefaultComponentValidator,
  DefaultRuntimeKernel,
  DefaultRuntimeRegistry,
} from "@worktracker/runtime";

import type {
  RuntimeKernel,
} from "@worktracker/runtime";

import type {
  PlatformRuntimeComponentDefinition,
} from "./contracts.js";

export interface PlatformRuntimeAssembly {
  readonly kernel:
    RuntimeKernel;
  readonly componentIds:
    readonly string[];
}

export function createPlatformRuntimeAssembly(
  definitions:
    readonly PlatformRuntimeComponentDefinition[],
): PlatformRuntimeAssembly {
  const factories =
    new Map(
      definitions.map(
        definition =>
          [
            definition.componentId,
            definition.factory,
          ] as const,
      ),
    );

  const registry =
    new DefaultRuntimeRegistry();

  const loader =
    new DefaultComponentLoader(
      factories,
    );

  const validator =
    new DefaultComponentValidator();

  const kernel =
    new DefaultRuntimeKernel(
      registry,
      loader,
      validator,
    );

  return Object.freeze({
    kernel,
    componentIds:
      Object.freeze(
        definitions.map(
          definition =>
            definition.componentId,
        ),
      ),
  });
}
