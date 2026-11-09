# NOOR Platform v1 — multi-application architecture and portable hosting

**Planning date:** 2026-11-09. **Status:** architecture proposal; no production migrations or deployment performed.

## Current verified foundations

- The canonical application catalog in `packages/core/src/application-catalog/canonical-application-catalog.ts` defines `noor-personal` → `/personal` and `noor-work` → `/work`, with separate application access entitlements.
- `apps/web/src/application-view-registry.ts` resolves registered application view factories. The web shell projects a selected route to authorized application views.
- The current hosted Node entrypoint `tools/hosting/serve-noor.mjs` serves built frontend files and forwards `/api/noor` to the privileged same-process runtime on loopback `127.0.0.1:8787`.
- Production branch: `product/noor-personal-mvp`. Protected, auto-deployed on Render. Staging project exists, but production/staging schema and RLS gates require independent checks before feature use.
- NOOR Personal v1.0.0-rc.1 is frozen at `35811031819ad81e754cdb878d85af74ff867277`. Development continues only from isolated branches.

## Product model

**NOOR Platform** is the host/control-plane; each NOOR application is a separate bounded context:

| Component | Owns | Must not own |
| --- | --- | --- |
| Platform core | app catalog, version policy, navigation, tenancy, session integration, authorized app routing, observability | personal task records, journal plaintext, school records |
| NOOR Personal | habits/tasks, daily rhythm, reading sessions, finance and private journal features | arbitrary users, tenant-wide admin |
| NOOR Work | timetable, lesson prep, school tracking, work-specific aggregates | privileged personal records |
| Future charity association app | organization, membership, beneficiaries, approvals, donations/finance only after applicable controls and review | all existing NOOR Personal or Work data |

Adding a new app requires: unique app key/route, view registration, scoped server API, entitlements, tenant/organization-aware authorization model, its own migrations and tests, and observability. **A new UI route alone is not a secure application.**

## Sensitive data and authorization boundaries

1. Platform administration is a separate privileged control plane. Account provisioning/recovery/disable needs MFA, server-side proof of authority, audit events, and revocation; admins cannot read private journals/beneficiary details merely by virtue of the admin role.
2. Keep existing NOOR Personal identity and records intact. No breaking rename of keys, account IDs, schemas, ownership fields or cookie names under a platform refactor.
3. For a charity app with real beneficiaries/donations, prefer a **separate Supabase project/database and dedicated secrets**. For a synthetic pilot inside a shared backend, require organization-scoped tables, restrictive RLS, owner/tenant-aware access rules, a separate encrypted storage boundary, and proof of cross-app isolation. Never create shared permissive `authenticated` read policies.
4. Server-only service-role credentials never enter frontend builds, CI artifacts or repo. Public clients use publishable keys and only authorized protected calls. Prefer explicit auth/session token binding.
5. Per-app retention, export, data deletion, data residency and backup must be assessed before any real sensitive beneficiary/financial information is collected.
6. Use a schema migration per feature, tested on a synthetic staging DB; no immediate destructive production migration and never reset the production DB to fix an app startup issue.

## Development and release train

| Ref | Role | Publication |
| --- | --- | --- |
| `release/noor-personal-v1.0.0-rc.1` | frozen code-only candidate | no automatic deployment |
| `product/noor-personal-mvp` | current protected production | Render automatically deploys after approved change |
| `develop/noor-platform-v1` | new multi-app platform integration | **must never auto-deploy to production** |
| `feature/noor-*` | bounded, reviewed work | PR into development |
| `backup/noor-r278-before-r280-rollback` | retained old admin / resilience code | archival only; no blind merge |

Move toward independent product versions: NOOR Personal, Work, Platform, charity module. Each feature needs: contract compatibility, server enforcement, automated tests, PWA/cache guardrails, separate schema migration/rollback notes and acceptance evidence. Never consider `npm build` alone a complete release gate. Ship patches to one app only after testing the platform shell and all existing apps.

## Supported hosting profiles

### A. Current Render Free (production baseline)

- Start Node entrypoint with `node tools/hosting/serve-noor.mjs`.
- Build with repository instructions in `docs/noor/hosted-render.md`.
- TLS publicly via Render. Public origin and Supabase auth redirects configured for the exact HTTPS hostname.
- Sleep after idle; no continuous timers while asleep; no continuous availability guarantee. Persist no operational data on ephemeral disk.

### B. Local Mac/Linux or dedicated LAN server (proof of concept)

- Node.js 24-compatible runtime, matching CI and lockfile.
- Host the *same built artifact* and the same Node startup entrypoint, with environment variables supplied locally through an OS-managed secrets store. Keep loopback runtime port `8787` private; expose only the hosted public port through a reverse proxy.
- Configure a real HTTPS origin and trusted reverse proxy, including WebSocket/HTTP forwarding only where needed. Validate the configured origin, Secure/SameSite cookies, Supabase authorized redirect URLs, CSRF/Origin rules and PWA scope.
- LAN-only trial: bind public access behind local network firewall/VPN; do not put service role secrets in a browser or expose the internal runtime port.
- Internet access: use a vetted tunnel or a hardened reverse proxy with DNS/TLS and access controls. **Do not simply port-forward a home router or turn off authentication.**
- Operation requires always-on power, watchdog/restart, correct clock/timezone, bounded resource quotas, health probes, controlled OS updates, backups, UPS or recovery plan, and an accessible independent incident path. A laptop that sleeps cannot provide reliable public hosting.

### C. Dedicated VPS or paid managed hosting (future production profile)

- Same Docker/Node artifact, runtime environment contract, protected API, HTTPS hostname and acceptance tests.
- Prefer deployment build once/promote digest over recompiling a different source tree on each target.
- Staged cutover: dual-host with synthetic external probes, approve domain/origin transition, preserve Supabase DB, verify user authentication and cookie transitions, validate data correctness, and retain a rollback path.
- If splitting static frontend from API service: choose explicit same-origin proxy routing for `/api/noor`, preserve HTTPS cookies and CSRF rules, and retest auth before launch.

## Work to execute next (ordered)

1. Complete NOOR Personal v1.0.0 release-candidate acceptance: authentication, saved records, NOOR Work, RLS/private journals, mobile PWA, cold-start failure paths. Record unresolved limitations and decisions.
2. Add application-independent production configuration and repeatable deployment artifacts **only on development branch**; test local loopback first, with synthetic data and no real user account content.
3. Extract app-registration and route contracts into tested extension points without changing existing `noor-personal`/`noor-work` keys or path semantics.
4. Establish platform-wide roles and organizational tenancy, with per-app least privilege and actual backend enforcement; stage and audit before any production use.
5. Build charity app prototype with fake association data and explicit audience/scope, then load-test free service limits.
6. Create separate product release trains and promotion automation, with protected branches, immutable release tags and rollbacks.

## Non-goals and red lines

- No production DB access by new app modules before schema/RLS tests.
- No native iPhone app commitment: PWA remains the portable install method until a separate mobile roadmap is approved.
- No migration of real accounts, passwords, journal keys or data for a hosting experiment.
- No assumption that Render's November 8 ingress timeout/429 episode was fixed by code rollback; it recurred with R270, and the upstream cause is still unconfirmed.
