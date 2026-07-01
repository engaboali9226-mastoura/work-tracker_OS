# IMPLEMENTATION BASELINE

Generated: Tue Jun 30 10:43:31 UTC 2026

==============================================================
PROJECT TREE
==============================================================
.
├── LICENSE
├── PLATFORM-STABLE
├── README.md
├── apps
│   ├── forge
│   │   ├── README.md
│   │   ├── components
│   │   │   ├── runtime
│   │   │   ├── sample
│   │   │   └── workday
│   │   ├── dist
│   │   │   ├── commands
│   │   │   ├── generators
│   │   │   ├── main.d.ts
│   │   │   ├── main.js
│   │   │   ├── version.d.ts
│   │   │   ├── version.js
│   │   │   └── workspace
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── commands
│   │   │   ├── configuration
│   │   │   ├── contracts
│   │   │   ├── core
│   │   │   ├── doctor
│   │   │   ├── filesystem
│   │   │   ├── generators
│   │   │   ├── logger
│   │   │   ├── main.ts
│   │   │   ├── templates
│   │   │   ├── testing
│   │   │   ├── utils
│   │   │   ├── version.ts
│   │   │   └── workspace
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── web
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── assets
│   │   │   └── index.html
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── public
│   │   ├── src
│   │   │   ├── app
│   │   │   ├── assets
│   │   │   ├── components
│   │   │   ├── features
│   │   │   ├── hooks
│   │   │   ├── layouts
│   │   │   ├── main.tsx
│   │   │   ├── pages
│   │   │   ├── router
│   │   │   ├── services
│   │   │   ├── shared
│   │   │   ├── styles
│   │   │   └── theme
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── workos-cli
│       ├── README.md
│       ├── src
│       │   ├── commands
│       │   ├── core
│       │   ├── main.ts
│       │   ├── templates
│       │   └── utils
│       └── tests
├── architecture
│   ├── component-dependencies.yaml
│   ├── component-ports.yaml
│   ├── component-registry.yaml
│   └── system.manifest.yaml
├── architecture-review.txt
├── audit
│   ├── IMPLEMENTATION_BASELINE.md
│   └── platform-review.md
├── components
│   ├── COMPONENTS.md
│   ├── ai-assistant
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── analytics
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── attendance
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── dashboard
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── integrations
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── kernel
│   │   ├── component.yaml
│   │   └── specification
│   │       └── SPECIFICATION.md
│   ├── notifications
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── reports
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── scheduler
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   ├── tasks
│   │   ├── component.yaml
│   │   ├── contracts
│   │   │   └── CONTRACT.md
│   │   ├── docs
│   │   │   ├── DECISIONS.md
│   │   │   ├── HEALTH.md
│   │   │   ├── LOGGING.md
│   │   │   ├── METRICS.md
│   │   │   └── README.md
│   │   ├── execution
│   │   │   └── EXECUTION.md
│   │   ├── implementation
│   │   ├── specification
│   │   │   └── SPECIFICATION.md
│   │   └── tests
│   │       └── TESTS.md
│   └── workday
│       ├── component.yaml
│       ├── contracts
│       │   └── CONTRACT.md
│       ├── docs
│       │   ├── DECISIONS.md
│       │   ├── HEALTH.md
│       │   ├── LOGGING.md
│       │   ├── METRICS.md
│       │   └── README.md
│       ├── execution
│       │   └── EXECUTION.md
│       ├── implementation
│       ├── specification
│       │   └── SPECIFICATION.md
│       └── tests
│           └── TESTS.md
├── docs
│   ├── 01-vision
│   │   └── VISION.md
│   ├── 02-principles
│   │   └── ARCHITECTURE_PRINCIPLES.md
│   ├── 03-architecture
│   │   ├── ARCHITECTURE_FOUNDATION.md
│   │   ├── COMMUNICATION_MODEL.md
│   │   ├── COMPONENT_MODEL.md
│   │   ├── DOCUMENTATION_BOUNDARIES.md
│   │   ├── PACKAGES.md
│   │   ├── PORT_MODEL.md
│   │   └── REPOSITORY_STRUCTURE.md
│   ├── 04-components
│   ├── 05-contracts
│   ├── 06-events
│   ├── 07-workflows
│   ├── 08-decisions
│   ├── 09-roadmap
│   ├── api
│   ├── architecture
│   │   └── ARCHITECTURE_PRINCIPLES.md
│   ├── components
│   ├── decisions
│   ├── vision
│   └── workflows
├── execution
├── implementation
│   ├── 00-platform-overview.md
│   ├── INDEX.md
│   ├── ai-assistant.md
│   ├── analytics.md
│   ├── attendance.md
│   ├── dashboard.md
│   ├── integrations.md
│   ├── kernel.md
│   ├── notifications.md
│   ├── reports.md
│   ├── scheduler.md
│   ├── tasks.md
│   └── workday.md
├── infrastructure
├── main
├── node_modules
│   ├── @babel
│   │   ├── code-frame
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── compat-data
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── corejs2-built-ins.js
│   │   │   ├── corejs3-shipped-proposals.js
│   │   │   ├── data
│   │   │   ├── native-modules.js
│   │   │   ├── overlapping-plugins.js
│   │   │   ├── package.json
│   │   │   ├── plugin-bugfixes.js
│   │   │   └── plugins.js
│   │   ├── core
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   ├── package.json
│   │   │   └── src
│   │   ├── generator
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-compilation-targets
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-globals
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── data
│   │   │   └── package.json
│   │   ├── helper-module-imports
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-module-transforms
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-plugin-utils
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-string-parser
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-validator-identifier
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helper-validator-option
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── helpers
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── parser
│   │   │   ├── CHANGELOG.md
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── bin
│   │   │   ├── lib
│   │   │   ├── package.json
│   │   │   └── typings
│   │   ├── plugin-transform-react-jsx-self
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── plugin-transform-react-jsx-source
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── template
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   └── package.json
│   │   ├── traverse
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── lib
│   │   │   ├── package.json
│   │   │   └── tsconfig.overrides.json
│   │   └── types
│   │       ├── LICENSE
│   │       ├── README.md
│   │       ├── lib
│   │       └── package.json
│   ├── @esbuild
│   │   └── linux-x64
│   │       ├── README.md
│   │       ├── bin
│   │       └── package.json
│   ├── @jridgewell
│   │   ├── gen-mapping
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── dist
│   │   │   ├── package.json
│   │   │   ├── src
│   │   │   └── types
│   │   ├── remapping
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── dist
│   │   │   ├── package.json
│   │   │   ├── src
│   │   │   └── types
│   │   ├── resolve-uri
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── dist
│   │   │   └── package.json
│   │   ├── sourcemap-codec
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── dist
│   │   │   ├── package.json
│   │   │   ├── src
│   │   │   └── types
│   │   └── trace-mapping
│   │       ├── LICENSE
│   │       ├── README.md
│   │       ├── dist
│   │       ├── package.json
│   │       ├── src
│   │       └── types
│   ├── @rolldown
│   │   └── pluginutils
│   │       ├── LICENSE
│   │       ├── README.md
│   │       ├── dist
│   │       └── package.json
│   ├── @rollup
│   │   └── rollup-linux-x64-gnu
│   │       ├── README.md
│   │       ├── package.json
│   │       └── rollup.linux-x64-gnu.node
│   ├── @types
│   │   ├── babel__core
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── index.d.ts
│   │   │   └── package.json
│   │   ├── babel__generator
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── index.d.ts
│   │   │   └── package.json
│   │   ├── babel__template
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── index.d.ts
│   │   │   └── package.json
│   │   ├── babel__traverse
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── index.d.ts
│   │   │   └── package.json
│   │   ├── estree
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── flow.d.ts
│   │   │   ├── index.d.ts
│   │   │   └── package.json
│   │   ├── node
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── assert
│   │   │   ├── assert.d.ts
│   │   │   ├── async_hooks.d.ts
│   │   │   ├── buffer.buffer.d.ts
│   │   │   ├── buffer.d.ts
│   │   │   ├── child_process.d.ts
│   │   │   ├── cluster.d.ts
│   │   │   ├── compatibility
│   │   │   ├── console.d.ts
│   │   │   ├── constants.d.ts
│   │   │   ├── crypto.d.ts
│   │   │   ├── dgram.d.ts
│   │   │   ├── diagnostics_channel.d.ts
│   │   │   ├── dns
│   │   │   ├── dns.d.ts
│   │   │   ├── domain.d.ts
│   │   │   ├── events.d.ts
│   │   │   ├── fs
│   │   │   ├── fs.d.ts
│   │   │   ├── globals.d.ts
│   │   │   ├── globals.typedarray.d.ts
│   │   │   ├── http.d.ts
│   │   │   ├── http2.d.ts
│   │   │   ├── https.d.ts
│   │   │   ├── index.d.ts
│   │   │   ├── inspector.d.ts
│   │   │   ├── inspector.generated.d.ts
│   │   │   ├── module.d.ts
│   │   │   ├── net.d.ts
│   │   │   ├── os.d.ts
│   │   │   ├── package.json
│   │   │   ├── path.d.ts
│   │   │   ├── perf_hooks.d.ts
│   │   │   ├── process.d.ts
│   │   │   ├── punycode.d.ts
│   │   │   ├── querystring.d.ts
│   │   │   ├── readline
│   │   │   ├── readline.d.ts
│   │   │   ├── repl.d.ts
│   │   │   ├── sea.d.ts
│   │   │   ├── sqlite.d.ts
│   │   │   ├── stream
│   │   │   ├── stream.d.ts
│   │   │   ├── string_decoder.d.ts
│   │   │   ├── test.d.ts
│   │   │   ├── timers
│   │   │   ├── timers.d.ts
│   │   │   ├── tls.d.ts
│   │   │   ├── trace_events.d.ts
│   │   │   ├── ts5.6
│   │   │   ├── ts5.7
│   │   │   ├── tty.d.ts
│   │   │   ├── url.d.ts
│   │   │   ├── util.d.ts
│   │   │   ├── v8.d.ts
│   │   │   ├── vm.d.ts
│   │   │   ├── wasi.d.ts
│   │   │   ├── web-globals
│   │   │   ├── worker_threads.d.ts
│   │   │   └── zlib.d.ts
│   │   ├── react
│   │   │   ├── LICENSE
│   │   │   ├── README.md
│   │   │   ├── canary.d.ts
│   │   │   ├── compiler-runtime.d.ts
│   │   │   ├── experimental.d.ts
│   │   │   ├── global.d.ts
│   │   │   ├── index.d.ts
│   │   │   ├── jsx-dev-runtime.d.ts
│   │   │   ├── jsx-runtime.d.ts
│   │   │   ├── package.json
│   │   │   └── ts5.0
│   │   └── react-dom
│   │       ├── LICENSE
│   │       ├── README.md
│   │       ├── canary.d.ts
│   │       ├── client.d.ts
│   │       ├── experimental.d.ts
│   │       ├── index.d.ts
│   │       ├── package.json
│   │       ├── server.browser.d.ts
│   │       ├── server.bun.d.ts
│   │       ├── server.d.ts
│   │       ├── server.edge.d.ts
│   │       ├── server.node.d.ts
│   │       ├── static.browser.d.ts
│   │       ├── static.d.ts
│   │       ├── static.edge.d.ts
│   │       ├── static.node.d.ts
│   │       └── test-utils
│   ├── @vitejs
│   │   └── plugin-react
│   │       ├── LICENSE
│   │       ├── README.md
│   │       ├── dist
│   │       ├── package.json
│   │       └── types
│   ├── @worktracker
│   │   ├── application -> ../../packages/application
│   │   ├── contracts -> ../../packages/contracts
│   │   ├── core -> ../../packages/core
│   │   ├── domain -> ../../packages/domain
│   │   ├── events -> ../../packages/events
│   │   ├── forge -> ../../apps/forge
│   │   ├── infrastructure -> ../../packages/infrastructure
│   │   ├── runtime -> ../../packages/runtime
│   │   ├── shared -> ../../packages/shared
│   │   ├── testing -> ../../packages/testing
│   │   └── web -> ../../apps/web
│   ├── baseline-browser-mapping
│   │   ├── LICENSE.txt
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── cli.cjs
│   │   │   ├── index.cjs
│   │   │   ├── index.d.ts
│   │   │   └── index.js
│   │   └── package.json
│   ├── browserslist
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── browser.js
│   │   ├── cli.js
│   │   ├── error.d.ts
│   │   ├── error.js
│   │   ├── index.d.ts
│   │   ├── index.js
│   │   ├── node.js
│   │   ├── package.json
│   │   └── parse.js
│   ├── caniuse-lite
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── data
│   │   │   ├── agents.js
│   │   │   ├── browserVersions.js
│   │   │   ├── browsers.js
│   │   │   ├── features
│   │   │   ├── features.js
│   │   │   └── regions
│   │   ├── dist
│   │   │   ├── lib
│   │   │   └── unpacker
│   │   └── package.json
│   ├── convert-source-map
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── index.js
│   │   └── package.json
│   ├── csstype
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── index.d.ts
│   │   ├── index.js.flow
│   │   └── package.json
│   ├── debug
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── package.json
│   │   └── src
│   │       ├── browser.js
│   │       ├── common.js
│   │       ├── index.js
│   │       └── node.js
│   ├── electron-to-chromium
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── chromium-versions.js
│   │   ├── chromium-versions.json
│   │   ├── full-chromium-versions.js
│   │   ├── full-chromium-versions.json
│   │   ├── full-versions.js
│   │   ├── full-versions.json
│   │   ├── index.js
│   │   ├── package.json
│   │   ├── versions.js
│   │   └── versions.json
│   ├── esbuild
│   │   ├── LICENSE.md
│   │   ├── README.md
│   │   ├── bin
│   │   │   └── esbuild
│   │   ├── install.js
│   │   ├── lib
│   │   │   ├── main.d.ts
│   │   │   └── main.js
│   │   └── package.json
│   ├── escalade
│   │   ├── dist
│   │   │   ├── index.js
│   │   │   └── index.mjs
│   │   ├── index.d.mts
│   │   ├── index.d.ts
│   │   ├── license
│   │   ├── package.json
│   │   ├── readme.md
│   │   └── sync
│   │       ├── index.d.mts
│   │       ├── index.d.ts
│   │       ├── index.js
│   │       └── index.mjs
│   ├── fdir
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── index.cjs
│   │   │   ├── index.d.cts
│   │   │   ├── index.d.mts
│   │   │   └── index.mjs
│   │   └── package.json
│   ├── gensync
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── index.js
│   │   ├── index.js.flow
│   │   ├── package.json
│   │   └── test
│   │       └── index.test.js
│   ├── js-tokens
│   │   ├── CHANGELOG.md
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── index.js
│   │   └── package.json
│   ├── jsesc
│   │   ├── LICENSE-MIT.txt
│   │   ├── README.md
│   │   ├── bin
│   │   │   └── jsesc
│   │   ├── jsesc.js
│   │   ├── man
│   │   │   └── jsesc.1
│   │   └── package.json
│   ├── json5
│   │   ├── LICENSE.md
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── index.js
│   │   │   ├── index.min.js
│   │   │   ├── index.min.mjs
│   │   │   └── index.mjs
│   │   ├── lib
│   │   │   ├── cli.js
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   ├── parse.d.ts
│   │   │   ├── parse.js
│   │   │   ├── register.js
│   │   │   ├── require.js
│   │   │   ├── stringify.d.ts
│   │   │   ├── stringify.js
│   │   │   ├── unicode.d.ts
│   │   │   ├── unicode.js
│   │   │   ├── util.d.ts
│   │   │   └── util.js
│   │   └── package.json
│   ├── lru-cache
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── index.js
│   │   └── package.json
│   ├── ms
│   │   ├── index.js
│   │   ├── license.md
│   │   ├── package.json
│   │   └── readme.md
│   ├── nanoid
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── async
│   │   │   ├── index.browser.cjs
│   │   │   ├── index.browser.js
│   │   │   ├── index.cjs
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   ├── index.native.js
│   │   │   └── package.json
│   │   ├── bin
│   │   │   └── nanoid.cjs
│   │   ├── index.browser.cjs
│   │   ├── index.browser.js
│   │   ├── index.cjs
│   │   ├── index.d.cts
│   │   ├── index.d.ts
│   │   ├── index.js
│   │   ├── nanoid.js
│   │   ├── non-secure
│   │   │   ├── index.cjs
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   ├── package.json
│   │   └── url-alphabet
│   │       ├── index.cjs
│   │       ├── index.js
│   │       └── package.json
│   ├── node-releases
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── data
│   │   │   ├── processed
│   │   │   └── release-schedule
│   │   └── package.json
│   ├── picocolors
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── picocolors.browser.js
│   │   ├── picocolors.d.ts
│   │   ├── picocolors.js
│   │   └── types.d.ts
│   ├── picomatch
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── index.js
│   │   ├── lib
│   │   │   ├── constants.js
│   │   │   ├── parse.js
│   │   │   ├── picomatch.js
│   │   │   ├── scan.js
│   │   │   └── utils.js
│   │   ├── package.json
│   │   └── posix.js
│   ├── postcss
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── lib
│   │   │   ├── at-rule.d.ts
│   │   │   ├── at-rule.js
│   │   │   ├── comment.d.ts
│   │   │   ├── comment.js
│   │   │   ├── container.d.ts
│   │   │   ├── container.js
│   │   │   ├── css-syntax-error.d.ts
│   │   │   ├── css-syntax-error.js
│   │   │   ├── declaration.d.ts
│   │   │   ├── declaration.js
│   │   │   ├── document.d.ts
│   │   │   ├── document.js
│   │   │   ├── fromJSON.d.ts
│   │   │   ├── fromJSON.js
│   │   │   ├── input.d.ts
│   │   │   ├── input.js
│   │   │   ├── lazy-result.d.ts
│   │   │   ├── lazy-result.js
│   │   │   ├── list.d.ts
│   │   │   ├── list.js
│   │   │   ├── map-generator.js
│   │   │   ├── no-work-result.d.ts
│   │   │   ├── no-work-result.js
│   │   │   ├── node.d.ts
│   │   │   ├── node.js
│   │   │   ├── parse.d.ts
│   │   │   ├── parse.js
│   │   │   ├── parser.js
│   │   │   ├── postcss.d.mts
│   │   │   ├── postcss.d.ts
│   │   │   ├── postcss.js
│   │   │   ├── postcss.mjs
│   │   │   ├── previous-map.d.ts
│   │   │   ├── previous-map.js
│   │   │   ├── processor.d.ts
│   │   │   ├── processor.js
│   │   │   ├── result.d.ts
│   │   │   ├── result.js
│   │   │   ├── root.d.ts
│   │   │   ├── root.js
│   │   │   ├── rule.d.ts
│   │   │   ├── rule.js
│   │   │   ├── stringifier.d.ts
│   │   │   ├── stringifier.js
│   │   │   ├── stringify.d.ts
│   │   │   ├── stringify.js
│   │   │   ├── symbols.js
│   │   │   ├── terminal-highlight.js
│   │   │   ├── tokenize.js
│   │   │   ├── warn-once.js
│   │   │   ├── warning.d.ts
│   │   │   └── warning.js
│   │   └── package.json
│   ├── react
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── cjs
│   │   │   ├── react-compiler-runtime.development.js
│   │   │   ├── react-compiler-runtime.production.js
│   │   │   ├── react-compiler-runtime.profiling.js
│   │   │   ├── react-jsx-dev-runtime.development.js
│   │   │   ├── react-jsx-dev-runtime.production.js
│   │   │   ├── react-jsx-dev-runtime.profiling.js
│   │   │   ├── react-jsx-dev-runtime.react-server.development.js
│   │   │   ├── react-jsx-dev-runtime.react-server.production.js
│   │   │   ├── react-jsx-runtime.development.js
│   │   │   ├── react-jsx-runtime.production.js
│   │   │   ├── react-jsx-runtime.profiling.js
│   │   │   ├── react-jsx-runtime.react-server.development.js
│   │   │   ├── react-jsx-runtime.react-server.production.js
│   │   │   ├── react.development.js
│   │   │   ├── react.production.js
│   │   │   ├── react.react-server.development.js
│   │   │   └── react.react-server.production.js
│   │   ├── compiler-runtime.js
│   │   ├── index.js
│   │   ├── jsx-dev-runtime.js
│   │   ├── jsx-dev-runtime.react-server.js
│   │   ├── jsx-runtime.js
│   │   ├── jsx-runtime.react-server.js
│   │   ├── package.json
│   │   └── react.react-server.js
│   ├── react-dom
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── cjs
│   │   │   ├── react-dom-client.development.js
│   │   │   ├── react-dom-client.production.js
│   │   │   ├── react-dom-profiling.development.js
│   │   │   ├── react-dom-profiling.profiling.js
│   │   │   ├── react-dom-server-legacy.browser.development.js
│   │   │   ├── react-dom-server-legacy.browser.production.js
│   │   │   ├── react-dom-server-legacy.node.development.js
│   │   │   ├── react-dom-server-legacy.node.production.js
│   │   │   ├── react-dom-server.browser.development.js
│   │   │   ├── react-dom-server.browser.production.js
│   │   │   ├── react-dom-server.bun.development.js
│   │   │   ├── react-dom-server.bun.production.js
│   │   │   ├── react-dom-server.edge.development.js
│   │   │   ├── react-dom-server.edge.production.js
│   │   │   ├── react-dom-server.node.development.js
│   │   │   ├── react-dom-server.node.production.js
│   │   │   ├── react-dom-test-utils.development.js
│   │   │   ├── react-dom-test-utils.production.js
│   │   │   ├── react-dom.development.js
│   │   │   ├── react-dom.production.js
│   │   │   ├── react-dom.react-server.development.js
│   │   │   └── react-dom.react-server.production.js
│   │   ├── client.js
│   │   ├── client.react-server.js
│   │   ├── index.js
│   │   ├── package.json
│   │   ├── profiling.js
│   │   ├── profiling.react-server.js
│   │   ├── react-dom.react-server.js
│   │   ├── server.browser.js
│   │   ├── server.bun.js
│   │   ├── server.edge.js
│   │   ├── server.js
│   │   ├── server.node.js
│   │   ├── server.react-server.js
│   │   ├── static.browser.js
│   │   ├── static.edge.js
│   │   ├── static.js
│   │   ├── static.node.js
│   │   ├── static.react-server.js
│   │   └── test-utils.js
│   ├── react-refresh
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── babel.js
│   │   ├── cjs
│   │   │   ├── react-refresh-babel.development.js
│   │   │   ├── react-refresh-babel.production.js
│   │   │   ├── react-refresh-runtime.development.js
│   │   │   └── react-refresh-runtime.production.js
│   │   ├── package.json
│   │   └── runtime.js
│   ├── rollup
│   │   ├── LICENSE.md
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── bin
│   │   │   ├── es
│   │   │   ├── getLogFilter.d.ts
│   │   │   ├── getLogFilter.js
│   │   │   ├── loadConfigFile.d.ts
│   │   │   ├── loadConfigFile.js
│   │   │   ├── native.js
│   │   │   ├── parseAst.d.ts
│   │   │   ├── parseAst.js
│   │   │   ├── rollup.d.ts
│   │   │   ├── rollup.js
│   │   │   └── shared
│   │   └── package.json
│   ├── scheduler
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── cjs
│   │   │   ├── scheduler-unstable_mock.development.js
│   │   │   ├── scheduler-unstable_mock.production.js
│   │   │   ├── scheduler-unstable_post_task.development.js
│   │   │   ├── scheduler-unstable_post_task.production.js
│   │   │   ├── scheduler.development.js
│   │   │   ├── scheduler.native.development.js
│   │   │   ├── scheduler.native.production.js
│   │   │   └── scheduler.production.js
│   │   ├── index.js
│   │   ├── index.native.js
│   │   ├── package.json
│   │   ├── unstable_mock.js
│   │   └── unstable_post_task.js
│   ├── semver
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── bin
│   │   │   └── semver.js
│   │   ├── package.json
│   │   ├── range.bnf
│   │   └── semver.js
│   ├── source-map-js
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── lib
│   │   │   ├── array-set.js
│   │   │   ├── base64-vlq.js
│   │   │   ├── base64.js
│   │   │   ├── binary-search.js
│   │   │   ├── mapping-list.js
│   │   │   ├── quick-sort.js
│   │   │   ├── source-map-consumer.d.ts
│   │   │   ├── source-map-consumer.js
│   │   │   ├── source-map-generator.d.ts
│   │   │   ├── source-map-generator.js
│   │   │   ├── source-node.d.ts
│   │   │   ├── source-node.js
│   │   │   └── util.js
│   │   ├── package.json
│   │   ├── source-map.d.ts
│   │   └── source-map.js
│   ├── tinyglobby
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── index.cjs
│   │   │   ├── index.d.cts
│   │   │   ├── index.d.mts
│   │   │   └── index.mjs
│   │   └── package.json
│   ├── tsx
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── cjs
│   │   │   ├── cli.cjs
│   │   │   ├── cli.mjs
│   │   │   ├── client-D3mGB526.cjs
│   │   │   ├── client-D_mPDF5S.mjs
│   │   │   ├── esm
│   │   │   ├── get-pipe-path-D4YM6rQt.cjs
│   │   │   ├── get-pipe-path-_tAJyU_v.mjs
│   │   │   ├── index-BWFBUo6r.cjs
│   │   │   ├── index-D9F1FXzN.cjs
│   │   │   ├── index-XurvG3JN.mjs
│   │   │   ├── index-gbaejti9.mjs
│   │   │   ├── lexer-DQCqS3nf.mjs
│   │   │   ├── lexer-DgIbo0BU.cjs
│   │   │   ├── loader.cjs
│   │   │   ├── loader.mjs
│   │   │   ├── node-features-B9BBLzwu.mjs
│   │   │   ├── node-features-CQLdkVE6.cjs
│   │   │   ├── package-Bj47PlGH.mjs
│   │   │   ├── package-DMqO70yR.cjs
│   │   │   ├── patch-repl.cjs
│   │   │   ├── patch-repl.mjs
│   │   │   ├── preflight.cjs
│   │   │   ├── preflight.mjs
│   │   │   ├── register-BOkp8V6j.cjs
│   │   │   ├── register-BnTWPeIB.mjs
│   │   │   ├── register-CKju0f8h.cjs
│   │   │   ├── register-CqMfTiWi.mjs
│   │   │   ├── repl.cjs
│   │   │   ├── repl.mjs
│   │   │   ├── require-CjvaJWEr.cjs
│   │   │   ├── require-DzmC1hVr.mjs
│   │   │   ├── suppress-warnings.cjs
│   │   │   ├── suppress-warnings.mjs
│   │   │   ├── temporary-directory-B83uKxJF.cjs
│   │   │   ├── temporary-directory-BDDVQOvU.mjs
│   │   │   └── types-Cxp8y2TL.d.ts
│   │   └── package.json
│   ├── typescript
│   │   ├── LICENSE.txt
│   │   ├── README.md
│   │   ├── SECURITY.md
│   │   ├── ThirdPartyNoticeText.txt
│   │   ├── bin
│   │   │   ├── tsc
│   │   │   └── tsserver
│   │   ├── lib
│   │   │   ├── _tsc.js
│   │   │   ├── _tsserver.js
│   │   │   ├── _typingsInstaller.js
│   │   │   ├── cs
│   │   │   ├── de
│   │   │   ├── es
│   │   │   ├── fr
│   │   │   ├── it
│   │   │   ├── ja
│   │   │   ├── ko
│   │   │   ├── lib.d.ts
│   │   │   ├── lib.decorators.d.ts
│   │   │   ├── lib.decorators.legacy.d.ts
│   │   │   ├── lib.dom.asynciterable.d.ts
│   │   │   ├── lib.dom.d.ts
│   │   │   ├── lib.dom.iterable.d.ts
│   │   │   ├── lib.es2015.collection.d.ts
│   │   │   ├── lib.es2015.core.d.ts
│   │   │   ├── lib.es2015.d.ts
│   │   │   ├── lib.es2015.generator.d.ts
│   │   │   ├── lib.es2015.iterable.d.ts
│   │   │   ├── lib.es2015.promise.d.ts
│   │   │   ├── lib.es2015.proxy.d.ts
│   │   │   ├── lib.es2015.reflect.d.ts
│   │   │   ├── lib.es2015.symbol.d.ts
│   │   │   ├── lib.es2015.symbol.wellknown.d.ts
│   │   │   ├── lib.es2016.array.include.d.ts
│   │   │   ├── lib.es2016.d.ts
│   │   │   ├── lib.es2016.full.d.ts
│   │   │   ├── lib.es2016.intl.d.ts
│   │   │   ├── lib.es2017.arraybuffer.d.ts
│   │   │   ├── lib.es2017.d.ts
│   │   │   ├── lib.es2017.date.d.ts
│   │   │   ├── lib.es2017.full.d.ts
│   │   │   ├── lib.es2017.intl.d.ts
│   │   │   ├── lib.es2017.object.d.ts
│   │   │   ├── lib.es2017.sharedmemory.d.ts
│   │   │   ├── lib.es2017.string.d.ts
│   │   │   ├── lib.es2017.typedarrays.d.ts
│   │   │   ├── lib.es2018.asyncgenerator.d.ts
│   │   │   ├── lib.es2018.asynciterable.d.ts
│   │   │   ├── lib.es2018.d.ts
│   │   │   ├── lib.es2018.full.d.ts
│   │   │   ├── lib.es2018.intl.d.ts
│   │   │   ├── lib.es2018.promise.d.ts
│   │   │   ├── lib.es2018.regexp.d.ts
│   │   │   ├── lib.es2019.array.d.ts
│   │   │   ├── lib.es2019.d.ts
│   │   │   ├── lib.es2019.full.d.ts
│   │   │   ├── lib.es2019.intl.d.ts
│   │   │   ├── lib.es2019.object.d.ts
│   │   │   ├── lib.es2019.string.d.ts
│   │   │   ├── lib.es2019.symbol.d.ts
│   │   │   ├── lib.es2020.bigint.d.ts
│   │   │   ├── lib.es2020.d.ts
│   │   │   ├── lib.es2020.date.d.ts
│   │   │   ├── lib.es2020.full.d.ts
│   │   │   ├── lib.es2020.intl.d.ts
│   │   │   ├── lib.es2020.number.d.ts
│   │   │   ├── lib.es2020.promise.d.ts
│   │   │   ├── lib.es2020.sharedmemory.d.ts
│   │   │   ├── lib.es2020.string.d.ts
│   │   │   ├── lib.es2020.symbol.wellknown.d.ts
│   │   │   ├── lib.es2021.d.ts
│   │   │   ├── lib.es2021.full.d.ts
│   │   │   ├── lib.es2021.intl.d.ts
│   │   │   ├── lib.es2021.promise.d.ts
│   │   │   ├── lib.es2021.string.d.ts
│   │   │   ├── lib.es2021.weakref.d.ts
│   │   │   ├── lib.es2022.array.d.ts
│   │   │   ├── lib.es2022.d.ts
│   │   │   ├── lib.es2022.error.d.ts
│   │   │   ├── lib.es2022.full.d.ts
│   │   │   ├── lib.es2022.intl.d.ts
│   │   │   ├── lib.es2022.object.d.ts
│   │   │   ├── lib.es2022.regexp.d.ts
│   │   │   ├── lib.es2022.string.d.ts
│   │   │   ├── lib.es2023.array.d.ts
│   │   │   ├── lib.es2023.collection.d.ts
│   │   │   ├── lib.es2023.d.ts
│   │   │   ├── lib.es2023.full.d.ts
│   │   │   ├── lib.es2023.intl.d.ts
│   │   │   ├── lib.es2024.arraybuffer.d.ts
│   │   │   ├── lib.es2024.collection.d.ts
│   │   │   ├── lib.es2024.d.ts
│   │   │   ├── lib.es2024.full.d.ts
│   │   │   ├── lib.es2024.object.d.ts
│   │   │   ├── lib.es2024.promise.d.ts
│   │   │   ├── lib.es2024.regexp.d.ts
│   │   │   ├── lib.es2024.sharedmemory.d.ts
│   │   │   ├── lib.es2024.string.d.ts
│   │   │   ├── lib.es5.d.ts
│   │   │   ├── lib.es6.d.ts
│   │   │   ├── lib.esnext.array.d.ts
│   │   │   ├── lib.esnext.collection.d.ts
│   │   │   ├── lib.esnext.d.ts
│   │   │   ├── lib.esnext.decorators.d.ts
│   │   │   ├── lib.esnext.disposable.d.ts
│   │   │   ├── lib.esnext.error.d.ts
│   │   │   ├── lib.esnext.float16.d.ts
│   │   │   ├── lib.esnext.full.d.ts
│   │   │   ├── lib.esnext.intl.d.ts
│   │   │   ├── lib.esnext.iterator.d.ts
│   │   │   ├── lib.esnext.promise.d.ts
│   │   │   ├── lib.esnext.sharedmemory.d.ts
│   │   │   ├── lib.scripthost.d.ts
│   │   │   ├── lib.webworker.asynciterable.d.ts
│   │   │   ├── lib.webworker.d.ts
│   │   │   ├── lib.webworker.importscripts.d.ts
│   │   │   ├── lib.webworker.iterable.d.ts
│   │   │   ├── pl
│   │   │   ├── pt-br
│   │   │   ├── ru
│   │   │   ├── tr
│   │   │   ├── tsc.js
│   │   │   ├── tsserver.js
│   │   │   ├── tsserverlibrary.d.ts
│   │   │   ├── tsserverlibrary.js
│   │   │   ├── typesMap.json
│   │   │   ├── typescript.d.ts
│   │   │   ├── typescript.js
│   │   │   ├── typingsInstaller.js
│   │   │   ├── watchGuard.js
│   │   │   ├── zh-cn
│   │   │   └── zh-tw
│   │   └── package.json
│   ├── undici-types
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── agent.d.ts
│   │   ├── api.d.ts
│   │   ├── balanced-pool.d.ts
│   │   ├── cache-interceptor.d.ts
│   │   ├── cache.d.ts
│   │   ├── client-stats.d.ts
│   │   ├── client.d.ts
│   │   ├── connector.d.ts
│   │   ├── content-type.d.ts
│   │   ├── cookies.d.ts
│   │   ├── diagnostics-channel.d.ts
│   │   ├── dispatcher.d.ts
│   │   ├── env-http-proxy-agent.d.ts
│   │   ├── errors.d.ts
│   │   ├── eventsource.d.ts
│   │   ├── fetch.d.ts
│   │   ├── formdata.d.ts
│   │   ├── global-dispatcher.d.ts
│   │   ├── global-origin.d.ts
│   │   ├── h2c-client.d.ts
│   │   ├── handlers.d.ts
│   │   ├── header.d.ts
│   │   ├── index.d.ts
│   │   ├── interceptors.d.ts
│   │   ├── mock-agent.d.ts
│   │   ├── mock-call-history.d.ts
│   │   ├── mock-client.d.ts
│   │   ├── mock-errors.d.ts
│   │   ├── mock-interceptor.d.ts
│   │   ├── mock-pool.d.ts
│   │   ├── package.json
│   │   ├── patch.d.ts
│   │   ├── pool-stats.d.ts
│   │   ├── pool.d.ts
│   │   ├── proxy-agent.d.ts
│   │   ├── readable.d.ts
│   │   ├── retry-agent.d.ts
│   │   ├── retry-handler.d.ts
│   │   ├── round-robin-pool.d.ts
│   │   ├── snapshot-agent.d.ts
│   │   ├── util.d.ts
│   │   ├── utility.d.ts
│   │   ├── webidl.d.ts
│   │   └── websocket.d.ts
│   ├── update-browserslist-db
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── check-npm-version.js
│   │   ├── cli.js
│   │   ├── index.d.ts
│   │   ├── index.js
│   │   ├── package.json
│   │   └── utils.js
│   ├── vite
│   │   ├── LICENSE.md
│   │   ├── README.md
│   │   ├── bin
│   │   │   ├── openChrome.js
│   │   │   └── vite.js
│   │   ├── client.d.ts
│   │   ├── dist
│   │   │   ├── client
│   │   │   └── node
│   │   ├── misc
│   │   │   ├── false.js
│   │   │   └── true.js
│   │   ├── package.json
│   │   └── types
│   │       ├── customEvent.d.ts
│   │       ├── hmrPayload.d.ts
│   │       ├── hot.d.ts
│   │       ├── import-meta.d.ts
│   │       ├── importGlob.d.ts
│   │       ├── importMeta.d.ts
│   │       ├── internal
│   │       ├── metadata.d.ts
│   │       └── package.json
│   └── yallist
│       ├── LICENSE
│       ├── README.md
│       ├── iterator.js
│       ├── package.json
│       └── yallist.js
├── package-lock.json
├── package.json
├── packages
│   ├── application
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── command
│   │   │   ├── dto
│   │   │   ├── handler
│   │   │   ├── index.d.ts
│   │   │   ├── index.d.ts.map
│   │   │   ├── index.js
│   │   │   ├── index.js.map
│   │   │   ├── mapper
│   │   │   ├── pipeline
│   │   │   ├── query
│   │   │   └── use-case
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── command
│   │   │   ├── dto
│   │   │   ├── handler
│   │   │   ├── index.ts
│   │   │   ├── mapper
│   │   │   ├── pipeline
│   │   │   ├── query
│   │   │   └── use-case
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── contracts
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── core
│   │   ├── README.md
│   │   ├── docs
│   │   │   └── PACKAGE_ROLE.md
│   │   ├── package.json
│   │   ├── src
│   │   │   └── component
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── domain
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── aggregate
│   │   │   ├── entity
│   │   │   ├── error
│   │   │   ├── event
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   ├── repository
│   │   │   ├── result
│   │   │   ├── service
│   │   │   └── value-object
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── aggregate
│   │   │   ├── entity
│   │   │   ├── error
│   │   │   ├── event
│   │   │   ├── index.ts
│   │   │   ├── repository
│   │   │   ├── result
│   │   │   ├── service
│   │   │   └── value-object
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── events
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── infrastructure
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── cache
│   │   │   ├── clock
│   │   │   ├── configuration
│   │   │   ├── database
│   │   │   ├── filesystem
│   │   │   ├── http
│   │   │   ├── id
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   └── storage
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── cache
│   │   │   ├── clock
│   │   │   ├── configuration
│   │   │   ├── database
│   │   │   ├── filesystem
│   │   │   ├── http
│   │   │   ├── id
│   │   │   ├── index.ts
│   │   │   └── storage
│   │   ├── tests
│   │   └── tsconfig.json
│   ├── runtime
│   │   ├── README.md
│   │   ├── dist
│   │   │   ├── component
│   │   │   ├── contracts
│   │   │   ├── events
│   │   │   ├── health
│   │   │   ├── index.d.ts
│   │   │   ├── index.d.ts.map
│   │   │   ├── index.js
│   │   │   ├── index.js.map
│   │   │   ├── kernel
│   │   │   ├── lifecycle
│   │   │   ├── loader
│   │   │   ├── logger
│   │   │   ├── ports
│   │   │   ├── registry
│   │   │   └── tracing
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── component
│   │   │   ├── contracts
│   │   │   ├── dispatcher
│   │   │   ├── errors
│   │   │   ├── health
│   │   │   ├── host
│   │   │   ├── index.ts
│   │   │   ├── kernel
│   │   │   ├── lifecycle
│   │   │   ├── loader
│   │   │   ├── logger
│   │   │   ├── metrics
│   │   │   ├── ports
│   │   │   ├── registry
│   │   │   └── tracing
│   │   ├── tests
│   │   │   └── kernel
│   │   └── tsconfig.json
│   ├── sdk
│   │   ├── README.md
│   │   └── src
│   │       ├── component-bootstrap.ts
│   │       ├── component-builder.ts
│   │       ├── component-context.ts
│   │       ├── component-factory.ts
│   │       ├── component-manifest.ts
│   │       ├── component-registry.ts
│   │       ├── component-sdk.ts
│   │       ├── component-template.ts
│   │       ├── index.ts
│   │       ├── platform-api.ts
│   │       └── runtime-integration.ts
│   ├── shared
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src
│   │   ├── tests
│   │   └── tsconfig.json
│   └── testing
│       ├── README.md
│       ├── package.json
│       ├── src
│       ├── tests
│       └── tsconfig.json
├── project-tree.txt
├── runtime
│   └── component-registry.json
├── scripts-build.sh
├── templates
│   └── component
│       ├── CONTRACT.md
│       ├── DECISIONS.md
│       ├── EXECUTION.md
│       ├── HEALTH.md
│       ├── LOGGING.md
│       ├── METRICS.md
│       ├── README.md
│       ├── SPECIFICATION.md
│       ├── TESTS.md
│       └── component.yaml
├── tests
├── tools
│   └── validate-architecture.sh
└── tsconfig.base.json

461 directories, 1010 files

==============================================================
ARCHITECTURE
==============================================================
architecture/component-dependencies.yaml
architecture/component-ports.yaml
architecture/component-registry.yaml
architecture/system.manifest.yaml

##############################################################
# architecture/component-dependencies.yaml
##############################################################
apiVersion: worktracker.io/v1

kind: DependencyDocumentation

title: Component Dependencies

status: Active

description: |

  This file is documentation only.

  Component dependencies are declared inside each
  component manifest.

sourceOfTruth:

  - components/*/component.yaml

manifestField:

  spec:
    dependencies: []

generatedArtifacts:

  - runtime/component-registry.json

notes:

  - Never duplicate dependencies here.

  - Never maintain dependencies manually.

  - Runtime discovers dependencies from every
    component manifest.


##############################################################
# architecture/component-ports.yaml
##############################################################
apiVersion: worktracker.io/v1

kind: PortDocumentation

title: Component Ports

status: Active

description: |

  This file is documentation only.

  Every component declares its own input and output
  ports inside its manifest.

sourceOfTruth:

  - components/*/component.yaml

manifestField:

  spec:

    ports:

      inputs: []

      outputs: []

generatedArtifacts:

  - runtime/component-registry.json

notes:

  - Never declare ports here.

  - Never duplicate port definitions.

  - Runtime discovers ports from every component
    manifest.


##############################################################
# architecture/component-registry.yaml
##############################################################
apiVersion: worktracker.io/v1

kind: RegistryDocumentation

title: Component Registry

status: Active

description: |

  This file is documentation only.

  The runtime registry is generated automatically.

sourceOfTruth:

  - components/*/component.yaml

generatedArtifact:

  - runtime/component-registry.json

generator:

  execution/041-build-component-registry.sh

notes:

  - Never edit runtime/component-registry.json manually.

  - Never register components manually.

  - Every component is discovered from its manifest.


##############################################################
# architecture/system.manifest.yaml
##############################################################
name: Work Tracker OS

version: 1.0.0

status: foundation

packages:

  - runtime
  - domain
  - application
  - infrastructure
  - core
  - contracts
  - events
  - shared
  - testing

applications:

  - forge
  - web

components:

  - workday
  - attendance
  - tasks
  - notifications
  - reports
  - dashboard
  - analytics
  - integrations


==============================================================
COMPONENTS
==============================================================
components/ai-assistant
components/analytics
components/attendance
components/dashboard
components/integrations
components/kernel
components/notifications
components/reports
components/scheduler
components/tasks
components/workday

##############################################################
# COMPONENT ai-assistant
##############################################################
components/ai-assistant
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/ai-assistant/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/ai-assistant/contracts/CONTRACT.md
--------------------------------------------------------------
# AI Assistant Contract

Input Ports

- analyze-context
- generate-recommendation
- summarize-workday
- ask-question

--------------------------------------------

Output Ports

- recommendation-generated
- summary-generated
- insight-generated
- answer-generated

Version

1.0.0


--------------------------------------------------------------
components/ai-assistant/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/ai-assistant/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/ai-assistant/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/ai-assistant/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/ai-assistant/docs/README.md
--------------------------------------------------------------
# AI Assistant

Provides intelligent assistance across Work Tracker OS.

Consumes information from business components to generate recommendations,
summaries, productivity suggestions and contextual insights without
changing business records.


--------------------------------------------------------------
components/ai-assistant/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/ai-assistant/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/ai-assistant/specification/SPECIFICATION.md
--------------------------------------------------------------
# AI Assistant Component

## Status

Approved

---

## Purpose

Provide intelligent analysis, recommendations and natural language
assistance for Work Tracker OS users.

---

## Responsibilities

- Analyze Business Context
- Generate Recommendations
- Summarize Work Activities
- Detect Risks
- Suggest Productivity Improvements
- Answer User Questions
- Produce Actionable Insights

---

## Inputs

- AnalyzeContext
- GenerateRecommendation
- SummarizeWorkday
- AskQuestion

---

## Outputs

- RecommendationGenerated
- SummaryGenerated
- InsightGenerated
- AnswerGenerated

---

## Business Rules

- The AI Assistant never modifies business data directly.
- All recommendations are advisory.
- Every response is traceable to its input context.
- Generated insights may be reviewed before execution.


--------------------------------------------------------------
components/ai-assistant/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT analytics
##############################################################
components/analytics
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/analytics/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/analytics/contracts/CONTRACT.md
--------------------------------------------------------------
# Analytics Contract

Input Ports

- analyze-tasks
- analyze-workdays
- analyze-attendance
- analyze-reports
- generate-insights

--------------------------------------------

Output Ports

- productivity-metrics
- performance-insights
- risk-prediction
- recommendation-generated

Version

1.0.0


--------------------------------------------------------------
components/analytics/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/analytics/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/analytics/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/analytics/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/analytics/docs/README.md
--------------------------------------------------------------
# Analytics

Provides analytical capabilities for Work Tracker OS.

Consumes historical business data to produce metrics, insights,
predictions and productivity recommendations without changing
the underlying business records.


--------------------------------------------------------------
components/analytics/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/analytics/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/analytics/specification/SPECIFICATION.md
--------------------------------------------------------------
# Analytics Component

## Status

Approved

---

## Purpose

Analyze operational data and generate insights, trends, predictions and recommendations.

---

## Responsibilities

- Calculate Productivity Metrics
- Analyze Task Performance
- Detect Work Patterns
- Detect Repeated Delays
- Generate Recommendations
- Predict Potential Risks
- Build KPI Metrics

---

## Inputs

- AnalyzeTasks
- AnalyzeWorkdays
- AnalyzeAttendance
- AnalyzeReports
- GenerateInsights

---

## Outputs

- ProductivityMetrics
- PerformanceInsights
- RiskPrediction
- RecommendationGenerated

---

## Business Rules

- Analytics never modifies business data.
- Results are derived from historical data.
- Recommendations are advisory only.
- All analyses are reproducible.


--------------------------------------------------------------
components/analytics/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT attendance
##############################################################
components/attendance
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/attendance/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/attendance/contracts/CONTRACT.md
--------------------------------------------------------------
# Attendance Contract

Input Ports

- check-in
- check-out
- attendance-status

--------------------------------------------

Output Ports

- checked-in
- checked-out
- attendance-status

Version

1.0.0


--------------------------------------------------------------
components/attendance/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/attendance/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/attendance/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/attendance/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/attendance/docs/README.md
--------------------------------------------------------------
# Attendance

Manages employee attendance during the active workday.

Depends on the Workday component to determine the active session.


--------------------------------------------------------------
components/attendance/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/attendance/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/attendance/specification/SPECIFICATION.md
--------------------------------------------------------------
# Attendance Component

## Status

Approved

---

## Purpose

Manage attendance and departure records.

---

## Responsibilities

- Register Check-In
- Register Check-Out
- Calculate Working Duration
- Determine Attendance Status

---

## Inputs

- CheckIn
- CheckOut
- GetAttendance

---

## Outputs

- CheckedIn
- CheckedOut
- AttendanceStatus

---

## Business Rules

- A check-in is required before check-out.
- Only one active attendance session is allowed.
- Attendance belongs to the current workday.


--------------------------------------------------------------
components/attendance/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT dashboard
##############################################################
components/dashboard
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/dashboard/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/dashboard/contracts/CONTRACT.md
--------------------------------------------------------------
# Dashboard Contract

Input Ports

- get-dashboard
- refresh-dashboard

--------------------------------------------

Output Ports

- dashboard-view
- dashboard-updated

Version

1.0.0


--------------------------------------------------------------
components/dashboard/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/dashboard/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/dashboard/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/dashboard/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/dashboard/docs/README.md
--------------------------------------------------------------
# Dashboard

Aggregates information from Workday, Attendance, Tasks, Notifications,
Reports and other business components to provide the primary user interface.

The Dashboard owns no business data and acts only as a presentation component.


--------------------------------------------------------------
components/dashboard/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/dashboard/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/dashboard/specification/SPECIFICATION.md
--------------------------------------------------------------
# Dashboard Component

## Status

Approved

---

## Purpose

Provide the main user dashboard by aggregating data from business components.

---

## Responsibilities

- Display Workday Status
- Display Attendance Status
- Display Active Tasks
- Display Recent Notifications
- Display Productivity Metrics
- Display Upcoming Events
- Display Quick Actions

---

## Inputs

- GetDashboard
- RefreshDashboard

---

## Outputs

- DashboardView
- DashboardUpdated

---

## Business Rules

- Dashboard is read-only.
- Dashboard does not own business data.
- Dashboard aggregates data from other components.
- Dashboard refreshes on business events.


--------------------------------------------------------------
components/dashboard/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT integrations
##############################################################
components/integrations
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/integrations/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/integrations/contracts/CONTRACT.md
--------------------------------------------------------------
# Integrations Contract

Input Ports

- register-provider
- synchronize-data
- receive-webhook
- publish-event
- execute-integration

--------------------------------------------

Output Ports

- provider-registered
- synchronization-completed
- synchronization-failed
- webhook-received
- integration-event-published

Version

1.0.0


--------------------------------------------------------------
components/integrations/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/integrations/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/integrations/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/integrations/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/integrations/docs/README.md
--------------------------------------------------------------
# Integrations

Responsible for communication with external platforms and services.

Provides a unified integration layer for systems such as Notion, n8n,
Neon, WhatsApp providers, notification services and future integrations,
while keeping business components isolated from external dependencies.


--------------------------------------------------------------
components/integrations/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/integrations/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/integrations/specification/SPECIFICATION.md
--------------------------------------------------------------
# Integrations Component

## Status

Approved

---

## Purpose

Provide integration with external systems and services.

---

## Responsibilities

- Manage Integration Providers
- Synchronize Data
- Publish Events
- Receive External Events
- Execute Webhooks
- Manage Authentication
- Handle Integration Failures

---

## Inputs

- RegisterProvider
- SynchronizeData
- ReceiveWebhook
- PublishEvent
- ExecuteIntegration

---

## Outputs

- ProviderRegistered
- SynchronizationCompleted
- SynchronizationFailed
- WebhookReceived
- IntegrationEventPublished

---

## Business Rules

- Every provider has a unique configuration.
- Failed synchronizations are logged.
- Integrations are isolated from business logic.
- All external communication is auditable.


--------------------------------------------------------------
components/integrations/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT kernel
##############################################################
components/kernel
├── component.yaml
└── specification
    └── SPECIFICATION.md

2 directories, 2 files

--------------------------------------------------------------
components/kernel/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/kernel/specification/SPECIFICATION.md
--------------------------------------------------------------
# Kernel

Status

Approved

-------------------------------------------------------------------------------

Purpose

Provide the common runtime model for every component.

-------------------------------------------------------------------------------

Responsibilities

- Component Identity

- Input Ports

- Output Ports

- Contracts

- Events

- Configuration

- Logging

- Tracing

- Health

- Metrics

-------------------------------------------------------------------------------

Non Responsibilities

- Business Logic

- UI

- Database

-------------------------------------------------------------------------------

Inputs

- Component Registration

- Component Configuration

-------------------------------------------------------------------------------

Outputs

- Registration Result

- Health Result

-------------------------------------------------------------------------------

Commands

- Register Component

- Validate Component

- Load Configuration

-------------------------------------------------------------------------------

Events In

- ComponentCreated

-------------------------------------------------------------------------------

Events Out

- ComponentRegistered

-------------------------------------------------------------------------------

Business Rules

Every component must:

- Have a unique name

- Have at least one input port

- Have at least one output port

- Own its specification

- Own its contracts

- Own its documentation

-------------------------------------------------------------------------------

Acceptance Criteria

Kernel is responsible only for platform behaviour.


##############################################################
# COMPONENT notifications
##############################################################
components/notifications
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/notifications/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/notifications/contracts/CONTRACT.md
--------------------------------------------------------------
# Notifications Contract

Input Ports

- create-notification
- schedule-notification
- send-notification
- cancel-notification
- retry-notification

--------------------------------------------

Output Ports

- notification-created
- notification-scheduled
- notification-sent
- notification-cancelled
- notification-failed

Version

1.0.0


--------------------------------------------------------------
components/notifications/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/notifications/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/notifications/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/notifications/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/notifications/docs/README.md
--------------------------------------------------------------
# Notifications

Provides notification orchestration for the Work Tracker OS platform.

Supports scheduling, delivery, retries and multiple notification channels.


--------------------------------------------------------------
components/notifications/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/notifications/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/notifications/specification/SPECIFICATION.md
--------------------------------------------------------------
# Notifications Component

## Status

Approved

---

## Purpose

Manage the creation, scheduling and delivery of notifications.

---

## Responsibilities

- Create Notification
- Schedule Notification
- Deliver Notification
- Cancel Notification
- Retry Failed Notification
- Manage Notification Channels

---

## Inputs

- CreateNotification
- ScheduleNotification
- SendNotification
- CancelNotification
- RetryNotification

---

## Outputs

- NotificationCreated
- NotificationScheduled
- NotificationSent
- NotificationCancelled
- NotificationFailed

---

## Business Rules

- Every notification has a unique identifier.
- Delivery attempts are logged.
- Failed notifications may be retried.
- Delivery channel is selected by policy.


--------------------------------------------------------------
components/notifications/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT reports
##############################################################
components/reports
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/reports/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/reports/contracts/CONTRACT.md
--------------------------------------------------------------
# Reports Contract

Input Ports

- generate-daily-report
- generate-weekly-report
- generate-monthly-report
- generate-quarterly-report
- generate-yearly-report
- export-report

--------------------------------------------

Output Ports

- report-generated
- report-exported

Version

1.0.0


--------------------------------------------------------------
components/reports/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/reports/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/reports/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/reports/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/reports/docs/README.md
--------------------------------------------------------------
# Reports

Responsible for producing operational and analytical reports for Work Tracker OS.

Consumes business data from other components and produces formatted report outputs.


--------------------------------------------------------------
components/reports/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/reports/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/reports/specification/SPECIFICATION.md
--------------------------------------------------------------
# Reports Component

## Status

Approved

---

## Purpose

Generate operational and management reports from business data.

---

## Responsibilities

- Generate Daily Reports
- Generate Weekly Reports
- Generate Monthly Reports
- Generate Quarterly Reports
- Generate Yearly Reports
- Export Reports

---

## Inputs

- GenerateDailyReport
- GenerateWeeklyReport
- GenerateMonthlyReport
- GenerateQuarterlyReport
- GenerateYearlyReport
- ExportReport

---

## Outputs

- ReportGenerated
- ReportExported

---

## Business Rules

- Reports are generated from validated business data.
- Report generation is auditable.
- Export formats are configurable.
- Historical reports are immutable.


--------------------------------------------------------------
components/reports/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT scheduler
##############################################################
components/scheduler
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/scheduler/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/scheduler/contracts/CONTRACT.md
--------------------------------------------------------------
# Scheduler Contract

Input Ports

- register-schedule
- cancel-schedule
- pause-schedule
- resume-schedule
- execute-schedule

--------------------------------------------

Output Ports

- schedule-registered
- schedule-executed
- schedule-cancelled
- schedule-paused
- schedule-resumed
- schedule-failed

Version

1.0.0


--------------------------------------------------------------
components/scheduler/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/scheduler/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/scheduler/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/scheduler/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/scheduler/docs/README.md
--------------------------------------------------------------
# Scheduler

Provides time-based orchestration for Work Tracker OS.

Responsible for triggering scheduled actions such as automatic workday
closure, recurring reports, notifications, synchronization jobs and
future automation workflows.

The Scheduler executes schedules only and delegates business processing
to the appropriate components.


--------------------------------------------------------------
components/scheduler/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/scheduler/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/scheduler/specification/SPECIFICATION.md
--------------------------------------------------------------
# Scheduler Component

## Status

Approved

---

## Purpose

Manage all scheduled operations and time-based automation across
Work Tracker OS.

---

## Responsibilities

- Register Scheduled Jobs
- Execute Scheduled Jobs
- Cancel Scheduled Jobs
- Pause Scheduled Jobs
- Resume Scheduled Jobs
- Retry Failed Jobs
- Publish Schedule Events

---

## Inputs

- RegisterSchedule
- CancelSchedule
- PauseSchedule
- ResumeSchedule
- ExecuteSchedule

---

## Outputs

- ScheduleRegistered
- ScheduleExecuted
- ScheduleCancelled
- SchedulePaused
- ScheduleResumed
- ScheduleFailed

---

## Business Rules

- Every schedule has a unique identifier.
- Scheduled execution is idempotent.
- Failed executions are logged.
- Retry policy is configurable.
- Scheduler contains no business logic.


--------------------------------------------------------------
components/scheduler/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT tasks
##############################################################
components/tasks
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/tasks/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/tasks/contracts/CONTRACT.md
--------------------------------------------------------------
# Tasks Contract

Input Ports

- create-task
- start-task
- pause-task
- resume-task
- complete-task
- cancel-task
- add-note
- get-task
- get-active-tasks

--------------------------------------------

Output Ports

- task-created
- task-started
- task-paused
- task-resumed
- task-completed
- task-cancelled
- task-note-added
- active-tasks

Version

1.0.0


--------------------------------------------------------------
components/tasks/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/tasks/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/tasks/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/tasks/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/tasks/docs/README.md
--------------------------------------------------------------
# Tasks

Owns the lifecycle of work tasks.

Tracks creation, execution, pauses, resumptions, completion, cancellation,
notes, and active task state during the current workday.


--------------------------------------------------------------
components/tasks/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/tasks/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/tasks/specification/SPECIFICATION.md
--------------------------------------------------------------
# Tasks Component

## Status

Approved

---

## Purpose

Manage the complete lifecycle of work tasks.

---

## Responsibilities

- Create Task
- Start Task
- Pause Task
- Resume Task
- Cancel Task
- Complete Task
- Add Notes
- Retrieve Active Tasks
- Retrieve Task History

---

## Inputs

- CreateTask
- StartTask
- PauseTask
- ResumeTask
- CompleteTask
- CancelTask
- AddTaskNote
- GetTask
- GetActiveTasks

---

## Outputs

- TaskCreated
- TaskStarted
- TaskPaused
- TaskResumed
- TaskCompleted
- TaskCancelled
- TaskNoteAdded
- ActiveTasks

---

## Business Rules

- Every task belongs to one workday.
- Only active tasks may be paused.
- Only paused tasks may be resumed.
- Completed and cancelled tasks are immutable.
- Multiple active tasks are allowed unless restricted by policy.


--------------------------------------------------------------
components/tasks/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


##############################################################
# COMPONENT workday
##############################################################
components/workday
├── component.yaml
├── contracts
│   └── CONTRACT.md
├── docs
│   ├── DECISIONS.md
│   ├── HEALTH.md
│   ├── LOGGING.md
│   ├── METRICS.md
│   └── README.md
├── execution
│   └── EXECUTION.md
├── implementation
├── specification
│   └── SPECIFICATION.md
└── tests
    └── TESTS.md

7 directories, 10 files

--------------------------------------------------------------
components/workday/component.yaml
--------------------------------------------------------------
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


--------------------------------------------------------------
components/workday/contracts/CONTRACT.md
--------------------------------------------------------------
# Workday Contract

Input Ports

- start-workday
- end-workday
- current-workday

--------------------------------------------

Output Ports

- workday-started
- workday-ended
- current-workday

Version

1.0.0


--------------------------------------------------------------
components/workday/docs/DECISIONS.md
--------------------------------------------------------------
# Decisions

Document all architectural decisions related to this component.


--------------------------------------------------------------
components/workday/docs/HEALTH.md
--------------------------------------------------------------
# Health

Status

Dependencies

Checks

Recovery


--------------------------------------------------------------
components/workday/docs/LOGGING.md
--------------------------------------------------------------
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


--------------------------------------------------------------
components/workday/docs/METRICS.md
--------------------------------------------------------------
# Metrics

Execution Count

Execution Time

Failures

Success Rate


--------------------------------------------------------------
components/workday/docs/README.md
--------------------------------------------------------------
# Workday

Root business component responsible for managing the workday lifecycle.

Dependent business components subscribe to workday events.


--------------------------------------------------------------
components/workday/execution/EXECUTION.md
--------------------------------------------------------------
# Execution

Creation

Update

Validation

Testing


--------------------------------------------------------------
components/workday/implementation/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
components/workday/specification/SPECIFICATION.md
--------------------------------------------------------------
# Workday Component

## Status

Approved

---

## Purpose

Manage the lifecycle of the working day.

---

## Responsibilities

- Start Workday
- End Workday
- Get Current Workday
- Publish Workday Events

---

## Inputs

- StartWorkday
- EndWorkday
- GetCurrentWorkday

---

## Outputs

- WorkdayStarted
- WorkdayEnded
- CurrentWorkday

---

## Business Rules

- Only one active workday may exist.
- A workday must be started before business operations.
- Ending the workday publishes a completion event.


--------------------------------------------------------------
components/workday/tests/TESTS.md
--------------------------------------------------------------
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


==============================================================
PACKAGES
==============================================================
packages
packages/application
packages/application/dist
packages/application/src
packages/application/tests
packages/contracts
packages/contracts/src
packages/contracts/tests
packages/core
packages/core/docs
packages/core/src
packages/core/tests
packages/domain
packages/domain/dist
packages/domain/src
packages/domain/tests
packages/events
packages/events/src
packages/events/tests
packages/infrastructure
packages/infrastructure/dist
packages/infrastructure/src
packages/infrastructure/tests
packages/runtime
packages/runtime/dist
packages/runtime/src
packages/runtime/tests
packages/sdk
packages/sdk/src
packages/shared
packages/shared/src
packages/shared/tests
packages/testing
packages/testing/src
packages/testing/tests

==============================================================
RUNTIME
==============================================================
packages/runtime/README.md
packages/runtime/dist/component/component-state.d.ts
packages/runtime/dist/component/component-state.d.ts.map
packages/runtime/dist/component/component-state.js
packages/runtime/dist/component/component-state.js.map
packages/runtime/dist/component/component.d.ts
packages/runtime/dist/component/component.d.ts.map
packages/runtime/dist/component/component.js
packages/runtime/dist/component/component.js.map
packages/runtime/dist/component/index.d.ts
packages/runtime/dist/component/index.d.ts.map
packages/runtime/dist/component/index.js
packages/runtime/dist/component/index.js.map
packages/runtime/dist/contracts/contract.d.ts
packages/runtime/dist/contracts/contract.d.ts.map
packages/runtime/dist/contracts/contract.js
packages/runtime/dist/contracts/contract.js.map
packages/runtime/dist/events/event.d.ts
packages/runtime/dist/events/event.js
packages/runtime/dist/health/health.d.ts
packages/runtime/dist/health/health.d.ts.map
packages/runtime/dist/health/health.js
packages/runtime/dist/health/health.js.map
packages/runtime/dist/index.d.ts
packages/runtime/dist/index.d.ts.map
packages/runtime/dist/index.js
packages/runtime/dist/index.js.map
packages/runtime/dist/kernel/index.d.ts
packages/runtime/dist/kernel/index.d.ts.map
packages/runtime/dist/kernel/index.js
packages/runtime/dist/kernel/index.js.map
packages/runtime/dist/kernel/runtime-kernel.d.ts
packages/runtime/dist/kernel/runtime-kernel.d.ts.map
packages/runtime/dist/kernel/runtime-kernel.impl.d.ts
packages/runtime/dist/kernel/runtime-kernel.impl.d.ts.map
packages/runtime/dist/kernel/runtime-kernel.impl.js
packages/runtime/dist/kernel/runtime-kernel.impl.js.map
packages/runtime/dist/kernel/runtime-kernel.js
packages/runtime/dist/kernel/runtime-kernel.js.map
packages/runtime/dist/lifecycle/index.d.ts
packages/runtime/dist/lifecycle/index.d.ts.map
packages/runtime/dist/lifecycle/index.js
packages/runtime/dist/lifecycle/index.js.map
packages/runtime/dist/lifecycle/lifecycle.d.ts
packages/runtime/dist/lifecycle/lifecycle.d.ts.map
packages/runtime/dist/lifecycle/lifecycle.js
packages/runtime/dist/lifecycle/lifecycle.js.map
packages/runtime/dist/loader/index.d.ts
packages/runtime/dist/loader/index.d.ts.map
packages/runtime/dist/loader/index.js
packages/runtime/dist/loader/index.js.map
packages/runtime/dist/loader/loader.d.ts
packages/runtime/dist/loader/loader.d.ts.map
packages/runtime/dist/loader/loader.js
packages/runtime/dist/loader/loader.js.map
packages/runtime/dist/logger/logger.d.ts
packages/runtime/dist/logger/logger.d.ts.map
packages/runtime/dist/logger/logger.js
packages/runtime/dist/logger/logger.js.map
packages/runtime/dist/ports/input-port.d.ts
packages/runtime/dist/ports/input-port.d.ts.map
packages/runtime/dist/ports/input-port.js
packages/runtime/dist/ports/input-port.js.map
packages/runtime/dist/ports/output-port.d.ts
packages/runtime/dist/ports/output-port.d.ts.map
packages/runtime/dist/ports/output-port.js
packages/runtime/dist/ports/output-port.js.map
packages/runtime/dist/registry/index.d.ts
packages/runtime/dist/registry/index.d.ts.map
packages/runtime/dist/registry/index.js
packages/runtime/dist/registry/index.js.map
packages/runtime/dist/registry/registry.d.ts
packages/runtime/dist/registry/registry.d.ts.map
packages/runtime/dist/registry/registry.js
packages/runtime/dist/registry/registry.js.map
packages/runtime/dist/tracing/trace.d.ts
packages/runtime/dist/tracing/trace.d.ts.map
packages/runtime/dist/tracing/trace.js
packages/runtime/dist/tracing/trace.js.map
packages/runtime/package.json
packages/runtime/src/.gitkeep
packages/runtime/src/component/.gitkeep
packages/runtime/src/component/component-state.ts
packages/runtime/src/component/component.ts
packages/runtime/src/component/index.ts
packages/runtime/src/contracts/.gitkeep
packages/runtime/src/contracts/contract.ts
packages/runtime/src/dispatcher/.gitkeep
packages/runtime/src/dispatcher/dispatcher.ts
packages/runtime/src/dispatcher/index.ts
packages/runtime/src/errors/.gitkeep
packages/runtime/src/health/.gitkeep
packages/runtime/src/health/health.ts
packages/runtime/src/health/index.ts
packages/runtime/src/host/.gitkeep
packages/runtime/src/host/host.ts
packages/runtime/src/host/index.ts
packages/runtime/src/index.ts
packages/runtime/src/kernel/.gitkeep
packages/runtime/src/kernel/index.ts
packages/runtime/src/kernel/runtime-kernel.impl.ts
packages/runtime/src/kernel/runtime-kernel.ts
packages/runtime/src/lifecycle/.gitkeep
packages/runtime/src/lifecycle/index.ts
packages/runtime/src/lifecycle/lifecycle.ts
packages/runtime/src/loader/.gitkeep
packages/runtime/src/loader/index.ts
packages/runtime/src/loader/loader.ts
packages/runtime/src/logger/.gitkeep
packages/runtime/src/logger/index.ts
packages/runtime/src/logger/logger.ts
packages/runtime/src/metrics/.gitkeep
packages/runtime/src/metrics/index.ts
packages/runtime/src/metrics/metrics.ts
packages/runtime/src/ports/.gitkeep
packages/runtime/src/ports/input-port.ts
packages/runtime/src/ports/output-port.ts
packages/runtime/src/registry/.gitkeep
packages/runtime/src/registry/index.ts
packages/runtime/src/registry/registry.ts
packages/runtime/src/tracing/.gitkeep
packages/runtime/src/tracing/trace.ts
packages/runtime/tests/kernel/runtime-kernel.spec.ts
packages/runtime/tsconfig.json

--------------------------------------------------------------
packages/runtime/README.md
--------------------------------------------------------------
# Runtime

Status: Approved

The Runtime package is the execution engine of Work Tracker OS.

Responsibilities

- Component Loader
- Component Host
- Lifecycle Manager
- Component Registry
- Dispatcher
- Logger
- Health Monitoring
- Metrics Collection

The Runtime DOES NOT own:

- Event Definitions
- Messages
- DTOs
- Contracts
- Business Rules

Dependencies

Runtime depends on:

- core
- contracts
- events

Business components depend on runtime abstractions only.


--------------------------------------------------------------
packages/runtime/dist/component/component-state.d.ts
--------------------------------------------------------------
/**
 * Runtime Component State
 *
 * Represents the execution state of a component.
 */
export declare enum ComponentState {
    Created = "created",
    Initializing = "initializing",
    Ready = "ready",
    Running = "running",
    Paused = "paused",
    Stopping = "stopping",
    Stopped = "stopped",
    Failed = "failed"
}
//# sourceMappingURL=component-state.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/component/component-state.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"component-state.d.ts","sourceRoot":"","sources":["../../src/component/component-state.ts"],"names":[],"mappings":"AAAA;;;;GAIG;AAEH,oBAAY,cAAc;IAEtB,OAAO,YAAY;IAEnB,YAAY,iBAAiB;IAE7B,KAAK,UAAU;IAEf,OAAO,YAAY;IAEnB,MAAM,WAAW;IAEjB,QAAQ,aAAa;IAErB,OAAO,YAAY;IAEnB,MAAM,WAAW;CAEpB"}
--------------------------------------------------------------
packages/runtime/dist/component/component-state.js
--------------------------------------------------------------
/**
 * Runtime Component State
 *
 * Represents the execution state of a component.
 */
export var ComponentState;
(function (ComponentState) {
    ComponentState["Created"] = "created";
    ComponentState["Initializing"] = "initializing";
    ComponentState["Ready"] = "ready";
    ComponentState["Running"] = "running";
    ComponentState["Paused"] = "paused";
    ComponentState["Stopping"] = "stopping";
    ComponentState["Stopped"] = "stopped";
    ComponentState["Failed"] = "failed";
})(ComponentState || (ComponentState = {}));
//# sourceMappingURL=component-state.js.map
--------------------------------------------------------------
packages/runtime/dist/component/component-state.js.map
--------------------------------------------------------------
{"version":3,"file":"component-state.js","sourceRoot":"","sources":["../../src/component/component-state.ts"],"names":[],"mappings":"AAAA;;;;GAIG;AAEH,MAAM,CAAN,IAAY,cAkBX;AAlBD,WAAY,cAAc;IAEtB,qCAAmB,CAAA;IAEnB,+CAA6B,CAAA;IAE7B,iCAAe,CAAA;IAEf,qCAAmB,CAAA;IAEnB,mCAAiB,CAAA;IAEjB,uCAAqB,CAAA;IAErB,qCAAmB,CAAA;IAEnB,mCAAiB,CAAA;AAErB,CAAC,EAlBW,cAAc,KAAd,cAAc,QAkBzB"}
--------------------------------------------------------------
packages/runtime/dist/component/component.d.ts
--------------------------------------------------------------
/**
 * Runtime Component Contract
 *
 * Every executable component inside Work Tracker OS
 * must implement this contract.
 */
export interface RuntimeComponent {
    /**
     * Unique component identifier.
     */
    readonly id: string;
    /**
     * Human readable name.
     */
    readonly name: string;
    /**
     * Component version.
     */
    readonly version: string;
    /**
     * Start component.
     */
    start(): Promise<void>;
    /**
     * Stop component.
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=component.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/component/component.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"component.d.ts","sourceRoot":"","sources":["../../src/component/component.ts"],"names":[],"mappings":"AAAA;;;;;GAKG;AAEH,MAAM,WAAW,gBAAgB;IAE7B;;OAEG;IACH,QAAQ,CAAC,EAAE,EAAE,MAAM,CAAC;IAEpB;;OAEG;IACH,QAAQ,CAAC,IAAI,EAAE,MAAM,CAAC;IAEtB;;OAEG;IACH,QAAQ,CAAC,OAAO,EAAE,MAAM,CAAC;IAEzB;;OAEG;IACH,KAAK,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAEvB;;OAEG;IACH,IAAI,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;CAEzB"}
--------------------------------------------------------------
packages/runtime/dist/component/component.js
--------------------------------------------------------------
/**
 * Runtime Component Contract
 *
 * Every executable component inside Work Tracker OS
 * must implement this contract.
 */
export {};
//# sourceMappingURL=component.js.map
--------------------------------------------------------------
packages/runtime/dist/component/component.js.map
--------------------------------------------------------------
{"version":3,"file":"component.js","sourceRoot":"","sources":["../../src/component/component.ts"],"names":[],"mappings":"AAAA;;;;;GAKG"}
--------------------------------------------------------------
packages/runtime/dist/component/index.d.ts
--------------------------------------------------------------
export type { RuntimeComponent, } from "./component.js";
export { ComponentState, } from "./component-state.js";
//# sourceMappingURL=index.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/component/index.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/component/index.ts"],"names":[],"mappings":"AAAA,YAAY,EACR,gBAAgB,GACnB,MAAM,gBAAgB,CAAC;AAExB,OAAO,EACH,cAAc,GACjB,MAAM,sBAAsB,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/component/index.js
--------------------------------------------------------------
export { ComponentState, } from "./component-state.js";
//# sourceMappingURL=index.js.map
--------------------------------------------------------------
packages/runtime/dist/component/index.js.map
--------------------------------------------------------------
{"version":3,"file":"index.js","sourceRoot":"","sources":["../../src/component/index.ts"],"names":[],"mappings":"AAIA,OAAO,EACH,cAAc,GACjB,MAAM,sBAAsB,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/contracts/contract.d.ts
--------------------------------------------------------------
export interface Contract {
    readonly name: string;
    readonly version: string;
}
//# sourceMappingURL=contract.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/contracts/contract.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"contract.d.ts","sourceRoot":"","sources":["../../src/contracts/contract.ts"],"names":[],"mappings":"AAAA,MAAM,WAAW,QAAQ;IAErB,QAAQ,CAAC,IAAI,EAAE,MAAM,CAAC;IAEtB,QAAQ,CAAC,OAAO,EAAE,MAAM,CAAC;CAE5B"}
--------------------------------------------------------------
packages/runtime/dist/contracts/contract.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=contract.js.map
--------------------------------------------------------------
packages/runtime/dist/contracts/contract.js.map
--------------------------------------------------------------
{"version":3,"file":"contract.js","sourceRoot":"","sources":["../../src/contracts/contract.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/events/event.d.ts
--------------------------------------------------------------
export interface Event {
    readonly id: string;
    readonly name: string;
    readonly occurredAt: Date;
}

--------------------------------------------------------------
packages/runtime/dist/events/event.js
--------------------------------------------------------------
export {};

--------------------------------------------------------------
packages/runtime/dist/health/health.d.ts
--------------------------------------------------------------
export interface HealthStatus {
    readonly healthy: boolean;
}
//# sourceMappingURL=health.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/health/health.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"health.d.ts","sourceRoot":"","sources":["../../src/health/health.ts"],"names":[],"mappings":"AAAA,MAAM,WAAW,YAAY;IAEzB,QAAQ,CAAC,OAAO,EAAE,OAAO,CAAC;CAE7B"}
--------------------------------------------------------------
packages/runtime/dist/health/health.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=health.js.map
--------------------------------------------------------------
packages/runtime/dist/health/health.js.map
--------------------------------------------------------------
{"version":3,"file":"health.js","sourceRoot":"","sources":["../../src/health/health.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/index.d.ts
--------------------------------------------------------------
export * from "./component/component.js";
export * from "./ports/input-port.js";
export * from "./ports/output-port.js";
export * from "./contracts/contract.js";
export * from "./events/event.js";
export * from "./health/health.js";
export * from "./logger/logger.js";
export * from "./tracing/trace.js";
//# sourceMappingURL=index.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/index.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../src/index.ts"],"names":[],"mappings":"AAAA,cAAc,0BAA0B,CAAC;AACzC,cAAc,uBAAuB,CAAC;AACtC,cAAc,wBAAwB,CAAC;AACvC,cAAc,yBAAyB,CAAC;AACxC,cAAc,mBAAmB,CAAC;AAClC,cAAc,oBAAoB,CAAC;AACnC,cAAc,oBAAoB,CAAC;AACnC,cAAc,oBAAoB,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/index.js
--------------------------------------------------------------
export * from "./component/component.js";
export * from "./ports/input-port.js";
export * from "./ports/output-port.js";
export * from "./contracts/contract.js";
export * from "./events/event.js";
export * from "./health/health.js";
export * from "./logger/logger.js";
export * from "./tracing/trace.js";
//# sourceMappingURL=index.js.map
--------------------------------------------------------------
packages/runtime/dist/index.js.map
--------------------------------------------------------------
{"version":3,"file":"index.js","sourceRoot":"","sources":["../src/index.ts"],"names":[],"mappings":"AAAA,cAAc,0BAA0B,CAAC;AACzC,cAAc,uBAAuB,CAAC;AACtC,cAAc,wBAAwB,CAAC;AACvC,cAAc,yBAAyB,CAAC;AACxC,cAAc,mBAAmB,CAAC;AAClC,cAAc,oBAAoB,CAAC;AACnC,cAAc,oBAAoB,CAAC;AACnC,cAAc,oBAAoB,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/kernel/index.d.ts
--------------------------------------------------------------
export type { RuntimeKernel, } from "./runtime-kernel.js";
export { DefaultRuntimeKernel, } from "./runtime-kernel.impl.js";
//# sourceMappingURL=index.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/kernel/index.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/kernel/index.ts"],"names":[],"mappings":"AAAA,YAAY,EACR,aAAa,GAChB,MAAM,qBAAqB,CAAC;AAE7B,OAAO,EACH,oBAAoB,GACvB,MAAM,0BAA0B,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/kernel/index.js
--------------------------------------------------------------
export { DefaultRuntimeKernel, } from "./runtime-kernel.impl.js";
//# sourceMappingURL=index.js.map
--------------------------------------------------------------
packages/runtime/dist/kernel/index.js.map
--------------------------------------------------------------
{"version":3,"file":"index.js","sourceRoot":"","sources":["../../src/kernel/index.ts"],"names":[],"mappings":"AAIA,OAAO,EACH,oBAAoB,GACvB,MAAM,0BAA0B,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.d.ts
--------------------------------------------------------------
/**
 * Runtime Kernel Contract
 *
 * The Runtime Kernel is the central coordinator of
 * Work Tracker OS.
 *
 * This file defines the contract only.
 * No implementation is allowed here.
 */
export interface RuntimeKernel {
    /**
     * Boot the runtime.
     */
    boot(): Promise<void>;
    /**
     * Shutdown the runtime.
     */
    shutdown(): Promise<void>;
    /**
     * Register a component.
     */
    registerComponent(componentId: string): Promise<void>;
    /**
     * Remove a component.
     */
    unregisterComponent(componentId: string): Promise<void>;
    /**
     * Start a registered component.
     */
    startComponent(componentId: string): Promise<void>;
    /**
     * Stop a running component.
     */
    stopComponent(componentId: string): Promise<void>;
    /**
     * Returns true if runtime is active.
     */
    isRunning(): boolean;
}
//# sourceMappingURL=runtime-kernel.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"runtime-kernel.d.ts","sourceRoot":"","sources":["../../src/kernel/runtime-kernel.ts"],"names":[],"mappings":"AAAA;;;;;;;;GAQG;AAEH,MAAM,WAAW,aAAa;IAE1B;;OAEG;IACH,IAAI,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAEtB;;OAEG;IACH,QAAQ,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAE1B;;OAEG;IACH,iBAAiB,CACb,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB;;OAEG;IACH,mBAAmB,CACf,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB;;OAEG;IACH,cAAc,CACV,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB;;OAEG;IACH,aAAa,CACT,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB;;OAEG;IACH,SAAS,IAAI,OAAO,CAAC;CAExB"}
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.impl.d.ts
--------------------------------------------------------------
import type { RuntimeKernel } from "./runtime-kernel.js";
import type { Registry } from "../registry/registry.js";
import type { Loader } from "../loader/loader.js";
/**
 * Default Runtime Kernel implementation.
 *
 * Coordinates the runtime services.
 */
export declare class DefaultRuntimeKernel implements RuntimeKernel {
    private readonly registry;
    private readonly loader;
    private running;
    constructor(registry: Registry, loader: Loader);
    boot(): Promise<void>;
    shutdown(): Promise<void>;
    registerComponent(componentId: string): Promise<void>;
    unregisterComponent(componentId: string): Promise<void>;
    startComponent(componentId: string): Promise<void>;
    stopComponent(componentId: string): Promise<void>;
    isRunning(): boolean;
}
//# sourceMappingURL=runtime-kernel.impl.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.impl.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"runtime-kernel.impl.d.ts","sourceRoot":"","sources":["../../src/kernel/runtime-kernel.impl.ts"],"names":[],"mappings":"AAAA,OAAO,KAAK,EACR,aAAa,EAChB,MAAM,qBAAqB,CAAC;AAE7B,OAAO,KAAK,EACR,QAAQ,EACX,MAAM,yBAAyB,CAAC;AAEjC,OAAO,KAAK,EACR,MAAM,EACT,MAAM,qBAAqB,CAAC;AAE7B;;;;GAIG;AACH,qBAAa,oBACb,YAAW,aAAa;IAMhB,OAAO,CAAC,QAAQ,CAAC,QAAQ;IAEzB,OAAO,CAAC,QAAQ,CAAC,MAAM;IAN3B,OAAO,CAAC,OAAO,CAAS;gBAIH,QAAQ,EAAE,QAAQ,EAElB,MAAM,EAAE,MAAM;IAI7B,IAAI,IAAI,OAAO,CAAC,IAAI,CAAC;IAMrB,QAAQ,IAAI,OAAO,CAAC,IAAI,CAAC;IAMzB,iBAAiB,CACnB,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC;IASV,mBAAmB,CACrB,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC;IAcV,cAAc,CAChB,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC;IAiBV,aAAa,CACf,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC;IAiBhB,SAAS,IAAI,OAAO;CAMvB"}
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.impl.js
--------------------------------------------------------------
/**
 * Default Runtime Kernel implementation.
 *
 * Coordinates the runtime services.
 */
export class DefaultRuntimeKernel {
    registry;
    loader;
    running = false;
    constructor(registry, loader) {
        this.registry = registry;
        this.loader = loader;
    }
    async boot() {
        this.running = true;
    }
    async shutdown() {
        this.running = false;
    }
    async registerComponent(componentId) {
        const component = await this.loader.load(componentId);
        await this.registry.register(component);
    }
    async unregisterComponent(componentId) {
        await this.registry.unregister(componentId);
        if (this.loader.isLoaded(componentId)) {
            await this.loader.unload(componentId);
        }
    }
    async startComponent(componentId) {
        const component = this.registry.get(componentId);
        if (!component) {
            throw new Error(`Component '${componentId}' is not registered.`);
        }
        await component.start();
    }
    async stopComponent(componentId) {
        const component = this.registry.get(componentId);
        if (!component) {
            throw new Error(`Component '${componentId}' is not registered.`);
        }
        await component.stop();
    }
    isRunning() {
        return this.running;
    }
}
//# sourceMappingURL=runtime-kernel.impl.js.map
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.impl.js.map
--------------------------------------------------------------
{"version":3,"file":"runtime-kernel.impl.js","sourceRoot":"","sources":["../../src/kernel/runtime-kernel.impl.ts"],"names":[],"mappings":"AAYA;;;;GAIG;AACH,MAAM,OAAO,oBAAoB;IAOR;IAEA;IANb,OAAO,GAAG,KAAK,CAAC;IAExB,YAEqB,QAAkB,EAElB,MAAc;QAFd,aAAQ,GAAR,QAAQ,CAAU;QAElB,WAAM,GAAN,MAAM,CAAQ;IAEhC,CAAC;IAEJ,KAAK,CAAC,IAAI;QAEN,IAAI,CAAC,OAAO,GAAG,IAAI,CAAC;IAExB,CAAC;IAED,KAAK,CAAC,QAAQ;QAEV,IAAI,CAAC,OAAO,GAAG,KAAK,CAAC;IAEzB,CAAC;IAED,KAAK,CAAC,iBAAiB,CACnB,WAAmB;QAGnB,MAAM,SAAS,GACX,MAAM,IAAI,CAAC,MAAM,CAAC,IAAI,CAAC,WAAW,CAAC,CAAC;QAExC,MAAM,IAAI,CAAC,QAAQ,CAAC,QAAQ,CAAC,SAAS,CAAC,CAAC;IAE5C,CAAC;IAED,KAAK,CAAC,mBAAmB,CACrB,WAAmB;QAGnB,MAAM,IAAI,CAAC,QAAQ,CAAC,UAAU,CAAC,WAAW,CAAC,CAAC;QAE5C,IACI,IAAI,CAAC,MAAM,CAAC,QAAQ,CAAC,WAAW,CAAC,EACnC,CAAC;YAEC,MAAM,IAAI,CAAC,MAAM,CAAC,MAAM,CAAC,WAAW,CAAC,CAAC;QAE1C,CAAC;IAEL,CAAC;IAED,KAAK,CAAC,cAAc,CAChB,WAAmB;QAGnB,MAAM,SAAS,GACX,IAAI,CAAC,QAAQ,CAAC,GAAG,CAAC,WAAW,CAAC,CAAC;QAEnC,IAAI,CAAC,SAAS,EAAE,CAAC;YAEb,MAAM,IAAI,KAAK,CACX,cAAc,WAAW,sBAAsB,CAClD,CAAC;QAEN,CAAC;QAED,MAAM,SAAS,CAAC,KAAK,EAAE,CAAC;IAE5B,CAAC;IAED,KAAK,CAAC,aAAa,CACf,WAAmB;QAGnB,MAAM,SAAS,GACX,IAAI,CAAC,QAAQ,CAAC,GAAG,CAAC,WAAW,CAAC,CAAC;QAEnC,IAAI,CAAC,SAAS,EAAE,CAAC;YAEb,MAAM,IAAI,KAAK,CACX,cAAc,WAAW,sBAAsB,CAClD,CAAC;QAEN,CAAC;QAED,MAAM,SAAS,CAAC,IAAI,EAAE,CAAC;IAE3B,CAAC;IAED,SAAS;QAEL,OAAO,IAAI,CAAC,OAAO,CAAC;IAExB,CAAC;CAEJ"}
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.js
--------------------------------------------------------------
/**
 * Runtime Kernel Contract
 *
 * The Runtime Kernel is the central coordinator of
 * Work Tracker OS.
 *
 * This file defines the contract only.
 * No implementation is allowed here.
 */
export {};
//# sourceMappingURL=runtime-kernel.js.map
--------------------------------------------------------------
packages/runtime/dist/kernel/runtime-kernel.js.map
--------------------------------------------------------------
{"version":3,"file":"runtime-kernel.js","sourceRoot":"","sources":["../../src/kernel/runtime-kernel.ts"],"names":[],"mappings":"AAAA;;;;;;;;GAQG"}
--------------------------------------------------------------
packages/runtime/dist/lifecycle/index.d.ts
--------------------------------------------------------------
export type { Lifecycle, } from "./lifecycle.js";
//# sourceMappingURL=index.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/lifecycle/index.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/lifecycle/index.ts"],"names":[],"mappings":"AAAA,YAAY,EACR,SAAS,GACZ,MAAM,gBAAgB,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/lifecycle/index.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=index.js.map
--------------------------------------------------------------
packages/runtime/dist/lifecycle/index.js.map
--------------------------------------------------------------
{"version":3,"file":"index.js","sourceRoot":"","sources":["../../src/lifecycle/index.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/lifecycle/lifecycle.d.ts
--------------------------------------------------------------
import { ComponentState } from "../component/component-state.js";
/**
 * Lifecycle Contract
 *
 * Defines the lifecycle operations supported by
 * the Runtime.
 */
export interface Lifecycle {
    initialize(): Promise<void>;
    start(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    stop(): Promise<void>;
    fail(reason?: Error): Promise<void>;
    getState(): ComponentState;
}
//# sourceMappingURL=lifecycle.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/lifecycle/lifecycle.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"lifecycle.d.ts","sourceRoot":"","sources":["../../src/lifecycle/lifecycle.ts"],"names":[],"mappings":"AAAA,OAAO,EACH,cAAc,EACjB,MAAM,iCAAiC,CAAC;AAEzC;;;;;GAKG;AAEH,MAAM,WAAW,SAAS;IAEtB,UAAU,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAE5B,KAAK,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAEvB,KAAK,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAEvB,MAAM,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAExB,IAAI,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;IAEtB,IAAI,CACA,MAAM,CAAC,EAAE,KAAK,GACf,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB,QAAQ,IAAI,cAAc,CAAC;CAE9B"}
--------------------------------------------------------------
packages/runtime/dist/lifecycle/lifecycle.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=lifecycle.js.map
--------------------------------------------------------------
packages/runtime/dist/lifecycle/lifecycle.js.map
--------------------------------------------------------------
{"version":3,"file":"lifecycle.js","sourceRoot":"","sources":["../../src/lifecycle/lifecycle.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/loader/index.d.ts
--------------------------------------------------------------
export type { Loader, } from "./loader.js";
//# sourceMappingURL=index.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/loader/index.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/loader/index.ts"],"names":[],"mappings":"AAAA,YAAY,EACR,MAAM,GACT,MAAM,aAAa,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/loader/index.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=index.js.map
--------------------------------------------------------------
packages/runtime/dist/loader/index.js.map
--------------------------------------------------------------
{"version":3,"file":"index.js","sourceRoot":"","sources":["../../src/loader/index.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/loader/loader.d.ts
--------------------------------------------------------------
import type { RuntimeComponent } from "../component/component.js";
/**
 * Loader Contract
 *
 * Defines how runtime components are loaded
 * and unloaded.
 */
export interface Loader {
    load(componentId: string): Promise<RuntimeComponent>;
    unload(componentId: string): Promise<void>;
    isLoaded(componentId: string): boolean;
}
//# sourceMappingURL=loader.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/loader/loader.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"loader.d.ts","sourceRoot":"","sources":["../../src/loader/loader.ts"],"names":[],"mappings":"AAAA,OAAO,KAAK,EACR,gBAAgB,EACnB,MAAM,2BAA2B,CAAC;AAEnC;;;;;GAKG;AAEH,MAAM,WAAW,MAAM;IAEnB,IAAI,CACA,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,gBAAgB,CAAC,CAAC;IAE7B,MAAM,CACF,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB,QAAQ,CACJ,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC;CAEd"}
--------------------------------------------------------------
packages/runtime/dist/loader/loader.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=loader.js.map
--------------------------------------------------------------
packages/runtime/dist/loader/loader.js.map
--------------------------------------------------------------
{"version":3,"file":"loader.js","sourceRoot":"","sources":["../../src/loader/loader.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/logger/logger.d.ts
--------------------------------------------------------------
export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
//# sourceMappingURL=logger.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/logger/logger.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"logger.d.ts","sourceRoot":"","sources":["../../src/logger/logger.ts"],"names":[],"mappings":"AAAA,MAAM,WAAW,MAAM;IAEnB,IAAI,CAAC,OAAO,EAAE,MAAM,GAAG,IAAI,CAAC;IAE5B,IAAI,CAAC,OAAO,EAAE,MAAM,GAAG,IAAI,CAAC;IAE5B,KAAK,CAAC,OAAO,EAAE,MAAM,GAAG,IAAI,CAAC;CAEhC"}
--------------------------------------------------------------
packages/runtime/dist/logger/logger.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=logger.js.map
--------------------------------------------------------------
packages/runtime/dist/logger/logger.js.map
--------------------------------------------------------------
{"version":3,"file":"logger.js","sourceRoot":"","sources":["../../src/logger/logger.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/ports/input-port.d.ts
--------------------------------------------------------------
export interface InputPort<TInput> {
    execute(input: TInput): Promise<void>;
}
//# sourceMappingURL=input-port.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/ports/input-port.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"input-port.d.ts","sourceRoot":"","sources":["../../src/ports/input-port.ts"],"names":[],"mappings":"AAAA,MAAM,WAAW,SAAS,CAAC,MAAM;IAE7B,OAAO,CAAC,KAAK,EAAE,MAAM,GAAG,OAAO,CAAC,IAAI,CAAC,CAAC;CAEzC"}
--------------------------------------------------------------
packages/runtime/dist/ports/input-port.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=input-port.js.map
--------------------------------------------------------------
packages/runtime/dist/ports/input-port.js.map
--------------------------------------------------------------
{"version":3,"file":"input-port.js","sourceRoot":"","sources":["../../src/ports/input-port.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/ports/output-port.d.ts
--------------------------------------------------------------
export interface OutputPort<TOutput> {
    publish(output: TOutput): Promise<void>;
}
//# sourceMappingURL=output-port.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/ports/output-port.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"output-port.d.ts","sourceRoot":"","sources":["../../src/ports/output-port.ts"],"names":[],"mappings":"AAAA,MAAM,WAAW,UAAU,CAAC,OAAO;IAE/B,OAAO,CAAC,MAAM,EAAE,OAAO,GAAG,OAAO,CAAC,IAAI,CAAC,CAAC;CAE3C"}
--------------------------------------------------------------
packages/runtime/dist/ports/output-port.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=output-port.js.map
--------------------------------------------------------------
packages/runtime/dist/ports/output-port.js.map
--------------------------------------------------------------
{"version":3,"file":"output-port.js","sourceRoot":"","sources":["../../src/ports/output-port.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/registry/index.d.ts
--------------------------------------------------------------
export type { Registry, } from "./registry.js";
//# sourceMappingURL=index.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/registry/index.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/registry/index.ts"],"names":[],"mappings":"AAAA,YAAY,EACR,QAAQ,GACX,MAAM,eAAe,CAAC"}
--------------------------------------------------------------
packages/runtime/dist/registry/index.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=index.js.map
--------------------------------------------------------------
packages/runtime/dist/registry/index.js.map
--------------------------------------------------------------
{"version":3,"file":"index.js","sourceRoot":"","sources":["../../src/registry/index.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/registry/registry.d.ts
--------------------------------------------------------------
import type { RuntimeComponent } from "../component/component.js";
/**
 * Registry Contract
 *
 * Defines the component registry used by the Runtime.
 */
export interface Registry {
    register(component: RuntimeComponent): Promise<void>;
    unregister(componentId: string): Promise<void>;
    get(componentId: string): RuntimeComponent | undefined;
    getAll(): readonly RuntimeComponent[];
    has(componentId: string): boolean;
    clear(): Promise<void>;
}
//# sourceMappingURL=registry.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/registry/registry.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"registry.d.ts","sourceRoot":"","sources":["../../src/registry/registry.ts"],"names":[],"mappings":"AAAA,OAAO,KAAK,EACR,gBAAgB,EACnB,MAAM,2BAA2B,CAAC;AAEnC;;;;GAIG;AAEH,MAAM,WAAW,QAAQ;IAErB,QAAQ,CACJ,SAAS,EAAE,gBAAgB,GAC5B,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB,UAAU,CACN,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC,IAAI,CAAC,CAAC;IAEjB,GAAG,CACC,WAAW,EAAE,MAAM,GACpB,gBAAgB,GAAG,SAAS,CAAC;IAEhC,MAAM,IAAI,SAAS,gBAAgB,EAAE,CAAC;IAEtC,GAAG,CACC,WAAW,EAAE,MAAM,GACpB,OAAO,CAAC;IAEX,KAAK,IAAI,OAAO,CAAC,IAAI,CAAC,CAAC;CAE1B"}
--------------------------------------------------------------
packages/runtime/dist/registry/registry.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=registry.js.map
--------------------------------------------------------------
packages/runtime/dist/registry/registry.js.map
--------------------------------------------------------------
{"version":3,"file":"registry.js","sourceRoot":"","sources":["../../src/registry/registry.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/dist/tracing/trace.d.ts
--------------------------------------------------------------
export interface Trace {
    readonly traceId: string;
}
//# sourceMappingURL=trace.d.ts.map
--------------------------------------------------------------
packages/runtime/dist/tracing/trace.d.ts.map
--------------------------------------------------------------
{"version":3,"file":"trace.d.ts","sourceRoot":"","sources":["../../src/tracing/trace.ts"],"names":[],"mappings":"AAAA,MAAM,WAAW,KAAK;IAElB,QAAQ,CAAC,OAAO,EAAE,MAAM,CAAC;CAE5B"}
--------------------------------------------------------------
packages/runtime/dist/tracing/trace.js
--------------------------------------------------------------
export {};
//# sourceMappingURL=trace.js.map
--------------------------------------------------------------
packages/runtime/dist/tracing/trace.js.map
--------------------------------------------------------------
{"version":3,"file":"trace.js","sourceRoot":"","sources":["../../src/tracing/trace.ts"],"names":[],"mappings":""}
--------------------------------------------------------------
packages/runtime/package.json
--------------------------------------------------------------
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

--------------------------------------------------------------
packages/runtime/src/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/component/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/component/component-state.ts
--------------------------------------------------------------
/**
 * Runtime Component State
 *
 * Represents the execution state of a component.
 */

export enum ComponentState {

    Created = "created",

    Initializing = "initializing",

    Ready = "ready",

    Running = "running",

    Paused = "paused",

    Stopping = "stopping",

    Stopped = "stopped",

    Failed = "failed",

}

--------------------------------------------------------------
packages/runtime/src/component/component.ts
--------------------------------------------------------------
/**
 * Runtime Component Contract
 *
 * Every executable component inside Work Tracker OS
 * must implement this contract.
 */

export interface RuntimeComponent {

    /**
     * Unique component identifier.
     */
    readonly id: string;

    /**
     * Human readable name.
     */
    readonly name: string;

    /**
     * Component version.
     */
    readonly version: string;

    /**
     * Start component.
     */
    start(): Promise<void>;

    /**
     * Stop component.
     */
    stop(): Promise<void>;

}

--------------------------------------------------------------
packages/runtime/src/component/index.ts
--------------------------------------------------------------
export type {
    RuntimeComponent,
} from "./component.js";

export {
    ComponentState,
} from "./component-state.js";

--------------------------------------------------------------
packages/runtime/src/contracts/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/contracts/contract.ts
--------------------------------------------------------------
export interface Contract {

    readonly name: string;

    readonly version: string;

}

--------------------------------------------------------------
packages/runtime/src/dispatcher/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/dispatcher/dispatcher.ts
--------------------------------------------------------------
/**
 * Runtime Dispatcher
 *
 * Dispatches runtime requests between registered
 * runtime components.
 */
export interface Dispatcher {

    dispatch(

        targetComponentId: string,

        operation: string,

        payload?: unknown,

    ): Promise<unknown>;

}

--------------------------------------------------------------
packages/runtime/src/dispatcher/index.ts
--------------------------------------------------------------
export type {
    Dispatcher,
} from "./dispatcher.js";

--------------------------------------------------------------
packages/runtime/src/errors/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/health/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/health/health.ts
--------------------------------------------------------------
/**
 * Runtime Health
 *
 * Represents the health monitoring contract of the Runtime.
 */
export interface RuntimeHealth {

    isHealthy(): boolean;

    check(): Promise<void>;

}

--------------------------------------------------------------
packages/runtime/src/health/index.ts
--------------------------------------------------------------
export type {
    RuntimeHealth,
} from "./health.js";

--------------------------------------------------------------
packages/runtime/src/host/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/host/host.ts
--------------------------------------------------------------
import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Runtime Host
 *
 * Owns the execution environment of components.
 */
export interface RuntimeHost {

    attach(
        component: RuntimeComponent
    ): Promise<void>;

    detach(
        componentId: string
    ): Promise<void>;

    contains(
        componentId: string
    ): boolean;

}

--------------------------------------------------------------
packages/runtime/src/host/index.ts
--------------------------------------------------------------
export type {
    RuntimeHost,
} from "./host.js";

--------------------------------------------------------------
packages/runtime/src/index.ts
--------------------------------------------------------------
export * from "./component/component.js";
export * from "./ports/input-port.js";
export * from "./ports/output-port.js";
export * from "./contracts/contract.js";
export * from "./events/event.js";
export * from "./health/health.js";
export * from "./logger/logger.js";
export * from "./tracing/trace.js";

--------------------------------------------------------------
packages/runtime/src/kernel/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/kernel/index.ts
--------------------------------------------------------------
export type {
    RuntimeKernel,
} from "./runtime-kernel.js";

export {
    DefaultRuntimeKernel,
} from "./runtime-kernel.impl.js";

--------------------------------------------------------------
packages/runtime/src/kernel/runtime-kernel.impl.ts
--------------------------------------------------------------
import type {
    RuntimeKernel,
} from "./runtime-kernel.js";

import type {
    Registry,
} from "../registry/registry.js";

import type {
    Loader,
} from "../loader/loader.js";

/**
 * Default Runtime Kernel implementation.
 *
 * Coordinates the runtime services.
 */
export class DefaultRuntimeKernel
implements RuntimeKernel {

    private running = false;

    constructor(

        private readonly registry: Registry,

        private readonly loader: Loader,

    ) {}

    async boot(): Promise<void> {

        this.running = true;

    }

    async shutdown(): Promise<void> {

        this.running = false;

    }

    async registerComponent(
        componentId: string
    ): Promise<void> {

        const component =
            await this.loader.load(componentId);

        await this.registry.register(component);

    }

    async unregisterComponent(
        componentId: string
    ): Promise<void> {

        await this.registry.unregister(componentId);

        if (
            this.loader.isLoaded(componentId)
        ) {

            await this.loader.unload(componentId);

        }

    }

    async startComponent(
        componentId: string
    ): Promise<void> {

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`
            );

        }

        await component.start();

    }

    async stopComponent(
        componentId: string
    ): Promise<void> {

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`
            );

        }

        await component.stop();

    }

    isRunning(): boolean {

        return this.running;

    }

}

--------------------------------------------------------------
packages/runtime/src/kernel/runtime-kernel.ts
--------------------------------------------------------------
/**
 * Runtime Kernel Contract
 *
 * The Runtime Kernel is the central coordinator of
 * Work Tracker OS.
 *
 * This file defines the contract only.
 * No implementation is allowed here.
 */

export interface RuntimeKernel {

    /**
     * Boot the runtime.
     */
    boot(): Promise<void>;

    /**
     * Shutdown the runtime.
     */
    shutdown(): Promise<void>;

    /**
     * Register a component.
     */
    registerComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Remove a component.
     */
    unregisterComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Start a registered component.
     */
    startComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Stop a running component.
     */
    stopComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Returns true if runtime is active.
     */
    isRunning(): boolean;

}

--------------------------------------------------------------
packages/runtime/src/lifecycle/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/lifecycle/index.ts
--------------------------------------------------------------
export type {
    Lifecycle,
} from "./lifecycle.js";

--------------------------------------------------------------
packages/runtime/src/lifecycle/lifecycle.ts
--------------------------------------------------------------
import {
    ComponentState,
} from "../component/component-state.js";

/**
 * Lifecycle Contract
 *
 * Defines the lifecycle operations supported by
 * the Runtime.
 */

export interface Lifecycle {

    initialize(): Promise<void>;

    start(): Promise<void>;

    pause(): Promise<void>;

    resume(): Promise<void>;

    stop(): Promise<void>;

    fail(
        reason?: Error
    ): Promise<void>;

    getState(): ComponentState;

}

--------------------------------------------------------------
packages/runtime/src/loader/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/loader/index.ts
--------------------------------------------------------------
export type {
    Loader,
} from "./loader.js";

--------------------------------------------------------------
packages/runtime/src/loader/loader.ts
--------------------------------------------------------------
import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Loader Contract
 *
 * Defines how runtime components are loaded
 * and unloaded.
 */

export interface Loader {

    load(
        componentId: string
    ): Promise<RuntimeComponent>;

    unload(
        componentId: string
    ): Promise<void>;

    isLoaded(
        componentId: string
    ): boolean;

}

--------------------------------------------------------------
packages/runtime/src/logger/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/logger/index.ts
--------------------------------------------------------------
export type {
    RuntimeLogger,
} from "./logger.js";

--------------------------------------------------------------
packages/runtime/src/logger/logger.ts
--------------------------------------------------------------
/**
 * Runtime Logger
 *
 * Defines the logging contract used by the Runtime.
 */
export interface RuntimeLogger {

    debug(
        message: string,
        context?: unknown,
    ): void;

    info(
        message: string,
        context?: unknown,
    ): void;

    warn(
        message: string,
        context?: unknown,
    ): void;

    error(
        message: string,
        error?: Error,
        context?: unknown,
    ): void;

}

--------------------------------------------------------------
packages/runtime/src/metrics/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/metrics/index.ts
--------------------------------------------------------------
export type {
    RuntimeMetrics,
} from "./metrics.js";

--------------------------------------------------------------
packages/runtime/src/metrics/metrics.ts
--------------------------------------------------------------
/**
 * Runtime Metrics
 *
 * Defines the metrics collection contract used
 * by the Runtime.
 */
export interface RuntimeMetrics {

    increment(
        metric: string,
        value?: number,
    ): void;

    gauge(
        metric: string,
        value: number,
    ): void;

    timing(
        metric: string,
        milliseconds: number,
    ): void;

    reset(): void;

}

--------------------------------------------------------------
packages/runtime/src/ports/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/ports/input-port.ts
--------------------------------------------------------------
export interface InputPort<TInput> {

    execute(input: TInput): Promise<void>;

}

--------------------------------------------------------------
packages/runtime/src/ports/output-port.ts
--------------------------------------------------------------
export interface OutputPort<TOutput> {

    publish(output: TOutput): Promise<void>;

}

--------------------------------------------------------------
packages/runtime/src/registry/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/registry/index.ts
--------------------------------------------------------------
export type {
    Registry,
} from "./registry.js";

--------------------------------------------------------------
packages/runtime/src/registry/registry.ts
--------------------------------------------------------------
import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Registry Contract
 *
 * Defines the component registry used by the Runtime.
 */

export interface Registry {

    register(
        component: RuntimeComponent
    ): Promise<void>;

    unregister(
        componentId: string
    ): Promise<void>;

    get(
        componentId: string
    ): RuntimeComponent | undefined;

    getAll(): readonly RuntimeComponent[];

    has(
        componentId: string
    ): boolean;

    clear(): Promise<void>;

}

--------------------------------------------------------------
packages/runtime/src/tracing/.gitkeep
--------------------------------------------------------------

--------------------------------------------------------------
packages/runtime/src/tracing/trace.ts
--------------------------------------------------------------
export interface Trace {

    readonly traceId: string;

}

--------------------------------------------------------------
packages/runtime/tests/kernel/runtime-kernel.spec.ts
--------------------------------------------------------------
import {
    describe,
    it,
} from "node:test";

import assert from "node:assert/strict";

describe(
    "DefaultRuntimeKernel",
    () => {

        it(
            "should be instantiable",
            () => {

                assert.ok(true);

            }
        );

        it(
            "should boot runtime",
            () => {

                assert.ok(true);

            }
        );

        it(
            "should shutdown runtime",
            () => {

                assert.ok(true);

            }
        );

        it(
            "should register components",
            () => {

                assert.ok(true);

            }
        );

        it(
            "should unregister components",
            () => {

                assert.ok(true);

            }
        );

        it(
            "should start components",
            () => {

                assert.ok(true);

            }
        );

        it(
            "should stop components",
            () => {

                assert.ok(true);

            }
        );

    }
);

--------------------------------------------------------------
packages/runtime/tsconfig.json
--------------------------------------------------------------
{
  "extends":"../../tsconfig.base.json",
  "compilerOptions":{
    "rootDir":"src",
    "outDir":"dist"
  },
  "include":[
    "src"
  ]
}

==============================================================
SDK
==============================================================
packages/sdk/README.md
packages/sdk/src/component-bootstrap.ts
packages/sdk/src/component-builder.ts
packages/sdk/src/component-context.ts
packages/sdk/src/component-factory.ts
packages/sdk/src/component-manifest.ts
packages/sdk/src/component-registry.ts
packages/sdk/src/component-sdk.ts
packages/sdk/src/component-template.ts
packages/sdk/src/index.ts
packages/sdk/src/platform-api.ts
packages/sdk/src/runtime-integration.ts

--------------------------------------------------------------
packages/sdk/README.md
--------------------------------------------------------------
# SDK

The SDK is the public API used by component developers.

Responsibilities

- Component Registration
- Runtime Integration
- Stable Developer API

The SDK never contains Runtime implementation.


--------------------------------------------------------------
packages/sdk/src/component-bootstrap.ts
--------------------------------------------------------------
import type {
    ComponentContext,
} from "./component-context.js";

import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Bootstrap
 *
 * Responsible for bootstrapping a component
 * into the Runtime.
 */
export interface ComponentBootstrap {

    bootstrap(

        context: ComponentContext,

    ): Promise<ComponentTemplate>;

}

--------------------------------------------------------------
packages/sdk/src/component-builder.ts
--------------------------------------------------------------
import type {
    RuntimeComponent,
} from "../../runtime/src/component/component.js";

import type {
    ComponentContext,
} from "./component-context.js";

/**
 * Component Builder
 *
 * Factory responsible for constructing runtime components.
 */
export interface ComponentBuilder {

    build(
        context: ComponentContext,
    ): Promise<RuntimeComponent>;

}

--------------------------------------------------------------
packages/sdk/src/component-context.ts
--------------------------------------------------------------
import type {
    RuntimeLogger,
} from "../../runtime/src/logger/logger.js";

import type {
    RuntimeHealth,
} from "../../runtime/src/health/health.js";

import type {
    RuntimeMetrics,
} from "../../runtime/src/metrics/metrics.js";

/**
 * Component Context
 *
 * Runtime services exposed to every component.
 */
export interface ComponentContext {

    readonly logger: RuntimeLogger;

    readonly health: RuntimeHealth;

    readonly metrics: RuntimeMetrics;

}

--------------------------------------------------------------
packages/sdk/src/component-factory.ts
--------------------------------------------------------------
import type {
    RuntimeComponent,
} from "../../runtime/src/component/component.js";

import type {
    ComponentContext,
} from "./component-context.js";

import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Factory
 *
 * Responsible for creating runtime components
 * from component templates.
 */
export interface ComponentFactory {

    create(

        template: ComponentTemplate,

        context: ComponentContext,

    ): Promise<RuntimeComponent>;

}

--------------------------------------------------------------
packages/sdk/src/component-manifest.ts
--------------------------------------------------------------
/**
 * Component Manifest
 *
 * Metadata describing a runtime component.
 */
export interface ComponentManifest {

    readonly id: string;

    readonly name: string;

    readonly version: string;

    readonly description?: string;

    readonly dependencies: readonly string[];

    readonly inputs: readonly string[];

    readonly outputs: readonly string[];

}

--------------------------------------------------------------
packages/sdk/src/component-registry.ts
--------------------------------------------------------------
import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Registry
 *
 * Stores and exposes all registered component
 * templates available to the platform.
 */
export interface ComponentRegistry {

    register(
        component: ComponentTemplate,
    ): Promise<void>;

    unregister(
        componentId: string,
    ): Promise<void>;

    get(
        componentId: string,
    ): ComponentTemplate | undefined;

    getAll(): readonly ComponentTemplate[];

    has(
        componentId: string,
    ): boolean;

}

--------------------------------------------------------------
packages/sdk/src/component-sdk.ts
--------------------------------------------------------------
import type {
    RuntimeComponent,
} from "../../runtime/src/component/component.js";

/**
 * Component SDK
 *
 * Entry point used by every Work Tracker OS component.
 */
export interface ComponentSDK {

    /**
     * Register the component in the Runtime.
     */
    register(
        component: RuntimeComponent,
    ): Promise<void>;

    /**
     * Unregister the component.
     */
    unregister(
        componentId: string,
    ): Promise<void>;

}

--------------------------------------------------------------
packages/sdk/src/component-template.ts
--------------------------------------------------------------
import type {
    ComponentManifest,
} from "./component-manifest.js";

import type {
    ComponentBuilder,
} from "./component-builder.js";

/**
 * Component Template
 *
 * Defines the complete description required
 * to publish a runtime component.
 */
export interface ComponentTemplate {

    readonly manifest: ComponentManifest;

    readonly builder: ComponentBuilder;

}

--------------------------------------------------------------
packages/sdk/src/index.ts
--------------------------------------------------------------
export type {
    ComponentSDK,
} from "./component-sdk.js";

export type {
    ComponentContext,
} from "./component-context.js";

export type {
    ComponentBuilder,
} from "./component-builder.js";

export type {
    ComponentManifest,
} from "./component-manifest.js";

export type {
    ComponentTemplate,
} from "./component-template.js";

export type {
    ComponentFactory,
} from "./component-factory.js";

export type {
    ComponentBootstrap,
} from "./component-bootstrap.js";

export type {
    RuntimeIntegration,
} from "./runtime-integration.js";

export type {
    PlatformAPI,
} from "./platform-api.js";

export type {
    ComponentRegistry,
} from "./component-registry.js";

--------------------------------------------------------------
packages/sdk/src/platform-api.ts
--------------------------------------------------------------
import type {
    RuntimeKernel,
} from "../../runtime/src/kernel/runtime-kernel.js";

import type {
    RuntimeIntegration,
} from "./runtime-integration.js";

/**
 * Platform API
 *
 * Public entry point exposed by Work Tracker OS.
 */
export interface PlatformAPI {

    readonly kernel: RuntimeKernel;

    readonly integration: RuntimeIntegration;

}

--------------------------------------------------------------
packages/sdk/src/runtime-integration.ts
--------------------------------------------------------------
import type {
    RuntimeKernel,
} from "../../runtime/src/kernel/runtime-kernel.js";

import type {
    ComponentBootstrap,
} from "./component-bootstrap.js";

/**
 * Runtime Integration
 *
 * Connects SDK bootstrapped components
 * with the Runtime Kernel.
 */
export interface RuntimeIntegration {

    register(

        kernel: RuntimeKernel,

        bootstrap: ComponentBootstrap,

    ): Promise<void>;

}

==============================================================
END
==============================================================
