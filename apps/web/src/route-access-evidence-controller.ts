import type {
  ApplicationCatalog,
} from "@worktracker/core";

import type {
  RouteAccessEvidenceClient,
} from "./route-access-evidence-client.js";

export type RouteAccessEvidenceTransportLifecycle =
  | "idle"
  | "bootstrapping"
  | "running";

export type RouteAccessEvidenceControllerSnapshot =
  Readonly<{
    pathname:
      string;
    lifecycleState:
      RouteAccessEvidenceTransportLifecycle;
    accessEvidence?:
      unknown;
  }>;

export interface RouteAccessEvidenceController {
  subscribe(
    listener:
      () => void,
  ):
  () => void;

  snapshot():
  RouteAccessEvidenceControllerSnapshot;

  selectPathname(
    pathname:
      string,
  ):
  void;

  dispose():
  void;
}

function findExperimentalApplication(
  catalog:
    ApplicationCatalog,
  pathname:
    string,
) {
  return catalog
    .list()
    .find(
      application =>
        (
          application.route ===
            pathname
          && application.status ===
            "experimental"
        ),
    );
}

export function createRouteAccessEvidenceController(
  catalog:
    ApplicationCatalog,
  client:
    RouteAccessEvidenceClient,
): RouteAccessEvidenceController {
  const listeners =
    new Set<
      () => void
    >();

  let selectionGeneration =
    0;

  let pendingAbort:
    AbortController | undefined;

  let current:
    RouteAccessEvidenceControllerSnapshot =
      Object.freeze({
        pathname:
          "/",
        lifecycleState:
          "idle",
      });

  const notify =
    () => {
      for (
        const listener
        of listeners
      ) {
        listener();
      }
    };

  const update =
    (
      snapshot:
        RouteAccessEvidenceControllerSnapshot,
    ) => {
      current =
        Object.freeze(
          snapshot,
        );

      notify();
    };

  const selectPathname =
    (
      pathname:
        string,
    ) => {
      if (
        current.pathname ===
        pathname
      ) {
        return;
      }

      selectionGeneration +=
        1;

      const generation =
        selectionGeneration;

      pendingAbort?.abort();

      pendingAbort =
        undefined;

      const application =
        findExperimentalApplication(
          catalog,
          pathname,
        );

      if (!application) {
        update({
          pathname,
          lifecycleState:
            "idle",
        });

        return;
      }

      const abortController =
        new AbortController();

      pendingAbort =
        abortController;

      update({
        pathname,
        lifecycleState:
          "bootstrapping",
      });

      let request:
        Promise<unknown>;

      try {
        request =
          client(
            {
              appKey:
                application.appKey,
              pathname:
                application.route,
            },
            abortController.signal,
          );
      } catch {
        request =
          Promise.reject(
            new Error(
              "Route access evidence transport is unavailable.",
            ),
          );
      }

      void request.then(
        accessEvidence => {
          if (
            generation !==
              selectionGeneration
            || current.pathname !==
              pathname
          ) {
            return;
          }

          pendingAbort =
            undefined;

          update({
            pathname,
            lifecycleState:
              "running",
            accessEvidence,
          });
        },
        () => {
          if (
            generation !==
              selectionGeneration
            || current.pathname !==
              pathname
          ) {
            return;
          }

          pendingAbort =
            undefined;

          update({
            pathname,
            lifecycleState:
              "running",
          });
        },
      );
    };

  return Object.freeze({
    subscribe:
      listener => {
        listeners.add(
          listener,
        );

        return () => {
          listeners.delete(
            listener,
          );
        };
      },

    snapshot:
      () =>
        current,

    selectPathname,

    dispose:
      () => {
        selectionGeneration +=
          1;

        pendingAbort?.abort();

        pendingAbort =
          undefined;

        listeners.clear();
      },
  });
}
