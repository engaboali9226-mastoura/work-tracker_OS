# Ribat Platform Completion Plan

## Status

APPROVED

## Decision Date

2026-07-16

## Stable Baseline

Commit:

`2b5becb9bb64651a6e9d7562f095648c8e8abad8`

Tag:

`platform-minimal-workday-lifecycle-foundation-v1.0.0`

Latest completed capability:

Minimal Workday Lifecycle Foundation.

---

# 1. Platform Identity

The general platform name is:

**Ribat Platform**

The complete product ecosystem may also be described as:

**Ribat OS**

Approved Arabic brand name:

**رباط**

Approved visual direction:

- an elegant Arabian horse head
- a refined and strong profile
- a distinctive dark teal or blue-green primary color
- the Arabic word `رباط`
- a clean, premium and minimal identity

The exact production asset formats and repository asset locations must be
handled in a dedicated brand-asset step.

---

# 2. Product Model

Ribat is one general platform that hosts multiple applications.

The initial product structure is exactly:

```text
Ribat Platform
├── Ribat Personal
└── Ribat Work
```

The platform is not itself a Personal or Work application.

The platform provides shared technical capabilities.

The applications provide domain-specific behavior.

---

# 3. Ribat Personal Boundary

Ribat Personal owns everything whose primary purpose is the user's life,
self-development and wellbeing outside direct employment, professional
delivery or income generation.

Approved Ribat Personal modules include:

1. Today
2. Habits and Routines
3. Goals
4. Personal Tasks
5. Health and Wellbeing
6. Personal Learning
7. Personal Finance
8. Relationships and Life
9. Reviews and Insights

Examples:

- daily habits
- morning and evening routines
- personal goals
- household tasks
- exercise
- sleep
- nutrition
- general reading
- learning for personal interest
- family and relationships
- personal spending
- budgeting
- saving
- daily reflection
- personal productivity

Personal Finance owns the management of money as part of the user's personal
life after that money becomes personal income.

It does not own professional opportunity generation, client acquisition,
employment management or business execution.

---

# 4. Ribat Work Boundary

Ribat Work owns everything whose primary purpose is employment, professional
development, project execution, business activity or income generation.

Approved Ribat Work modules include:

1. Work Today
2. Work Execution
3. Projects
4. Career
5. Professional Skills
6. Income and Opportunities
7. Professional Knowledge
8. Work Reviews and Insights

Examples:

- Workday
- attendance
- work tasks
- work orders
- sites
- teams
- equipment
- meetings
- project delivery
- reports
- professional achievements
- curriculum vitae
- job applications
- interviews
- promotions
- professional certificates
- professional learning plans
- technical references
- freelancing
- clients
- proposals
- contracts
- invoices
- side projects intended to generate income
- employment opportunities
- business opportunities

The already stable Workday capability belongs to Ribat Work when the Work
application is built.

Attendance and Work Tasks are deferred until Ribat Work development begins.

---

# 5. Classification Rule

An item is classified by its primary purpose and operating context, not merely
by its title.

The governing rule is:

```text
Does it primarily serve life and self-development outside earning?
→ Ribat Personal

Does it primarily serve employment, profession, business or earning?
→ Ribat Work

Is it a shared technical service needed by multiple applications?
→ Ribat Platform
```

Examples:

English learning for travel or personal interest:

`Ribat Personal`

English learning for a promotion or professional opportunity:

`Ribat Work`

Programming as a hobby:

`Ribat Personal`

Programming for employment, freelancing or building a commercial product:

`Ribat Work`

Personal household budgeting:

`Ribat Personal`

Salary opportunities, clients, invoices and revenue generation:

`Ribat Work`

---

# 6. One Primary Owner Rule

Every record has exactly one primary owning application.

A record must not be duplicated merely because it affects both personal and
work contexts.

Cross-application relationships are allowed.

Example:

```text
Professional English Course
Primary owner: Ribat Work
Related Personal Goal: Travel confidently
```

The course remains one record.

The Personal goal links to it without creating a second course record.

This rule prevents:

- duplicate data
- inconsistent progress
- conflicting edits
- unclear ownership
- application overlap

---

# 7. Modules Are Not Separate Applications

Habits, Goals, Health, Skills, Career, Attendance and Projects are modules.

They are not separate top-level applications in the initial product.

The initial App Launcher should expose only:

```text
Ribat Personal
Ribat Work
```

Each application contains its internal modules.

A new top-level application may be introduced only when a future domain is
large, independent and cannot coherently belong to Personal or Work.

---

# 8. Ribat Platform Boundary

Ribat Platform owns shared capabilities required by multiple applications.

Mandatory shared platform capabilities before application development:

1. Architecture as the Source of Truth
2. Runtime and module execution
3. Event System
4. Storage abstraction and persistence composition
5. State transition support
6. Scheduler execution foundation
7. Identity Foundation
8. Time and Clock Foundation
9. Use-Case Execution Foundation
10. Contracts and Validation Foundation
11. Authentication Foundation
12. Session Foundation
13. Authorization and App Entitlements
14. User Context Foundation
15. User-Scoped Storage and Data Isolation
16. Application Registry and App Catalog
17. Application Composition and Bootstrap
18. Platform Shell and Protected Routing
19. App Launcher
20. Security and Isolation Verification

The following shared capabilities may be added incrementally when an actual
application requires them:

- global search
- shared calendar
- notifications
- files
- tags
- shared analytics
- shared settings beyond the required account settings

They must not be built prematurely merely because they may be useful later.

---

# 9. User and Access Model

Ribat is not an anonymously accessible platform.

The required access flow is:

```text
Open Ribat
↓
Validate session
↓
No valid session
↓
Show sign-in
↓
Authenticate user
↓
Create secure session
↓
Load user context and application entitlements
↓
Show allowed applications
↓
Open selected application
```

The initial platform should support controlled accounts or invitations.

Public self-registration is not required for the first platform release.

Authentication and authorization are different:

```text
Authentication:
Who is the user?

Authorization:
What may the user access or perform?
```

Hiding an application in the user interface is not sufficient.

Access must also be enforced by application and storage boundaries.

---

# 10. App Catalog and App Launcher

The platform owns a canonical catalog of applications.

A catalog entry should eventually include concepts such as:

```text
App Key
Name
Description
Icon
Route
Status
Required Permissions
```

User access is derived from application entitlements.

After sign-in, the App Launcher displays only applications available to the
current user.

The initial launcher contains at most:

- Ribat Personal
- Ribat Work

An application that is not available to the current user should not be shown
in the first release.

---

# 11. User Data Isolation

Every user-owned domain record must be scoped to its owner.

Examples:

```text
Habit → User
Goal → User
Personal Task → User
Workday → User
Work Task → User
Professional Skill → User
Opportunity → User
```

A user must not be able to read or mutate another user's data by:

- modifying a route
- changing an identifier
- sending a manual API request
- bypassing the user interface

Isolation must be enforced through appropriate platform layers, including:

- User Context
- application use cases
- repository boundaries
- persistence policies
- API or adapter boundaries

---

# 12. Platform Completion Sequence

The continuation sequence before building Ribat Personal or Ribat Work is:

1. Platform Completion Gap Audit
2. Identity Foundation
3. Time and Clock Foundation
4. Use-Case Execution Foundation
5. Contracts and Validation Foundation
6. Authentication Foundation
7. Session Foundation
8. Authorization and App Entitlements
9. User Context Foundation
10. User-Scoped Storage and Persistence Composition
11. Application Registry and App Catalog
12. Application Composition and Bootstrap
13. Platform Shell and Protected Routing
14. App Launcher
15. Security and Data-Isolation Verification
16. Reference Module Platform Verification
17. Platform Completion Checkpoint

Only after the Platform Completion Checkpoint may application development
begin.

---

# 13. Application Order After Platform Completion

The first application should be:

**Ribat Personal**

Initial candidate modules:

- Today
- Habits and Routines
- Goals
- Personal Tasks
- Daily Check-in
- Productivity Log
- Daily Review

The exact first slice must be selected through evidence and formal
requirements.

The second application should be:

**Ribat Work**

Ribat Work will reuse the stable Workday capability and may then add:

- Attendance
- Work Tasks
- Projects
- Career
- Professional Skills
- Income and Opportunities
- Professional Knowledge

---

# 14. Platform Completion Definition of Done

Ribat Platform is complete enough to stop platform construction when the
following scenario is proven:

```text
Create or provision a user
↓
Sign in
↓
Create a secure session
↓
Load user identity and permissions
↓
Display allowed applications
↓
Open an application inside Ribat
↓
Execute an application use case
↓
Persist data under the current user
↓
Block access to another user's data
↓
Sign out and invalidate the session
```

A new application module must be addable without modifying the foundations of:

- Architecture
- Runtime
- Events
- Storage
- Authentication
- Authorization
- Platform Shell

If every new module requires modifying those foundations, the platform is not
yet complete.

---

# 15. Superseded Continuation Direction

The previous immediate continuation toward Attendance is paused.

Attendance remains valid future Ribat Work functionality.

It is not the next platform capability.

The next activity is:

**Platform Completion Gap Audit**

The audit must determine the exact existing and missing foundations before
selecting implementation requirements.

---

# 16. Anti-Overreach Rules

The platform completion phase must not automatically expand into:

- building all Personal modules
- building all Work modules
- public registration
- social networking
- organizations or enterprise tenancy
- payroll
- accounting
- CRM
- generic ERP
- AI Assistant
- complex analytics
- every possible shared service
- provider-specific coupling without abstraction evidence

Evidence Before Assumption remains mandatory.

No feature starts with code.
