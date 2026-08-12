import type {
  ApplicationCatalog,
  ApplicationCatalogEntry,
} from "@worktracker/core";

import type {
  ApplicationViewRegistry,
} from "./application-view-registry.js";
import {
  normalizeRouteAccessEvidence,
} from "./route-access-evidence.js";

export type PlatformLifecycleState =
  | "idle"
  | "bootstrapping"
  | "running"
  | "shutting-down"
  | "failed-closed";

export type PlatformShellState<View> =
  | Readonly<{
      kind:
        "no-application-selected";
    }>
  | Readonly<{
      kind:
        "not-found";
      pathname:
        string;
    }>
  | Readonly<{
      kind:
        "planned-application";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "platform-failed-closed";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "authentication-required";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "session-access-unavailable";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "authorization-denied";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "authorization-unavailable";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "known-view-unavailable";
      application:
        ApplicationCatalogEntry;
    }>
  | Readonly<{
      kind:
        "platform-lifecycle-unavailable";
      application:
        ApplicationCatalogEntry;
      lifecycleState:
        PlatformLifecycleState | undefined;
    }>
  | Readonly<{
      kind:
        "application-view";
      application:
        ApplicationCatalogEntry;
      view:
        View;
    }>
  | Readonly<{
      kind:
        "application-view-failure";
      application:
        ApplicationCatalogEntry;
    }>;

export type PlatformShellProjectionInput<View> =
Readonly<{
  pathname:
    string;
  catalog:
    ApplicationCatalog;
  applicationViews:
    ApplicationViewRegistry<View>;
  lifecycleState?:
    PlatformLifecycleState;
  accessEvidence?:
    unknown;
}>;

function findApplicationByExactPathname(
  catalog: ApplicationCatalog,
  pathname: string,
): ApplicationCatalogEntry | undefined {
  return catalog
    .list()
    .find(
      application =>
        application.route === pathname,
    );
}

export function projectPlatformShell<View>(
  input: PlatformShellProjectionInput<View>,
): PlatformShellState<View> {
  if (input.pathname === "/") {
    return Object.freeze({
      kind:
        "no-application-selected",
    });
  }

  const application =
    findApplicationByExactPathname(
      input.catalog,
      input.pathname,
    );

  if (!application) {
    return Object.freeze({
      kind:
        "not-found",
      pathname:
        input.pathname,
    });
  }

  if (application.status === "planned") {
    return Object.freeze({
      kind:
        "planned-application",
      application,
    });
  }

  if (input.lifecycleState === "failed-closed") {
    return Object.freeze({
      kind:
        "platform-failed-closed",
      application,
    });
  }

  if (input.lifecycleState !== "running") {
    return Object.freeze({
      kind:
        "platform-lifecycle-unavailable",
      application,
      lifecycleState:
        input.lifecycleState,
    });
  }

  const accessDecision =
    normalizeRouteAccessEvidence(
      input.accessEvidence,
      application.appKey,
      application.route,
    );

  if (!accessDecision) {
    return Object.freeze({
      kind:
        "session-access-unavailable",
      application,
    });
  }

  switch (accessDecision.kind) {
    case "authentication-required":
      return Object.freeze({
        kind:
          "authentication-required",
        application,
      });

    case "session-access-unavailable":
      return Object.freeze({
        kind:
          "session-access-unavailable",
        application,
      });

    case "authorization-denied":
      return Object.freeze({
        kind:
          "authorization-denied",
        application,
      });

    case "authorization-unavailable":
      return Object.freeze({
        kind:
          "authorization-unavailable",
        application,
      });

    case "authenticated-authorized":
      break;

    default:
      return Object.freeze({
        kind:
          "session-access-unavailable",
        application,
      });
  }

  const factory =
    input.applicationViews.find(
      application.appKey,
    );

  if (!factory) {
    return Object.freeze({
      kind:
        "known-view-unavailable",
      application,
    });
  }

  try {
    return Object.freeze({
      kind:
        "application-view",
      application,
      view:
        factory(),
    });
  } catch {
    return Object.freeze({
      kind:
        "application-view-failure",
      application,
    });
  }
}
