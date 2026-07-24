# Noor Personal Step 003 — Foundation Slice Design

## Slice Name

Fajr Day Foundation.

## Slice Goal

Produce one reliable local Today snapshot from:

- Current instant.
- Effective location.
- Effective prayer policy.
- Stored task and habit definitions.
- Existing daily execution records.

The slice must persist the result atomically and write privacy-safe automation events without requiring a server or n8n to be available.

## End-to-End Slice

Resolve current instant  
→ Resolve active location  
→ Resolve prayer policy  
→ Calculate prayer snapshot  
→ Resolve Fajr-based Personal Day boundary  
→ Ensure Personal Day  
→ Build Daily Islamic Context  
→ Load eligible definitions  
→ Materialize missing task and habit records  
→ Reconcile existing records  
→ Persist Today and Automation Outbox atomically  
→ Return Today Dashboard snapshot

## Application Use Cases

- UC-001: ResolveActiveLocation obtains the effective location profile for the current instant.
- UC-002: ResolvePrayerTimePolicy obtains the effective prayer policy and Personal Day offset.
- UC-003: CalculatePrayerSnapshot calculates Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha and next Fajr.
- UC-004: ResolvePersonalDayBoundary maps the current instant to one half-open Fajr-based interval.
- UC-005: EnsurePersonalDay finds or creates one PersonalDay for the resolved boundary key.
- UC-006: BuildDailyIslamicContext creates or returns the immutable Islamic context snapshot for that day.
- UC-007: LoadEligibleDefinitions loads effective task and habit revisions applicable to the day.
- UC-008: MaterializeDailyTasks creates missing daily task instances using deterministic materialization keys.
- UC-009: MaterializeHabitOccurrences creates missing habit occurrences using deterministic materialization keys.
- UC-010: ReconcileOpenToday suppresses or restores unresolved instances according to effective lifecycle changes.
- UC-011: PersistTodayAndOutbox atomically saves the domain changes and automation outbox messages.
- UC-012: ReadTodayDashboard returns a privacy-safe, mobile-ready Today projection.

## Foundation Invariants

- INV-001: One user may have at most one PersonalDay for one resolved boundary-start instant.
- INV-002: A Personal Day interval is half-open: start is included and next start is excluded.
- INV-003: A civil-midnight instant before next Fajr remains in the preceding operational day.
- INV-004: The Personal Day boundary snapshot is immutable after day creation.
- INV-005: DailyIslamicContext is unique per PersonalDay and effective policy revisions.
- INV-006: Historical prayer and Hijri snapshots are never recalculated destructively.
- INV-007: One task materialization key may create at most one DailyTaskInstance.
- INV-008: One habit materialization key may create at most one HabitOccurrence.
- INV-009: Repeating EnsureToday with unchanged inputs produces no new domain records.
- INV-010: Reconciliation cannot reset Completed daily execution.
- INV-011: Reconciliation cannot alter a Closed PersonalDay.
- INV-012: A definition applies only when its effective revision covers the resolved day.
- INV-013: A paused or stopped definition does not create an eligible daily instance.
- INV-014: A definition added during an Open day may create one missing daily instance.
- INV-015: Suppression preserves the daily record and its source revision.
- INV-016: Daily execution stores weight, importance, gate and target snapshots.
- INV-017: Automation Outbox writing occurs in the same local transaction as the domain change.
- INV-018: Failed automation delivery never rolls back a valid local Personal Day.
- INV-019: Every outbox event has a deterministic idempotency key.
- INV-020: Sensitive emotional free text is never included in Foundation Slice outbox payloads.
- INV-021: Remote verification cannot rewrite a historical local prayer snapshot automatically.
- INV-022: Read models cannot mutate aggregate state.
- INV-023: Every state-changing command includes expected aggregate version.
- INV-024: The first Foundation Slice creates no review, sleep, emotional or insight records.

## Materialization Keys

### Personal Day

`personal-day:{userId}:{boundaryStartInstant}`

### Daily Islamic Context

`daily-islamic-context:{personalDayId}:{locationRevisionId}:{prayerPolicyRevisionId}`

### Daily Task Instance

`daily-task:{personalDayId}:{taskDefinitionId}:{definitionRevisionId}:{scheduleOccurrenceKey}`

### Habit Occurrence

`habit-occurrence:{personalDayId}:{habitDefinitionId}:{definitionRevisionId}:{scheduleOccurrenceKey}`

### Automation Outbox

`outbox:{aggregateId}:{aggregateVersion}:{eventType}`

Keys are stored values, not reconstructed only from display text.

## Atomic Transaction Boundary

UC-011 must atomically persist:

1. PersonalDay creation or version update.
2. DailyIslamicContext creation.
3. New or reconciled DailyTaskInstance records.
4. New or reconciled HabitOccurrence records.
5. AutomationOutboxEvent records.
6. Aggregate-version increments.

The concrete storage technology remains undecided, but its adapter must support this transaction boundary locally.

## Resolved Design Obligations

- OBL-001: Prayer calculation uses an application-owned PrayerTimeCalculatorPort. A local calculator is mandatory; a remote verifier is optional. The stored day snapshot is historical authority.
- OBL-002: Day, Islamic context, task, habit and outbox creation use deterministic idempotency keys defined in this design.
- OBL-003: Hijri calculation uses a HijriDateCalculatorPort and stores source, method, adjustment and calculated value in the daily snapshot.
- OBL-004: Islamic history uses a curated catalog. Only Approved records may appear in Today; disputed precision is displayed explicitly.
- OBL-005: First-design weights are bounded from 1 to 10. Default achievement factors are 0.00, 0.50, 1.00, 1.25 and 1.50 for none, partial, minimum, standard and stretch. Contribution is capped at weight multiplied by 1.50.
- OBL-006: Review reminders are based on bedtime policy. Logical automatic closure occurs exactly at the next Personal Day boundary. If the app is inactive, closure is materialized on next wake with the boundary instant preserved as closedAt.
- OBL-007: SleepSession remains an immutable instant interval. Primary sleep is associated with the Personal Day containing its wake instant; overlap allocations remain available for duration analytics.
- OBL-008: Sensitive emotional records use a separate local protection boundary. Automation receives identifiers, due times and severity only, not emotional free text.
- OBL-009: Automation Outbox provides atomic write and at-least-once delivery. Consumers must deduplicate using the stored outbox idempotency key.
- OBL-010: Local-to-cloud synchronization uses aggregate versions and optimistic concurrency. Closed-day conflicts cannot be overwritten automatically and must produce a conflict record.
- OBL-011: Notification delivery requires per-device consent, channel preferences, quiet time, cooldown, deduplication and escalation policy.
- OBL-012: ReasonCatalog uses stable versioned codes. Referenced codes cannot be deleted; custom explanations use OTHER plus private free text.

## Closure Recovery Design

Although closure implementation is outside the first slice, day resolution must support it.

When application wake detects a crossed boundary:

1. Resolve the previous Personal Day.
2. If it is still Open, submit CloseExpiredPersonalDay before creating the new Today.
3. Use the stored next-boundary instant as the logical closure time.
4. Record automatic exception when review was absent.
5. Create a privacy-safe retrospective follow-up.
6. Continue with EnsureToday for the new boundary.

n8n may remind and request closure before the boundary, but local recovery remains authoritative.

## Weight and Gate Design

Weighted achievement and essential-gate status are separate outputs.

### Weighted Achievement

Only eligible instances enter the denominator.

A suppressed, paused, stopped or not-yet-due item contributes neither earned points nor eligible weight.

### Essential Gate

An Essential Blocking item passes only when:

- Its minimum target is reached, or
- An accepted exception and reason are recorded.

A high weighted score cannot convert a failed Essential Gate into a passing day.

## Sleep Attribution Design

- Raw SleepSession remains unchanged after import except through explicit correction history.
- Main sleep is presented on the Personal Day containing the wake instant.
- Naps are associated with the Personal Day containing the nap start instant.
- Interval-overlap projections support cross-boundary analysis.
- Sleep sufficiency uses the active SleepProfile target.
- Assessment language remains non-diagnostic.

## Emotional Privacy Design

The emotional model is split into:

- Non-sensitive metadata: episode identifier, Personal Day, timestamps, review status and severity.
- Sensitive content: factual description, interpretation, emotion notes, persons, free text, lesson and better-response plan.

Sensitive content is local by default and accessed through SensitiveDataProtectionPort.

No sensitive text appears in:

- Automation Outbox.
- Push payloads.
- Lock-screen notifications.
- General analytics exports unless explicitly selected.

## Foundation Slice Failure Rules

- Missing active location blocks prayer and boundary resolution with an explainable configuration error.
- Missing prayer policy blocks day creation until a valid default policy is selected.
- Local prayer-calculation failure returns a recoverable failure and must not invent times.
- Optional remote-verification failure does not block local creation.
- Local transaction failure creates no partial Personal Day.
- Outbox-delivery failure leaves the outbox event pending.
- A stale aggregate version returns a conflict and performs no silent overwrite.

## Explicitly Deferred From Foundation Slice

- Task-definition management UI.
- Habit-definition management UI.
- Review and closure screens.
- Sleep recording.
- Emotional recording.
- Islamic-history administration.
- Web Push delivery.
- n8n workflow creation.
- Cloud synchronization.
- Insights and analytics.
- Export and import.
- Application source implementation.

## Authorization Boundary

This design authorizes independent review only.

It does not authorize implementation, staging, commit, tag or push.

## Next Step

Noor Personal Review 003 — Independent Domain Design Review.
