# NOOR Development Notes → GitHub Issues (R282)

**Scope:** `تطوير نور` (development feedback only), NOT `مشاعري`, `أفكاري`, `مساحتي`, wellbeing or other private journals.

## What actually happens

The production GitHub repository is **public**. It must never receive encrypted journal records, auth credentials, session cookies, private reflections, or account details as part of a development feedback export.

R282 provides an explicit and independently tested **GitHub Issues hand-off**, not silent server-side replication:

1. Open NOOR Personal → `تطوير نور` → `إضافة جديدة`.
2. Enter a concise title, choose development category, and write the issue description.
3. Check **the distinct PUBLIC GitHub publishing consent**. The separate `shareApproved` checkbox continues to govern *manual developer exports* only; it is insufficient for public GitHub publication.
4. Click `فتح مسودة GitHub`: GitHub opens with the title/body pre-filled.
5. Authenticate to GitHub if needed; review and click `Create issue`. **Only then is the issue actually stored on GitHub.**
6. View developer issues at https://github.com/engaboali9226-mastoura/work-tracker_OS/issues . The NOOR form itself cannot assert success on GitHub's behalf.

Existing developer notes can open a public GitHub draft only after a separate confirmation dialog. Existing private encrypted notes remain unmodified and are never bulk-migrated.

## Safeguards

- The browser never receives a GitHub personal access token or service-role key.
- `feelings` and `ideas` notes cannot be converted by the public issue builder even with forged consent.
- Validate title/category/body, URL path/host, and URL length. Do not silently truncate long reports.
- Retain NOOR's existing trusted private-journal fail-closed behavior for all unrelated journal operations.
- No new Supabase table, account, scope or privilege. No service configuration changes.
- A person must deliberately confirm public publication and independently click GitHub's Issue submission control.
- Do not claim automatic remote saving; GitHub may require login or reject submission.

## Verified integration evidence

- Synthetic public issue test created on GitHub: https://github.com/engaboali9226-mastoura/work-tracker_OS/issues/121
- Verified by reading it back through the connected GitHub API: title and body matched.
- That test was created through the developer's connected GitHub integration; **it does not prove browser submission from NOOR**.
- Automated browser/contract test in `apps/web/tests/noor-developer-github-issues-r282.spec.ts` covers form opt-in, public-only URL, character-size restrictions, and blocked private types.

## For future automatic one-click server-side publishing

A separate release must provision a dedicated GitHub App (or scoped fine-grained token with **Issues: write only**) to the NOOR server, configure an owner-authorized same-origin backend route with CSRF/origin/session validation and rate limiting, add idempotent issue-ID mapping/acknowledgement, and keep that secret solely in a server-side secret store. Do NOT reuse the ChatGPT GitHub connector session or put tokens in `VITE_` environment variables or GitHub issue bodies. Consider a private repository if raw development reports could contain sensitive details.

Until then, the manual confirmation step is necessary and intentional.
