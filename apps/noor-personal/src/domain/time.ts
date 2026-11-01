import type {
    DayBoundarySnapshot,
    IsoInstant,
    LocalDate,
    LocationProfileRevision,
    PrayerTimePolicyRevision,
    PrayerTimesSnapshot,
} from "./model.js";
import {
    addMinutes,
    isAtOrAfter,
    isBefore,
} from "./model.js";
import type {
    PrayerTimeCalculatorPort,
    TimeZonePort,
} from "../ports.js";

export class IntlTimeZoneAdapter
implements TimeZonePort {
    localDateForInstant(
        instant: IsoInstant,
        timeZone: string,
    ): LocalDate {
        const formatter =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                },
            );

        const parts =
            formatter.formatToParts(
                new Date(instant),
            );

        const values =
            new Map(
                parts.map(
                    part => [
                        part.type,
                        part.value,
                    ],
                ),
            );

        const year =
            values.get("year");

        const month =
            values.get("month");

        const day =
            values.get("day");

        if (
            !year
            || !month
            || !day
        ) {
            throw new Error(
                "Unable to resolve local date.",
            );
        }

        return `${year}-${month}-${day}`;
    }

    addLocalDays(
        localDate: LocalDate,
        days: number,
    ): LocalDate {
        const date =
            new Date(
                `${localDate}T12:00:00.000Z`,
            );

        date.setUTCDate(
            date.getUTCDate()
            + days,
        );

        return date
            .toISOString()
            .slice(0, 10);
    }

    weekday(
        localDate: LocalDate,
    ): number {
        return new Date(
            `${localDate}T12:00:00.000Z`,
        ).getUTCDay();
    }
}

export interface ResolvedFajrBoundary {
    readonly boundary: DayBoundarySnapshot;
    readonly prayerTimes: PrayerTimesSnapshot;
}

export async function resolveFajrBoundary(
    input: {
        readonly userId: string;
        readonly now: IsoInstant;
        readonly location: LocationProfileRevision;
        readonly policy: PrayerTimePolicyRevision;
        readonly timeZone: TimeZonePort;
        readonly prayerCalculator: PrayerTimeCalculatorPort;
    },
): Promise<ResolvedFajrBoundary> {
    const civilLocalDate =
        input.timeZone
            .localDateForInstant(
                input.now,
                input.location.timeZone,
            );

    const civilPrayerTimes =
        await input.prayerCalculator
            .calculate(
                input.location,
                input.policy,
                civilLocalDate,
            );

    const adjustedCivilFajr =
        addMinutes(
            civilPrayerTimes.fajr,
            input.policy
                .fajrAdjustmentMinutes,
        );

    const civilBoundaryStart =
        addMinutes(
            adjustedCivilFajr,
            input.policy
                .personalDayOffsetMinutes,
        );

    const operationalLocalDate =
        isAtOrAfter(
            input.now,
            civilBoundaryStart,
        )
            ? civilLocalDate
            : input.timeZone.addLocalDays(
                civilLocalDate,
                -1,
            );

    const operationalPrayerTimes =
        operationalLocalDate
        === civilLocalDate
            ? civilPrayerTimes
            : await input
                .prayerCalculator
                .calculate(
                    input.location,
                    input.policy,
                    operationalLocalDate,
                );

    const nextLocalDate =
        input.timeZone.addLocalDays(
            operationalLocalDate,
            1,
        );

    const nextPrayerTimes =
        nextLocalDate
        === civilLocalDate
            ? civilPrayerTimes
            : await input
                .prayerCalculator
                .calculate(
                    input.location,
                    input.policy,
                    nextLocalDate,
                );

    const adjustedOperationalFajr =
        addMinutes(
            operationalPrayerTimes.fajr,
            input.policy
                .fajrAdjustmentMinutes,
        );

    const adjustedNextFajr =
        addMinutes(
            nextPrayerTimes.fajr,
            input.policy
                .fajrAdjustmentMinutes,
        );

    const startAt =
        addMinutes(
            adjustedOperationalFajr,
            input.policy
                .personalDayOffsetMinutes,
        );

    const endAt =
        addMinutes(
            adjustedNextFajr,
            input.policy
                .personalDayOffsetMinutes,
        );

    if (
        isBefore(
            input.now,
            startAt,
        )
        || !isBefore(
            input.now,
            endAt,
        )
    ) {
        throw new Error(
            "Resolved instant is outside the calculated Personal Day boundary.",
        );
    }

    const key =
        `personal-day:${input.userId}:${startAt}`;

    return {
        boundary: {
            key,
            localDate:
                operationalLocalDate,
            startAt,
            endAt,
            calculatedFajrAt:
                adjustedOperationalFajr,
            nextCalculatedFajrAt:
                adjustedNextFajr,
            fajrAdjustmentMinutes:
                input.policy
                    .fajrAdjustmentMinutes,
            personalDayOffsetMinutes:
                input.policy
                    .personalDayOffsetMinutes,
            locationRevisionId:
                input.location.id,
            prayerPolicyRevisionId:
                input.policy.id,
            timeZone:
                input.location.timeZone,
            calculationMethod:
                input.policy
                    .calculationMethod,
            calculationSource:
                operationalPrayerTimes.source,
            calculationEngineVersion:
                operationalPrayerTimes
                    .engineVersion,
        },
        prayerTimes: {
            ...operationalPrayerTimes,
            fajr:
                adjustedOperationalFajr,
            nextFajr:
                adjustedNextFajr,
        },
    };
}

/**
 * Civil-day operational boundary for daily habits and tasks (R98).
 * Prayer instants and Fajr adjustment remain religious-time calculations.
 * The binary search uses IANA-zone civil dates, not a fixed UTC offset, so
 * 23/25-hour DST days and fractional-offset zones are handled correctly.
 * Historical Fajr-based PersonalDay records are NOT rewritten here.
 */
function findCivilMidnight(
    now: IsoInstant,
    timeZoneName: string,
    timeZone: TimeZonePort,
    direction: "start" | "end",
): IsoInstant {
    const instant = Date.parse(now);
    if (!Number.isFinite(instant)) throw new Error("Invalid civil-day instant.");
    const localDate = timeZone.localDateForInstant(now, timeZoneName);
    const horizon = 72 * 60 * 60 * 1000;
    let low = direction === "start" ? instant - horizon : instant;
    let high = direction === "start" ? instant : instant + horizon;
    const dateAt = (ms: number): LocalDate =>
        timeZone.localDateForInstant(new Date(ms).toISOString(), timeZoneName);
    const reached = (ms: number): boolean => direction === "start"
        ? dateAt(ms) >= localDate
        : dateAt(ms) > localDate;
    if (reached(low) || !reached(high)) {
        throw new Error("Unable to resolve IANA civil-day boundary.");
    }
    while (high - low > 1) {
        const middle = low + Math.floor((high - low) / 2);
        if (reached(middle)) high = middle;
        else low = middle;
    }
    return new Date(high).toISOString();
}

export async function resolveCivilBoundary(
    input: {
        readonly userId: string;
        readonly now: IsoInstant;
        readonly location: LocationProfileRevision;
        readonly policy: PrayerTimePolicyRevision;
        readonly timeZone: TimeZonePort;
        readonly prayerCalculator: PrayerTimeCalculatorPort;
    },
): Promise<ResolvedFajrBoundary> {
    const localDate = input.timeZone.localDateForInstant(input.now, input.location.timeZone);
    const startAt = findCivilMidnight(input.now, input.location.timeZone, input.timeZone, "start");
    const endAt = findCivilMidnight(input.now, input.location.timeZone, input.timeZone, "end");
    const nextLocalDate = input.timeZone.localDateForInstant(endAt, input.location.timeZone);
    const prayerTimes = await input.prayerCalculator.calculate(input.location, input.policy, localDate);
    const nextPrayerTimes = await input.prayerCalculator.calculate(input.location, input.policy, nextLocalDate);
    const adjustedFajr = addMinutes(prayerTimes.fajr, input.policy.fajrAdjustmentMinutes);
    const adjustedNextFajr = addMinutes(nextPrayerTimes.fajr, input.policy.fajrAdjustmentMinutes);
    if (isBefore(input.now, startAt) || !isBefore(input.now, endAt)) {
        throw new Error("Civil-day boundary does not contain current instant.");
    }
    return {
        boundary: {
            key: `personal-day-civil:${input.userId}:${startAt}`,
            localDate,
            startAt,
            endAt,
            calculatedFajrAt: adjustedFajr,
            nextCalculatedFajrAt: adjustedNextFajr,
            fajrAdjustmentMinutes: input.policy.fajrAdjustmentMinutes,
            // Retained as prayer-policy metadata; it does not shift civil midnight.
            personalDayOffsetMinutes: input.policy.personalDayOffsetMinutes,
            locationRevisionId: input.location.id,
            prayerPolicyRevisionId: input.policy.id,
            timeZone: input.location.timeZone,
            calculationMethod: input.policy.calculationMethod,
            calculationSource: prayerTimes.source,
            calculationEngineVersion: prayerTimes.engineVersion,
        },
        prayerTimes: { ...prayerTimes, fajr: adjustedFajr, nextFajr: adjustedNextFajr },
    };
}
