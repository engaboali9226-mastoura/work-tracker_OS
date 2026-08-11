import {
  applicationCatalog,
} from "@worktracker/core";
import {
  StrictMode,
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

const history =
  createBrowserHistory(
    window,
  );

const applicationViews =
  createApplicationViewRegistry<ReactElement>(
    applicationCatalog,
    [],
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

  const state =
    projectPlatformShell({
      pathname,
      catalog:
        applicationCatalog,
      applicationViews,
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
