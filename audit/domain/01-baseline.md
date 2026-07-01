# Domain Baseline

## Package

total 32
drwxrwxrwx+  5 codespace codespace 4096 Jun 30 06:48 .
drwxrwxrwx+ 12 codespace codespace 4096 Jun 30 08:34 ..
-rw-rw-rw-   1 codespace codespace   91 Jun 30 06:44 README.md
drwxrwxrwx+ 10 codespace codespace 4096 Jun 30 06:48 dist
-rw-rw-rw-   1 codespace codespace  156 Jun 30 06:44 package.json
drwxrwxrwx+ 10 codespace codespace 4096 Jun 30 06:44 src
drwxrwxrwx+  2 codespace codespace 4096 Jun 30 06:44 tests
-rw-rw-rw-   1 codespace codespace  140 Jun 30 06:44 tsconfig.json

----------------------------------------

## Source

/workspaces/work-tracker_OS/packages/domain/src/aggregate/aggregate-root.ts
/workspaces/work-tracker_OS/packages/domain/src/entity/entity.ts
/workspaces/work-tracker_OS/packages/domain/src/error/domain-error.ts
/workspaces/work-tracker_OS/packages/domain/src/event/domain-event.ts
/workspaces/work-tracker_OS/packages/domain/src/index.ts
/workspaces/work-tracker_OS/packages/domain/src/repository/repository.ts
/workspaces/work-tracker_OS/packages/domain/src/result/result.ts
/workspaces/work-tracker_OS/packages/domain/src/service/domain-service.ts
/workspaces/work-tracker_OS/packages/domain/src/value-object/value-object.ts

----------------------------------------

## Tests


----------------------------------------

## Public API

export * from "./entity/entity.js";
export * from "./value-object/value-object.js";
export * from "./aggregate/aggregate-root.js";
export * from "./repository/repository.js";
export * from "./service/domain-service.js";
export * from "./event/domain-event.js";
export * from "./result/result.js";
export * from "./error/domain-error.js";

----------------------------------------

## Package.json

{
  "name":"@worktracker/domain",
  "private":true,
  "version":"0.0.1",
  "type":"module",
  "scripts":{
    "build":"tsc",
    "test":"node --test"
  }
}

----------------------------------------

## TypeScript

PASS
