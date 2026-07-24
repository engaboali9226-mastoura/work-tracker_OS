# Noor Personal Step 003 — Contracts, Events and Persistence Boundaries

## Purpose

This document defines application-owned boundaries required for later implementation.

No concrete vendor, database, prayer API, push provider or cloud host is selected here.

## Application Ports

- PORT-001: ClockPort supplies the current instant and deterministic test clocks.
- PORT-002: IdGeneratorPort creates stable domain identifiers.
- PORT-003: TimeZonePort converts instants and local calendar fields using explicit timezone identifiers.
- PORT-004: LocationProfileRepository stores effective location profiles and revisions.
- PORT-005: PrayerTimeCalculatorPort calculates prayer times locally from coordinates, date and policy.
- PORT-006: PrayerTimeVerificationPort optionally verifies calculated times against an external source.
- PORT-007: HijriDateCalculatorPort calculates and explains Hijri-date source, method and adjustment.
- PORT-008: IslamicHistoryCatalogPort returns only editorially eligible events.
- PORT-009: PersonalDayRepository loads and saves versioned PersonalDay aggregates.
- PORT-010: DefinitionRepository loads effective TaskDefinition and HabitDefinition revisions.
- PORT-011: DailyExecutionRepository loads and saves DailyTaskInstance and HabitOccurrence records.
- PORT-012: ReviewRepository stores DailyReview, ClosureException and retrospective annotations.
- PORT-013: SleepRepository stores SleepProfile, SleepSession and derived allocations.
- PORT-014: EmotionalRepository stores EmotionalEpisode metadata and protected sensitive content references.
- PORT-015: TazkiyahRepository stores TazkiyahReflection and better-response plans.
- PORT-016: BalanceRepository stores BalanceRule and non-diagnostic assessments.
- PORT-017: AlertRepository stores explainable alerts and resolution states.
- PORT-018: AutomationOutboxRepository stores pending, delivered and failed outbox records.
- PORT-019: NotificationPreferenceRepository stores consent, channels, quiet time, cooldown and escalation.
- PORT-020: NotificationDeliveryRepository stores scheduled and actual delivery evidence.
- PORT-021: LocalTransactionPort executes atomic local domain and outbox writes.
- PORT-022: SensitiveDataProtectionPort protects, unlocks and removes access to sensitive local payloads.
- PORT-023: SyncGatewayPort exchanges versioned commands and snapshots without owning domain rules.
- PORT-024: AuditLogPort records security, correction, import and exceptional administrative actions.

## Port Direction Rules

- Domain and application layers define the ports.
- Infrastructure adapters implement the ports.
- UI calls application use cases rather than repositories.
- n8n calls authenticated automation endpoints rather than repositories.
- Legacy platform dependencies are wrapped only by apps/noor-personal/src/platform.
- No domain module imports browser, IndexedDB, HTTP, n8n or notification-provider types.

## Domain Events

- EVT-001: PersonalDayBoundaryResolved records the selected operational interval and policy revisions.
- EVT-002: PersonalDayCreated records creation of one day for one boundary key.
- EVT-003: DailyIslamicContextBuilt records the immutable prayer and Hijri snapshot.
- EVT-004: TodayReconciled records evaluated definitions, created instances, suppressions and prevented duplicates.
- EVT-005: DailyTaskMaterialized records one deterministic daily task creation.
- EVT-006: HabitOccurrenceMaterialized records one deterministic habit occurrence creation.
- EVT-007: DefinitionLifecycleChanged records pause, resume, stop, archive or activation with reason.
- EVT-008: DefinitionRevisionActivated records a new effective schedule, weight, gate or target revision.
- EVT-009: ReviewBecameDue records review-due policy activation.
- EVT-010: ReviewBecameOverdue records overdue escalation eligibility.
- EVT-011: PersonalDayClosed records normal or accepted-exception closure.
- EVT-012: PersonalDayAutoClosedWithException records boundary-driven automatic closure.
- EVT-013: SleepAssessmentUpdated records a non-diagnostic target comparison.
- EVT-014: EmotionalEpisodeCaptured records privacy-safe emotional-episode metadata only.
- EVT-015: TazkiyahReflectionCompleted records completion metadata without sensitive reflection text.
- EVT-016: AlertRaised records an explainable domain-approved attention condition.

## Event Envelope

Every event envelope must contain:

- eventId.
- eventType.
- eventVersion.
- occurredAt.
- aggregateType.
- aggregateId.
- aggregateVersion.
- userId.
- personalDayId when applicable.
- correlationId.
- causationId.
- idempotencyKey.
- privacyClassification.
- payload.

## Privacy Classifications

- PublicProductData.
- PersonalOperationalData.
- SensitiveWellbeingData.
- HighlySensitiveInnerLifeData.

Automation payloads may contain only fields allowed for their classification and user consent.

HighlySensitiveInnerLifeData is excluded from default outbox payloads.

## Read Models

- RM-001: TodayDashboard combines day boundary, prayer context, priorities, essential items, tasks, habits, sleep summary and review readiness.
- RM-002: PrayerHeader presents prayer times, next prayer, countdown, Hijri date and daily windows.
- RM-003: ExecutionBoard presents daily tasks, habits, weights, minimum targets and final states.
- RM-004: ClosureReadiness presents unresolved items, essential gates, achievement preview and review timing.
- RM-005: SleepSummary presents main sleep, naps, target comparison and non-diagnostic status.
- RM-006: InnerLifeReviewQueue presents privacy-safe emotional episodes awaiting reflection.
- RM-007: HistoricalDay presents the immutable Closed day snapshot.
- RM-008: WeeklyInsight presents observed trends, reasons and associations without claiming causation.

## Persistence Decisions

- PST-001: Local storage is the source of truth for the first daily loop.
- PST-002: The selected adapter must support atomic writes spanning domain aggregates and Automation Outbox.
- PST-003: Every mutable aggregate stores a monotonically increasing version.
- PST-004: Closed PersonalDay, frozen snapshots and delivered historical events are append-only or immutable.
- PST-005: Sensitive inner-life payloads use a separately protected local partition.
- PST-006: Outbox delivery is at least once and requires consumer idempotency.
- PST-007: Synchronization conflicts are recorded explicitly and never silently overwrite Closed history.
- PST-008: Storage schema versions and migrations must be reversible through backup or export before destructive change.

## Command Concurrency

Every state-changing command must include:

- aggregateId.
- expectedVersion.
- commandId.
- requestedAt.
- actor.
- source.
- reason when required.

A stale expectedVersion returns Conflict and must not retry as an unconditional overwrite.

## Automation Command Boundary

n8n may submit only explicit authenticated commands such as:

- RequestEnsureToday.
- RequestReviewReminderEvaluation.
- RequestOverdueClosureEvaluation.
- RecordNotificationDeliveryResult.
- RequestWeeklyInsightGeneration.

The application revalidates every command against current domain state.

n8n must not submit direct field updates.

## Initial Package Layout Design

When implementation is later authorized, the intended application-owned layout is:

- apps/noor-personal/src/domain/temporal-location
- apps/noor-personal/src/domain/islamic-context
- apps/noor-personal/src/domain/execution
- apps/noor-personal/src/domain/review-closure
- apps/noor-personal/src/domain/wellbeing-sleep
- apps/noor-personal/src/domain/inner-life
- apps/noor-personal/src/domain/automation-notification
- apps/noor-personal/src/domain/history-insights
- apps/noor-personal/src/application
- apps/noor-personal/src/infrastructure
- apps/noor-personal/src/platform
- apps/noor-personal/src/ui

This is a design target only. Step 003 creates none of these paths.

## Compatibility Facade

All temporary reuse of existing platform capabilities must pass through:

`apps/noor-personal/src/platform`

Examples include:

- Clock adaptation.
- Event publication adaptation.
- Storage abstraction adaptation.
- Scheduler-request adaptation.
- Identifier adaptation.

No Noor Personal domain type may expose a legacy package identity.

## Review Requirements

Independent Review 003 must verify:

1. Every aggregate has one owner.
2. Context dependencies do not create circular domain authority.
3. The first slice can run locally without n8n.
4. Idempotency covers day, context, task, habit and outbox creation.
5. Closure recovery is compatible with the Fajr boundary.
6. Sensitive emotional content cannot leak through automation contracts.
7. Ports remain application-owned and vendor-neutral.
8. No application implementation has been authorized or created.

## Authorization Boundary

This document authorizes independent design review only.

It does not authorize source creation, database implementation, n8n workflows, staging, commit, tag or push.

## Next Step

Noor Personal Review 003 — Independent Domain Design Review.
