import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const buildDir =
  process.env.NOOR_PERSONAL_BUILD_DIR ?? "dist";

const moduleUrl =
  pathToFileURL(
    path.resolve(
      buildDir,
      "infrastructure/versioned-islamic-history-catalog.js",
    ),
  ).href;

test(
  "V1 history catalog returns no fabricated religious history when no authority is provisioned",
  async () => {
    const {
      VersionedApprovedIslamicHistoryCatalog,
    } =
      await import(moduleUrl);

    const result =
      await new VersionedApprovedIslamicHistoryCatalog()
        .findApprovedForHijriDate({
          day:
            1,
          month:
            1,
          monthName:
            "Muharram",
          year:
            1448,
          source:
            "test",
          method:
            "UmmAlQura",
          adjustmentDays:
            0,
          calculatedAt:
            "2026-08-22T09:00:00.000Z",
        });

    assert.deepEqual(
      result,
      [],
    );
  },
);
