Phase 2 Step 085
Root Test Build Order

Status
Completed

Problem
A clean install has no packages/architecture/dist directory.

Impact
Forge tests import @worktracker/architecture, whose package exports point to dist/index.js.

Fix
The root npm test command now builds packages/architecture before running workspace tests.

Reason
npm test must work from a clean clone after npm ci without relying on old local dist artifacts.
