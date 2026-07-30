import {
  createApplicationCatalog,
} from "./application-catalog.js";
import type {
  ApplicationCatalogEntryInput,
} from "./application-catalog.js";

export const NOOR_PLATFORM_NAME =
  "Noor";

const CANONICAL_APPLICATIONS = [
  {
    appKey:
      "noor-personal",
    name:
      "Noor Personal",
    description:
      "Personal life, self-development, and wellbeing.",
    iconToken:
      "noor.app.personal",
    route:
      "/personal",
    status:
      "experimental",
    requiredEntitlement: {
      action:
        "access",
      resourceType:
        "application",
      resourceId:
        "noor-personal",
    },
  },
  {
    appKey:
      "noor-work",
    name:
      "Noor Work",
    description:
      "Employment, professional delivery, business, and earning.",
    iconToken:
      "noor.app.work",
    route:
      "/work",
    status:
      "planned",
    requiredEntitlement: {
      action:
        "access",
      resourceType:
        "application",
      resourceId:
        "noor-work",
    },
  },
] as const satisfies
readonly ApplicationCatalogEntryInput[];

export const applicationCatalog =
  createApplicationCatalog(
    CANONICAL_APPLICATIONS,
  );
