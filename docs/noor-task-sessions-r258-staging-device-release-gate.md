# NOOR R254–R258 — Task Sessions Release Gate

**Status: HOLD / DRAFT.** This document is not a release authorization.
**Scope:** Existing personal Task session plans, persistent general/session notes, per-session progress, weighted statistics and mobile layout.

## Verified isolated evidence
- GitHub Actions full suite + build, and R257 loopback HTTP exercising the real NOOR HTTP route, command operation, cookie-owner mapping and in-memory Foundation (all **synthetic**, never production user data).
- R255 separate storage adapters sharing a simulated PostgREST store with stale-version rejection and two-owner isolation.
- Staging PostgreSQL synthetic A/B transaction with explicit `ROLLBACK` and zero persisted rows. This does **not** authenticate two real staging users.
- R258 mounted React conflict behavior: remote note change preserves a dirty local draft; metadata-only revision updates rebase without false conflicts. HTTP 409 triggers fresh workspace read without page navigation.

## Pending release-blocking verification
1. **Isolated staging web/backend** using nonproduction Supabase and isolated identities. As reviewed, the existing Render production service deploys `product/noor-personal-mvp`; PR preview deployments are OFF. Never repoint production to staging, and never enable a potentially billable service without approval.
2. **Authenticated end-to-end scenario**, accounts A and B with real verified sessions, on two real browsers/devices and a persistent staging backend. Keep all data synthetic. Do not reuse production cookies or access real journals, tasks or finance records.
3. **Physical Safari/iPhone and macOS check** with mobile keyboard, resize, scrolling, text selection and Save buttons. Unit tests, jsdom, CSS inspection and browser emulation alone do not satisfy this gate.
4. **User/reviewer acceptance** and explicit merge/deployment authorization after verifying an exact green commit, full change diff and rollback target.

## Deterministic staging acceptance scenario
- On Mac, user A creates a **normal Task**: 20 pages, one existing parent weight, 2 sessions of 10 pages (pages 1–10 and 11–20). Confirm existing unsegmented tasks and habits are unchanged.
- On iPhone, authenticated as A, reload workspace and verify both sessions, targets and page ranges. Edit an independent **general note**, then a **first-session note**. Reload on Mac and confirm both persisted with distinct fields.
- On Mac, start typing an unsaved session note. On iPhone, change **only the session title**; refresh the Mac session. Draft stays present, with no false note-conflict warning; save uses the refreshed revision.
- On Mac, start a different unsaved note. On iPhone, change that **same note field**. Attempt to save on Mac: receives a nonrevealing 409, fetches the latest workspace, preserves the local text and shows a review panel with the newer saved note. Test **Copy my draft** and intentional **Use saved version**. A copy failure must not delete the draft.
- Record exactly **4 pages** in session 1. Verify 4/10, event history, immutable parent-weight fraction **4/20**, and that session 2 is untouched. Reject half-page entries. A lost command acknowledgement followed by retry with the **same event ID** must not double-count. An ID reused for a different amount must be rejected.
- A should not be able to mark the parent as achieved while sessions are incomplete or the quantified 20-page target has not been reached. Review percentages across civil-midnight and after a new local day.
- Open the Task's session notes after archiving/completing the Task (read-only progress; notes accessible under the expected permissions), including independent general note and session notes.
- User B must see **no** data owned by A. Guessing A's definition/session IDs through the authenticated API must not disclose or mutate A. Inspect no-store response headers and sanitize 400/401/403/409 responses.

## Mobile acceptance evidence
- Verify at least a small iPhone portrait viewport (e.g. 375×667), a modern iPhone viewport, landscape rotation, macOS laptop window and RTL Arabic text.
- Expand multiple nested sessions, focus the last note textarea while iOS keyboard is visible, scroll until **Save** is fully visible and tappable, and close/reopen each disclosure without losing saved notes.
- Try slow network, offline recovery, repeated taps, denied clipboard permission, VoiceOver focus/labels, 200% text sizing, and light/dark modes. Capture only synthetic data and redacted screenshots.
- If any layout, user-isolation, note-retention, or weight-invariant check fails: **NO GO**.

## Release and rollback safeguards
- The exact PR head must have successful full CI **after** its last change. Preserve the reviewed base SHA and original live Render deploy identifier.
- No force push, no production DB writes in staging, no direct main-branch patch. Merge/deploy only with explicit authorization.
- After approved deployment, verify authenticated route reachability, user data isolation, and task-session read/write without logging private content.
- On a release regression, roll back the web service to the previous known-good commit/deploy; do not attempt destructive database rollback or drop existing user records.

**Gate owner decision:** PENDING. **Production status:** R253, unaffected by this review branch.
