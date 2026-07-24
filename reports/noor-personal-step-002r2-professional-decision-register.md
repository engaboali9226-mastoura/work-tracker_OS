# Noor Personal Step 002-R2 — Professional Decision Register

## Purpose

This register captures the approved product decisions that govern later domain design.

## Approved Decisions

- NPD-001: The Personal Day begins at calculated local Fajr plus a configurable offset.
- NPD-002: The operational Personal Day may differ from the civil calendar date around midnight.
- NPD-003: Every day stores an immutable calculation snapshot.
- NPD-004: Location and prayer-policy changes apply prospectively.
- NPD-005: Today is created and reconciled automatically.
- NPD-006: Definitions and daily execution records are separate.
- NPD-007: Definition changes create effective revisions.
- NPD-008: Pause, resume, stop and edit operations require auditable lifecycle events.
- NPD-009: Structured reason codes are combined with optional free-text explanation.
- NPD-010: Closed historical days are never regenerated destructively.
- NPD-011: Prayer times, next prayer and countdown are part of Today.
- NPD-012: Hijri dates preserve source, method and adjustment.
- NPD-013: Islamic history events require editorial approval and source metadata.
- NPD-014: Fasting and night windows are derived from the prayer snapshot.
- NPD-015: Sleep has a configurable personal target and non-diagnostic assessment.
- NPD-016: Review time is derived from target bedtime policy.
- NPD-017: Every Personal Day closes before the next boundary.
- NPD-018: Unreviewed days close automatically with an exception record.
- NPD-019: Late explanations are annotations and do not reopen the day.
- NPD-020: Tasks and habits support importance, weight and gate policy.
- NPD-021: Measurable items support Minimum, Standard and Stretch.
- NPD-022: Weighted achievement and essential-gate status remain separate.
- NPD-023: Planned suppression is not counted as failure.
- NPD-024: Emotional records separate event, interpretation, feeling, urge and action.
- NPD-025: Emotional reflection includes handling, result, benefit, harm and lesson.
- NPD-026: Tazkiyah reflection links experience to values and a better future response.
- NPD-027: Noor Personal does not diagnose or assign a moral or tazkiyah score.
- NPD-028: Sensitive emotional text remains local by default.
- NPD-029: n8n is used from the first usable release.
- NPD-030: n8n coordinates automation but does not own domain truth.
- NPD-031: Automation uses an outbox, deduplication and delivery records.
- NPD-032: Core daily operation remains available during temporary network or automation failure.

## First Design Aggregates

The next design phase should evaluate these candidate aggregates:

- PersonalDay.
- LocationProfile.
- PrayerTimePolicy.
- DailyIslamicContext.
- TaskDefinition.
- HabitDefinition.
- DefinitionRevision.
- LifecycleEvent.
- DailyTaskInstance.
- HabitOccurrence.
- DailyReview.
- ClosureException.
- SleepProfile.
- SleepSession.
- EmotionalEpisode.
- TazkiyahReflection.
- BalanceRule.
- Alert.
- AutomationOutboxEvent.
- NotificationDelivery.

The list is a design input, not authorization to create source files.

## Required Design Questions

Independent review and later design must resolve:

1. Aggregate ownership of daily reconciliation.
2. Exact idempotency keys for daily materialization.
3. Prayer-calculation adapter and offline fallback boundary.
4. Hijri-date source and adjustment policy.
5. Historical-event editorial storage boundary.
6. Weight-factor ranges and contribution caps.
7. Essential-gate exception workflow.
8. Final automatic-closure timing before the next Fajr boundary.
9. Sleep-window and 24-hour aggregation rules.
10. Emotional-record privacy and encryption boundary.
11. Automation-outbox delivery guarantees.
12. Local-to-cloud conflict policy.

## Prohibited Premature Decisions

Step 002-R2 does not select:

- A production database.
- A prayer-time vendor.
- A Hijri API.
- A push-notification provider.
- A cloud host.
- A specific encryption library.
- A final n8n deployment topology.

Those choices require requirements-backed design and review.

## Next Step

Noor Personal Review 002-R2 — Independent Professional Charter and Requirements Review.
