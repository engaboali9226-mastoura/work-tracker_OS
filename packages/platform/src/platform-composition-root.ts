import {
  applicationCatalog,
} from "@worktracker/core";

import type {
  RuntimeKernel,
} from "@worktracker/runtime";

import {
  PLATFORM_COMPOSITION_STATES,
} from "./contracts.js";

import type {
  BootstrappedPlatform,
  PlatformCompositionConfiguration,
  PlatformCompositionState,
  PlatformRuntimeComponentDefinition,
  PlatformRuntimePlan,
  PlatformServiceDependencies,
} from "./contracts.js";

import {
  InvalidPlatformCompositionError,
  PlatformBootstrapError,
  PlatformFailedClosedError,
  PlatformRollbackError,
  PlatformShutdownError,
} from "./errors.js";

import {
  createPlatformRuntimeAssembly,
} from "./runtime-assembly.js";

import {
  createPlatformServices,
} from "./services.js";

interface ActivePlatform<
  Proof
> {
  readonly publicPlatform:
    BootstrappedPlatform<Proof>;
  readonly kernel:
    RuntimeKernel;
  readonly registeredComponentIds:
    readonly string[];
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(value)
  );
}

function hasMethod(
  value: unknown,
  method: string,
): boolean {
  return (
    isRecord(value)
    && typeof value[method] === "function"
  );
}

function hasAllMethods(
  value: unknown,
  methods: readonly string[],
): boolean {
  return methods.every(
    method =>
      hasMethod(
        value,
        method,
      ),
  );
}

function validateDependencies(
  value: unknown,
): value is PlatformServiceDependencies<unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const authentication =
    value.authentication;
  const session =
    value.session;
  const authorization =
    value.authorization;

  return (
    hasMethod(
      value.clock,
      "now",
    )
    && isRecord(authentication)
    && hasMethod(
      authentication.verifier,
      "verify",
    )
    && isRecord(session)
    && hasMethod(
      session.idGenerator,
      "generate",
    )
    && hasMethod(
      session.lifetimePolicy,
      "calculateExpirationEpochMs",
    )
    && hasAllMethods(
      session.repository,
      [
        "create",
        "findById",
        "revoke",
      ],
    )
    && isRecord(authorization)
    && hasMethod(
      authorization
        .entitlementIdGenerator,
      "generate",
    )
    && hasAllMethods(
      authorization.repository,
      [
        "create",
        "findByExactScope",
        "revoke",
      ],
    )
  );
}

function validateRuntimeDefinitions(
  value: unknown,
  observedIds: Set<string>,
): value is readonly PlatformRuntimeComponentDefinition[] {
  if (!Array.isArray(value)) {
    return false;
  }

  for (const definition of value) {
    if (!isRecord(definition)) {
      return false;
    }

    const componentId =
      definition.componentId;

    if (
      typeof componentId !== "string"
      || componentId.length === 0
      || componentId.trim() !== componentId
      || typeof definition.factory !== "function"
      || observedIds.has(componentId)
    ) {
      return false;
    }

    observedIds.add(
      componentId,
    );
  }

  return true;
}

function validateRuntimePlan(
  value: unknown,
): value is PlatformRuntimePlan {
  if (!isRecord(value)) {
    return false;
  }

  const observedComponentIds =
    new Set<string>();

  if (
    !validateRuntimeDefinitions(
      value.platformComponents,
      observedComponentIds,
    )
    || !Array.isArray(
      value.applicationBindings,
    )
  ) {
    return false;
  }

  const observedApplicationKeys =
    new Set<string>();

  for (
    const binding
    of value.applicationBindings
  ) {
    if (!isRecord(binding)) {
      return false;
    }

    const appKey =
      binding.appKey;

    if (
      typeof appKey !== "string"
      || appKey.length === 0
      || appKey.trim() !== appKey
      || observedApplicationKeys.has(
        appKey,
      )
    ) {
      return false;
    }

    const catalogEntry =
      applicationCatalog.findByKey(
        appKey,
      );

    if (
      !catalogEntry
      || catalogEntry.status
        === "planned"
      || !validateRuntimeDefinitions(
        binding.components,
        observedComponentIds,
      )
    ) {
      return false;
    }

    observedApplicationKeys.add(
      appKey,
    );
  }

  return true;
}

function validateConfiguration(
  value: unknown,
): value is PlatformCompositionConfiguration<unknown> {
  return (
    isRecord(value)
    && validateDependencies(
      value.dependencies,
    )
    && validateRuntimePlan(
      value.runtime,
    )
  );
}

function copyDependencies<
  Proof
>(
  dependencies:
    PlatformServiceDependencies<Proof>,
): PlatformServiceDependencies<Proof> {
  return Object.freeze({
    clock:
      dependencies.clock,
    authentication:
      Object.freeze({
        verifier:
          dependencies
            .authentication
            .verifier,
      }),
    session:
      Object.freeze({
        idGenerator:
          dependencies
            .session
            .idGenerator,
        lifetimePolicy:
          dependencies
            .session
            .lifetimePolicy,
        repository:
          dependencies
            .session
            .repository,
      }),
    authorization:
      Object.freeze({
        entitlementIdGenerator:
          dependencies
            .authorization
            .entitlementIdGenerator,
        repository:
          dependencies
            .authorization
            .repository,
      }),
  });
}

function copyRuntimeDefinitions(
  plan:
    PlatformRuntimePlan,
): readonly PlatformRuntimeComponentDefinition[] {
  const bindingsByApplicationKey =
    new Map(
      plan.applicationBindings.map(
        binding =>
          [
            binding.appKey,
            binding,
          ] as const,
      ),
    );

  const orderedApplicationComponents =
    applicationCatalog
      .list()
      .flatMap(
        entry =>
          bindingsByApplicationKey
            .get(
              entry.appKey,
            )
            ?.components
          ?? [],
      );

  return Object.freeze(
    [
      ...plan.platformComponents,
      ...orderedApplicationComponents,
    ].map(
      definition =>
        Object.freeze({
          componentId:
            definition.componentId,
          factory:
            definition.factory,
        }),
    ),
  );
}

export class PlatformCompositionRoot<
  Proof
> {
  private state:
    PlatformCompositionState =
      PLATFORM_COMPOSITION_STATES.IDLE;

  private active:
    ActivePlatform<Proof> | undefined;

  private bootstrapRequest:
    Promise<BootstrappedPlatform<Proof>> | undefined;

  private shutdownRequest:
    Promise<void> | undefined;

  private lastRequestKind:
    "bootstrap" | "shutdown" | undefined;

  private transitionTail:
    Promise<void> =
      Promise.resolve();

  private readonly dependencies:
    PlatformServiceDependencies<Proof>;

  private readonly runtimeDefinitions:
    readonly PlatformRuntimeComponentDefinition[];

  public constructor(
    configuration:
      PlatformCompositionConfiguration<Proof>,
  ) {
    if (
      !validateConfiguration(
        configuration,
      )
    ) {
      throw new InvalidPlatformCompositionError();
    }

    this.dependencies =
      copyDependencies(
        configuration.dependencies,
      );

    this.runtimeDefinitions =
      copyRuntimeDefinitions(
        configuration.runtime,
      );
  }

  public getState():
  PlatformCompositionState {
    return this.state;
  }

  public bootstrap():
  Promise<BootstrappedPlatform<Proof>> {
    if (
      this.state
      === PLATFORM_COMPOSITION_STATES
        .FAILED_CLOSED
    ) {
      return Promise.reject(
        new PlatformFailedClosedError(),
      );
    }

    if (
      this.lastRequestKind
      === "bootstrap"
      && this.bootstrapRequest
    ) {
      return this.bootstrapRequest;
    }

    if (
      this.state
      === PLATFORM_COMPOSITION_STATES.RUNNING
      && this.active
      && this.lastRequestKind
        === undefined
    ) {
      return Promise.resolve(
        this.active.publicPlatform,
      );
    }

    const operation =
      this.transitionTail.then(
        async () => {
          this.assertOpen();

          if (
            this.state
            === PLATFORM_COMPOSITION_STATES.RUNNING
            && this.active
          ) {
            return this.active.publicPlatform;
          }

          return this.performBootstrap();
        },
      );

    let shared:
      Promise<BootstrappedPlatform<Proof>>;

    shared =
      operation.finally(
        () => {
          if (
            this.bootstrapRequest
            === shared
          ) {
            this.bootstrapRequest =
              undefined;

            if (
              this.lastRequestKind
              === "bootstrap"
            ) {
              this.lastRequestKind =
                undefined;
            }
          }
        },
      );

    this.bootstrapRequest =
      shared;
    this.lastRequestKind =
      "bootstrap";

    this.transitionTail =
      shared.then(
        () => undefined,
        () => undefined,
      );

    return shared;
  }

  public shutdown():
  Promise<void> {
    if (
      this.state
      === PLATFORM_COMPOSITION_STATES
        .FAILED_CLOSED
    ) {
      return Promise.reject(
        new PlatformFailedClosedError(),
      );
    }

    if (
      this.lastRequestKind
      === "shutdown"
      && this.shutdownRequest
    ) {
      return this.shutdownRequest;
    }

    if (
      this.state
      === PLATFORM_COMPOSITION_STATES.IDLE
      && this.lastRequestKind
        === undefined
    ) {
      return Promise.resolve();
    }

    const operation =
      this.transitionTail.then(
        async () => {
          this.assertOpen();

          if (
            this.state
            === PLATFORM_COMPOSITION_STATES.IDLE
          ) {
            return;
          }

          await this.performShutdown();
        },
      );

    let shared:
      Promise<void>;

    shared =
      operation.finally(
        () => {
          if (
            this.shutdownRequest
            === shared
          ) {
            this.shutdownRequest =
              undefined;

            if (
              this.lastRequestKind
              === "shutdown"
            ) {
              this.lastRequestKind =
                undefined;
            }
          }
        },
      );

    this.shutdownRequest =
      shared;
    this.lastRequestKind =
      "shutdown";

    this.transitionTail =
      shared.then(
        () => undefined,
        () => undefined,
      );

    return shared;
  }

  private assertOpen(): void {
    if (
      this.state
      === PLATFORM_COMPOSITION_STATES
        .FAILED_CLOSED
    ) {
      throw new PlatformFailedClosedError();
    }
  }

  private async performBootstrap():
  Promise<BootstrappedPlatform<Proof>> {
    this.state =
      PLATFORM_COMPOSITION_STATES
        .BOOTSTRAPPING;

    const services =
      createPlatformServices(
        this.dependencies,
      );

    const assembly =
      createPlatformRuntimeAssembly(
        this.runtimeDefinitions,
      );

    const registeredComponentIds:
      string[] =
        [];

    try {
      await assembly.kernel.boot();

      for (
        const componentId
        of assembly.componentIds
      ) {
        await assembly
          .kernel
          .registerComponent(
            componentId,
          );

        registeredComponentIds.push(
          componentId,
        );
      }

      for (
        const componentId
        of assembly.componentIds
      ) {
        await assembly
          .kernel
          .startComponent(
            componentId,
          );
      }
    } catch {
      const rollbackSucceeded =
        await this.cleanupRuntime(
          assembly.kernel,
          registeredComponentIds,
        );

      this.active =
        undefined;

      if (!rollbackSucceeded) {
        const rollbackError =
          new PlatformRollbackError();

        this.failClosed();

        throw rollbackError;
      }

      this.state =
        PLATFORM_COMPOSITION_STATES.IDLE;

      throw new PlatformBootstrapError();
    }

    const publicPlatform:
      BootstrappedPlatform<Proof> =
        Object.freeze({
          services,
        });

    this.active =
      Object.freeze({
        publicPlatform,
        kernel:
          assembly.kernel,
        registeredComponentIds:
          Object.freeze([
            ...registeredComponentIds,
          ]),
      });

    this.state =
      PLATFORM_COMPOSITION_STATES.RUNNING;

    return publicPlatform;
  }

  private async performShutdown():
  Promise<void> {
    const active =
      this.active;

    if (!active) {
      this.state =
        PLATFORM_COMPOSITION_STATES.IDLE;

      return;
    }

    this.state =
      PLATFORM_COMPOSITION_STATES
        .SHUTTING_DOWN;

    const cleanupSucceeded =
      await this.cleanupRuntime(
        active.kernel,
        active.registeredComponentIds,
      );

    this.active =
      undefined;

    if (!cleanupSucceeded) {
      const shutdownError =
        new PlatformShutdownError();

      this.failClosed();

      throw shutdownError;
    }

    this.state =
      PLATFORM_COMPOSITION_STATES.IDLE;
  }

  private async cleanupRuntime(
    kernel: RuntimeKernel,
    registeredComponentIds:
      readonly string[],
  ): Promise<boolean> {
    let succeeded =
      true;

    try {
      await kernel.shutdown();
    } catch {
      succeeded =
        false;
    }

    for (
      const componentId
      of [
        ...registeredComponentIds,
      ].reverse()
    ) {
      try {
        await kernel.unregisterComponent(
          componentId,
        );
      } catch {
        succeeded =
          false;
      }
    }

    return succeeded;
  }

  private failClosed(): void {
    this.state =
      PLATFORM_COMPOSITION_STATES
        .FAILED_CLOSED;
  }
}

export function createPlatformCompositionRoot<
  Proof
>(
  configuration:
    PlatformCompositionConfiguration<Proof>,
): PlatformCompositionRoot<Proof> {
  return new PlatformCompositionRoot(
    configuration,
  );
}
