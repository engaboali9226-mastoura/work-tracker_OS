# Platform Audit Part 003 - Toolchain Summary

========================================
APPLICATIONS
========================================

----------------------------------------
forge
----------------------------------------
apps/forge/README.md
apps/forge/dist/main.d.ts
apps/forge/dist/main.d.ts.map
apps/forge/dist/main.js
apps/forge/dist/main.js.map
apps/forge/dist/version.d.ts
apps/forge/dist/version.d.ts.map
apps/forge/dist/version.js
apps/forge/dist/version.js.map
apps/forge/package.json
apps/forge/src/main.ts
apps/forge/src/version.ts
apps/forge/tsconfig.json

PACKAGE.JSON
{
  "name": "@worktracker/forge",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/main.ts",
    "test": "node --test"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^24.0.0",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0"
  }
}


----------------------------------------
web
----------------------------------------
apps/web/README.md
apps/web/dist/index.html
apps/web/index.html
apps/web/package.json
apps/web/src/main.tsx
apps/web/tsconfig.json
apps/web/vite.config.ts

PACKAGE.JSON
{
  "name": "@worktracker/web",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0"
  }
}


----------------------------------------
workos-cli
----------------------------------------
apps/workos-cli/README.md
apps/workos-cli/src/main.ts


========================================
TOOLS
========================================
tools/validate-architecture.sh

========================================
TEMPLATES
========================================
templates/component/CONTRACT.md
templates/component/DECISIONS.md
templates/component/EXECUTION.md
templates/component/HEALTH.md
templates/component/LOGGING.md
templates/component/METRICS.md
templates/component/README.md
templates/component/SPECIFICATION.md
templates/component/TESTS.md
templates/component/component.yaml

========================================
COMPONENT MANIFESTS
========================================
components/ai-assistant/component.yaml
components/analytics/component.yaml
components/attendance/component.yaml
components/dashboard/component.yaml
components/integrations/component.yaml
components/kernel/component.yaml
components/notifications/component.yaml
components/reports/component.yaml
components/scheduler/component.yaml
components/tasks/component.yaml
components/workday/component.yaml

========================================
CLI BINARIES
========================================
./apps/forge/dist/main.js
./apps/forge/src/main.ts
./apps/workos-cli/src/main.ts
./node_modules/browserslist/cli.js
./node_modules/esbuild/lib/main.js
./node_modules/json5/lib/cli.js
./node_modules/update-browserslist-db/cli.js
./packages/application/src/index.ts
./packages/architecture/src/index.ts
./packages/contracts/src/index.ts
./packages/core/src/index.ts
./packages/domain/src/index.ts
./packages/events/src/index.ts
./packages/infrastructure/src/index.ts
./packages/runtime/src/index.ts
./packages/sdk/src/index.ts
./packages/shared/src/index.ts
./packages/testing/src/index.ts

[PASS] Toolchain Summary Completed.
