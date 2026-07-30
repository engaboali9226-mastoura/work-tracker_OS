import type {
  AuthenticationVerifier,
  Clock,
  EntitlementIdGenerator,
  EntitlementRepository,
  SessionIdGenerator,
  SessionLifetimePolicy,
  SessionRepository,
} from "@worktracker/core";

import type {
  RuntimeComponentFactory,
} from "@worktracker/runtime";

import type {
  PlatformServices,
} from "./services.js";

export const PLATFORM_COMPOSITION_STATES =
  Object.freeze({
    IDLE:
      "idle",
    BOOTSTRAPPING:
      "bootstrapping",
    RUNNING:
      "running",
    SHUTTING_DOWN:
      "shutting-down",
    FAILED_CLOSED:
      "failed-closed",
  } as const);

export type PlatformCompositionState =
  (typeof PLATFORM_COMPOSITION_STATES)[
    keyof typeof PLATFORM_COMPOSITION_STATES
  ];

export interface PlatformServiceDependencies<
  Proof
> {
  readonly clock:
    Clock;

  readonly authentication: Readonly<{
    verifier:
      AuthenticationVerifier<Proof>;
  }>;

  readonly session: Readonly<{
    idGenerator:
      SessionIdGenerator;
    lifetimePolicy:
      SessionLifetimePolicy;
    repository:
      SessionRepository;
  }>;

  readonly authorization: Readonly<{
    entitlementIdGenerator:
      EntitlementIdGenerator;
    repository:
      EntitlementRepository;
  }>;
}

export interface PlatformRuntimeComponentDefinition {
  readonly componentId:
    string;
  readonly factory:
    RuntimeComponentFactory;
}

export interface PlatformRuntimePlan {
  readonly platformComponents:
    readonly PlatformRuntimeComponentDefinition[];
  readonly applicationBindings:
    readonly PlatformApplicationBinding[];
}

export interface PlatformApplicationBinding {
  readonly appKey:
    string;
  readonly components:
    readonly PlatformRuntimeComponentDefinition[];
}

export interface PlatformCompositionConfiguration<
  Proof
> {
  readonly dependencies:
    PlatformServiceDependencies<Proof>;
  readonly runtime:
    PlatformRuntimePlan;
}

export interface BootstrappedPlatform<
  Proof
> {
  readonly services:
    PlatformServices<Proof>;
}
