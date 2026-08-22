import {
  ProductionAdapterError,
  assertHijriDateRequest,
  assertHijriDateResult,
} from "../application/production-adapter-contracts.js";

import type {
  HijriDateAdapter,
  HijriDateRequest,
  HijriDateResult,
} from "../application/production-adapter-contracts.js";

import type {
  HijriDateSnapshot,
  IsoInstant,
  LocalDate,
} from "../domain/model.js";

import type {
  HijriDateCalculatorPort,
} from "../ports.js";

const START =
  "1900-01-01";

const END =
  "2077-11-16";

const MAX_CIVIL_DATE_CORRECTIONS =
  4;

function partsFor(
  formatter:
    Intl.DateTimeFormat,
  instant:
    Date,
):
Readonly<{
  year: number;
  month: number;
  day: number;
}> {
  const values =
    new Map<string, string>();

  for (
    const part
    of formatter.formatToParts(
      instant,
    )
  ) {
    if (
      part.type === "year"
      || part.type === "month"
      || part.type === "day"
    ) {
      if (
        values.has(
          part.type,
        )
      ) {
        throw new ProductionAdapterError(
          "InvalidHijriResult",
          "Intl returned duplicate date components.",
        );
      }

      values.set(
        part.type,
        part.value,
      );
    }
  }

  const year =
    Number(
      values.get("year"),
    );
  const month =
    Number(
      values.get("month"),
    );
  const day =
    Number(
      values.get("day"),
    );

  if (
    !Number.isInteger(year)
    || !Number.isInteger(month)
    || !Number.isInteger(day)
  ) {
    throw new ProductionAdapterError(
      "InvalidHijriResult",
      "Intl returned incomplete date components.",
    );
  }

  return {
    year,
    month,
    day,
  };
}

function gregorianOrdinal(
  year: number,
  month: number,
  day: number,
):
number {
  return Date.UTC(
    year,
    month - 1,
    day,
  );
}

function instantForLocalCivilDate(
  civilDate: string,
  timeZone: string,
):
Date {
  const [
    year,
    month,
    day,
  ] = civilDate.split("-").map(Number);

  if (
    year === undefined
    || month === undefined
    || day === undefined
  ) {
    throw new ProductionAdapterError(
      "InvalidHijriResult",
      "Requested civil date is invalid.",
    );
  }

  const targetOrdinal =
    gregorianOrdinal(
      year,
      month,
      day,
    );
  const gregorianFormatter =
    new Intl.DateTimeFormat(
      "en-u-ca-gregory-nu-latn",
      {
        calendar: "gregory",
        numberingSystem: "latn",
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      },
    );
  let candidate =
    new Date(
      targetOrdinal
      + 12 * 60 * 60 * 1000,
    );

  for (
    let iteration = 0;
    iteration < MAX_CIVIL_DATE_CORRECTIONS;
    iteration += 1
  ) {
    const local =
      partsFor(
        gregorianFormatter,
        candidate,
      );
    const localOrdinal =
      gregorianOrdinal(
        local.year,
        local.month,
        local.day,
      );

    if (
      localOrdinal === targetOrdinal
    ) {
      return candidate;
    }

    candidate =
      new Date(
        candidate.getTime()
        + targetOrdinal
        - localOrdinal,
      );
  }

  throw new ProductionAdapterError(
    "InvalidHijriResult",
    "Requested civil date is not representable in the requested time zone.",
  );
}

export const UMM_AL_QURA_PROVIDER_VERSION =
  `Node/${process.version};ICU/${process.versions.icu ?? "unknown"};calendar/islamic-umalqura`;

export class IntlUmmAlQuraHijriDateAdapter
implements HijriDateAdapter {
  public readonly kind =
    "HijriDate" as const;

  public async resolve(
    request:
      HijriDateRequest,
  ):
  Promise<HijriDateResult> {
    assertHijriDateRequest(
      request,
    );

    if (
      request.method
      !== "UmmAlQura"
    ) {
      throw new ProductionAdapterError(
        "UnsupportedHijriMethod",
        "Unsupported Hijri calculation method.",
      );
    }

    if (
      request.providerVersion
      !== UMM_AL_QURA_PROVIDER_VERSION
    ) {
      throw new ProductionAdapterError(
        "HijriProviderUnavailable",
        "Requested Umm al-Qura provider identity does not match this runtime.",
      );
    }

    if (
      request.civilDate < START
      || request.civilDate > END
    ) {
      throw new ProductionAdapterError(
        "HijriDateOutOfRange",
        "Hijri date is outside the supported Umm al-Qura range.",
      );
    }

    try {
      const instant =
        instantForLocalCivilDate(
          request.civilDate,
          request.timeZone,
        );
      const formatter =
        new Intl.DateTimeFormat(
          "en-u-ca-islamic-umalqura",
          {
            calendar:
              "islamic-umalqura",
            timeZone:
              request.timeZone,
            year:
              "numeric",
            month:
              "numeric",
            day:
              "numeric",
          },
        );

      if (
        formatter
          .resolvedOptions()
          .calendar
        !== "islamic-umalqura"
      ) {
        throw new ProductionAdapterError(
          "HijriProviderUnavailable",
          "Umm al-Qura calendar is unavailable.",
        );
      }

      const {
        year,
        month,
        day,
      } =
        partsFor(
          formatter,
          instant,
        );

      const result:
        HijriDateResult =
        {
          requestedCivilDate:
            request.civilDate,
          timeZone:
            request.timeZone,
          year,
          month,
          day,
          method:
            request.method,
          providerName:
            "Intl.UmmAlQura",
          providerVersion:
            UMM_AL_QURA_PROVIDER_VERSION,
          supportedRangeStart:
            START,
          supportedRangeEnd:
            END,
        };

      assertHijriDateResult(
        request,
        result,
      );

      return result;
    } catch (error) {
      if (
        error
        instanceof ProductionAdapterError
      ) {
        throw error;
      }

      throw new ProductionAdapterError(
        "InvalidHijriResult",
        "Intl returned an invalid Hijri date.",
        {
          cause:
            error,
        },
      );
    }
  }
}

export class IntlUmmAlQuraHijriDateCalculator
implements HijriDateCalculatorPort {
  public constructor(
    private readonly adapter:
      HijriDateAdapter =
        new IntlUmmAlQuraHijriDateAdapter(),
  ) {}

  public async calculate(
    localDate:
      LocalDate,
    timeZone:
      string,
    calculatedAt:
      IsoInstant,
  ):
  Promise<HijriDateSnapshot> {
    const result =
      await this.adapter.resolve({
        civilDate:
          localDate,
        timeZone,
        method:
          "UmmAlQura",
        providerVersion:
          UMM_AL_QURA_PROVIDER_VERSION,
      });

    return {
      day:
        result.day,
      month:
        result.month,
      monthName:
        `Umm al-Qura month ${result.month}`,
      year:
        result.year,
      source:
        result.providerName,
      method:
        result.method,
      adjustmentDays:
        0,
      calculatedAt,
    };
  }
}
