import {
  resolve,
} from "node:path";

import {
  assertApplicationCatalogMatchesArchitecture,
} from "../packages/core/src/application-catalog/application-catalog.js";

import {
  NOOR_PLATFORM_NAME,
  applicationCatalog,
} from "../packages/core/src/application-catalog/canonical-application-catalog.js";

import {
  SystemManifestApplicationLoader,
} from "../packages/architecture/src/parser/index.js";

const workspaceRoot =
  resolve(
    import.meta.dirname,
    "..",
  );

const architecturalSource =
  new SystemManifestApplicationLoader()
    .load(
      resolve(
        workspaceRoot,
        "architecture/system.manifest.yaml",
      ),
    );

if (
  architecturalSource.name
  !== NOOR_PLATFORM_NAME
) {
  throw new Error(
    "The system manifest identity does not match Noor.",
  );
}

assertApplicationCatalogMatchesArchitecture(
  applicationCatalog,
  architecturalSource.applications,
);

console.log(
  `Application catalog matches ${architecturalSource.name} architecture (${applicationCatalog.list().length} applications).`,
);
