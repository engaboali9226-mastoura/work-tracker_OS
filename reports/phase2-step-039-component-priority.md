# Component Priority Audit

==================================================
COMPONENT : kernel
==================================================

----- components/kernel/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/kernel/specification/SPECIFICATION.md -----
Provide the common runtime model for every component.
- Component Identity
- Component Registration
- Component Configuration
- Register Component
- Validate Component
- ComponentCreated
- ComponentRegistered
Every component must:

==================================================
COMPONENT : scheduler
==================================================

----- components/scheduler/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/scheduler/specification/SPECIFICATION.md -----
# Scheduler Component
- Scheduled execution is idempotent.
- Failed executions are logged.

----- components/scheduler/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : workday
==================================================

----- components/workday/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/workday/specification/SPECIFICATION.md -----
# Workday Component
- Start Workday
- StartWorkday
- WorkdayStarted
- A workday must be started before business operations.

----- components/workday/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : attendance
==================================================

----- components/attendance/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/attendance/specification/SPECIFICATION.md -----
# Attendance Component
- A check-in is required before check-out.

----- components/attendance/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : tasks
==================================================

----- components/tasks/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/tasks/specification/SPECIFICATION.md -----
# Tasks Component
- Start Task
- StartTask
- TaskStarted

----- components/tasks/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : notifications
==================================================

----- components/notifications/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/notifications/specification/SPECIFICATION.md -----
# Notifications Component

----- components/notifications/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : reports
==================================================

----- components/reports/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/reports/specification/SPECIFICATION.md -----
# Reports Component

----- components/reports/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : dashboard
==================================================

----- components/dashboard/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/dashboard/specification/SPECIFICATION.md -----
# Dashboard Component
Provide the main user dashboard by aggregating data from business components.
- Dashboard aggregates data from other components.

----- components/dashboard/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : analytics
==================================================

----- components/analytics/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/analytics/specification/SPECIFICATION.md -----
# Analytics Component

----- components/analytics/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : integrations
==================================================

----- components/integrations/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/integrations/specification/SPECIFICATION.md -----
# Integrations Component

----- components/integrations/execution/EXECUTION.md -----
# Execution

==================================================
COMPONENT : ai-assistant
==================================================

----- components/ai-assistant/component.yaml -----
kind: Component
  name: component-name
  displayName: Component Name
    startup: automatic
    restartPolicy: always
  phase: Draft

----- components/ai-assistant/specification/SPECIFICATION.md -----
# AI Assistant Component
- Generated insights may be reviewed before execution.

----- components/ai-assistant/execution/EXECUTION.md -----
# Execution

