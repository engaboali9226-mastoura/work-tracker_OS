# NOOR Personal v1 — controlled release baseline

**Created:** 2026-11-09 (Asia/Riyadh)
**Product:** NOOR Personal
**Candidate version:** `v1.0.0-rc.1` (**not yet declared GA/stable**)
**Pinned application commit:** `35811031819ad81e754cdb878d85af74ff867277`
**Application tree:** identical to the last pre-administration R270 baseline (`a179cef7c26648b6624940e179f1963654c3fc95`).
**Frozen release ref:** `release/noor-personal-v1.0.0-rc.1`, pointing to the pinned application commit, and never used for development.
**Continuing development ref:** `develop/noor-platform-v1`.
**Current production branch:** `product/noor-personal-mvp` (protected). The repository default `main` is NOT the Render production branch.

## Scope and intention

This creates a reproducible, **code-only candidate snapshot**, not a database backup, new user account, or declaration of production reliability. NOOR Personal remains published through the existing Render Node service. Existing NOOR Work is present in the snapshot and must not regress. Neither production Render nor Supabase may be modified by documentation/release-planning work.

**Known incident:** 2026-11-08, external HTTPS requests timed out and returned HTTP 429 despite reverting to the pre-admin code; redeploying the identical commit restored access. On 2026-11-09 the normal Render Free sleep/wake loading experience resumed. The specific upstream cause remains unproven. This is a **release qualification issue**, not an app-code fix. Render Free sleep, lack of a configured health-check path, and worker R222 recovery behavior remain known limitations. No 24/7 SLA may be claimed.

## Automated evidence already obtained

- GitHub Actions `Architecture Validation` for production commit `35811031819ad81e754cdb878d85af74ff867277`: SUCCESS; workflow executes canonical architecture validation, npm workspace tests and build.
- Render deploy `dep-dbod7jvf3r2c73ar6k70` of that exact commit: LIVE (2026-11-08 19:57:30 UTC).
- Hosted build `npm run test:hosting`: nine tests passed during deploy.
- Independent public GETs of `/healthz`, `/`, `/personal`, and `/noor-service-worker.js`: 200 shortly after the redeploy. **These do not verify signed-in workflows.**

## Release acceptance checklist

The following gates are mandatory before calling this candidate **NOOR Personal v1.0.0 stable**. Record test date, evidence ref and reviewer in a separate release evidence document; do not record passwords or real journal contents.

- [x] Source commit and release candidate ref pinned.
- [x] Automated canonical architecture validation, workspace unit tests, static build and hosting tests passed for source commit.
- [x] Render deployed SHA matches release snapshot; anonymous public routes served at time of last external check.
- [ ] Verify production login/logout, protected page authorization and safe account separation using dedicated non-owner synthetic accounts, without modifying real users' data.
- [ ] Verify actual NOOR Personal tasks/habits save, refresh, re-login, numeric progress, weights and reading-session notes with disposable test records.
- [ ] Verify NOOR Work route, teaching-week/calendar logic, lesson preparation and auto-save with disposable test records.
- [ ] Verify the private journal fail-closed, encryption and per-owner isolation; never downgrade access policies to pass tests.
- [ ] Verify mobile responsiveness, modal scrolling, fonts, welcome gateway, installed PWA behavior and no cache of private data.
- [ ] Verify an idle cold start from a clean client, response headers/status, external HTTP smoke and repeatable recovery, recording Render Free constraints.
- [ ] Verify an authorized, read-only database backup/restore plan and schema migration compatibility before any subsequent release.
- [ ] Capture named product acceptance and issue triage for all known production defects, then cut immutable GA tag `noor-personal/v1.0.0` via an approved Git operation/GitHub Release.

**Important:** protected backend and MFA/admin rollout (R271–R273) are not in this candidate. Historic work remains recoverable in Git at `backup/noor-r278-before-r280-rollback`. Do not reintroduce it accidentally as a merge side effect.

## Version policy

- `vMAJOR.MINOR.PATCH-rc.N`: release candidate, not yet accepted.
- `vMAJOR.MINOR.PATCH`: accepted production release.
- `PATCH`: nonbreaking bugfix/security patch with regression tests.
- `MINOR`: backward-compatible product feature.
- `MAJOR`: explicitly governed breaking change with migration and rollback.
- Maintain distinct product release identifiers: `noor-personal/v1.0.0`, `noor-work/vX.Y.Z`, `noor-platform/vX.Y.Z`; package.json version `0.0.1` is the existing workspace package version, not the product release.
- Never move a published GA tag or force-push a protected production branch. For a failed release, create a **new forward-only revert commit** and record evidence.

## Release flow

1. Feature work and experimental apps live on the isolated `develop/noor-platform-v1` branch or feature branches based on it.
2. Run full CI and code/security review; create dedicated release candidate from a verified commit.
3. Use staging with **synthetic data only** and a different backend. No production Supabase service-role keys in GitHub Actions or logs.
4. Validate migration compatibility, authentication/cookies/origin, service worker, and private-data access boundaries.
5. Promote only through an approved PR into `product/noor-personal-mvp`; Render auto-deploys this branch, so do not trigger a second manual deploy after a push.
6. Check Render deployment SHA + external HTTP smoke + signed-in functional acceptance, then announce GA version and preserve evidence.
7. If a deployment fails, rollback with a new commit from the pinned good release, without rolling the database backwards blindly.

## Boundaries

Do not alter, delete or re-create production accounts; do not query private notes, journals, tokens, or passwords. No schema changes without tested forward migration and independent approved rollback. No production deployment from documentation-only experimentation.
