# Monorepo Architecture Audit

## Root Files

/workspaces/work-tracker_OS/package.json
/workspaces/work-tracker_OS/tsconfig.base.json

----------------------------------------


========================================
/workspaces/work-tracker_OS/package.json
========================================
{
  "name": "work-tracker-os",
  "private": true,
  "version": "0.0.1",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "./scripts-build.sh",
    "test": "npm run test --workspaces",
    "forge": "npm --workspace apps/forge run dev --",
    "web": "npm --workspace apps/web run dev",
    "web:build": "npm --workspace apps/web run build",
    "validate:architecture": "./tools/validate-architecture.sh"
  }
}
========================================
/workspaces/work-tracker_OS/tsconfig.base.json
========================================
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],

    "module": "ESNext",
    "moduleResolution": "Bundler",

    "strict": true,

    "skipLibCheck": true,

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    "resolveJsonModule": true,

    "forceConsistentCasingInFileNames": true,

    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    "baseUrl": ".",

    "paths": {
      "@worktracker/shared": [
        "packages/shared/src/index.ts"
      ],
      "@worktracker/core": [
        "packages/core/src/index.ts"
      ]
    },

    "types": [
      "node"
    ]
  }
}

----------------------------------------

## Packages
/workspaces/work-tracker_OS/packages/application/package.json
/workspaces/work-tracker_OS/packages/contracts/package.json
/workspaces/work-tracker_OS/packages/core/package.json
/workspaces/work-tracker_OS/packages/domain/package.json
/workspaces/work-tracker_OS/packages/events/package.json
/workspaces/work-tracker_OS/packages/infrastructure/package.json
/workspaces/work-tracker_OS/packages/runtime/package.json
/workspaces/work-tracker_OS/packages/sdk/package.json
/workspaces/work-tracker_OS/packages/shared/package.json
/workspaces/work-tracker_OS/packages/testing/package.json

----------------------------------------

## SDK Imports
/workspaces/work-tracker_OS/packages/sdk/src/platform-api.ts:3:} from "../../runtime/src/kernel/runtime-kernel.js";
/workspaces/work-tracker_OS/packages/sdk/src/component-factory.ts:3:} from "../../runtime/src/component/component.js";
/workspaces/work-tracker_OS/packages/sdk/src/component-builder.ts:3:} from "../../runtime/src/component/component.js";
/workspaces/work-tracker_OS/packages/sdk/src/component-sdk.ts:3:} from "../../runtime/src/component/component.js";
/workspaces/work-tracker_OS/packages/sdk/src/component-context.ts:3:} from "../../runtime/src/logger/logger.js";
/workspaces/work-tracker_OS/packages/sdk/src/component-context.ts:7:} from "../../runtime/src/health/health.js";
/workspaces/work-tracker_OS/packages/sdk/src/component-context.ts:11:} from "../../runtime/src/metrics/metrics.js";
/workspaces/work-tracker_OS/packages/sdk/src/runtime-integration.ts:3:} from "../../runtime/src/kernel/runtime-kernel.js";

----------------------------------------

## Runtime Package
{
  "name":"@worktracker/runtime",
  "private":true,
  "version":"0.0.1",
  "type":"module",
  "scripts":{
    "build":"tsc",
    "test":"node --test"
  }
}
