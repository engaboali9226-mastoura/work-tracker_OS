# Infrastructure Baseline

## Package

total 32
drwxrwxrwx+  5 codespace codespace 4096 Jun 30 06:48 .
drwxrwxrwx+ 12 codespace codespace 4096 Jun 30 08:34 ..
-rw-rw-rw-   1 codespace codespace   89 Jun 30 06:46 README.md
drwxrwxrwx+ 10 codespace codespace 4096 Jun 30 06:48 dist
-rw-rw-rw-   1 codespace codespace  164 Jun 30 06:46 package.json
drwxrwxrwx+ 10 codespace codespace 4096 Jun 30 06:46 src
drwxrwxrwx+  2 codespace codespace 4096 Jun 30 06:46 tests
-rw-rw-rw-   1 codespace codespace  140 Jun 30 06:46 tsconfig.json

----------------------------------------

## Source

/workspaces/work-tracker_OS/packages/infrastructure/src/cache/cache-provider.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/clock/clock.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/configuration/configuration-provider.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/database/database-provider.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/filesystem/file-system.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/http/http-client.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/id/id-generator.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/index.ts
/workspaces/work-tracker_OS/packages/infrastructure/src/storage/storage-provider.ts

----------------------------------------

## Tests


----------------------------------------

## Public API

export * from "./configuration/configuration-provider.js";
export * from "./storage/storage-provider.js";
export * from "./database/database-provider.js";
export * from "./http/http-client.js";
export * from "./filesystem/file-system.js";
export * from "./cache/cache-provider.js";
export * from "./clock/clock.js";
export * from "./id/id-generator.js";

----------------------------------------

## package.json

{
  "name":"@worktracker/infrastructure",
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
