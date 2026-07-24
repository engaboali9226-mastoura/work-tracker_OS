# Noor Personal Step 002-R2 — Professional System Requirements

## Canonical Scope

These requirements supersede earlier Step 002 requirement drafts wherever a conflict exists.

Implementation remains prohibited until independent review approves this scope.

## A. Product and Architecture Boundary

- NP-PRO-001: Noor Personal MUST serve one individual managing their own personal life.
- NP-PRO-002: The product MUST be Arabic-first, right-to-left and mobile-first.
- NP-PRO-003: The product MUST use Noor Personal or نور in all user-facing identity.
- NP-PRO-004: The application workspace MUST be apps/noor-personal.
- NP-PRO-005: The application package name MUST be @noor/personal.
- NP-PRO-006: Temporary legacy platform dependencies MUST remain behind apps/noor-personal/src/platform.
- NP-PRO-007: Core daily behavior MUST remain local-first.
- NP-PRO-008: Core domain decisions MUST NOT be delegated to n8n or an external API.

## B. Fajr-Based Personal Day

- NP-PRO-009: A Personal Day MUST be resolved using a local Fajr-based boundary.
- NP-PRO-010: The boundary MUST equal calculated Fajr plus a configurable personal offset.
- NP-PRO-011: The Personal Day MUST end at the next calculated Fajr-based boundary.
- NP-PRO-012: A time after civil midnight but before the next boundary MUST belong to the preceding operational Personal Day.
- NP-PRO-013: Fajr calculation MUST use location, coordinates, timezone, date and calculation policy.
- NP-PRO-014: The user MUST be able to configure a local prayer-time adjustment.
- NP-PRO-015: The user MUST be able to configure the post-Fajr Personal Day offset.
- NP-PRO-016: Every Personal Day MUST store a boundary snapshot sufficient to explain its calculation.
- NP-PRO-017: A boundary snapshot MUST include calculation method, coordinates, timezone, calculated Fajr and effective start.
- NP-PRO-018: Changing location or prayer policy MUST NOT rewrite Closed days.
- NP-PRO-019: A location change after a day begins MUST apply from the next Personal Day unless explicitly overridden with a reason.
- NP-PRO-020: The local-first release MUST materialize a logically due day on first app wake if exact background creation was unavailable.

## C. Prayer, Hijri and Islamic Context

- NP-PRO-021: Today MUST display Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha.
- NP-PRO-022: Sunrise MUST be presented as contextual time rather than a prayer.
- NP-PRO-023: Today MUST identify the next prayer.
- NP-PRO-024: Today MUST display a locally updating countdown to the next prayer.
- NP-PRO-025: Prayer-time display MUST remain available from the stored daily snapshot while offline.
- NP-PRO-026: Today MUST display the Hijri date with source, method and optional day adjustment.
- NP-PRO-027: Historical days MUST preserve the Hijri date snapshot originally assigned to them.
- NP-PRO-028: Today MAY display an Islamic history event associated with the Hijri date.
- NP-PRO-029: A displayed Islamic history event MUST have source references, review status and date precision.
- NP-PRO-030: Events with disputed or approximate dates MUST be labelled accordingly.
- NP-PRO-031: Only Approved Islamic history events MAY appear in the primary Today experience.
- NP-PRO-032: Today MUST display the Fajr-to-Maghrib and Isha-to-next-Fajr durations.

## D. Automatic Tasks, Habits and Lifecycle

- NP-PRO-033: The user MUST NOT be required to manually create each Personal Day.
- NP-PRO-034: Ensure Today MUST find or create exactly one Personal Day for the active boundary.
- NP-PRO-035: Ensure Today MUST reconcile applicable tasks and habits before returning Today.
- NP-PRO-036: Reconciliation MUST be idempotent and prevent duplicate daily instances.
- NP-PRO-037: Task and habit definitions MUST be separate from daily execution records.
- NP-PRO-038: Definitions MUST support Draft, Active, Paused, Stopped and Archived.
- NP-PRO-039: Lifecycle transitions MUST record from-state, to-state, reason, effective time and recorded time.
- NP-PRO-040: Pausing MUST support an optional planned-resumption time.
- NP-PRO-041: Resuming MUST record the actual-resumption time and reason.
- NP-PRO-042: Schedule, weight or target changes MUST create an effective definition revision.
- NP-PRO-043: Daily instances MUST retain the definition revision that created them.
- NP-PRO-044: Definition changes MUST NOT rewrite completed or Closed historical daily instances.
- NP-PRO-045: An applicable definition added during an Open day MUST appear after reconciliation.
- NP-PRO-046: Stopping or pausing a definition during an Open day MUST suppress unresolved applicable instances without deleting history.
- NP-PRO-047: A completed daily instance MUST remain completed after later definition suspension.
- NP-PRO-048: Closed days MUST NOT receive newly generated task or habit instances.

## E. Importance, Weight and Minimum Achievement

- NP-PRO-049: Every applicable task or habit MUST support an importance level.
- NP-PRO-050: Importance levels MUST include Essential, Important, Supporting and Optional.
- NP-PRO-051: Every applicable task or habit MUST support a positive bounded weight.
- NP-PRO-052: Every applicable task or habit MUST support Blocking, Reason Required or Non-Blocking gate policy.
- NP-PRO-053: A measurable item MAY define Minimum, Standard and Stretch targets.
- NP-PRO-054: Minimum MUST represent the least meaningful acceptable completion.
- NP-PRO-055: Achievement MUST support distinct factors for none, partial, minimum, standard and stretch.
- NP-PRO-056: An item contribution MUST be capped so one optional item cannot hide broad failure.
- NP-PRO-057: Daily weighted achievement MUST use only eligible daily items.
- NP-PRO-058: Suppressed, paused and not-yet-due items MUST NOT reduce weighted achievement.
- NP-PRO-059: Essential-gate status MUST be reported separately from weighted achievement.
- NP-PRO-060: Daily instances MUST preserve weight, importance, gate and target snapshots.

## F. Review, Closure, Sleep and Balance

- NP-PRO-061: The user MUST be able to configure target bedtime by weekday policy.
- NP-PRO-062: The user MUST be able to configure review lead time before bedtime.
- NP-PRO-063: The system MUST calculate review-due and review-overdue times.
- NP-PRO-064: The system MUST notify the user when review becomes due.
- NP-PRO-065: The system MUST escalate notification when review or closure becomes overdue.
- NP-PRO-066: A Personal Day MUST NOT remain Open beyond the next Personal Day boundary.
- NP-PRO-067: Normal closure MUST require all unresolved daily items to receive a final disposition.
- NP-PRO-068: A Blocking item MUST require minimum completion or an explicit accepted exception.
- NP-PRO-069: A day not reviewed before the final boundary MUST close automatically with a documented exception.
- NP-PRO-070: A late explanation MUST be stored as a retrospective annotation without reopening the day.
- NP-PRO-071: The system MUST record main sleep, naps and total sleep.
- NP-PRO-072: Sleep sufficiency MUST be assessed against a configurable target and MUST NOT be presented as medical diagnosis.

## G. Emotional Reading and Tazkiyah

- NP-PRO-073: The user MUST be able to create a quick emotional episode during the day.
- NP-PRO-074: An emotional episode MUST distinguish factual event description from interpretation.
- NP-PRO-075: An emotional episode MUST support one or more emotions with approximate intensity.
- NP-PRO-076: An emotional episode MUST support body sensations and internal urges.
- NP-PRO-077: The system MUST distinguish the urge from the action actually taken.
- NP-PRO-078: The user MUST be able to record actions resisted or deliberately avoided.
- NP-PRO-079: The user MUST be able to record how the emotion was handled.
- NP-PRO-080: The user MUST be able to assess the result, benefit, harm and remaining action.
- NP-PRO-081: A reflection MUST support lessons and an alternative better response.
- NP-PRO-082: A reflection MUST support linkage to a value such as patience, justice, mercy, courage or restraint.
- NP-PRO-083: Emotional records MAY be linked to sleep, tasks, habits, persons, location and Personal Day.
- NP-PRO-084: The product MUST NOT assign psychiatric diagnosis, moral score or numerical tazkiyah rating.

## H. Automation, Notifications, Privacy and Insights

- NP-PRO-085: The first usable release MUST integrate with n8n through an explicit automation boundary.
- NP-PRO-086: Domain events intended for automation MUST be written to an Automation Outbox.
- NP-PRO-087: n8n MUST coordinate delivery and retries but MUST NOT mutate domain state without an authorized command.
- NP-PRO-088: Initial workflows MUST cover Fajr preparation, prayer reminders, review reminders and overdue closure.
- NP-PRO-089: Initial workflows MUST cover bedtime protection, essential-balance alerts and weekly insights.
- NP-PRO-090: Notifications MUST use deduplication keys, cooldown and delivery records.
- NP-PRO-091: Lock-screen notifications MUST NOT reveal sensitive emotional or personal free text.
- NP-PRO-092: Emotional free text and sensitive notes MUST remain local by default.
- NP-PRO-093: Analytics MUST distinguish eligibility, suppression, accepted exception, skipping and missing.
- NP-PRO-094: Analytics MAY identify associations but MUST NOT describe them as proven causation.
- NP-PRO-095: The user MUST be able to export all first-release data in a versioned format.
- NP-PRO-096: Implementation MUST NOT begin until independent review approves all canonical Step 002-R2 artifacts.

## Deferred Non-Goals

- NG-001: Multi-user household collaboration.
- NG-002: Public social profiles.
- NG-003: Employer and commercial work operations.
- NG-004: Full personal-finance accounting.
- NG-005: Medical diagnosis or treatment planning.
- NG-006: Mental-health diagnosis.
- NG-007: Religious rulings or moral scoring.
- NG-008: Autonomous artificial-intelligence decision making.
- NG-009: Automatic interpretation of private emotional text by external services.
- NG-010: Full cloud dependency for the daily loop.
- NG-011: Unreviewed historical content from arbitrary internet sources.
- NG-012: Complex yearly goal frameworks before daily-system validation.
- NG-013: Gamification, competitive rankings or public streaks.
- NG-014: Destructive deletion of established historical records.
- NG-015: Automatic reopening of Closed days.
- NG-016: Unlimited notifications without cooldown or user control.

## Professional Acceptance Criteria

- AC-001: A time before Fajr boundary resolves to the preceding Personal Day.
- AC-002: A time after Fajr plus offset resolves to the new Personal Day.
- AC-003: Repeated Ensure Today calls create one day and no duplicate instances.
- AC-004: Prayer times and next-prayer countdown appear from the daily snapshot.
- AC-005: Hijri date and approved event metadata remain stable in history.
- AC-006: Fajr-to-Maghrib and Isha-to-Fajr durations are displayed.
- AC-007: Adding an applicable task or habit updates Open Today.
- AC-008: Pausing and resuming preserve reasons, effective times and history.
- AC-009: Revision changes affect only valid current and future materialization.
- AC-010: Minimum, Standard and Stretch produce distinct achievement factors.
- AC-011: Weighted achievement and essential-gate status are displayed separately.
- AC-012: Suppressed items do not lower eligible achievement.
- AC-013: Review-due and review-overdue notifications are generated once per policy.
- AC-014: No day remains Open beyond the next boundary.
- AC-015: Automatic closure records a reason and creates retrospective follow-up.
- AC-016: Sleep data is compared with the personal target without diagnostic language.
- AC-017: A quick emotional record can later be completed as deep reflection.
- AC-018: Event, interpretation, feeling, urge, action and result remain distinct.
- AC-019: A better-response plan and selected value can be stored.
- AC-020: Sensitive emotional text is absent from lock-screen notification payloads.
- AC-021: n8n receives outbox events and records delivery attempts.
- AC-022: Temporary n8n or network failure does not prevent local daily operation.
- AC-023: Export and import preserve snapshots, revisions, reasons and history.
- AC-024: All tests and reviews pass without staging, commit, tag or push.

## Authorization Boundary

These requirements authorize independent review and domain-design planning only.

They do not authorize application, domain, storage, automation or notification implementation.

## Next Step

Noor Personal Review 002-R2 — Independent Professional Charter and Requirements Review.
