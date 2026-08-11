import assert from "node:assert/strict";
import test from "node:test";

import {
  applicationCatalog,
} from "@worktracker/core";
import type {
  ApplicationKey,
} from "@worktracker/core";
import {
  createElement,
} from "react";
import type {
  ReactElement,
} from "react";

import {
  ApplicationViewRegistrationError,
  createApplicationViewRegistry,
} from "../src/application-view-registry.js";
import type {
  ApplicationViewRegistration,
} from "../src/application-view-registry.js";
import {
  projectPlatformShell,
} from "../src/platform-shell-model.js";
import type {
  PlatformLifecycleState,
} from "../src/platform-shell-model.js";

const personal =
  applicationCatalog.findByKey(
    "noor-personal",
  );

const work =
  applicationCatalog.findByKey(
    "noor-work",
  );

assert.ok(personal);
assert.ok(work);

const emptyRegistry =
  createApplicationViewRegistry<ReactElement>(
    applicationCatalog,
    [],
  );

test(
  "root is neutral and unknown or nested paths do not select applications",
  () => {
    assert.equal(
      projectPlatformShell({
        pathname:
          "/",
        catalog:
          applicationCatalog,
        applicationViews:
          emptyRegistry,
      }).kind,
      "no-application-selected",
    );

    for (
      const pathname
      of [
        "/missing",
        "/personal/today",
        "/work/settings",
      ]
    ) {
      const state =
        projectPlatformShell({
          pathname,
          catalog:
            applicationCatalog,
          applicationViews:
            emptyRegistry,
        });

      assert.equal(
        state.kind,
        "not-found",
      );
    }
  },
);

test(
  "exact canonical routes retain catalog status without mounting unavailable views",
  () => {
    const personalState =
      projectPlatformShell({
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          emptyRegistry,
      });

    assert.equal(
      personalState.kind,
      "known-view-unavailable",
    );

    const workState =
      projectPlatformShell({
        pathname:
          work.route,
        catalog:
          applicationCatalog,
        applicationViews:
          emptyRegistry,
      });

    assert.equal(
      workState.kind,
      "planned-application",
    );
  },
);

test(
  "registry accepts a canonical experimental key and snapshots immutable registration",
  () => {
    const firstFactory =
      () =>
        createElement(
          "p",
          null,
          "First view",
        );

    const registrations:
    ApplicationViewRegistration<ReactElement>[] = [
      {
        appKey:
          personal.appKey,
        factory:
          firstFactory,
      },
    ];

    const registry =
      createApplicationViewRegistry(
        applicationCatalog,
        registrations,
      );

    registrations[0] = {
      appKey:
        personal.appKey,
      factory:
        () =>
          createElement(
            "p",
            null,
            "Changed view",
          ),
    };

    assert.equal(
      registry.find(
        personal.appKey,
      ),
      firstFactory,
    );

    assert.equal(
      Object.isFrozen(
        registry,
      ),
      true,
    );
  },
);

test(
  "registry rejects duplicate, unknown, and planned registrations",
  () => {
    const factory =
      () =>
        createElement(
          "p",
          null,
          "View",
        );

    assert.throws(
      () =>
        createApplicationViewRegistry(
          applicationCatalog,
          [
            {
              appKey:
                personal.appKey,
              factory,
            },
            {
              appKey:
                personal.appKey,
              factory,
            },
          ],
        ),
      error =>
        error
          instanceof ApplicationViewRegistrationError
        && error.code
          === "DUPLICATE_APPLICATION",
    );

    assert.throws(
      () =>
        createApplicationViewRegistry(
          applicationCatalog,
          [
            {
              appKey:
                "unknown" as ApplicationKey,
              factory,
            },
          ],
        ),
      error =>
        error
          instanceof ApplicationViewRegistrationError
        && error.code
          === "UNKNOWN_APPLICATION",
    );

    assert.throws(
      () =>
        createApplicationViewRegistry(
          applicationCatalog,
          [
            {
              appKey:
                work.appKey,
              factory,
            },
          ],
        ),
      error =>
        error
          instanceof ApplicationViewRegistrationError
        && error.code
          === "NON_MOUNTABLE_APPLICATION",
    );
  },
);

test(
  "factory invocation requires an exact experimental route and running lifecycle",
  () => {
    let invocations =
      0;

    const registry =
      createApplicationViewRegistry(
        applicationCatalog,
        [
          {
            appKey:
              personal.appKey,
            factory:
              () => {
                invocations +=
                  1;

                return createElement(
                  "p",
                  null,
                  "Mounted view",
                );
              },
          },
        ],
      );

    const nonRunningStates:
    readonly (PlatformLifecycleState | undefined)[] = [
      undefined,
      "idle",
      "bootstrapping",
      "shutting-down",
      "failed-closed",
    ];

    for (const lifecycleState of nonRunningStates) {
      const input = {
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        ...(lifecycleState
          ? {
              lifecycleState,
            }
          : {}),
      };

      assert.equal(
        projectPlatformShell(
          input,
        ).kind,
        "platform-lifecycle-unavailable",
      );
    }

    for (
      const pathname
      of [
        "/",
        "/unknown",
        "/personal/nested",
        work.route,
      ]
    ) {
      projectPlatformShell({
        pathname,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "running",
      });
    }

    assert.equal(
      invocations,
      0,
    );

    const mounted =
      projectPlatformShell({
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "running",
      });

    assert.equal(
      mounted.kind,
      "application-view",
    );

    assert.equal(
      invocations,
      1,
    );
  },
);

test(
  "factory creation exceptions remain Shell view failures",
  () => {
    const registry =
      createApplicationViewRegistry<ReactElement>(
        applicationCatalog,
        [
          {
            appKey:
              personal.appKey,
            factory:
              () => {
                throw new Error(
                  "view failure",
                );
              },
          },
        ],
      );

    assert.equal(
      projectPlatformShell({
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "running",
      }).kind,
      "application-view-failure",
    );
  },
);
