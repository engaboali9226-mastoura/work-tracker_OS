# NOOR current application boundaries

The application now renders task, habit, prayer and finance projections from the trusted runtime. Presentation may name these values; it may not own privileged clients, raw NOOR API calls, session identifiers or credentials.

The public weather client owns the external Open-Meteo read with credentials omitted. A dedicated appearance adapter may store exactly `noor:appearance:v1`, accepting only `noor`, `light` and `dark`. This allowance grants no session storage authority; the remaining browser boundary rules continue to apply.

The daily materialization scheduler is the sole runtime owner of its interval. Its timer is unreferenced, stopped during host shutdown, and shutdown awaits an active tick. Other runtime modules remain prohibited from creating intervals or process keepalive.

Today returns its dashboard and workspace together. A successful command may return HTTP 200 with the committed projection, while legacy HTTP 204 remains supported. The browser supplies no account or user identity for Today; the finance response owner field is server data.

No-op persistence avoids a new revision. A mutating transaction still uses a conditional revision check and reports a conflict without retry inside the persistence transaction. Bounded command orchestration retries only known conflicts, and never ambiguous network failures. Regression tests exercise real changes when asserting commit and conflict behavior.
