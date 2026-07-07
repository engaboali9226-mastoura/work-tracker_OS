Phase 2 Step 089
Architecture CLI Clean Errors

Status
Completed

Goal
Make architecture CLI runtime errors user-friendly.

Change
The architecture CLI entrypoint now catches command errors and prints a clean Architecture Error message instead of a Node.js stack trace.

Protection
Added entrypoint-level tests that execute the architecture CLI entrypoint through Node + tsx and assert that missing arguments and unknown components produce clean errors without stack traces.
