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
      "infrastructure/adhan-prayer-calculation-adapter.js",
    ),
  ).href;

const contractsUrl =
  pathToFileURL(
    path.resolve(
      buildDir,
      "application/production-adapter-contracts.js",
    ),
  ).href;

test(
  "adhan adapter returns deterministic raw prayer instants without Foundation adjustments",
  async () => {
    const {
      AdhanPrayerCalculationAdapter,
    } =
      await import(moduleUrl);

    const adapter =
      new AdhanPrayerCalculationAdapter();

    const request = {
      civilDate:
        "2026-08-22",
      timeZone:
        "Asia/Riyadh",
      latitude:
        24.7136,
      longitude:
        46.6753,
      calculationMethod:
        "UmmAlQura",
      asrMethod:
        "standard",
      highLatitudeRule:
        "middle-of-night",
      engineVersion:
        "4.4.4",
    };

    const first =
      await adapter.calculate(
        request,
      );

    const second =
      await adapter.calculate(
        request,
      );

    assert.deepEqual(
      first,
      second,
    );

    assert.equal(
      first.engineName,
      "adhan",
    );

    assert.equal(
      first.engineVersion,
      "4.4.4",
    );

    for (
      const key
      of [
        "fajr",
        "sunrise",
        "dhuhr",
        "asr",
        "maghrib",
        "isha",
      ]
    ) {
      assert.equal(
        new Date(first[key])
          .toISOString(),
        first[key],
      );
    }

    assert.equal(
      Object.hasOwn(
        first,
        "fajrAdjustmentMinutes",
      ),
      false,
    );

    assert.equal(
      Object.hasOwn(
        first,
        "personalDayOffsetMinutes",
      ),
      false,
    );
  },
);

test(
  "adhan adapter fails closed for an unsupported frozen policy",
  async () => {
    const {
      AdhanPrayerCalculationAdapter,
    } =
      await import(moduleUrl);

    const {
      ProductionAdapterError,
    } =
      await import(contractsUrl);

    await assert.rejects(
      () =>
        new AdhanPrayerCalculationAdapter()
          .calculate({
            civilDate:
              "2026-08-22",
            timeZone:
              "Asia/Riyadh",
            latitude:
              24.7136,
            longitude:
              46.6753,
            calculationMethod:
              "UmmAlQura",
            asrMethod:
              "hanafi",
            highLatitudeRule:
              "middle-of-night",
            engineVersion:
              "4.4.4",
          }),
      error =>
        (
          error
          instanceof ProductionAdapterError
          && error.code
            === "UnsupportedPrayerPolicy"
        ),
    );
  },
);
