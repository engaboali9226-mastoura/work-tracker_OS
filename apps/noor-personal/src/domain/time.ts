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
