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
  ApplicationViewRegistry,
} from "../src/application-view-registry.js";
import {
  projectPlatformShell,
} from "../src/platform-shell-model.js";
import type {
  PlatformLifecycleState,
} from "../src/platform-shell-model.js";
import type {
  RouteAccessEvidence,
  RouteAccessEvidenceKind,
} from "../src/route-access-evidence.js";

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

function accessEvidence(
  kind: RouteAccessEvidenceKind,
  application = personal,
): RouteAccessEvidence {
  return Object.freeze({
    kind,
    appKey:
      application.appKey,
    pathname:
      application.route,
  });
}

function mountedRegistry(
  onFactory: () => void = () => {},
) {
  return createApplicationViewRegistry(
    applicationCatalog,
    [
      {
        appKey:
          personal.appKey,
        factory:
          () => {
            onFactory();

            return createElement(
              "p",
              null,
              "Mounted view",
            );
          },
      },
    ],
  );
}

test(
  "root and noncanonical routes retain route semantics regardless of access evidence",
  () => {
    assert.equal(
      projectPlatformShell({
        pathname:
          "/",
        catalog:
          applicationCatalog,
        applicationViews:
          emptyRegistry,
        lifecycleState:
          "running",
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
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
      assert.equal(
        projectPlatformShell({
          pathname,
          catalog:
            applicationCatalog,
          applicationViews:
            emptyRegistry,
          lifecycleState:
            "running",
          accessEvidence:
            accessEvidence(
              "authenticated-authorized",
            ),
        }).kind,
        "not-found",
      );
    }
  },
);

test(
  "planned applications remain non-mountable before lifecycle or access evaluation",
  () => {
    let lookups =
      0;

    const registry: ApplicationViewRegistry<ReactElement> =
      Object.freeze({
        find: () => {
          lookups +=
            1;

          return undefined;
        },
      });

    assert.equal(
      projectPlatformShell({
        pathname:
          work.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "failed-closed",
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
            work,
          ),
      }).kind,
      "planned-application",
    );

    assert.equal(
      lookups,
      0,
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
  "failed or non-running lifecycle prevents access and view registry evaluation",
  () => {
    let lookups =
      0;

    const registry: ApplicationViewRegistry<ReactElement> =
      Object.freeze({
        find: () => {
          lookups +=
            1;

          throw new Error(
            "registry must not be consulted",
          );
        },
      });

    const unavailableStates:
    readonly (PlatformLifecycleState | undefined)[] = [
      undefined,
      "idle",
      "bootstrapping",
      "shutting-down",
    ];

    for (const lifecycleState of unavailableStates) {
      const state =
        projectPlatformShell({
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
          accessEvidence:
            accessEvidence(
              "authenticated-authorized",
            ),
        });

      assert.equal(
        state.kind,
        "platform-lifecycle-unavailable",
      );
    }

    assert.equal(
      projectPlatformShell({
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "failed-closed",
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
      }).kind,
      "platform-failed-closed",
    );

    assert.equal(
      lookups,
      0,
    );
  },
);

test(
  "missing, malformed, and mismatched access evidence fails closed before view availability",
  () => {
    let lookups =
      0;

    const registry: ApplicationViewRegistry<ReactElement> =
      Object.freeze({
        find: () => {
          lookups +=
            1;

          return undefined;
        },
      });

    const unusableEvidence: readonly unknown[] = [
      undefined,
      Object.freeze({
        kind:
          "authenticated-authorized",
      }),
      Object.freeze({
        kind:
          "unrecognized",
        appKey:
          personal.appKey,
        pathname:
          personal.route,
      }),
      accessEvidence(
        "authenticated-authorized",
        work,
      ),
      Object.freeze({
        kind:
          "authenticated-authorized",
        appKey:
          personal.appKey,
        pathname:
          "/personal/nested",
      }),
    ];

    for (const evidence of unusableEvidence) {
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
          accessEvidence:
            evidence as RouteAccessEvidence,
        }).kind,
        "session-access-unavailable",
      );
    }

    assert.equal(
      lookups,
      0,
    );
  },
);

test(
  "hostile runtime evidence is normalized once and fails closed before view lookup",
  () => {
    let lookups =
      0;
    let invocations =
      0;

    const registry: ApplicationViewRegistry<ReactElement> =
      Object.freeze({
        find: () => {
          lookups +=
            1;

          return () => {
            invocations +=
              1;

            return createElement(
              "p",
              null,
              "Mounted view",
            );
          };
        },
      });

    const project =
      (evidence: unknown) =>
        projectPlatformShell({
          pathname:
            personal.route,
          catalog:
            applicationCatalog,
          applicationViews:
            registry,
          lifecycleState:
            "running",
          accessEvidence:
            evidence,
        });

    let changingKindReads =
      0;

    const changingKindEvidence = {
      get kind() {
        changingKindReads +=
          1;

        return changingKindReads === 1
          ? "authorization-denied"
          : "authenticated-authorized";
      },
      appKey:
        personal.appKey,
      pathname:
        personal.route,
    };

    assert.equal(
      project(changingKindEvidence).kind,
      "authorization-denied",
    );
    assert.equal(changingKindReads, 1);

    assert.equal(
      project({
        kind:
          "something-unrecognized",
        appKey:
          personal.appKey,
        pathname:
          personal.route,
      }).kind,
      "session-access-unavailable",
    );

    for (const property of [
      "kind",
      "appKey",
      "pathname",
    ] as const) {
      const evidence = {
        kind:
          "authenticated-authorized",
        appKey:
          personal.appKey,
        pathname:
          personal.route,
      };

      Object.defineProperty(
        evidence,
        property,
        {
          get: () => {
            throw new Error(
              `${property} unavailable`,
            );
          },
        },
      );

      assert.equal(
        project(evidence).kind,
        "session-access-unavailable",
      );
    }

    assert.equal(lookups, 0);
    assert.equal(invocations, 0);
  },
);

test(
  "stable normalized bindings ignore later external mutation and authorize exactly once",
  () => {
    let lookups =
      0;
    let invocations =
      0;
    let appKeyReads =
      0;
    let pathnameReads =
      0;

    const registry: ApplicationViewRegistry<ReactElement> =
      Object.freeze({
        find: () => {
          lookups +=
            1;

          return () => {
            invocations +=
              1;

            return createElement(
              "p",
              null,
              "Mounted view",
            );
          };
        },
      });

    const evidence = {
      kind:
        "authenticated-authorized",
      get appKey() {
        appKeyReads +=
          1;

        return appKeyReads === 1
          ? personal.appKey
          : work.appKey;
      },
      get pathname() {
        pathnameReads +=
          1;

        return pathnameReads === 1
          ? personal.route
          : "/personal/other";
      },
    };

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
        accessEvidence:
          evidence,
      }).kind,
      "application-view",
    );
    assert.equal(appKeyReads, 1);
    assert.equal(pathnameReads, 1);
    assert.equal(lookups, 1);
    assert.equal(invocations, 1);
  },
);

test(
  "resolved negative access outcomes are distinct and do not reveal view availability",
  () => {
    let lookups =
      0;

    const registry: ApplicationViewRegistry<ReactElement> =
      Object.freeze({
        find: () => {
          lookups +=
            1;

          return undefined;
        },
      });

    const outcomes:
    readonly [
      RouteAccessEvidenceKind,
      string,
    ][] = [
      [
        "authentication-required",
        "authentication-required",
      ],
      [
        "session-access-unavailable",
        "session-access-unavailable",
      ],
      [
        "authorization-denied",
        "authorization-denied",
      ],
      [
        "authorization-unavailable",
        "authorization-unavailable",
      ],
    ];

    for (const [evidenceKind, stateKind] of outcomes) {
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
          accessEvidence:
            accessEvidence(
              evidenceKind,
            ),
        }).kind,
        stateKind,
      );
    }

    assert.equal(
      lookups,
      0,
    );
  },
);

test(
  "only exact positively authorized evidence can reach a registered view factory",
  () => {
    let invocations =
      0;

    const registry =
      mountedRegistry(
        () => {
          invocations +=
            1;
        },
      );

    const nonPositiveEvidence:
    readonly (RouteAccessEvidence | undefined)[] = [
      undefined,
      accessEvidence(
        "authentication-required",
      ),
      accessEvidence(
        "session-access-unavailable",
      ),
      accessEvidence(
        "authorization-denied",
      ),
      accessEvidence(
        "authorization-unavailable",
      ),
      accessEvidence(
        "authenticated-authorized",
        work,
      ),
    ];

    for (const evidence of nonPositiveEvidence) {
      const state =
        projectPlatformShell({
          pathname:
            personal.route,
          catalog:
            applicationCatalog,
          applicationViews:
            registry,
          lifecycleState:
            "running",
          ...(evidence
            ? {
                accessEvidence:
                  evidence,
              }
            : {}),
        });

      assert.notEqual(
        state.kind,
        "application-view",
      );
    }

    assert.equal(
      invocations,
      0,
    );

    const missingView =
      projectPlatformShell({
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          emptyRegistry,
        lifecycleState:
          "running",
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
      });

    assert.equal(
      missingView.kind,
      "known-view-unavailable",
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
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
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
  "factory creation exceptions remain Shell view failures after positive access",
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
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
      }).kind,
      "application-view-failure",
    );
  },
);

test(
  "registered Noor Personal view mounts only for canonical authenticated-authorized access",
  () => {
    let factoryInvocations =
      0;

    const registry =
      mountedRegistry(
        () => {
          factoryInvocations +=
            1;
        },
      );

    const blockedEvidence:
    readonly RouteAccessEvidence[] = [
      accessEvidence(
        "authentication-required",
      ),
      accessEvidence(
        "session-access-unavailable",
      ),
      accessEvidence(
        "authorization-denied",
      ),
      accessEvidence(
        "authorization-unavailable",
      ),
    ];

    for (
      const evidence
      of blockedEvidence
    ) {
      const state =
        projectPlatformShell({
          pathname:
            personal.route,
          catalog:
            applicationCatalog,
          applicationViews:
            registry,
          lifecycleState:
            "running",
          accessEvidence:
            evidence,
        });

      assert.notEqual(
        state.kind,
        "application-view",
      );

      assert.equal(
        factoryInvocations,
        0,
      );
    }

    assert.equal(
      projectPlatformShell({
        pathname:
          "/personal/today",
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "running",
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
      }).kind,
      "not-found",
    );

    assert.equal(
      factoryInvocations,
      0,
    );

    assert.equal(
      projectPlatformShell({
        pathname:
          work.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "running",
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
            work,
          ),
      }).kind,
      "planned-application",
    );

    assert.equal(
      factoryInvocations,
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
        accessEvidence:
          accessEvidence(
            "authenticated-authorized",
          ),
      });

    assert.equal(
      mounted.kind,
      "application-view",
    );

    assert.equal(
      factoryInvocations,
      1,
    );
  },
);
