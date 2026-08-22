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
      "infrastructure/intl-umm-al-qura-hijri-date-adapter.js",
    ),
  ).href;

test(
  "Hijri adapter distinguishes unsupported method from provider identity failure",
  async () => {
    const {
      IntlUmmAlQuraHijriDateAdapter,
      UMM_AL_QURA_PROVIDER_VERSION,
    } =
      await import(moduleUrl);

    const adapter =
      new IntlUmmAlQuraHijriDateAdapter();

    await assert.rejects(
      () =>
        adapter.resolve({
          civilDate:
            "2026-08-22",
          timeZone:
            "Asia/Riyadh",
          method:
            "Other",
          providerVersion:
            UMM_AL_QURA_PROVIDER_VERSION,
        }),
      error =>
        error?.code
          === "UnsupportedHijriMethod",
    );

    await assert.rejects(
      () =>
        adapter.resolve({
          civilDate:
            "2026-08-22",
          timeZone:
            "Asia/Riyadh",
          method:
            "UmmAlQura",
          providerVersion:
            "wrong-runtime",
        }),
      error =>
        error?.code
          === "HijriProviderUnavailable",
    );
  },
);

test(
  "Hijri calculator reports real runtime identity and leaves adjustment to Foundation",
  async () => {
    const {
      IntlUmmAlQuraHijriDateAdapter,
      IntlUmmAlQuraHijriDateCalculator,
      UMM_AL_QURA_PROVIDER_VERSION,
    } =
      await import(moduleUrl);

    const adapter =
      new IntlUmmAlQuraHijriDateAdapter();

    const result =
      await adapter.resolve({
        civilDate:
          "2026-08-22",
        timeZone:
          "Asia/Riyadh",
        method:
          "UmmAlQura",
        providerVersion:
          UMM_AL_QURA_PROVIDER_VERSION,
      });

    assert.equal(
      result.providerName,
      "Intl.UmmAlQura",
    );

    assert.equal(
      result.providerVersion,
      UMM_AL_QURA_PROVIDER_VERSION,
    );

    const calculatedAt =
      "2026-08-22T09:00:00.000Z";

    const snapshot =
      await new IntlUmmAlQuraHijriDateCalculator()
        .calculate(
          "2026-08-22",
          "Asia/Riyadh",
          calculatedAt,
        );

    assert.equal(
      snapshot.adjustmentDays,
      0,
    );

    assert.equal(
      snapshot.calculatedAt,
      calculatedAt,
    );
  },
);

test(
  "Hijri adapter preserves the requested local Gregorian civil date across offsets",
  async () => {
    const {
      IntlUmmAlQuraHijriDateAdapter,
      UMM_AL_QURA_PROVIDER_VERSION,
    } =
      await import(moduleUrl);

    const adapter =
      new IntlUmmAlQuraHijriDateAdapter();
    const results =
      await Promise.all(
        [
          "Asia/Riyadh",
          "Pacific/Kiritimati",
          "Pacific/Pago_Pago",
        ].map(
          timeZone =>
            adapter.resolve({
              civilDate: "2026-08-22",
              timeZone,
              method: "UmmAlQura",
              providerVersion:
                UMM_AL_QURA_PROVIDER_VERSION,
            }),
        ),
      );

    for (
      const result
      of results
    ) {
      assert.deepEqual(
        [
          result.year,
          result.month,
          result.day,
        ],
        [1448, 3, 9],
      );
    }
  },
);

test(
  "Hijri adapter fails closed for a Gregorian date skipped by the runtime zone data",
  async t => {
    const gregorian =
      new Intl.DateTimeFormat(
        "en-u-ca-gregory-nu-latn",
        {
          calendar: "gregory",
          numberingSystem: "latn",
          timeZone: "Pacific/Apia",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        },
      );
    const formatted =
      gregorian.format(
        new Date("2011-12-30T12:00:00.000Z"),
      );

    if (
      formatted === "12/30/2011"
    ) {
      t.skip(
        "The runtime does not expose the Pacific/Apia historical date skip.",
      );
      return;
    }

    const {
      IntlUmmAlQuraHijriDateAdapter,
      UMM_AL_QURA_PROVIDER_VERSION,
    } =
      await import(moduleUrl);

    await assert.rejects(
      () =>
        new IntlUmmAlQuraHijriDateAdapter()
          .resolve({
            civilDate: "2011-12-30",
            timeZone: "Pacific/Apia",
            method: "UmmAlQura",
            providerVersion:
              UMM_AL_QURA_PROVIDER_VERSION,
          }),
      error =>
        error?.code
          === "InvalidHijriResult",
    );
  },
);
