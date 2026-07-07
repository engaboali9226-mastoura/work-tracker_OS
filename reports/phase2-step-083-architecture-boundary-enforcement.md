Phase 2 Step 083
Architecture Boundary Enforcement

Status
Completed

Goal
Prevent workspace code from importing architecture internals directly.

Rule
Code under apps and packages must not import from architecture source internals.

Allowed
@worktracker/architecture

Forbidden
packages architecture src internal paths
@worktracker/architecture src internal paths
