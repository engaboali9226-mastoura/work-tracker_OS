import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidApplicationCatalogError,
  applicationCatalog,
  assertApplicationCatalogMatchesArchitecture,
  createApplicationCatalog,
} from "../src/index.js";
import type {
  ApplicationCatalogEntryInput,
  ApplicationCatalogValidationCode,
} from "../src/index.js";

const baseInput:
ApplicationCatalogEntryInput = {
  appKey:
    "example-app",
  name:
    "Example App",
  description:
    "An example platform application.",
  iconToken:
    "noor.app.example",
  route:
    "/example",
  status:
    "experimental",
  requiredEntitlement: {
    action:
      "access",
    resourceType:
      "application",
    resourceId:
      "example-app",
  },
};

function expectCatalogError(
  action: () => unknown,
  code: ApplicationCatalogValidationCode,
): void {
  assert.throws(
    action,
    error =>
      (
        error
        instanceof InvalidApplicationCatalogError
        && error.code === code
      ),
  );
}

function createInput(
  overrides:
  Partial<ApplicationCatalogEntryInput> = {},
): ApplicationCatalogEntryInput {
  return {
    ...baseInput,
    ...overrides,
    requiredEntitlement: {
      ...baseInput.requiredEntitlement,
      ...overrides.requiredEntitlement,
    },
  };
}

test("canonical catalog lists only the two approved applications in deterministic order", () => {
  const firstRead =
    applicationCatalog.list();

  const secondRead =
    applicationCatalog.list();

  assert.equal(
    firstRead,
    secondRead,
  );

  assert.deepEqual(
    firstRead.map(
      application => ({
        appKey:
          application.appKey,
        route:
          application.route,
        status:
          application.status,
      }),
    ),
    [
      {
        appKey:
          "noor-personal",
        route:
          "/personal",
        status:
          "experimental",
      },
      {
        appKey:
          "noor-work",
        route:
          "/work",
        status:
          "planned",
      },
    ],
  );
});

test("catalog supports exact key lookup and returns undefined for unknown keys", () => {
  const personal =
    applicationCatalog.findByKey(
      "noor-personal",
    );

  assert.ok(personal);

  assert.equal(
    personal.name,
    "Noor Personal",
  );

  assert.deepEqual(
    personal.requiredEntitlement,
    {
      action:
        "access",
      resourceType:
        "application",
      resourceId:
        "noor-personal",
    },
  );

  assert.equal(
    applicationCatalog.findByKey(
      "NOOR-PERSONAL",
    ),
    undefined,
  );

  assert.equal(
    applicationCatalog.findByKey(
      "missing",
    ),
    undefined,
  );
});

test("catalog snapshots are deeply immutable and isolated from caller input", () => {
  const mutableInput = {
    ...baseInput,
    requiredEntitlement: {
      ...baseInput.requiredEntitlement,
    },
  };

  const catalog =
    createApplicationCatalog([
      mutableInput,
    ]);

  mutableInput.name =
    "Changed";

  mutableInput.requiredEntitlement.resourceId =
    "changed";

  const entries =
    catalog.list();

  const entry =
    entries[0];

  assert.ok(entry);

  assert.equal(
    Object.isFrozen(catalog),
    true,
  );

  assert.equal(
    Object.isFrozen(entries),
    true,
  );

  assert.equal(
    Object.isFrozen(entry),
    true,
  );

  assert.equal(
    Object.isFrozen(
      entry.requiredEntitlement,
    ),
    true,
  );

  assert.equal(
    entry.name,
    "Example App",
  );

  assert.equal(
    entry.requiredEntitlement.resourceId,
    "example-app",
  );
});

test("catalog rejects duplicate application keys and routes", () => {
  expectCatalogError(
    () =>
      createApplicationCatalog([
        baseInput,
        createInput({
          route:
            "/another",
        }),
      ]),
    "DUPLICATE_APP_KEY",
  );

  expectCatalogError(
    () =>
      createApplicationCatalog([
        baseInput,
        createInput({
          appKey:
            "another-app",
          requiredEntitlement: {
            action:
              "access",
            resourceType:
              "application",
            resourceId:
              "another-app",
          },
        }),
      ]),
    "DUPLICATE_ROUTE",
  );
});

test("catalog rejects empty and whitespace-only fields", () => {
  const scalarFields = [
    "appKey",
    "name",
    "description",
    "iconToken",
    "route",
    "status",
  ] as const;

  for (const field of scalarFields) {
    expectCatalogError(
      () =>
        createApplicationCatalog([
          createInput({
            [field]:
              " ",
          }),
        ]),
      "EMPTY_FIELD",
    );
  }

  const entitlementFields = [
    "action",
    "resourceType",
    "resourceId",
  ] as const;

  for (const field of entitlementFields) {
    expectCatalogError(
      () =>
        createApplicationCatalog([
          createInput({
            requiredEntitlement: {
              ...baseInput.requiredEntitlement,
              [field]:
                "",
            },
          }),
        ]),
      "EMPTY_FIELD",
    );
  }
});

test("catalog rejects invalid application routes", () => {
  const invalidRoutes = [
    "personal",
    "//personal",
    "/personal/",
    "/Personal",
    "/personal?mode=test",
    "/personal#today",
    "/personal//today",
  ];

  for (const route of invalidRoutes) {
    expectCatalogError(
      () =>
        createApplicationCatalog([
          createInput({
            route,
          }),
        ]),
      "INVALID_ROUTE",
    );
  }
});

test("catalog rejects unsupported statuses", () => {
  expectCatalogError(
    () =>
      createApplicationCatalog([
        createInput({
          status:
            "active",
        }),
      ]),
    "UNSUPPORTED_STATUS",
  );
});

test("catalog enforces application access entitlement descriptors", () => {
  const invalidEntitlements = [
    {
      action:
        "read",
      resourceType:
        "application",
      resourceId:
        "example-app",
    },
    {
      action:
        "access",
      resourceType:
        "module",
      resourceId:
        "example-app",
    },
    {
      action:
        "access",
      resourceType:
        "application",
      resourceId:
        "another-app",
    },
  ];

  for (
    const requiredEntitlement
    of invalidEntitlements
  ) {
    expectCatalogError(
      () =>
        createApplicationCatalog([
          createInput({
            requiredEntitlement,
          }),
        ]),
      "INVALID_ENTITLEMENT",
    );
  }
});

test("catalog validation rejects architectural source drift", () => {
  const architectureEntries =
    applicationCatalog.list()
      .map(
        entry => ({
          ...entry,
          requiredEntitlement: {
            ...entry.requiredEntitlement,
          },
        }),
      );

  const firstEntry =
    architectureEntries[0];

  assert.ok(firstEntry);

  architectureEntries[0] = {
    ...firstEntry,
    route:
      "/personal-drift",
  };

  expectCatalogError(
    () =>
      assertApplicationCatalogMatchesArchitecture(
        applicationCatalog,
        architectureEntries,
      ),
    "ARCHITECTURE_MISMATCH",
  );
});
