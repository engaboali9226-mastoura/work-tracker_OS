import {
  applicationCatalog,
} from "@worktracker/core";
import {
  StrictMode,
  useEffect,
  useSyncExternalStore,
} from "react";
import type {
  ReactElement,
} from "react";
import {
  createRoot,
} from "react-dom/client";

import {
  createApplicationViewRegistry,
} from "./application-view-registry.js";
import {
  createBrowserHistory,
} from "./browser-history.js";
import {
  applyDocumentLocalization,
} from "./document-localization.js";
import {
  projectPlatformShell,
} from "./platform-shell-model.js";
import {
  PlatformShell,
} from "./platform-shell.js";
import {
  createBrowserRouteAccessEvidenceClient,
} from "./route-access-evidence-client.js";
import {
  createRouteAccessEvidenceController,
} from "./route-access-evidence-controller.js";

const history =
  createBrowserHistory(
    window,
  );

const applicationViews =
  createApplicationViewRegistry<ReactElement>(
    applicationCatalog,
    [],
  );

const routeAccessClient =
  createBrowserRouteAccessEvidenceClient();

const routeAccessController =
  createRouteAccessEvidenceController(
    applicationCatalog,
    routeAccessClient,
  );

routeAccessController
  .selectPathname(
    history.pathname(),
  );

applyDocumentLocalization(
  document,
  navigator.language,
);

function ShellFoundation() {
  const pathname =
    useSyncExternalStore(
      history.subscribe,
      history.pathname,
      history.pathname,
    );

  const routeAccess =
    useSyncExternalStore(
      routeAccessController
        .subscribe,
      routeAccessController
        .snapshot,
      routeAccessController
        .snapshot,
    );

  useEffect(
    () => {
      routeAccessController
        .selectPathname(
          pathname,
        );
    },
    [
      pathname,
    ],
  );

  const routeAccessMatchesPath =
    routeAccess.pathname ===
      pathname;

  const state =
    projectPlatformShell({
      pathname,
      catalog:
        applicationCatalog,
      applicationViews,

      lifecycleState:
        routeAccessMatchesPath
          ? routeAccess
              .lifecycleState
          : "idle",

      accessEvidence:
        routeAccessMatchesPath
          ? routeAccess
              .accessEvidence
          : undefined,
    });

  return (
    <PlatformShell
      state={state}
      navigate={history.push}
    />
  );
}

const rootElement =
  document.getElementById(
    "root",
  );

if (!rootElement) {
  throw new Error(
    "Platform Shell root element is unavailable.",
  );
}

createRoot(
  rootElement,
).render(
  <StrictMode>
    <ShellFoundation />
  </StrictMode>,
);
