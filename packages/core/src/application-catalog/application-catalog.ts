import {
  createAuthorizationAction,
} from "../authorization/authorization-action.js";
import type {
  AuthorizationAction,
} from "../authorization/authorization-action.js";
import {
  createAuthorizationResourceId,
} from "../authorization/authorization-resource-id.js";
import type {
  AuthorizationResourceId,
} from "../authorization/authorization-resource-id.js";
import {
  createAuthorizationResourceType,
} from "../authorization/authorization-resource-type.js";
import type {
  AuthorizationResourceType,
} from "../authorization/authorization-resource-type.js";

declare const applicationKeyBrand: unique symbol;

export type ApplicationKey = string & {
  readonly [applicationKeyBrand]: "ApplicationKey";
};

export const APPLICATION_STATUSES = [
  "experimental",
  "planned",
] as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[number];

export type RequiredEntitlementDescriptor = Readonly<{
  action: AuthorizationAction;
  resourceType: AuthorizationResourceType;
  resourceId: AuthorizationResourceId;
}>;

export type RequiredEntitlementDescriptorInput = Readonly<{
  action: string;
  resourceType: string;
  resourceId: string;
}>;

export type ApplicationCatalogEntryInput = Readonly<{
  appKey: string;
  name: string;
  description: string;
  iconToken: string;
  route: string;
  status: string;
  requiredEntitlement: RequiredEntitlementDescriptorInput;
}>;

export type ApplicationCatalogEntry = Readonly<{
  appKey: ApplicationKey;
  name: string;
  description: string;
  iconToken: string;
  route: string;
  status: ApplicationStatus;
  requiredEntitlement: RequiredEntitlementDescriptor;
}>;

export interface ApplicationCatalog {
  list(): readonly ApplicationCatalogEntry[];

  findByKey(
    appKey: string,
  ): ApplicationCatalogEntry | undefined;
}

export type ApplicationCatalogValidationCode =
  | "EMPTY_FIELD"
  | "INVALID_APP_KEY"
  | "INVALID_ROUTE"
  | "UNSUPPORTED_STATUS"
  | "INVALID_ENTITLEMENT"
  | "DUPLICATE_APP_KEY"
  | "DUPLICATE_ROUTE"
  | "ARCHITECTURE_MISMATCH";

export class InvalidApplicationCatalogError extends Error {
  public readonly code: ApplicationCatalogValidationCode;

  public constructor(
    code: ApplicationCatalogValidationCode,
  ) {
    super(
      `Invalid application catalog: ${code}.`,
    );

    this.name =
      "InvalidApplicationCatalogError";

    this.code =
      code;
  }
}

const APP_KEY_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ROUTE_PATTERN =
  /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

const SUPPORTED_STATUSES =
  new Set<string>(
    APPLICATION_STATUSES,
  );

function isPopulatedString(
  value: unknown,
): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && value === value.trim()
  );
}

function requirePopulatedString(
  value: unknown,
): string {
  if (!isPopulatedString(value)) {
    throw new InvalidApplicationCatalogError(
      "EMPTY_FIELD",
    );
  }

  return value;
}

function createApplicationKey(
  value: unknown,
): ApplicationKey {
  const appKey =
    requirePopulatedString(
      value,
    );

  if (!APP_KEY_PATTERN.test(appKey)) {
    throw new InvalidApplicationCatalogError(
      "INVALID_APP_KEY",
    );
  }

  return appKey as ApplicationKey;
}

function createApplicationStatus(
  value: unknown,
): ApplicationStatus {
  const status =
    requirePopulatedString(
      value,
    );

  if (!SUPPORTED_STATUSES.has(status)) {
    throw new InvalidApplicationCatalogError(
      "UNSUPPORTED_STATUS",
    );
  }

  return status as ApplicationStatus;
}

function createRoute(
  value: unknown,
): string {
  const route =
    requirePopulatedString(
      value,
    );

  if (!ROUTE_PATTERN.test(route)) {
    throw new InvalidApplicationCatalogError(
      "INVALID_ROUTE",
    );
  }

  return route;
}

function createRequiredEntitlement(
  value: unknown,
  appKey: ApplicationKey,
): RequiredEntitlementDescriptor {
  if (
    !value
    || typeof value !== "object"
  ) {
    throw new InvalidApplicationCatalogError(
      "EMPTY_FIELD",
    );
  }

  const record =
    value as Record<string, unknown>;

  const action =
    requirePopulatedString(
      record.action,
    );

  const resourceType =
    requirePopulatedString(
      record.resourceType,
    );

  const resourceId =
    requirePopulatedString(
      record.resourceId,
    );

  if (
    action !== "access"
    || resourceType !== "application"
    || resourceId !== appKey
  ) {
    throw new InvalidApplicationCatalogError(
      "INVALID_ENTITLEMENT",
    );
  }

  return Object.freeze({
    action:
      createAuthorizationAction(
        action,
      ),
    resourceType:
      createAuthorizationResourceType(
        resourceType,
      ),
    resourceId:
      createAuthorizationResourceId(
        resourceId,
      ),
  });
}

function createEntry(
  input: unknown,
): ApplicationCatalogEntry {
  if (
    !input
    || typeof input !== "object"
  ) {
    throw new InvalidApplicationCatalogError(
      "EMPTY_FIELD",
    );
  }

  const record =
    input as Record<string, unknown>;

  const appKey =
    createApplicationKey(
      record.appKey,
    );

  const entry: ApplicationCatalogEntry = {
    appKey,
    name:
      requirePopulatedString(
        record.name,
      ),
    description:
      requirePopulatedString(
        record.description,
      ),
    iconToken:
      requirePopulatedString(
        record.iconToken,
      ),
    route:
      createRoute(
        record.route,
      ),
    status:
      createApplicationStatus(
        record.status,
      ),
    requiredEntitlement:
      createRequiredEntitlement(
        record.requiredEntitlement,
        appKey,
      ),
  };

  return Object.freeze(
    entry,
  );
}

class DefaultApplicationCatalog
implements ApplicationCatalog {
  readonly #entries:
  readonly ApplicationCatalogEntry[];

  readonly #entriesByKey:
  ReadonlyMap<string, ApplicationCatalogEntry>;

  public constructor(
    inputs: readonly ApplicationCatalogEntryInput[],
  ) {
    if (!Array.isArray(inputs)) {
      throw new InvalidApplicationCatalogError(
        "EMPTY_FIELD",
      );
    }

    const entries =
      inputs.map(
        createEntry,
      );

    const entriesByKey =
      new Map<string, ApplicationCatalogEntry>();

    const routes =
      new Set<string>();

    for (const entry of entries) {
      if (entriesByKey.has(entry.appKey)) {
        throw new InvalidApplicationCatalogError(
          "DUPLICATE_APP_KEY",
        );
      }

      if (routes.has(entry.route)) {
        throw new InvalidApplicationCatalogError(
          "DUPLICATE_ROUTE",
        );
      }

      entriesByKey.set(
        entry.appKey,
        entry,
      );

      routes.add(
        entry.route,
      );
    }

    this.#entries =
      Object.freeze(
        entries,
      );

    this.#entriesByKey =
      entriesByKey;

    Object.freeze(this);
  }

  public list():
  readonly ApplicationCatalogEntry[] {
    return this.#entries;
  }

  public findByKey(
    appKey: string,
  ): ApplicationCatalogEntry | undefined {
    return this.#entriesByKey.get(
      appKey,
    );
  }
}

export function createApplicationCatalog(
  inputs: readonly ApplicationCatalogEntryInput[],
): ApplicationCatalog {
  return new DefaultApplicationCatalog(
    inputs,
  );
}

function entriesMatch(
  catalogEntry: ApplicationCatalogEntry,
  architectureEntry: ApplicationCatalogEntry,
): boolean {
  return (
    catalogEntry.appKey === architectureEntry.appKey
    && catalogEntry.name === architectureEntry.name
    && catalogEntry.description === architectureEntry.description
    && catalogEntry.iconToken === architectureEntry.iconToken
    && catalogEntry.route === architectureEntry.route
    && catalogEntry.status === architectureEntry.status
    && catalogEntry.requiredEntitlement.action
      === architectureEntry.requiredEntitlement.action
    && catalogEntry.requiredEntitlement.resourceType
      === architectureEntry.requiredEntitlement.resourceType
    && catalogEntry.requiredEntitlement.resourceId
      === architectureEntry.requiredEntitlement.resourceId
  );
}

export function assertApplicationCatalogMatchesArchitecture(
  catalog: ApplicationCatalog,
  architectureEntries: readonly ApplicationCatalogEntryInput[],
): void {
  let validatedArchitectureEntries:
  readonly ApplicationCatalogEntry[];

  try {
    validatedArchitectureEntries =
      createApplicationCatalog(
        architectureEntries,
      ).list();
  } catch {
    throw new InvalidApplicationCatalogError(
      "ARCHITECTURE_MISMATCH",
    );
  }

  const catalogEntries =
    catalog.list();

  if (
    catalogEntries.length
    !== validatedArchitectureEntries.length
    || catalogEntries.some(
      (
        entry,
        index,
      ) => {
        const architectureEntry =
          validatedArchitectureEntries[index];

        return (
          !architectureEntry
          || !entriesMatch(
            entry,
            architectureEntry,
          )
        );
      },
    )
  ) {
    throw new InvalidApplicationCatalogError(
      "ARCHITECTURE_MISMATCH",
    );
  }
}
