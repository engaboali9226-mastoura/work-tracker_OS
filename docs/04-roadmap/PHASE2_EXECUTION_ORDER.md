# Phase 2 Execution Order

Status: Approved

The execution order for Phase 2 has been officially adopted after completion
of the Foundation milestone.

Execution sequence:

1. Kernel
2. Scheduler
3. Workday
4. Attendance
5. Tasks
6. Notifications
7. Reports
8. Dashboard
9. Analytics
10. Integrations
11. AI Assistant

Rationale

- Kernel provides the common runtime model for every component.
- Scheduler provides platform scheduling services.
- Business components follow.
- Aggregation components are implemented after business components.
- AI Assistant is implemented after the platform becomes operational.


---

<!-- RIBAT_PLATFORM_CONTINUATION_BEGIN -->

# Superseding Ribat Platform Continuation Decision

Status:

APPROVED — 2026-07-16

Stable starting point:

`platform-minimal-workday-lifecycle-foundation-v1.0.0`

The completed Workday foundation remains stable and will later belong to
Ribat Work.

The previous immediate continuation from Workday to Attendance is paused.

The project will now complete the general Ribat Platform before building
application-specific capabilities.

Approved product structure:

```text
Ribat Platform
├── Ribat Personal
└── Ribat Work
```

Classification rule:

- life and self-development outside direct earning → Ribat Personal
- employment, profession, business and earning → Ribat Work
- shared technical capabilities → Ribat Platform

The next required activity is:

`Platform Completion Gap Audit`

Mandatory platform-completion areas include:

1. identity
2. time and Clock
3. use-case execution
4. contracts and validation
5. authentication
6. sessions
7. authorization and application entitlements
8. user context
9. user-scoped persistence and data isolation
10. application catalog
11. application composition and bootstrap
12. platform shell and protected routing
13. App Launcher
14. security verification
15. Platform Completion Checkpoint

No Personal or Work application module should be implemented before the
Platform Completion Checkpoint.

After platform completion:

1. build Ribat Personal first
2. build Ribat Work second
3. reuse the stable Workday capability inside Ribat Work
4. implement Attendance only as part of the later Ribat Work roadmap

Canonical decision document:

`docs/04-roadmap/RIBAT_PLATFORM_COMPLETION_PLAN.md`

<!-- RIBAT_PLATFORM_CONTINUATION_END -->
