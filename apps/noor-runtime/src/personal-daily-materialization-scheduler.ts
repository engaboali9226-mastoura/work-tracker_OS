import {
  AdhanPrayerTimeCalculator,
  CryptographicIdGenerator,
  EnsureTodayService,
  IntlTimeZoneAdapter,
  IntlUmmAlQuraHijriDateCalculator,
  SystemClock,
  VersionedApprovedIslamicHistoryCatalog,
} from "@noor/personal";

import type {
  ClockPort,
  IdGeneratorPort,
  PersonalFoundationOperationScopeProvider,
} from "@noor/personal";

interface ScheduledFoundation
extends PersonalFoundationOperationScopeProvider {
  listKnownUserIds(): Promise<readonly string[]>;
}

export interface PersonalDailyMaterializationSchedulerDependencies {
  readonly foundation: ScheduledFoundation;
  readonly clock?: ClockPort;
  readonly idGenerator?: IdGeneratorPort;
  readonly intervalMs?: number;
}

export class PersonalDailyMaterializationScheduler {
  private readonly clock: ClockPort;
  private readonly idGenerator: IdGeneratorPort;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | undefined;
  private startupTimer: ReturnType<typeof setTimeout> | undefined;
  private activeTick: Promise<void> | undefined;
  private stopped = false;

  public constructor(
    private readonly dependencies:
      PersonalDailyMaterializationSchedulerDependencies,
  ) {
    this.clock = dependencies.clock ?? new SystemClock();
    this.idGenerator =
      dependencies.idGenerator ?? new CryptographicIdGenerator();
    this.intervalMs = dependencies.intervalMs ?? 60_000;
  }

  public start(): void {
    if (this.timer || this.startupTimer) {
      return;
    }

    this.stopped = false;

    this.startupTimer = setTimeout(
      () => {
        this.startupTimer = undefined;
        void this.tick();
      },
      1_000,
    );
    this.startupTimer.unref?.();

    this.timer = setInterval(
      () => {
        void this.tick();
      },
      this.intervalMs,
    );
    this.timer.unref?.();
  }

  public async stop(): Promise<void> {
    this.stopped = true;

    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = undefined;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    if (this.activeTick) {
      try {
        await this.activeTick;
      } catch {
      }
    }
  }

  public tick(): Promise<void> {
    if (this.stopped) {
      return Promise.resolve();
    }

    if (this.activeTick) {
      return this.activeTick;
    }

    const request = this.tickInternal();
    this.activeTick = request;

    void request.finally(
      () => {
        if (this.activeTick === request) {
          this.activeTick = undefined;
        }
      },
    );

    return request;
  }

  private async tickInternal(): Promise<void> {
    const now = this.clock.now();
    let userIds: readonly string[];

    try {
      userIds = await this.dependencies.foundation.listKnownUserIds();
    } catch {
      return;
    }

    for (const userId of userIds) {
      if (this.stopped) {
        return;
      }

      try {
        const operation =
          await this.dependencies.foundation.openOperation(userId);

        const hasCurrentDay =
          operation.snapshot
            .listPersonalDays(userId)
            .some(
              day =>
                day.boundary.startAt <= now
                && now < day.boundary.endAt
                && new IntlTimeZoneAdapter().localDateForInstant(
                  now, day.boundary.timeZone,
                ) === day.boundary.localDate,
            );

        if (hasCurrentDay) {
          continue;
        }

        const ensureToday = new EnsureTodayService({
          clock: this.clock,
          idGenerator: this.idGenerator,
          timeZone: new IntlTimeZoneAdapter(),
          locations: operation.locations,
          prayerPolicies: operation.prayerPolicies,
          prayerCalculator: new AdhanPrayerTimeCalculator(),
          hijriCalculator: new IntlUmmAlQuraHijriDateCalculator(),
          historyCatalog: new VersionedApprovedIslamicHistoryCatalog(),
          transaction: operation.transaction,
        });

        await ensureToday.execute(userId);
      } catch {
        // Fail closed for one user and retry on a later scheduler tick.
      }
    }
  }
}
