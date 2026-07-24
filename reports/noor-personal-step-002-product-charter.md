# Noor Personal Step 002 — Product Charter

## Decision Summary

Noor Personal will be delivered first as a focused, local-first personal-day application.

The first release will not attempt to become a complete life-management platform. It will implement one complete daily loop that a single individual can use every day without depending on a remote server.

## Product Identity

- Product name: Noor Personal.
- Arabic product name: نور.
- Product family: Noor Platform.
- Primary experience: Arabic-first and right-to-left.
- Secondary language support: deferred until after the first usable release.
- Initial form factor: mobile-first installable web application.

## First User

The first user is one individual managing their own personal life.

The initial design partner and daily user is the repository owner. The product must therefore solve a real daily problem before it is generalized for other users.

The first user is not:

- A company.
- A project team.
- A manager supervising employees.
- A social community.
- A household with shared accounts.

## Core Problem

Personal responsibilities, intentions, tasks, routines and reflections are often spread across memory, chat messages, notes and disconnected applications.

This creates:

- Unclear daily priorities.
- Forgotten commitments.
- Repeated mental re-planning.
- Weak visibility into what was actually completed.
- No reliable daily history.
- Difficulty learning from previous days.

## Product Promise

Noor Personal gives the user one trusted place to decide what matters today, capture what appears during the day, complete personal actions, review what happened and preserve a searchable history.

## Core Daily Loop

1. Open or create today.
2. Set an optional intention.
3. Select up to three priority tasks.
4. Review today's tasks and routines.
5. Capture new thoughts and commitments quickly.
6. Complete, defer or cancel tasks.
7. Complete or skip routine occurrences.
8. Write the daily review.
9. Carry selected unfinished tasks forward.
10. Close the day.
11. Reopen the day later as a read-only historical record.

## First Runnable Outcome

The first runnable release is successful when the user can complete the full daily loop on a phone while offline and reopen the same data after refreshing or restarting the application.

## Primary User Jobs

### Plan Today

The user can decide the small number of actions that matter most today.

### Remember Commitments

The user can capture thoughts or obligations without interrupting the current activity.

### Execute Personal Actions

The user can see current tasks and routines and record what was completed.

### Resolve Incomplete Work

The user can deliberately defer, cancel or carry forward unfinished tasks.

### Review the Day

The user can record achievements, obstacles, lessons and a simple rating.

### Recall Previous Days

The user can reopen an earlier day and understand what happened without reconstructing it from memory.

## Product Principles

### One Daily Home

Today is the primary product surface. The user should not need to navigate through several modules to understand the current day.

### Completion Over Configuration

The MVP must favor using the product over configuring the product.

### Fast Capture

Creating a capture must require minimal input.

### Explicit State

Tasks, routines and days must have clear states. Hidden or inferred state must not control critical behavior.

### Local First

The daily loop must remain usable without an internet connection.

### User Ownership

The user must be able to export their data without requiring a service operator.

### Calm Interface

The interface must help the user decide and act. It must not create pressure through streaks, points, competitive scores or excessive alerts.

### Narrow First Release

A smaller complete application is preferred to a larger incomplete platform.

## MVP Functional Surfaces

The first release contains only:

- Today.
- Capture Inbox.
- Routines.
- Daily Review.
- History.
- Data Export and Import.
- Installable PWA shell.

Tasks and priorities are managed primarily through Today and the Capture Inbox rather than through a separate complex project-management interface.

## Initial Data Concepts

The MVP will later define formal domain models for:

- Personal Day.
- Personal Task.
- Routine.
- Routine Occurrence.
- Capture.
- Daily Review.

This Charter does not authorize their implementation yet.

## Product Boundary

Noor Personal owns personal life management outside the direct management of employment, client delivery, commercial projects or income-generating work.

A personal action may relate to career development, learning or preparation, but operational job records and work-project execution remain outside Noor Personal.

## Local-First Release Strategy

The first release will:

- Store structured data locally.
- Work without a remote account.
- Work without a mandatory network connection.
- Provide versioned JSON export and import.
- Preserve a future path to authenticated synchronization.
- Avoid making an external automation service part of the core daily loop.

## Platform Compatibility Boundary

Existing platform capabilities may be reused, but temporary dependencies on the pre-migration platform must remain behind:

`apps/noor-personal/src/platform`

Product code outside this boundary must use Noor Personal language and application-owned interfaces.

## Success Measures

The first release will be evaluated by whether:

1. The user completes the full daily loop for seven real days.
2. Core data survives refresh, browser restart and PWA restart.
3. The application remains usable offline after first load.
4. A complete export can be imported into a clean local profile.
5. The user can open any recorded day from history.
6. The user can review today's priorities in one screen.
7. No core operation requires a remote server.
8. No legacy product identity is visible in the Noor Personal interface.

## Delivery Sequence

### Slice 1 — Today and Tasks

- Open today.
- Add tasks.
- Select up to three priorities.
- Complete, defer or cancel tasks.

### Slice 2 — Routines and Capture Inbox

- Define simple routines.
- Record today's routine outcomes.
- Capture and process new items.

### Slice 3 — Daily Review and History

- Review the day.
- Carry selected tasks forward.
- Close the day.
- Open previous days.

### Slice 4 — Local-First PWA and Portability

- Install the application.
- Work offline.
- Export data.
- Import data.
- Validate the complete release.

## Release Position

The MVP is a personal daily operating loop, not a complete life-management system.

Further modules will be considered only after real daily use proves that the core loop is stable and useful.

## Governance

This Charter authorizes requirements and design work only.

It does not authorize:

- Application implementation.
- Domain implementation.
- Storage implementation.
- PWA implementation.
- Staging.
- Commit.
- Tag.
- Push.

## Next Product Step

Noor Personal Step 003 — Define the Domain Requirements and First Vertical Slice Use Cases.
