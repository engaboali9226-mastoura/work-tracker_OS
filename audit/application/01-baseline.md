# Application Baseline

## Package Structure

total 32
drwxrwxrwx+  5 codespace codespace 4096 Jun 30 06:48 .
drwxrwxrwx+ 12 codespace codespace 4096 Jun 30 08:34 ..
-rw-rw-rw-   1 codespace codespace   89 Jun 30 06:44 README.md
drwxrwxrwx+  9 codespace codespace 4096 Jun 30 06:49 dist
-rw-rw-rw-   1 codespace codespace  161 Jun 30 06:44 package.json
drwxrwxrwx+  9 codespace codespace 4096 Jun 30 06:44 src
drwxrwxrwx+  2 codespace codespace 4096 Jun 30 06:44 tests
-rw-rw-rw-   1 codespace codespace  140 Jun 30 06:44 tsconfig.json

----------------------------------------

## Source Files

packages/application/src/command/command.ts
packages/application/src/dto/dto.ts
packages/application/src/handler/command-handler.ts
packages/application/src/handler/query-handler.ts
packages/application/src/index.ts
packages/application/src/mapper/mapper.ts
packages/application/src/pipeline/pipeline.ts
packages/application/src/query/query.ts
packages/application/src/use-case/use-case.ts

----------------------------------------

## Tests


----------------------------------------

## Public API

export * from "./command/command.js";
export * from "./query/query.js";
export * from "./use-case/use-case.js";
export * from "./handler/command-handler.js";
export * from "./handler/query-handler.js";
export * from "./dto/dto.js";
export * from "./mapper/mapper.js";
export * from "./pipeline/pipeline.js";

----------------------------------------

## Package Dependencies

{
  "name":"@worktracker/application",
  "private":true,
  "version":"0.0.1",
  "type":"module",
  "scripts":{
    "build":"tsc",
    "test":"node --test"
  }
}

----------------------------------------

## TypeScript Verification


PASS
