# NOOR hosted Node service

The hosted entrypoint serves `apps/web/dist` and streams `/api/noor` requests
to the existing privileged runtime on `127.0.0.1:8787`. Both listeners run in
one Node process. Authentication, authorization, persistence, commands and the
daily scheduler remain owned by the existing runtime. The hosted transport
does not create accounts, records, database schemas or credential files.

## Render configuration

- Service: one Node web service, Free compute plan, Singapore region.
- Source branch after governed publication and merge: `product/noor-personal-mvp`.
- Build: `npm ci --include=dev && node tools/hosting/serve-noor.mjs --check-build-env && npm run build && npm run test:hosting`.
- Start: `node tools/hosting/serve-noor.mjs`.
- Public listener: `0.0.0.0:$PORT`; default Render port is 10000.
- Health endpoint: `/healthz`, without an application-data read.
- Runtime public origin: explicit `NOOR_PUBLIC_ORIGIN`, or Render's documented
  `RENDER_EXTERNAL_URL` for the service's HTTPS address.
- Node.js: version 24. Keep required build dependencies installed for the build.

Use the Render service environment as the configuration source of truth. Set
private credentials there through the supported connected service or Dashboard,
never in Git, commands, reports or chat. Required server keys are
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOOR_AUTH_EXPECTED_ISSUER`,
`NOOR_AUTH_EXPECTED_AUDIENCE`, `NOOR_AUTH_EXPECTED_ALGORITHM`, and
`NOOR_SESSION_LIFETIME_MS`. Preserve the existing validated authentication
settings. Do not infer a signing algorithm from a token's unverified claims.

The frontend receives only `VITE_NOOR_SUPABASE_URL` and
`VITE_NOOR_SUPABASE_PUBLISHABLE_KEY`. The public build validator rejects
service-role or secret keys and checks that the public and server project URLs
match. The runtime's existing origin and Secure-cookie checks remain active.

No Render database or persistent disk is required: application records remain
in the existing Supabase project. Do not copy a browser profile, local session
database, private environment files or reports into the repository or deployment.

## Verification

`npm run test:hosting` uses temporary static fixtures and loopback HTTP stubs.
It covers deep links, asset types and caching, HEAD, forwarding of method/body/
Origin/cookies, HTTP 204 session responses, path traversal and symlink rejection,
offline API responses, and rejection of secrets in public build configuration.
The root `npm test` includes these tests in addition to the existing suite.

These tests do not prove that an actual deployment is live. After deployment,
verify the exact deployed commit, `/healthz`, frontend assets and API routing;
perform any user sign-in and deliberate save in the normal app manually. Keep
the Mac runtime available until the online app has been verified.

## Trial limits

Render Free web services spin down after 15 minutes without inbound traffic;
the next startup can take approximately a minute. The in-process scheduler does
not run while asleep. This configuration is a free online trial, not a guarantee
of continuous scheduling or faster cold startup. Free service hours and build/
bandwidth allowances are shared with other resources in the workspace; do not
change unrelated services to make room without the user's instruction.

References: https://render.com/docs/free,
https://render.com/docs/environment-variables,
https://render.com/docs/configure-environment-variables,
https://render.com/docs/web-services.
