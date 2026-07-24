# Noor Personal Step 002 — MVP Boundary Requirements

## Purpose

These requirements define the smallest complete Noor Personal release that can be used for real daily personal management.

## Requirement Language

- MUST means required for the first runnable MVP.
- MUST NOT means prohibited in the first runnable MVP.
- MAY means optional if it does not delay the complete daily loop.

## A. Product Boundary

- NP-MVP-001: The MVP MUST serve one individual managing their own personal life.
- NP-MVP-002: The MVP MUST NOT include employer operations, client delivery, team supervision or commercial project execution.
- NP-MVP-003: The MVP MUST implement one complete daily loop before adding broad life-management modules.
- NP-MVP-004: The MVP MUST be local-first and keep the core daily loop usable without a remote server.
- NP-MVP-005: The MVP MUST be Arabic-first, right-to-left and mobile-first.
- NP-MVP-006: The MVP MUST NOT require an account or network connection for initial daily use.

## B. Personal Day

- NP-MVP-007: The system MUST allow at most one Personal Day record for each local calendar date.
- NP-MVP-008: Opening the same date repeatedly MUST return the existing Personal Day rather than create a duplicate.
- NP-MVP-009: A Personal Day MUST use the states Open, Reviewed and Closed.
- NP-MVP-010: A newly created Personal Day MUST begin in the Open state.
- NP-MVP-011: The user MAY record one optional intention for the day.
- NP-MVP-012: The user MUST be able to assign no more than three ordered task priorities to an Open day.
- NP-MVP-013: A Closed Personal Day MUST be read-only in the first MVP.
- NP-MVP-014: The system MUST preserve ISO timestamps and initially interpret the first user's calendar dates using Asia/Riyadh.

## C. Personal Tasks and Priorities

- NP-MVP-015: The user MUST be able to create a personal task from Today.
- NP-MVP-016: Every task MUST have a non-empty title.
- NP-MVP-017: A task MAY have optional notes.
- NP-MVP-018: A task MUST use one of the states Inbox, Planned, In Progress, Completed, Deferred or Cancelled.
- NP-MVP-019: A task MAY be assigned to a Personal Day.
- NP-MVP-020: A priority position MUST reference a task assigned to the same Personal Day.
- NP-MVP-021: Priority positions 1, 2 and 3 MUST be unique within a Personal Day.
- NP-MVP-022: Completing a task MUST record the completion timestamp.
- NP-MVP-023: Deferring a task MUST require a target local date.
- NP-MVP-024: The user MUST be able to remove a task from a day's priorities without deleting the task.

## D. Routines

- NP-MVP-025: The user MUST be able to define a routine with a non-empty title.
- NP-MVP-026: A routine MUST be either active or inactive.
- NP-MVP-027: The first MVP MUST support daily schedules and selected-weekday schedules only.
- NP-MVP-028: The system MUST generate at most one occurrence for the same routine and local date.
- NP-MVP-029: A routine occurrence MUST use one of the states Pending, Completed or Skipped.
- NP-MVP-030: Completing a routine occurrence MUST record the completion timestamp.
- NP-MVP-031: Today's routine list MUST include only active routines scheduled for that date.
- NP-MVP-032: The first MVP MUST NOT implement streaks, points, badges or competitive routine scores.

## E. Capture Inbox

- NP-MVP-033: The user MUST be able to create a quick text capture from the primary daily interface.
- NP-MVP-034: A capture MUST record its creation timestamp automatically.
- NP-MVP-035: A capture MUST use one of the states Unprocessed, Converted or Archived.
- NP-MVP-036: The user MUST be able to convert an Unprocessed capture into a personal task.
- NP-MVP-037: Conversion MUST preserve a reference to the original capture.
- NP-MVP-038: The Capture Inbox MUST show Unprocessed captures ordered from newest to oldest.

## F. Daily Review and History

- NP-MVP-039: The user MUST be able to record achievements for the current Personal Day.
- NP-MVP-040: The user MUST be able to record obstacles for the current Personal Day.
- NP-MVP-041: The user MUST be able to record one or more lessons or observations.
- NP-MVP-042: The user MUST be able to assign a daily rating from 1 to 5.
- NP-MVP-043: Saving a valid review MUST move an Open day to Reviewed.
- NP-MVP-044: Closing a day MUST require a saved Daily Review.
- NP-MVP-045: Before closing, the user MUST be able to carry selected unfinished tasks to another local date.
- NP-MVP-046: History MUST list recorded Personal Days by date and open Closed days as read-only summaries.

## G. Local-First PWA and Data Portability

- NP-MVP-047: Structured MVP data MUST be persisted through a local storage adapter suitable for offline use.
- NP-MVP-048: Creating and updating days, tasks, routines, captures and reviews MUST work without a network connection.
- NP-MVP-049: Data MUST survive page refresh, browser restart and installed-PWA restart.
- NP-MVP-050: The application MUST provide a valid installable PWA manifest and offline application shell.
- NP-MVP-051: The user MUST be able to export all MVP data into one versioned JSON document.
- NP-MVP-052: The user MUST be able to import a valid supported export into a clean local profile.
- NP-MVP-053: Import MUST validate the schema version before modifying local data.
- NP-MVP-054: The system MUST NOT silently erase or reset stored data after an application or schema error.

## H. Platform, Identity and Release Boundaries

- NP-MVP-055: The application workspace MUST be located at apps/noor-personal.
- NP-MVP-056: The application package name MUST be @noor/personal.
- NP-MVP-057: Temporary dependencies on the pre-migration platform MUST be isolated behind apps/noor-personal/src/platform.
- NP-MVP-058: User-facing titles, manifests, messages and interface text MUST use Noor Personal or نور identity only.
- NP-MVP-059: The first MVP MUST keep storage, time and state behavior behind explicit application or platform interfaces rather than global mutable state.
- NP-MVP-060: Implementation MUST NOT begin until the Product Charter and all sixty MVP requirements pass independent structural review.

## Deferred Non-Goals

- NG-001: Remote account registration and login.
- NG-002: Multi-device cloud synchronization.
- NG-003: Multi-user or household collaboration.
- NG-004: Social sharing or public profiles.
- NG-005: Employment and commercial work management.
- NG-006: Personal finance and budgeting.
- NG-007: Medical or detailed health-record management.
- NG-008: Long-term goal frameworks and complex life-area planning.
- NG-009: Artificial-intelligence recommendations or autonomous planning.
- NG-010: External automation and third-party productivity integrations.
- NG-011: Attachments, image storage and document libraries.
- NG-012: Advanced analytics, gamification and performance scoring.

## MVP Acceptance Criteria

- AC-001: Opening today's date twice produces one Personal Day.
- AC-002: The user can create tasks and select no more than three ordered priorities.
- AC-003: Completing, deferring and cancelling tasks produces valid explicit states.
- AC-004: Today's scheduled routines can be completed or skipped exactly once.
- AC-005: A quick capture can be converted into a task without losing its origin.
- AC-006: A Daily Review can be saved and the day can then be closed.
- AC-007: Selected unfinished tasks can be carried to a future date before closure.
- AC-008: A Closed day appears in History and opens as a read-only summary.
- AC-009: Core daily actions remain functional while offline.
- AC-010: Data survives refresh and restart and completes a valid export-import round trip.
- AC-011: The application installs as an Arabic-first mobile PWA with Noor identity.
- AC-012: All application tests, architecture checks and MVP acceptance tests pass with no real staging, commit, tag or push.

## First Vertical Slice

The first implementation slice MUST include only:

1. Open today.
2. Create a task.
3. Assign the task as a daily priority.
4. Complete the task.
5. Save a minimal Daily Review.
6. Close the day.
7. Open the Closed day from History.
8. Preserve the result across reload.

Routines, Capture Inbox, export, import and final PWA installation follow in later MVP slices.

## Authorization Boundary

This requirements document authorizes domain requirements and design work only.

It does not authorize:

- Application source creation.
- Domain source creation.
- Storage source creation.
- PWA source creation.
- Real staging.
- Commit.
- Tag.
- Push.

## Next Step

Noor Personal Step 003 — Domain Requirements and First Vertical Slice Use-Case Design.
