# Noor Personal Step 002-R2 — Professional Product Charter

## Canonical Status

This document is the canonical Product Charter for the first professional Noor Personal release.

Earlier Step 002 Product Charter and MVP documents are retained only as historical drafts. Where they conflict with this Charter, this Charter and the Step 002-R2 Professional System Requirements govern.

## Product Identity

- Product name: Noor Personal.
- Arabic product name: نور.
- Product family: Noor Platform.
- Primary language: Arabic.
- Primary direction: right-to-left.
- Primary form factor: mobile-first installable PWA.
- First user: one individual managing their own personal life.

## Product Position

Noor Personal is a personal operating system for preparing, living, reviewing and learning from each day.

It is not merely a task list, habit tracker, prayer-times viewer, sleep tracker or journal. It connects these capabilities into one coherent daily system while preserving explicit state, reasons, history and user ownership.

## Core Product Promise

Noor Personal prepares the user's day automatically according to the local Fajr boundary, applicable tasks, habits and personal policies.

It helps the user:

1. Understand the Islamic and temporal context of the day.
2. Know what is required and what matters most.
3. Act according to minimum, standard and stretch commitments.
4. Protect essential responsibilities.
5. Observe sleep, balance and personal capacity.
6. Record emotional experiences and internal reactions.
7. Review conduct, causes, benefits and lessons.
8. Close every day deliberately or through a documented exception.
9. Learn from recurring patterns without reducing the user to a score.

## Professional System Pillars

### Fajr-Based Personal Day

The operational Personal Day begins at locally calculated Fajr plus a configurable personal offset and ends at the next Fajr-based boundary.

The civil date remains visible, but the operational day is determined by the Fajr boundary.

### Islamic Daily Context

Today presents:

- Prayer times.
- The next prayer.
- Time remaining until the next prayer.
- Sunrise as contextual information.
- Hijri date.
- Approved Islamic history events associated with the Hijri date.
- Fajr-to-Maghrib duration.
- Isha-to-next-Fajr duration.

### Automatic Daily Materialization

The user does not manually create each day.

Noor automatically ensures and reconciles the active Personal Day from:

- One-time scheduled tasks.
- Recurring task definitions.
- Habit definitions.
- Carried-forward responsibilities.
- Effective lifecycle states.
- Effective definition revisions.
- Pauses, stops and exclusions.

Repeated reconciliation must never create duplicates or destroy completed history.

### Tasks, Habits and Minimum Viable Action

Every applicable task or habit may define:

- Importance.
- Weight.
- Gate policy.
- Minimum target.
- Standard target.
- Stretch target.

The minimum target represents the least meaningful action that preserves continuity or satisfies the minimum acceptable obligation.

Achievement beyond the minimum raises the weighted achievement result, while essential-gate failure remains visible separately.

### Daily Review and Mandatory Closure

The user defines a target bedtime and review policy.

The system reminds the user before the target bedtime and escalates reminders when review or closure is overdue.

No Personal Day remains Open beyond the next Personal Day boundary.

A day closes as:

- Closed.
- Closed With Accepted Exceptions.
- Closed Automatically With Exception.

Failure to review does not silently disappear. It creates a documented closure exception and a retrospective follow-up.

### Sleep and Personal Capacity

The system records sleep sessions and assesses sleep against a configurable personal target.

It presents:

- Main sleep.
- Naps.
- Total sleep.
- Target comparison.
- Sleep deficit or sufficiency.
- Available Isha-to-Fajr window.
- Relationship between sleep, workload and daily outcomes.

The assessment is behavioral guidance, not medical diagnosis.

### Emotional Reading and Tazkiyah

The system supports a structured record of personal emotional episodes:

- What happened.
- What was factually observed.
- What was interpreted.
- What was felt.
- What occurred internally and physically.
- What urge appeared.
- What action was taken or resisted.
- How the emotion was handled.
- What resulted.
- What benefited or harmed.
- What was learned.
- Which value should guide a better future response.

The purpose is self-reading, responsibility and tazkiyah, not psychiatric diagnosis or moral scoring.

### Reasons, Revisions and Historical Truth

Every significant lifecycle transition records:

- Previous state.
- New state.
- Reason code.
- Optional explanation.
- Effective time.
- Recorded time.
- Planned resumption.
- Actual resumption.
- Source and actor.

Definition changes create revisions rather than rewriting history.

Daily instances store snapshots of the rules and weights that governed them.

### Professional Analytics

Analytics distinguish:

- Scheduled items.
- Eligible items.
- Suppressed items.
- Completed items.
- Skipped items.
- Missed items.
- Deferred items.
- Accepted exceptions.

Planned pauses and valid suppression do not count as failure.

The system reports weighted achievement and essential-gate status separately.

It may identify patterns from user data, but must label them as observed associations rather than medical, religious or psychological judgments.

### Local-First Reliability

Core daily operations remain available locally:

- Day resolution.
- Prayer-time fallback calculation.
- Today reconciliation.
- Task and habit updates.
- Daily review.
- Closure.
- Emotional records.
- Sleep records.
- History.
- Export.

Remote services enhance the product but do not become the only source of truth for the personal day.

### n8n Automation From the First Release

n8n is included from the first usable release as the automation orchestrator.

It coordinates:

- Fajr preparation.
- Prayer notifications.
- Review reminders.
- Overdue-review escalation.
- Bedtime and sleep-protection reminders.
- Essential-balance alerts.
- Daily and weekly summaries.
- External-data retrieval and synchronization.
- Delivery retries and execution records.

Noor Personal retains domain authority. n8n does not determine valid state transitions, eligibility, weighted achievement or closure rules.

## Primary Today Experience

The Today screen presents a calm prioritized view:

1. Product identity and date.
2. Hijri and civil date.
3. Location and Fajr-based day boundary.
4. Prayer times.
5. Next prayer and countdown.
6. Fasting or Fajr-to-Maghrib window.
7. Isha-to-Fajr window.
8. Sleep duration and sufficiency.
9. Approved Islamic history context.
10. Essential-balance alerts.
11. Three selected priorities.
12. Essential items.
13. Tasks.
14. Habits.
15. Quick capture.
16. Emotional quick record.
17. Review and closure readiness.

## First Release Surfaces

- Today.
- Tasks.
- Habits.
- Inbox and Quick Capture.
- Prayer and Islamic Context.
- Sleep.
- Emotional Reading and Tazkiyah.
- Review and Closure.
- History.
- Insights.
- Automation and Notification Preferences.
- Settings and Data Portability.

## Privacy Position

Emotional notes, free-text reflections, personal relationships and detailed sleep notes are sensitive.

They remain local by default.

Automation receives only the minimum information needed to deliver a reminder or perform an authorized workflow.

Lock-screen notifications must not expose sensitive emotional or personal content.

## Explicit Non-Diagnostic Boundary

Noor Personal must not:

- Diagnose mental-health conditions.
- Diagnose sleep disorders.
- Claim religious judgment of the user.
- Assign a numerical tazkiyah or moral score.
- Treat statistical association as causation.
- Replace qualified medical, psychological or religious advice.

## First Professional Release Outcome

The first professional release succeeds when the user can:

1. Receive an automatically prepared Fajr-based day.
2. View prayer and Islamic context.
3. Execute weighted tasks and habits.
4. Record sleep and receive understandable balance feedback.
5. Record emotional episodes and complete reflective learning.
6. Review and close the day before the next boundary.
7. Receive automation and notifications through n8n.
8. Continue the core daily loop during temporary network loss.
9. Export and restore their personal data.
10. Review historical days without rewriting them.

## Delivery Strategy

### Foundation Slice

- Fajr boundary.
- Location and prayer policy.
- Automatic Today.
- Local persistence.
- Automation outbox.

### Execution Slice

- Tasks.
- Habits.
- Definition lifecycle.
- Reconciliation.
- Weights and minimum targets.

### Review Slice

- Sleep.
- Daily review.
- Essential gates.
- Mandatory closure.
- Exception reasons.

### Inner-Life Slice

- Emotional quick capture.
- Deep reflection.
- Tazkiyah values.
- Better-response plan.
- Privacy protections.

### Islamic Context Slice

- Prayer display.
- Next-prayer countdown.
- Hijri date.
- Approved history event.
- Daily windows.

### Automation Slice

- n8n gateway.
- Prayer notifications.
- Review and bedtime reminders.
- Essential-balance alerts.
- Weekly insight.

### Release Slice

- Offline PWA.
- Export and import.
- End-to-end acceptance testing.
- Seven-day real-use validation.

## Governance

This Charter authorizes requirements review and domain-design planning only.

It does not authorize:

- Application implementation.
- Domain source implementation.
- Database implementation.
- n8n workflow implementation.
- Notification-server implementation.
- Real staging.
- Commit.
- Tag.
- Push.

## Next Step

Noor Personal Review 002-R2 — Independent Professional Charter and Requirements Review.
