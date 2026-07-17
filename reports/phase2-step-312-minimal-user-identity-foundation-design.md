# Phase 2 Step 312 — Minimal User Identity Foundation Design

## Status

PASS

## Stable Baseline

Stable committed baseline:

`40fab174dbcf0102c77b7b1241b9d958df7bf3fb`

Stable checkpoint:

`checkpoint-noor-platform-boundaries-v1.0.0`

## Requirements Source

This design implements the future executable behavior defined by:

`reports/phase2-step-310-minimal-user-identity-foundation-requirements.md`

The Requirements report contains exactly 36 requirements:

`UIR-001` through `UIR-036`.

## Design Evidence

The design is based on:

- Review 309 — Minimal Identity Foundation Evidence Preflight
- Review 311 — Minimal User Identity Foundation Design Audit
- the existing generic `Identifier<string>` implementation
- the existing Core identity namespace
- the existing Core dependency on Shared
- existing Core public-constructor conventions
- existing `getValue`, `equals` and `toString` conventions
- existing `node:test` and `node:assert/strict` test conventions

No implementation begins during this design step.

---

# 1. Capability and Ownership

## Decision UIDD-001 — Capability remains Minimal User Identity Foundation

The capability shall remain:

**Minimal User Identity Foundation**

The executable first slice shall introduce only `UserId`.

It shall not introduce authentication, sessions, authorization, user context,
profiles, accounts or provider integration.

## Decision UIDD-002 — Core owns UserId

The exact ownership namespace shall be:

`packages/core/src/identity`

No new package, application, component or workspace shall be created.

## Decision UIDD-003 — Use the exact source filename user-id.ts

The future source file shall be:

`packages/core/src/identity/user-id.ts`

The file shall export:

- `UserId`
- `InvalidUserIdError`

Both types shall remain in one cohesive source file.

---

# 2. Public Construction Design

## Decision UIDD-004 — Use a public constructor

The exact creation surface shall be:

`new UserId(value)`

The constructor parameter shall be statically typed as `string`.

No static `create`, `from`, `of` or `parse` method shall be introduced.

No Result-returning factory shall be introduced.

## Decision UIDD-005 — Invalid construction throws

Invalid caller-supplied identity values shall cause the constructor to throw
`InvalidUserIdError`.

The first slice shall not return a Result, Optional or ValidationResult.

## Decision UIDD-006 — Runtime non-string validation is not added

The TypeScript constructor contract accepts `string`.

The first slice shall not add a separate runtime contract for JavaScript values
that violate the declared TypeScript parameter type.

The approved runtime validation scope is limited to string-content validity.

---

# 3. Identifier Composition

## Decision UIDD-007 — Import Identifier from the Shared package surface

The UserId source shall import:

`Identifier`

from:

`@worktracker/shared`

It shall not import Shared through a relative filesystem path.

## Decision UIDD-008 — Compose Identifier<string>

The exact internal representation shall be:

`Identifier<string>`

The representation shall be held through composition.

`UserId` shall not extend or subclass `Identifier<string>`.

## Decision UIDD-009 — Use one private readonly internal field

The internal field shall be named:

`identifier`

Its conceptual shape shall be:

`private readonly identifier: Identifier<string>`

The accepted identity value shall not be publicly mutable or replaceable.

---

# 4. Validation Algorithm

## Decision UIDD-010 — Validation occurs before Identifier construction

The constructor shall validate the caller-supplied string before constructing
the internal `Identifier<string>`.

No invalid value shall be passed into the internal Identifier.

## Decision UIDD-011 — Empty input is checked first

The first validation check shall reject:

`value.length === 0`

This gives the empty-string case an explicit and deterministic validation path.

## Decision UIDD-012 — Whitespace-only input is checked second

After the explicit empty check, the constructor shall reject:

`value.trim().length === 0`

This covers strings consisting only of spaces, tabs or line breaks.

## Decision UIDD-013 — Surrounding whitespace is checked third

After the empty and whitespace-only checks, the constructor shall reject:

`value.trim() !== value`

This rejects both:

- leading whitespace
- trailing whitespace

The value shall not be trimmed or normalized.

## Decision UIDD-014 — Accepted values are preserved exactly

After validation succeeds, the exact supplied string shall be passed to:

`new Identifier<string>(value)`

The implementation shall not:

- lowercase
- uppercase
- trim
- prefix
- suffix
- replace
- regenerate

the accepted value.

---

# 5. InvalidUserIdError Design

## Decision UIDD-015 — Define InvalidUserIdError

The source file shall export a dedicated error class named:

`InvalidUserIdError`

The class shall provide the deterministic error identity required by the
Requirements.

## Decision UIDD-016 — Extend native Error directly

`InvalidUserIdError` shall extend native `Error`.

It shall not extend:

- DomainError
- a Shared error
- ValidationError
- an authentication error
- a provider-specific error

## Decision UIDD-017 — Set the exact error name

Every `InvalidUserIdError` instance shall have:

`name === "InvalidUserIdError"`

The constructor shall set the error name explicitly.

## Decision UIDD-018 — Use one exact stable error message

Every approved invalid string-content path shall use exactly this message:

`UserId value must be a non-empty string without surrounding whitespace.`

The message shall be identical for:

- empty string
- whitespace-only string
- leading whitespace
- trailing whitespace

No supplied invalid value shall be interpolated into the message.

---

# 6. Public UserId API

## Decision UIDD-019 — Expose getValue

The exact value-retrieval API shall be:

`getValue(): string`

It shall return:

`this.identifier.getValue()`

The returned string shall equal the exact accepted constructor value.

## Decision UIDD-020 — Expose toString

The exact string-representation API shall be:

`toString(): string`

It shall return:

`this.identifier.toString()`

No prefix, label or formatting shall be added.

## Decision UIDD-021 — Expose UserId-only equality

The exact equality API shall conceptually be:

`equals(other: UserId): boolean`

It shall delegate comparison to the composed identifiers.

The method shall not accept arbitrary `Identifier<string>` values.

## Decision UIDD-022 — Equality remains exact and case-sensitive

Equality shall preserve the existing strict string semantics of
`Identifier<string>`.

Therefore:

- equal exact strings compare equal
- different strings compare unequal
- `user-100` and `USER-100` compare unequal

No case normalization shall occur.

---

# 7. Public Export Design

## Decision UIDD-023 — Export through the Core identity barrel

The future implementation shall append one export to:

`packages/core/src/identity/index.ts`

The export shall target:

`./user-id`

This makes both `UserId` and `InvalidUserIdError` publicly available through the
identity namespace.

## Decision UIDD-024 — Keep the Core root index unchanged

`packages/core/src/index.ts` already exports:

`./identity`

Therefore, it shall remain byte-for-byte unchanged.

No duplicate root export shall be added.

---

# 8. Exact Behavioral Test Design

## Decision UIDD-025 — Add exactly ten focused tests

The exact future test file shall be:

`packages/core/tests/user-id.spec.ts`

It shall use:

- `node:test`
- `node:assert/strict`
- the Core public root export

It shall contain exactly ten `test` cases:

1. `UserId accepts a valid caller-supplied value`
2. `UserId getValue returns the exact accepted value`
3. `UserId toString returns the exact accepted value`
4. `UserIds with the same exact value compare equal`
5. `UserIds with different values compare unequal`
6. `UserId equality is case-sensitive`
7. `UserId rejects an empty string`
8. `UserId rejects a whitespace-only string`
9. `UserId rejects leading whitespace without trimming`
10. `UserId rejects trailing whitespace without trimming`

Test 1 shall establish successful construction and `instanceof UserId`.

Tests 2 and 3 shall independently protect the two public value surfaces.

Tests 4 through 6 shall independently protect equality behavior.

Tests 7 through 10 shall remain four separate negative tests.

Every invalid-input test shall assert:

- `error instanceof InvalidUserIdError`
- exact error name
- exact error message

The tests shall not inspect the private internal Identifier field.

---

# 9. Exact Negative-Probe Design

## Decision UIDD-026 — Execute exactly five negative probes

Future verification shall execute exactly these five negative probes.

### Negative Probe 1 — No capability expansion

Verify no executable declaration is introduced for:

- AccountId
- IdentityId
- PrincipalId
- Principal
- User
- UserAccount
- CurrentUser
- UserContext
- Authentication
- Session
- Authorization
- Permission
- Entitlement

### Negative Probe 2 — Existing identity primitives are preserved

Verify byte-for-byte preservation of:

- `packages/shared/src/primitives/identifier.ts`
- `packages/shared/tests/identifier-guard.spec.ts`
- `packages/core/src/identity/uuid-provider.interface.ts`
- `packages/infrastructure/src/id/id-generator.ts`

### Negative Probe 3 — No dependency mutation

Verify no change to:

- root `package.json`
- `package-lock.json`
- `packages/core/package.json`
- `packages/shared/package.json`
- `packages/infrastructure/package.json`

### Negative Probe 4 — No unrelated capability coupling

Verify no changes under:

- `packages/domain/src`
- `packages/application/src`
- `packages/events/src`
- `packages/infrastructure/src`
- `packages/runtime/src`
- `apps`
- `components`
- `architecture`
- `runtime`

This includes no Workday, Attendance, Noor Personal or Noor Work changes.

### Negative Probe 5 — Exact scope and complete verification

Verify:

- exact three-file implementation scope
- exact public export
- exactly ten focused tests
- focused UserId tests
- full Core tests
- Shared tests
- Domain tests
- Application tests
- Event System tests
- Infrastructure tests
- Runtime tests
- root test gate
- official architecture validation
- full root build

---

# 10. Exact Future Implementation Scope

## Decision UIDD-027 — Limit implementation to exactly three files

The future executable implementation scope shall be exactly:

`A  packages/core/src/identity/user-id.ts`

`M  packages/core/src/identity/index.ts`

`A  packages/core/tests/user-id.spec.ts`

No fourth executable or test file is approved.

The future implementation shall not modify:

- `packages/core/src/index.ts`
- `packages/core/package.json`
- `packages/shared`
- `packages/domain`
- `packages/application`
- `packages/events`
- `packages/infrastructure`
- `packages/runtime`
- `apps`
- `components`
- `architecture`
- `runtime`
- root `package.json`
- `package-lock.json`

---

# 11. Implementation Blueprint

The future `user-id.ts` implementation shall follow this behavioral sequence:

1. import `Identifier` from `@worktracker/shared`
2. declare and export `InvalidUserIdError`
3. make `InvalidUserIdError` extend `Error`
4. apply the stable error message
5. set the exact error name
6. declare and export `UserId`
7. receive a caller-supplied string through a public constructor
8. reject empty input
9. reject whitespace-only input
10. reject surrounding whitespace
11. construct `Identifier<string>` using the exact accepted value
12. expose `getValue`
13. expose `equals`
14. expose `toString`

The implementation shall not introduce additional behavior.

---

# 12. Protected Evidence Hashes

Review 311 recorded these protected evidence hashes:

`e77f84bd332dc076b63f6c9a503d41a36f0d2a4c`
for `packages/shared/src/primitives/identifier.ts`

`1c5b42a1f9bd788d6921ec5f5b49377d348aa672`
for `packages/shared/tests/identifier-guard.spec.ts`

`ff0b407e980e7d93d36a92b1f539abba62f9c638`
for `packages/core/src/identity/uuid-provider.interface.ts`

`5abaefb590e4e572e3067f244e838d6b18e7a715`
for `packages/infrastructure/src/id/id-generator.ts`

`ff6c1a1bc30cae77907a1396b0bf5a5ea34ca80c`
for `packages/core/package.json`

`4c06a3447bfc346986f1b1fac2ef388e675946a5`
for `packages/shared/package.json`

`b97adf10e9157863d19d16c3097b92c32a30cafc`
for `packages/infrastructure/package.json`

`54f0d786f97f4e8b7021f365fbf8fc998c77a201`
for root `package.json`

`aeb90a290954b129c95df7f365cfcc6a2f7d057a`
for `package-lock.json`

Future implementation verification shall confirm these protected hashes remain
unchanged.

---

# 13. Verification Sequence

The future implementation verification order shall be:

1. exact baseline and checkpoint verification
2. exact two-report pre-implementation scope verification
3. protected evidence hash verification
4. create only the approved three implementation files or changes
5. verify exact five-file total working scope:
   - two reports
   - three implementation files
6. verify exact ten tests exist
7. run focused UserId tests
8. run full Core tests
9. run Shared tests
10. run Domain tests
11. run Application tests
12. run Event System tests
13. run Infrastructure tests
14. run Runtime tests
15. run the root test gate
16. run official architecture validation
17. run the full root build
18. execute exactly five negative probes
19. verify no package or lock-file mutation
20. verify HEAD and remote references remain unchanged
21. verify no stage, commit, tag or push occurred

---

# 14. Anti-Overreach Boundary

This design does not approve:

- AccountId
- IdentityId
- PrincipalId
- Principal
- User
- UserAccount
- CurrentUser
- UserContext
- profiles
- email identity
- usernames
- phone identity
- credentials
- passwords
- authentication
- login
- logout
- sessions
- tokens
- OAuth
- OpenID Connect
- JWT
- roles
- permissions
- authorization
- App Entitlements
- user-scoped persistence
- ID generation
- UUID-format validation
- provider adapters
- Platform Shell
- protected routing
- App Launcher
- Noor Personal functionality
- Noor Work functionality
- Attendance
- Workday changes

No feature starts with code.

Evidence Before Assumption.

---

# 15. Next Step

The formal design is sufficient for:

**Review 313 — Independent Minimal User Identity Design Verification**

No executable implementation shall begin until Review 313 verifies:

- all 27 decisions
- exact requirements traceability
- exact three-file implementation scope
- exact ten tests
- exact five negative probes
- protected evidence hashes
- anti-overreach boundaries
