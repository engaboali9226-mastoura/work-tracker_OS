# Noor Personal Step 003 — Domain Decomposition

## Canonical Input

This design is governed by:

- Noor Personal Step 002-R2 Professional Product Charter.
- Noor Personal Step 002-R2 Professional System Requirements.
- Noor Personal Step 002-R2 Professional Decision Register.
- Noor Personal Review 002-R2 approval.

This document designs boundaries only. It does not authorize source creation.

## Decomposition Principles

1. The Personal Day is the operational center of the product.
2. Time, location and prayer calculation are upstream capabilities.
3. Definitions remain separate from daily execution records.
4. Closed historical truth is immutable.
5. Sensitive inner-life data receives a stricter privacy boundary.
6. Automation consumes explicit events and never owns domain truth.
7. Insights are derived read models and do not mutate source aggregates.
8. Existing platform dependencies remain hidden behind the Noor Personal platform facade.

## Bounded Contexts

- CTX-001: Temporal and Location Context owns current-instant interpretation, timezone, location profiles, prayer policies and Personal Day boundary calculation.
- CTX-002: Islamic Daily Context owns daily prayer snapshots, Hijri-date snapshots, approved Islamic-history context and derived daily windows.
- CTX-003: Personal Execution Context owns task definitions, habit definitions, revisions, lifecycle changes, daily tasks, habit occurrences, priorities, weights and eligibility.
- CTX-004: Review and Closure Context owns review policy, final daily dispositions, essential-gate evaluation, weighted achievement snapshots, closure and closure exceptions.
- CTX-005: Wellbeing and Sleep Context owns sleep goals, immutable sleep sessions, sleep attribution and non-diagnostic capacity assessment.
- CTX-006: Inner Life and Tazkiyah Context owns emotional episodes, interpretations, feelings, urges, actions, handling, outcomes, lessons, values and better-response plans.
- CTX-007: Automation and Notification Context owns outbox delivery, notification consent, scheduling requests, deduplication, cooldown, delivery attempts and authorized automation commands.
- CTX-008: History and Insights Context owns read-only historical projections, weekly and monthly insights, reason analytics and cross-context observed associations.

## Context Authority

### CTX-001 Temporal and Location

This context is upstream to all date-sensitive contexts.

It publishes resolved boundaries and immutable time snapshots.

It does not create tasks, habits, reviews or notifications.

### CTX-002 Islamic Daily Context

This context consumes resolved location, prayer policy and day boundaries.

It owns historical prayer and Hijri snapshots for each day.

It does not decide task eligibility or day closure.

### CTX-003 Personal Execution

This context evaluates definitions against the active Personal Day.

It owns whether a task or habit is eligible, materialized, completed, deferred, skipped, missed or suppressed.

It does not calculate Fajr or close the Personal Day.

### CTX-004 Review and Closure

This context receives final daily execution states, sleep summaries and reflection readiness.

It owns closure readiness, accepted exceptions and immutable closure.

It does not rewrite source definitions or sensitive reflection content.

### CTX-005 Wellbeing and Sleep

This context owns raw sleep truth and derived assessments.

It provides summaries to Today and Review through explicit read contracts.

It does not decide medical sufficiency or diagnosis.

### CTX-006 Inner Life and Tazkiyah

This context owns sensitive self-reading records.

Free text is local by default.

It publishes only privacy-safe event metadata unless the user explicitly authorizes more.

### CTX-007 Automation and Notification

This context receives outbox events and produces delivery records.

It may submit an authorized command back to the application boundary.

It must never directly update domain storage.

### CTX-008 History and Insights

This context builds projections from immutable events and snapshots.

It may identify observed associations.

It must not claim causation or mutate historical source records.

## Aggregate Ownership

- AGG-001: LocationProfile belongs to CTX-001 and owns location identity, coordinates, timezone, validity interval and activation history.
- AGG-002: PrayerTimePolicy belongs to CTX-001 and owns calculation method, prayer adjustments, Personal Day offset and effective revisions.
- AGG-003: PersonalDay belongs to CTX-004 and owns operational boundary identity, lifecycle state, review readiness, final closure and immutable day-level snapshots.
- AGG-004: DailyIslamicContext belongs to CTX-002 and owns prayer times, next-prayer data source, Hijri snapshot, daily windows and approved historical-event references.
- AGG-005: IslamicHistoryEvent belongs to CTX-002 and owns sourced editorial content, date precision, confidence and approval status.
- AGG-006: TaskDefinition belongs to CTX-003 and owns task schedule, lifecycle state, revisions, importance, weight, gate policy and targets.
- AGG-007: HabitDefinition belongs to CTX-003 and owns habit schedule, lifecycle state, revisions, importance, weight, gate policy and targets.
- AGG-008: DailyTaskInstance belongs to CTX-003 and owns one task execution record for one Personal Day and one materialization key.
- AGG-009: HabitOccurrence belongs to CTX-003 and owns one habit execution record for one Personal Day and one materialization key.
- AGG-010: ReasonCatalog belongs to CTX-003 as governed reference data used by execution, review, sleep and inner-life decisions.
- AGG-011: DailyReview belongs to CTX-004 and owns review content, final dispositions, achievement snapshot and closure recommendation.
- AGG-012: ClosureException belongs to CTX-004 and owns accepted or automatic closure exceptions and retrospective-follow-up requirements.
- AGG-013: SleepProfile belongs to CTX-005 and owns sleep targets, weekday policies and non-diagnostic assessment thresholds.
- AGG-014: SleepSession belongs to CTX-005 and owns immutable start, end, source, quality, interruption and correction history.
- AGG-015: EmotionalEpisode belongs to CTX-006 and owns factual event, interpretation, emotions, body sensations, urges, actions, handling and outcome.
- AGG-016: TazkiyahReflection belongs to CTX-006 and owns lesson, value, repair, better-response plan and follow-up action.
- AGG-017: BalanceRule belongs to CTX-005 and owns user-configured essential-area thresholds, windows, severity, grace and cooldown.
- AGG-018: Alert belongs to CTX-005 and owns a domain-approved, explainable attention condition and its resolution state.
- AGG-019: AutomationOutboxEvent belongs to CTX-007 and owns the durable automation message, idempotency key and delivery lifecycle.
- AGG-020: NotificationDelivery belongs to CTX-007 and owns scheduled, sent, delivered, opened, dismissed and failed delivery evidence.

## Owned Entities and Value Objects

The following are not separate aggregate roots in the first design:

- DayBoundarySnapshot is owned by PersonalDay.
- PrayerTimesSnapshot is owned by DailyIslamicContext.
- HijriDateSnapshot is owned by DailyIslamicContext.
- DefinitionRevision is owned by TaskDefinition or HabitDefinition.
- LifecycleEvent is owned by its TaskDefinition or HabitDefinition.
- PriorityAssignment is owned by PersonalDay through an execution reference.
- AchievementSnapshot is owned by DailyReview and frozen at closure.
- SleepAllocation is a derived projection from SleepSession.
- Interpretation, EmotionRecord, BodySensation, UrgeRecord, BehaviorRecord and CopingAction are owned by EmotionalEpisode.
- BetterResponsePlan is owned by TazkiyahReflection.
- RetrospectiveAnnotation is owned by PersonalDay but cannot change closure truth.

## Context Relationships

- CTX-001 supplies resolved boundaries to CTX-002, CTX-003, CTX-004 and CTX-005.
- CTX-002 supplies immutable DailyIslamicContext snapshots to Today and History.
- CTX-003 supplies daily execution states to CTX-004.
- CTX-005 supplies privacy-safe sleep summaries to CTX-004.
- CTX-006 supplies reflection readiness and privacy-safe metadata to CTX-004.
- CTX-004 publishes closure events to CTX-007 and CTX-008.
- CTX-007 delivers notifications and automation but never bypasses application commands.
- CTX-008 consumes events and snapshots from all contexts through read-only projectors.

## Cross-Context Prohibitions

- Personal Execution must not calculate prayer times.
- Automation must not directly mark a task completed.
- Insights must not reopen or edit a Closed Personal Day.
- Review must not read sensitive emotional free text unless explicitly requested by the user.
- Islamic history content must not be fetched directly into Today without editorial approval.
- Sleep assessment must not produce a medical diagnosis.
- Weighted achievement must not override essential-gate failure.
- A new definition revision must not rewrite an earlier daily instance.
- A remote synchronization conflict must not silently replace local Closed history.
- Legacy platform types must not appear outside apps/noor-personal/src/platform.

## First Foundation Slice Ownership

The first Foundation Slice spans only:

- CTX-001 Temporal and Location.
- CTX-002 Islamic Daily Context.
- The materialization portion of CTX-003 Personal Execution.
- The outbox-writing portion of CTX-007 Automation and Notification.

CTX-004, CTX-005, CTX-006 and CTX-008 remain design dependencies but are not implemented in the first Foundation Slice.

## Authorization Boundary

This decomposition authorizes independent design review only.

It does not authorize source files, database schemas, workflows, staging, commit, tag or push.

## Next Step

Noor Personal Review 003 — Independent Domain Design Review.
