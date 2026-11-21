# NOOR R386 — Data Foundation & Reliability
## Status: isolated groundwork, production cutover blocked
Baseline: R385 / 12dca76212a8cd48f8aaf34307fb26d08902eeee; Render dep-dbvvkmbm8hqs7394utg0, live, API-triggered. 2026-11-20.
Do not merge or deploy this branch until the applicable release gate passes. No production schema, records, runtime or UI changed.

### Recorded read-only baseline (point-in-time, not a backup)
- 9 personal state rows; 1 work state row; 2216 outbox events, all Pending.
- Max state 2677652 bytes; max outbox 1700557 bytes.
- Zero missing event ID/key, duplicate owner-scoped ID/key, or event owner mismatch.
- R385 CI run 44696406755: 1465 reported tests passed; browser smoke passed. Existing CI is evidence for the baseline, not for a new migration.
- Production PostgreSQL 17.11, 12 public tables, 12 migration records. Staging PostgreSQL 17.11, 5 public tables, 11 migration records.
- Staging lacks habit_entries, habits, tasks, task_events, work teacher state, admin accounts and admin audit tables. Linkage user_id is text in staging versus uuid in production; five shared staging tables force RLS; only journal forces RLS in production. Compare all constraints/RPCs/grants/migrations before staging parity. Do not copy real production users, credentials, finance, journal or student data.
- Render autoDeploy=yes, manual release policy not enforced by service configuration. No available connector action for service autoDeploy update. Disable Auto-Deploy in Render service settings; verify autoDeploy=no by readback. Do not replace the service.
- Backup/PITR inventory and restore not verified. Available Supabase connector does not expose backups/download or restore from backup (restore_project is unpausing a project, not backup restore). No claims of verified backup. Require authorised encrypted backup and isolated restore, including journal decryption key recovery, authentication dependencies, migration versions and object storage if used. Never commit dumps or keys.
- Staging synthetic SQL transaction: PASS (2 events, 2 synthetic owners, original Pending preserved; retry, owner mismatch and key collision checks). Follow-up catalogue count: zero residual fixture tables.

### Scope and impact map
| Area | Current implementation | Impact of later changes |
| --- | --- | --- |
| Personal | apps/noor-personal/src/infrastructure/supabase-postgres-personal-foundation-persistence.ts | Full owner JSONB state, CAS revision, candidate cache, outbox idempotency, deletion semantics |
| Personal business rules | apps/noor-personal/src/application/personal-control.ts; domain/completion-r331.ts | Materialization, prayer scoring, recovery, sessions, habits, finance, projections |
| Runtime | apps/noor-runtime/src/personal-control-operation.ts; personal-daily-materialization-scheduler.ts; personal-today-operation.ts | Transactions, retries, day rollover, stale revisions |
| Browser | apps/web/src/noor-personal-today-client.ts; noor-personal-application-view.tsx | Optimistic queues, failed state, read invalidation, notification/read, save confirmed |
| Work | apps/noor-runtime/src/noor-work-teacher-operation-r264.ts; apps/web/src/noor-work-teacher-view-r264.tsx | Separate full-state CAS/debounce; do not modify in R386 |
| Auth/admin/journal | apps/noor-runtime/src/route-access-http-server.ts; noor-admin-account-http-r316.ts; noor-private-journal-http-r221.ts | Owner isolation, role boundaries, encrypted journal excluded from analytical extraction |
| Hosting/PWA | tools/hosting/serve-noor.mjs; apps/web/public/noor-service-worker.js | Deployment, readiness, no account cache; unchanged in R386 |
| CI | .github/workflows/architecture-validation.yml; tools/ci/noor-r323-visual-smoke.mjs | All existing tests retained; future integration and parity tests additive only |

### Target contracts
1. Operational state is authoritative during shadow. Existing revision-CAS writes and current calculation logic unchanged.
2. Historical event store is distinct from a delivery outbox. Preserve owner, source identity, idempotency key, event/version, aggregate/version, occurredAt, correlation/causation, privacy class and source revision; retain original legacy record only in restricted encrypted/access-controlled boundary after data-minimization review. New events use explicit versioned discriminated schemas. Delivery state is independent from historical admission. Never mark legacy Pending as Delivered solely because copied. Do not replay business mutations.
3. Use durable unique (owner,event_id) and (owner,idempotency_key); identical replay is a no-op; different content with same key is a hard conflict, not silent ON CONFLICT DO NOTHING. Compare canonical JSON/equality and count per owner, excluding no data silently. Invalid rows block migration, do not skip. Record checkpoint and source revision; no personal contents in logs.
4. Need atomic database transaction for operational change plus event record/outbox. Avoid independent client writes to two tables. Backfill in bounded transactions/checkpoints, concurrent revision change forces repeat. Do not enable dual write until concurrency/crash/ack-loss tests pass. Staging fixture is only a proof of constraints, not this runtime design.
5. Important: current outbox is not a complete history; some records are upserted or removed when definitions are deleted. Map deletion/correction/retention semantics explicitly before copying; append-only history cannot override user deletion/privacy. Do not treat legacy event sequence as complete or reconstruct missing facts. Separate restricted raw data from analytical projections; no journal, student identifiers, or financial/mood content for analytics by default.
6. Analytics facts link due date, actual date, timezone, weight and policy version where trustworthy; never fabricate missing dimensions. Preserve historical outputs; no score recalculation implicitly. Derive corrected facts with versioning and data quality checks. Separate observed association from causality.

### Ordered gates and rollback
G0: pinned baseline and branch (done), inventory (done), staging parity (blocked), verified backup/restore (blocked), manual deploy setting (blocked).
G1: proposed schema and privacy/retention contract reviewed; synthetic staging migrations, explicit RLS and role tests. No production DDL yet.
G2: shadow backfill with validation; per-owner exact key/payload parity and status preservation; verify replay no duplicates, collisions blocked, no mutations to old state. Staging with synthetic workloads; production backfill is separate gated action.
G3: atomic dual persistence plus failure tests (before/after commit, lost acknowledgement, device concurrency, restart, timezone rollover); legacy source remains authoritative. Rollback disables flag, keeps writes in old source; reconcile shadow records before retry. No delete, no destructive migrations.
G4: compare all daily/weekly/monthly outputs and task/habit/prayer/finance/work workflows, security and performance on representative history and real-device browsers; require 100% deterministic parity for unchanged rules and zero cross-owner access, no missing or duplicate events. Define measured latency baseline before claiming improvement.
G5: manual rollout per cohort only after backup restoration and tested rollback; never switch authority unless post-switch writes also retained and reversible. Retire old representation only in separate approved migration after retention, parity, rollback, and privacy review.
No G1–G5 gate is certified by this document. R385 remains live.

### R386 files
- tools/data-foundation/r386/read-only-baseline.sql: safe aggregate preflight; no identities or event payloads returned.
- tools/data-foundation/r386/staging-synthetic-proof.sql: transactional temp-only test, never use as a production migration.
- docs/noor/r386-data-foundation.md: this decision and gate record.
