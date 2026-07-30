import assert from "node:assert/strict";
import test from "node:test";

import * as core from "../src/index.js";
import type {
  ApplicationCatalog,
  ApplicationCatalogEntry,
} from "../src/index.js";

test("application catalog foundation is available from the Core public API", () => {
  const requiredSymbols = [
    "APPLICATION_STATUSES",
    "InvalidApplicationCatalogError",
    "NOOR_PLATFORM_NAME",
    "applicationCatalog",
    "assertApplicationCatalogMatchesArchitecture",
    "createApplicationCatalog",
  ];

  for (const symbol of requiredSymbols) {
    assert.equal(
      symbol in core,
      true,
      `Missing Core export: ${symbol}`,
    );
  }

  const catalog:
  ApplicationCatalog =
    core.applicationCatalog;

  const entry:
  ApplicationCatalogEntry | undefined =
    catalog.findByKey(
      "noor-personal",
    );

  assert.equal(
    entry?.appKey,
    "noor-personal",
  );
});
