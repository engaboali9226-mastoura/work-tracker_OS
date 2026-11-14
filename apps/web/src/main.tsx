import "./noor-personal-initial-setup-r321.css";
import "./noor-ios-viewport-r230.css";
import "./noor-welcome-gateway-r231.css";
import "./noor-time-windows-r232.css";
import "./noor-work-teacher-r264.css";
import "./noor-linked-activity-insights-r312.css";
import "./noor-reminder-settings-r314.css";
import "./noor-admin-mfa-r315.css";
import "./noor-account-self-service-r312.css";
import "./noor-premium-r322.css";

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
  NoorPersonalApplicationView,
} from "./noor-personal-application-view.js";
import {NoorWorkTeacherViewR264} from "./noor-work-teacher-view-r264.js";
import {NoorAdminMfaPageR315} from "./noor-admin-mfa-page-r315.js";
import {
  createAuthenticationSessionController,
} from "./authentication-session-controller.js";
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
  readBrowserPublicAuthenticationConfiguration,
} from "./public-authentication-environment.js";
import {
  createBrowserPublicSupabaseAuthenticationClient,
} from "./public-supabase-authentication-client.js";
import { createNoorAccountSelfServiceR312 } from "./noor-account-self-service-r312.js";
import {
  createBrowserRouteAccessEvidenceClient,
} from "./route-access-evidence-client.js";
import {
  createRouteAccessEvidenceController,
} from "./route-access-evidence-controller.js";
import {
  createBrowserSessionEstablishmentClient,
} from "./session-establishment-client.js";

const history =
  createBrowserHistory(
    window,
  );

const applicationViews =
  createApplicationViewRegistry<ReactElement>(
    applicationCatalog,
    [
      {
        appKey:
          "noor-personal",
        factory:
          () => (
            <NoorPersonalApplicationView />
          ),
      },
      {appKey:"noor-work",factory:()=> <NoorWorkTeacherViewR264 />},
    ],
  );

const routeAccessClient =
  createBrowserRouteAccessEvidenceClient();

const routeAccessController =
  createRouteAccessEvidenceController(
    applicationCatalog,
    routeAccessClient,
  );

const publicAuthenticationClient =
  createBrowserPublicSupabaseAuthenticationClient(
    readBrowserPublicAuthenticationConfiguration(),
  );

// Email flows require independently verified Supabase redirects/SMTP and owner
// provisioning before any guest access. Disabled by default in production.
const noorAccountServiceR312 = import.meta.env?.VITE_NOOR_ACCOUNT_SELF_SERVICE_ENABLED === "true"
  ? createNoorAccountSelfServiceR312(readBrowserPublicAuthenticationConfiguration())
  : undefined;

const sessionEstablishmentClient =
  createBrowserSessionEstablishmentClient();

const authenticationController =
  createAuthenticationSessionController({
    authenticationClient:
      publicAuthenticationClient,

    sessionClient:
      sessionEstablishmentClient,

    onAuthenticated:
      () => {
        const pathname =
          history.pathname();

        // Synchronize route access evidence immediately upon session establishment
        routeAccessController
          .selectPathname(
            "/",
          );

        routeAccessController
          .selectPathname(
            pathname,
          );
      },
  });

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

  const authentication =
    useSyncExternalStore(
      authenticationController
        .subscribe,
      authenticationController
        .snapshot,
      authenticationController
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

      authenticationState:
        authentication.kind,
    });

  // Only the dedicated /admin/security route hosts administrator MFA.
  // The root recovery callback belongs to the *ordinary* NOOR gateway, not
  // to an administrator page. Supabase Auth still verifies any recovery proof.
  if (pathname==="/admin/security") {
    // This is an identity-factor setup screen, not an administration route.
    // It exposes NO role grants, account data, or privileged APIs.
    return <NoorAdminMfaPageR315 />;
  }
  return (
    <PlatformShell
      state={state}
      navigate={history.push}
      signIn={authenticationController.signIn}
      authenticationState={authentication.kind}
      accountService={noorAccountServiceR312}
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

// R222: installable web app; no offline persistence of sessions or journal data.
if (((import.meta as ImportMeta & {env?:{PROD?:boolean}}).env?.PROD) === true &&
    typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load",()=>{
    void navigator.serviceWorker.register("/noor-service-worker.js",{
      scope:"/",
      updateViaCache:"none",
    }).catch(()=>{/* Keep the online web app functional if registration fails. */});
  },{once:true});
}
