# Phase 2 Step 310 — Minimal User Identity Foundation Requirements

## Status

PASS

## Stable Baseline

Stable committed baseline:

`40fab174dbcf0102c77b7b1241b9d958df7bf3fb`

Stable checkpoint:

`checkpoint-ribat-platform-boundaries-v1.0.0`

## Evidence Source

These requirements are based on:

- Review 308 — Ribat Platform Completion Gap Audit
- Review 309 — Minimal Identity Foundation Evidence Preflight
- the existing shared `Identifier<T>` primitive
- the existing Core identity namespace
- the existing Core dependency on Shared
- the proven absence of `UserId`
- the proven absence of `AccountId`
- the proven absence of `Principal`
- the proven absence of `UserContext`

No executable implementation begins during this Requirements step.

---

# 1. Capability Selection

## Requirement UIR-001 — Select Minimal User Identity Foundation

The next capability shall be named:

**Minimal User Identity Foundation**

It shall establish the smallest provider-independent executable representation
of a Ribat platform user identity.

It shall not expand into authentication, sessions, authorization, profiles or
account management.

## Requirement UIR-002 — Select UserId as the only first-slice identity type

The first slice shall introduce only one platform-user identity concept:

`UserId`

The first slice shall not introduce:

- `AccountId`
- `PrincipalId`
- `IdentityId`
- `UserAccount`
- `User`
- `Principal`
- `CurrentUser`
- `UserContext`

Those concepts require later independent evidence and requirements.

## Requirement UIR-003 — Keep the capability provider-independent

`UserId` shall not depend on:

- an authentication provider
- a database provider
- UUID package implementations
- OAuth
- OpenID Connect
- JWT
- cookies
- email addresses
- usernames
- phone numbers

The value shall remain an opaque platform identity supplied by the caller.

---

# 2. Ownership and Workspace Boundary

## Requirement UIR-004 — Core owns the UserId semantic boundary

The executable and public ownership location shall be the existing Core identity
namespace:

`packages/core/src/identity`

Core already exposes a platform-level identity namespace and already depends on
Shared.

## Requirement UIR-005 — Do not create a new identity workspace

The first slice shall not create:

- `packages/identity`
- a new npm workspace
- a new component
- a new application

The existing Core identity namespace is sufficient for the first slice.

## Requirement UIR-006 — Reuse the existing shared Identifier primitive

`UserId` shall reuse the existing:

`Identifier<string>`

from:

`@worktracker/shared`

Reuse shall be performed through composition.

`UserId` shall own one internal generic identifier value rather than duplicate
generic identifier storage and equality behavior.

## Requirement UIR-007 — Do not inherit from Identifier

`UserId` shall not subclass or extend `Identifier<string>`.

Inheritance would expose generic identifier comparison semantics at the
user-identity boundary.

The public equality operation shall compare `UserId` with `UserId`.

## Requirement UIR-008 — Preserve the shared Identifier implementation

The first slice shall not modify:

- `packages/shared/src/primitives/identifier.ts`
- its public exports
- its existing tests
- its existing generic behavior

Generic `Identifier<T>` remains independently reusable by other capabilities.

## Requirement UIR-009 — Preserve the existing Core UuidProvider

The first slice shall not modify or remove:

`packages/core/src/identity/uuid-provider.interface.ts`

`UuidProvider` remains an existing independent generation contract.

The first UserId slice shall not require it.

## Requirement UIR-010 — Preserve the Infrastructure IdGenerator

The first slice shall not modify or remove:

`packages/infrastructure/src/id/id-generator.ts`

The Minimal User Identity Foundation owns identity semantics, not infrastructure
generation mechanisms.

---

# 3. Canonical UserId Value Semantics

## Requirement UIR-011 — Use string as the underlying value type

The canonical underlying `UserId` value type shall be:

`string`

The first slice shall not support numeric, object or composite UserId values.

## Requirement UIR-012 — Treat UserId as an opaque identifier

The content of a valid `UserId` shall not imply:

- authentication provider
- UUID format
- database key format
- email address
- username
- tenant
- application
- role
- permission

No provider-specific format validation shall be introduced.

## Requirement UIR-013 — Keep UserId immutable

After successful creation, the identity value shall not be replaceable or
mutable through the public API.

## Requirement UIR-014 — Preserve the exact accepted value

A successfully accepted identity value shall be preserved exactly.

The implementation shall not:

- lowercase it
- uppercase it
- trim it
- rewrite it
- generate a replacement
- add a prefix
- remove a prefix

## Requirement UIR-015 — Expose exact value retrieval behavior

The public capability shall provide behavior that returns the exact accepted
string value.

The exact public method or property name shall be finalized during the design
audit.

## Requirement UIR-016 — Expose exact string representation behavior

The string representation of a valid `UserId` shall equal the exact accepted
identity value.

The exact public method shape shall be finalized during the design audit.

## Requirement UIR-017 — Equal exact values represent equal UserIds

Two distinct `UserId` instances containing the same exact string shall compare
equal.

Equality shall be value-based rather than object-reference-based.

## Requirement UIR-018 — Different values represent different UserIds

Two `UserId` instances containing different strings shall compare unequal.

## Requirement UIR-019 — UserId equality is case-sensitive

Identity comparison shall use exact case-sensitive string equality.

For example:

- `user-100`
- `USER-100`

shall represent different identities.

---

# 4. Input Validation

## Requirement UIR-020 — Reject an empty string

Creating a `UserId` from:

`""`

shall fail deterministically.

## Requirement UIR-021 — Reject whitespace-only values

Creating a `UserId` from a string containing only whitespace shall fail
deterministically.

This includes spaces, tabs or line breaks.

## Requirement UIR-022 — Reject leading or trailing whitespace

A candidate identity with leading or trailing whitespace shall fail.

The capability shall not silently trim the value.

Examples that shall fail include:

- `" user-100"`
- `"user-100 "`
- `"\tuser-100"`
- `"user-100\n"`

## Requirement UIR-023 — Do not normalize invalid input

Invalid identity input shall not be converted into a valid identity.

The caller must supply an already valid opaque identity value.

## Requirement UIR-024 — Use deterministic invalid-input failure

Invalid UserId construction shall fail with a deterministic error identity and
stable message.

The exact:

- error class
- error message
- constructor or factory failure surface

shall be finalized during the design audit.

---

# 5. Creation and Generation Boundary

## Requirement UIR-025 — Use caller-supplied identity values

The first slice shall create `UserId` only from an explicitly supplied string.

## Requirement UIR-026 — Defer UserId generation

The first slice shall not add:

- a concrete UUID generator
- random ID generation
- provider-generated identity
- automatic identity creation
- a new UserId generator contract

Existing generation contracts shall remain unchanged.

## Requirement UIR-027 — Defer AccountId

The first slice shall not introduce `AccountId`.

The distinction between user identity and authentication-account identity
requires Authentication Foundation evidence.

## Requirement UIR-028 — Defer Principal and User Context

The first slice shall not introduce:

- `Principal`
- `PrincipalId`
- `CurrentUser`
- `AuthenticatedUser`
- `AnonymousUser`
- `UserContext`

Those belong to later authentication, session, authorization and execution
context capabilities.

## Requirement UIR-029 — Defer User entity and profile behavior

The first slice shall not create a `User` entity or profile.

It shall not own:

- display name
- avatar
- email
- phone
- locale
- preferences
- account status
- profile lifecycle

## Requirement UIR-030 — Defer access-control capabilities

The first slice shall not implement:

- authentication
- login
- logout
- sessions
- authorization
- roles
- permissions
- App Entitlements
- user-scoped storage
- protected routes
- App Launcher filtering

`UserId` is a prerequisite identity value only.

---

# 6. Public Export and Dependency Boundary

## Requirement UIR-031 — Export UserId through the Core identity surface

The future implementation shall make `UserId` publicly reachable through:

`packages/core/src/identity/index.ts`

and through the existing Core root export:

`packages/core/src/index.ts`

The exact source filename shall be finalized during design.

## Requirement UIR-032 — Add no dependency or lock-file changes

The first slice shall add no external dependency.

It shall add no new internal workspace dependency because Core already depends
on Shared.

The implementation shall not modify:

- `packages/core/package.json`
- root `package.json`
- `package-lock.json`

---

# 7. Focused Behavioral Test Baseline

## Requirement UIR-033 — Implement exactly ten focused UserId tests

The future implementation shall provide exactly ten focused behavioral tests:

1. a valid caller-supplied string creates a UserId
2. value retrieval returns the exact accepted string
3. string representation returns the exact accepted string
4. separate UserIds with the same exact value compare equal
5. UserIds with different values compare unequal
6. equality remains case-sensitive
7. an empty string is rejected deterministically
8. a whitespace-only string is rejected deterministically
9. leading whitespace is rejected without trimming
10. trailing whitespace is rejected without trimming

The tests shall protect observable UserId behavior only.

## Requirement UIR-034 — Execute exactly five independent negative probes

Final capability verification shall execute exactly five negative probes:

1. no `AccountId`, `Principal`, `User`, `UserContext`, Authentication, Session
   or Authorization capability is introduced

2. the shared `Identifier<T>`, Core `UuidProvider` and Infrastructure
   `IdGenerator` remain unchanged

3. no external dependency, provider dependency, package-manifest change or
   package-lock change occurs

4. no Storage, Runtime, Event System, Scheduler, Transition Engine, Workday,
   Attendance, Personal or Work application coupling is introduced

5. exact implementation scope, public exports, Core tests, root tests,
   architecture validation and full build remain verified

No additional negative probes are required unless the design audit introduces
new approved behavior.

---

# 8. Protected Boundaries and Completion

## Requirement UIR-035 — Preserve existing stable boundaries

The future implementation shall preserve:

- `packages/shared/src/**`
- `packages/domain/src/**`
- `packages/application/src/**`
- `packages/events/src/**`
- `packages/infrastructure/src/**`
- `packages/runtime/src/**`
- `apps/**`
- `components/**`
- `architecture/**`
- `runtime/component-registry.json`
- root `package.json`
- `package-lock.json`
- existing Workday implementation
- all existing stable capability tags

Expected executable mutation shall remain limited to the minimum Core identity
source, Core identity public export and focused Core tests approved by the
design audit.

## Requirement UIR-036 — Complete only the minimal UserId foundation

The capability is complete only when all of the following are proven:

- exactly 36 requirements exist from UIR-001 through UIR-036
- the capability remains Minimal User Identity Foundation
- the first slice remains UserId only
- ownership remains `packages/core/src/identity`
- Shared `Identifier<string>` is reused through composition
- inheritance from Identifier is absent
- exact opaque string semantics are implemented
- exact case-sensitive equality semantics are implemented
- empty input is rejected
- whitespace-only input is rejected
- leading whitespace is rejected
- trailing whitespace is rejected
- invalid input is not normalized
- exactly ten focused behavioral tests pass
- exactly five negative probes pass
- Core package tests pass
- Shared tests remain protected
- Domain tests remain protected
- Application tests remain protected
- Event System tests remain protected
- Infrastructure tests remain protected
- Runtime tests remain protected
- root test gate passes
- official architecture validation passes
- full root build passes
- no package dependency changes occur
- no package-lock mutation occurs
- exact implementation scope matches the approved design
- HEAD remains unchanged before the future commit

---

# 9. Selected Decision Summary

Selected capability:

**Minimal User Identity Foundation**

Selected first slice:

**UserId only**

Selected owner:

`packages/core/src/identity`

Selected reuse model:

**composition around `Identifier<string>`**

Rejected:

- inheriting from `Identifier<string>`
- creating a new identity workspace
- adding `AccountId`
- adding `Principal`
- adding a `User` entity
- adding `UserContext`
- adding authentication
- adding sessions
- adding authorization
- adding provider-specific identity formats
- adding identity generation

---

# 10. Next Step

The evidence and formal requirements are sufficient for:

**Review 311 — Minimal User Identity Foundation Design Audit**

The design audit must determine:

- exact source filename
- exact exported class name
- exact constructor or factory shape
- exact composition structure
- exact value retrieval API
- exact equality API
- exact string representation API
- exact validation order
- exact invalid-input error class
- exact invalid-input message
- exact ten-test implementation
- exact five negative probes
- exact implementation file scope
- exact protected-boundary guards
- exact build and validation commands

No implementation shall begin before Review 311 and the subsequent design
report are complete.
