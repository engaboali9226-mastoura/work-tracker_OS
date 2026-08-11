import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as ts from "typescript";

const workspaceRoot =
  path.resolve(
    import.meta.dirname,
    "../../..",
  );

const platformRoot =
  path.join(
    workspaceRoot,
    "packages/platform",
  );

function collectFiles(
  directory: string,
): string[] {
  return fs
    .readdirSync(
      directory,
      {
        withFileTypes:
          true,
      },
    )
    .flatMap(
      entry => {
        const absolute =
          path.join(
            directory,
            entry.name,
          );

        return entry.isDirectory()
          ? collectFiles(absolute)
          : [absolute];
      },
    );
}

function isGovernedPlatformSource(fileName: string): boolean {
  const relativeSegments = path.relative(
    path.join(platformRoot, "src"),
    fileName,
  ).split(path.sep);
  return /\.(?:ts|tsx)$/u.test(fileName)
    && !fileName.endsWith(".d.ts")
    && !relativeSegments.some(segment =>
      segment === "node_modules" || segment === "generated" || segment === "vendor"
    );
}

type ShellBoundaryEvidence =
  | "react-module-dependency"
  | "jsdom-module-dependency"
  | "browser-global-usage"
  | "browser-type-ownership"
  | "shell-presentation-ownership";

interface ShellBoundaryFinding {
  readonly evidence: ShellBoundaryEvidence;
  readonly fileName: string;
  readonly line: number;
  readonly column: number;
  readonly detail: string;
}

const browserGlobals = new Set(["window", "document", "history"]);
const browserTypes = new Set(["Window", "Document", "History", "PopStateEvent"]);
const shellIdentifiers = new Set([
  "PlatformShell", "ApplicationViewFactory", "ApplicationViewRegistry",
]);
const domLibraryFileName = /^lib\.dom(?:\.[^.]+)*\.d\.ts$/u;
const standardLibraryFileName = /^lib\..+\.d\.ts$/u;

// Platform intentionally omits DOM types. The architecture-only Program includes
// lib.dom.d.ts solely so the checker can identify forbidden browser ownership.
const analysisCompilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
  types: [],
  strict: true,
  skipLibCheck: true,
  noEmit: true,
};

function scriptKindFor(fileName: string): ts.ScriptKind {
  return fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function createAnalysisProgram(
  rootNames: readonly string[],
  virtualSources: ReadonlyMap<string, string> = new Map(),
): ts.Program {
  const absoluteRootNames = rootNames.map(fileName => path.resolve(fileName)).sort();
  const normalizedVirtualSources = new Map(
    [...virtualSources].map(([fileName, source]) => [path.resolve(fileName), source]),
  );
  const containsVirtualFile = (directory: string): boolean => {
    const prefix = `${path.resolve(directory)}${path.sep}`;
    return [...normalizedVirtualSources.keys()].some(fileName =>
      fileName.startsWith(prefix)
    );
  };
  const standardHost = ts.createCompilerHost(analysisCompilerOptions, true);
  const host: ts.CompilerHost = {
    ...standardHost,
    fileExists: fileName =>
      normalizedVirtualSources.has(path.resolve(fileName))
      || standardHost.fileExists(fileName),
    readFile: fileName =>
      normalizedVirtualSources.get(path.resolve(fileName))
      ?? standardHost.readFile(fileName),
    directoryExists: directory =>
      containsVirtualFile(directory)
      || (standardHost.directoryExists?.(directory) ?? false),
    getSourceFile: (
      fileName,
      languageVersionOrOptions,
      onError,
      shouldCreateNewSourceFile,
    ) => {
      const virtualSource = normalizedVirtualSources.get(path.resolve(fileName));
      return virtualSource === undefined
        ? standardHost.getSourceFile(
          fileName,
          languageVersionOrOptions,
          onError,
          shouldCreateNewSourceFile,
        )
        : ts.createSourceFile(
          fileName,
          virtualSource,
          languageVersionOrOptions,
          true,
          scriptKindFor(fileName),
        );
    },
  };

  return ts.createProgram({
    rootNames: absoluteRootNames,
    options: analysisCompilerOptions,
    host,
  });
}

function analysisSourceFiles(
  program: ts.Program,
  fileNames: readonly string[],
): readonly ts.SourceFile[] {
  return fileNames.map(fileName => {
    const absoluteFileName = path.resolve(fileName);
    const sourceFile = program.getSourceFile(absoluteFileName);
    assert.ok(sourceFile, `${absoluteFileName} must be present in the analysis Program.`);
    const diagnostics = program.getSyntacticDiagnostics(sourceFile);
    assert.equal(
      diagnostics.length,
      0,
      `${absoluteFileName} must have no analysis syntactic diagnostics: ${diagnostics
        .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
        .join("; ")}`,
    );
    return sourceFile;
  });
}

function assertDomLibraryAvailable(program: ts.Program): void {
  assert.ok(
    program.getSourceFiles().some(sourceFile =>
      domLibraryFileName.test(path.basename(sourceFile.fileName))
    ),
    "The architecture analysis Program must load TypeScript's DOM library.",
  );
}

function resolvedSymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): ts.Symbol {
  return (symbol.flags & ts.SymbolFlags.Alias) === 0
    ? symbol
    : checker.getAliasedSymbol(symbol);
}

function declaredSymbolAt(
  checker: ts.TypeChecker,
  node: ts.Node,
  description: string,
): ts.Symbol {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const location = `${sourceFile.fileName}:${position.line + 1}:${position.character + 1}`;
  const symbol = checker.getSymbolAtLocation(node);
  assert.ok(symbol, `${location}: ${description} must resolve to a TypeScript Symbol.`);
  const resolved = resolvedSymbol(checker, symbol);
  assert.ok(
    (resolved.declarations?.length ?? 0) > 0,
    `${location}: ${description} must resolve to a declared TypeScript Symbol.`,
  );
  return resolved;
}

function isDomLibrarySymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): boolean {
  return resolvedSymbol(checker, symbol).declarations?.some(declaration =>
    domLibraryFileName.test(path.basename(declaration.getSourceFile().fileName))
  ) ?? false;
}

function isCompilerGlobalThis(
  checker: ts.TypeChecker,
  node: ts.Identifier,
): boolean {
  const symbol = checker.getSymbolAtLocation(node);
  assert.ok(symbol, "globalThis must resolve through the TypeChecker.");
  const resolved = resolvedSymbol(checker, symbol);
  if (resolved.getName() !== "globalThis") return false;
  const declarations = resolved.declarations ?? [];

  // TypeScript may synthesize the globalThis symbol without declarations.
  // Otherwise, accept it only when every declaration comes from a compiler lib.
  return declarations.length === 0 || declarations.every(declaration =>
    standardLibraryFileName.test(
      path.basename(declaration.getSourceFile().fileName),
    )
  );
}

function isTopLevelShellDeclaration(node: ts.Identifier): boolean {
  const parent = node.parent;
  const namedDeclaration =
    ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent)
    || ts.isInterfaceDeclaration(parent) || ts.isTypeAliasDeclaration(parent)
    || ts.isEnumDeclaration(parent) || ts.isModuleDeclaration(parent);
  const variableStatement = ts.isVariableDeclaration(parent)
    && ts.isVariableStatement(parent.parent.parent)
      ? parent.parent.parent
      : undefined;
  const declaration = namedDeclaration ? parent : variableStatement;

  return declaration !== undefined
    && ts.isSourceFile(declaration.parent);
}

function isShellImportOrExportName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (ts.isImportClause(parent) && parent.name === node)
    || ts.isImportSpecifier(parent)
    || ts.isNamespaceImport(parent)
    || (ts.isImportEqualsDeclaration(parent) && parent.name === node)
    || ts.isExportSpecifier(parent)
    || (ts.isExportAssignment(parent) && parent.expression === node);
}

function staticStringValue(node: ts.Node | undefined): string | undefined {
  return node !== undefined
    && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined;
}

function moduleSpecifierFrom(
  node: ts.Node,
  checker: ts.TypeChecker,
): string | undefined {
  if (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
    && node.moduleSpecifier !== undefined
  ) return staticStringValue(node.moduleSpecifier);

  if (
    ts.isImportEqualsDeclaration(node)
    && ts.isExternalModuleReference(node.moduleReference)
    && node.moduleReference.expression !== undefined
  ) return staticStringValue(node.moduleReference.expression);

  if (
    ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
  ) return staticStringValue(node.argument.literal);

  if (ts.isCallExpression(node)) {
    const moduleSpecifier = staticStringValue(node.arguments[0]);
    if (moduleSpecifier === undefined) return undefined;
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) return moduleSpecifier;
    if (
      node.arguments.length === 1 && ts.isIdentifier(node.expression)
      && node.expression.text === "require"
      && checker.getSymbolAtLocation(node.expression) === undefined
    ) return moduleSpecifier;
  }

  return undefined;
}

function unwrapParentheses(node: ts.Expression): ts.Expression {
  let expression = node;
  while (ts.isParenthesizedExpression(expression)) {
    expression = expression.expression;
  }
  return expression;
}

function isBrowserTypeReference(node: ts.Identifier): boolean {
  return (ts.isTypeReferenceNode(node.parent) && node.parent.typeName === node)
    || (ts.isExpressionWithTypeArguments(node.parent)
      && node.parent.expression === node);
}

function isBrowserValueReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  const declarationName =
    (ts.isVariableDeclaration(parent) || ts.isParameter(parent)
      || ts.isBindingElement(parent) || ts.isFunctionDeclaration(parent)
      || ts.isFunctionExpression(parent) || ts.isClassDeclaration(parent)
      || ts.isClassExpression(parent) || ts.isEnumDeclaration(parent)
      || ts.isModuleDeclaration(parent))
    && parent.name === node;
  const propertyOrLabelName =
    (ts.isPropertyAccessExpression(parent) && parent.name === node)
    || (ts.isBindingElement(parent) && parent.propertyName === node)
    || (ts.isPropertyAssignment(parent) && parent.name === node)
    || (ts.isPropertyDeclaration(parent) && parent.name === node)
    || (ts.isPropertySignature(parent) && parent.name === node)
    || (ts.isMethodDeclaration(parent) && parent.name === node)
    || (ts.isMethodSignature(parent) && parent.name === node)
    || (ts.isGetAccessorDeclaration(parent) && parent.name === node)
    || (ts.isSetAccessorDeclaration(parent) && parent.name === node)
    || (ts.isEnumMember(parent) && parent.name === node)
    || (ts.isLabeledStatement(parent) && parent.label === node)
    || (ts.isBreakStatement(parent) && parent.label === node)
    || (ts.isContinueStatement(parent) && parent.label === node)
    || ts.isJsxAttribute(parent);
  const moduleName = ts.isImportClause(parent) || ts.isImportSpecifier(parent)
    || ts.isNamespaceImport(parent) || ts.isImportEqualsDeclaration(parent)
    || ts.isExportSpecifier(parent);

  return !declarationName && !propertyOrLabelName && !moduleName;
}

function findShellBoundaryEvidence(
  program: ts.Program,
  sourceFiles: readonly ts.SourceFile[],
): readonly ShellBoundaryFinding[] {
  const checker = program.getTypeChecker();
  const findings: ShellBoundaryFinding[] = [];

  const addFinding = (
    node: ts.Node,
    evidence: ShellBoundaryEvidence,
    detail: string,
  ): void => {
    const sourceFile = node.getSourceFile();
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    findings.push({
      evidence,
      fileName: sourceFile.fileName,
      line: position.line + 1,
      column: position.character + 1,
      detail,
    });
  };

  const visit = (node: ts.Node): void => {
    const moduleSpecifier = moduleSpecifierFrom(node, checker);

    if (moduleSpecifier !== undefined) {
      if (
        moduleSpecifier === "react" || moduleSpecifier.startsWith("react/")
        || moduleSpecifier === "react-dom" || moduleSpecifier.startsWith("react-dom/")
      ) addFinding(node, "react-module-dependency", moduleSpecifier);
      if (
        moduleSpecifier === "jsdom" || moduleSpecifier.startsWith("jsdom/")
      ) addFinding(node, "jsdom-module-dependency", moduleSpecifier);
    }

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const receiver = unwrapParentheses(node.expression);
      const propertyNode = ts.isPropertyAccessExpression(node)
        ? node.name
        : node.argumentExpression;
      const propertyName = ts.isPropertyAccessExpression(node)
        ? node.name.text
        : staticStringValue(node.argumentExpression);
      if (
        ts.isIdentifier(receiver) && receiver.text === "globalThis"
        && propertyName !== undefined && browserGlobals.has(propertyName)
        && isCompilerGlobalThis(checker, receiver)
      ) {
        const propertySymbol = declaredSymbolAt(
          checker,
          propertyNode,
          `globalThis.${propertyName}`,
        );
        if (isDomLibrarySymbol(checker, propertySymbol)) {
          addFinding(node, "browser-global-usage", node.getText());
        }
      }
    }

    if (ts.isIdentifier(node)) {
      if (
        browserGlobals.has(node.text) && isBrowserValueReference(node)
      ) {
        const symbol = declaredSymbolAt(checker, node, node.text);
        if (isDomLibrarySymbol(checker, symbol)) {
          addFinding(node, "browser-global-usage", node.text);
        }
      }
      if (
        browserTypes.has(node.text)
        && (isBrowserTypeReference(node) || isBrowserValueReference(node))
      ) {
        const symbol = declaredSymbolAt(checker, node, node.text);
        if (isDomLibrarySymbol(checker, symbol)) {
          addFinding(node, "browser-type-ownership", node.text);
        }
      }
      if (
        shellIdentifiers.has(node.text)
        && (isTopLevelShellDeclaration(node) || isShellImportOrExportName(node))
      ) addFinding(node, "shell-presentation-ownership", node.text);
    }

    ts.forEachChild(node, visit);
  };

  for (const sourceFile of [...sourceFiles].sort((left, right) =>
    left.fileName.localeCompare(right.fileName)
  )) {
    visit(sourceFile);
  }
  return findings;
}

function evidenceCount(
  findings: readonly ShellBoundaryFinding[],
  evidence: ShellBoundaryEvidence,
): number {
  return findings.filter(finding => finding.evidence === evidence).length;
}

function analyzeProbe(
  name: string,
  sources: Readonly<Record<string, string>>,
): readonly ShellBoundaryFinding[] {
  const probeRoot = path.join(workspaceRoot, ".architecture-probes", name);
  const virtualSources = new Map(
    Object.entries(sources).map(([fileName, source]) => [
      path.join(probeRoot, fileName),
      source,
    ]),
  );
  const rootNames = [...virtualSources.keys()].sort();
  const program = createAnalysisProgram(rootNames, virtualSources);
  assertDomLibraryAvailable(program);
  return findShellBoundaryEvidence(
    program,
    analysisSourceFiles(program, rootNames),
  );
}

test(
  "platform is the single outer composition root with approved dependencies",
  () => {
    const packageJson =
      JSON.parse(
        fs.readFileSync(
          path.join(
            platformRoot,
            "package.json",
          ),
          "utf8",
        ),
      ) as {
        readonly dependencies:
          Readonly<Record<string, string>>;
      };

    assert.deepEqual(
      Object.keys(
        packageJson.dependencies,
      ).sort(),
      [
        "@worktracker/application",
        "@worktracker/core",
        "@worktracker/runtime",
      ],
    );

    const sourceFiles =
      collectFiles(
        path.join(
          platformRoot,
          "src",
        ),
      ).filter(
        file =>
          file.endsWith(
            ".ts",
          ),
      );

    const source =
      sourceFiles
        .map(
          file =>
            fs.readFileSync(
              file,
              "utf8",
            ),
        )
        .join("\n");

    assert.equal(
      (
        source.match(
          /\bclass\s+PlatformCompositionRoot\b/gu,
        )
        ?? []
      ).length,
      1,
    );

    assert.doesNotMatch(
      source,
      /apps\/|@noor\/|@worktracker\/(?:sdk|infrastructure|architecture)/u,
    );

    assert.doesNotMatch(
      source,
      /\bimport\s*\(|\bServiceLocator\b|\bglobalThis\b|\bsingleton\b/iu,
    );

    assert.doesNotMatch(
      source,
      /\binterface\s+(?:RuntimeKernel|Lifecycle)\b|\bclass\s+\w*AuthorizationEngine\b/u,
    );
  },
);

test(
  "lower layers and SDK do not depend on the platform composition root",
  () => {
    for (
      const relativeRoot
      of [
        "packages/core/src",
        "packages/application/src",
        "packages/runtime/src",
        "packages/sdk/src",
        "apps/noor-personal/src",
      ]
    ) {
      const source =
        collectFiles(
          path.join(
            workspaceRoot,
            relativeRoot,
          ),
        )
          .filter(
            file =>
              /\.(?:ts|tsx|js|mjs)$/u
                .test(file),
          )
          .map(
            file =>
              fs.readFileSync(
                file,
                "utf8",
              ),
          )
          .join("\n");

      assert.equal(
        source.includes(
          "@worktracker/platform",
        ),
        false,
        `${relativeRoot} must remain independent from the composition root.`,
      );
    }
  },
);

test(
  "platform keeps runtime ownership internal and request context external",
  () => {
    const readPlatformSource =
      (
        fileName: string,
      ) =>
        fs.readFileSync(
          path.join(
            platformRoot,
            "src",
            fileName,
          ),
          "utf8",
        );

    const indexSource =
      readPlatformSource(
        "index.ts",
      );

    const contractsSource =
      readPlatformSource(
        "contracts.ts",
      );

    const servicesSource =
      readPlatformSource(
        "services.ts",
      );

    const rootSource =
      readPlatformSource(
        "platform-composition-root.ts",
      );

    const publicSurface =
      [
        indexSource,
        contractsSource,
        servicesSource,
      ].join("\n");

    assert.doesNotMatch(
      publicSurface,
      /\bRuntimeKernel\b/u,
    );

    assert.doesNotMatch(
      [
        contractsSource,
        servicesSource,
      ].join("\n"),
      /\bUserContextProvider\b|\bprovider\s*:/u,
    );

    assert.match(
      contractsSource,
      /\bplatformComponents\b/u,
    );

    assert.match(
      contractsSource,
      /\bapplicationBindings\b/u,
    );

    assert.match(
      rootSource,
      /applicationCatalog\s*\.findByKey\s*\(/u,
    );

    assert.match(
      rootSource,
      /catalogEntry\s*\.status\s*===\s*"planned"/u,
    );

    assert.match(
      rootSource,
      /applicationCatalog\s*\.list\s*\(\s*\)\s*\.flatMap\s*\(/u,
    );

    const allPlatformSource =
      collectFiles(
        path.join(
          platformRoot,
          "src",
        ),
      )
        .filter(
          file =>
            file.endsWith(
              ".ts",
            ),
        )
        .map(
          file =>
            fs.readFileSync(
              file,
              "utf8",
            ),
        )
        .join("\n");

    assert.doesNotMatch(
      allPlatformSource,
      /\bAggregateError\b|\bcause\b/u,
    );

    assert.doesNotMatch(
      allPlatformSource,
      /\bnoor-personal\b|\bnoor-work\b/u,
    );
  },
);

test(
  "system manifest includes platform and source contains no generated artifacts",
  () => {
    const manifest =
      fs.readFileSync(
        path.join(
          workspaceRoot,
          "architecture/system.manifest.yaml",
        ),
        "utf8",
      );

    assert.equal(
      (
        manifest.match(
          /^\s*-\s+platform\s*$/gmu,
        )
        ?? []
      ).length,
      1,
    );

    const generatedSourceFiles =
      collectFiles(
        path.join(
          platformRoot,
          "src",
        ),
      ).filter(
        file =>
          /\.(?:js|js\.map|d\.ts|d\.ts\.map)$/u
            .test(file),
      );

    assert.deepEqual(
      generatedSourceFiles,
      [],
    );
  },
);

test(
  "platform remains free of browser and Shell presentation ownership",
  () => {
    const ordinaryLocalFindings = analyzeProbe("ordinary-locals", {
      "probe.ts": `
        export {};
        declare const records: readonly {
          status: string;
          entries: readonly string[];
        }[];
        declare const domain: {
          document: { status: string };
          history: { entries: readonly string[] };
          globalThis: string;
        };
        declare const domainHistory: { entries: readonly string[] };
        declare const ready: boolean;
        declare const someObject: {
          window: string;
          document: string;
          history: string;
        };

        type History = { entries: readonly string[] };
        interface Document { status: string }
        type Window = { mode: string };
        type DomainSnapshot<History> = { value: History };
        interface DomainDocument<Document> { value: Document }
        type Snapshot = History | Document | Window;

        for (const document of records) {
          document.status;
        }
        function inspectDocument(document: { status: string }) {
          return document.status;
        }
        function inspectHistory(history: { entries: readonly string[] }) {
          return history.entries;
        }
        records.map(document => document.status);
        const { document } = domain;
        document.status;
        const { history } = domain;
        history.entries;
        function localWindow() {
          const window = { location: "domain" };
          return window.location;
        }
        function varHistory() {
          if (ready) {
            var history = domainHistory;
          }
          return history.entries;
        }
        function localGlobalThis(globalThis: { window: string }) {
          return globalThis.window;
        }
        someObject.window;
        someObject.document;
        someObject.history;
        domain.globalThis;
        function createRoot() { return "domain"; }
        function localVocabulary(PlatformShell: string) { return PlatformShell; }
        function require(moduleName: string) { return moduleName; }
        const localReactName = require("react");
        const text = "window.location";
        const moduleName = "react";
        const fakeImport = "import React from 'react'";
        const regex = /window\\.location/u;
        // React JSDOM Window Document History PlatformShell
      `,
    });

    assert.deepEqual(ordinaryLocalFindings, []);

    const coverageGapFindings = analyzeProbe("coverage-gaps", {
      "probe.ts": `
        export {};
        type ReactNode = import("react").ReactNode;
        const dynamicReact = import("react", { with: { type: "json" } });
        new PopStateEvent("popstate");
        const BrowserEvent = PopStateEvent;
        new Window();
        const BrowserHistoryCtor = History;
        (globalThis).document.createElement("div");
        globalThis["document"].createElement("div");
        globalThis["window"].location.href;
        globalThis["history"].pushState({}, "", "/");
        void dynamicReact;
        void BrowserEvent;
        void BrowserHistoryCtor;
      `,
    });

    assert.equal(evidenceCount(coverageGapFindings, "react-module-dependency"), 2);
    assert.equal(evidenceCount(coverageGapFindings, "browser-type-ownership"), 4);
    assert.equal(evidenceCount(coverageGapFindings, "browser-global-usage"), 4);

    const coverageGapPrecisionFindings = analyzeProbe("coverage-gap-precision", {
      "probe.ts": `
        export {};
        declare const domainObject: { document: { status: string } };

        class PopStateEvent {}
        new PopStateEvent();
        class Window {}
        new Window();
        const History = { entries: [] };
        const historyValue = History;

        function inspect(globalThis: { document: { status: string } }) {
          return globalThis.document.status;
        }

        const localGlobal = { document: { status: "ok" } };
        localGlobal["document"].status;

        const property = "document";
        globalThis[property];

        function inspectShadowedGlobalThis() {
          const globalThis = domainObject;
          return globalThis["document"].status;
        }

        void historyValue;
        void inspect;
        void inspectShadowedGlobalThis;
      `,
    });

    assert.deepEqual(coverageGapPrecisionFindings, []);

    const importedDomainTypeFindings = analyzeProbe("imported-domain-type", {
      "domain-history.ts": `
        export type History = { entries: readonly string[] };
      `,
      "probe.ts": `
        import type { History } from "./domain-history.js";
        type Snapshot = History;
        export type { Snapshot };
      `,
    });

    assert.deepEqual(importedDomainTypeFindings, []);

    const leakageFindings = analyzeProbe("genuine-leakage", {
      "probe.ts": `
        import React from "react";
        import { createRoot } from "react-dom/client";
        import { JSDOM } from "jsdom";
        export { something } from "react";
        const reactModule = require("react");
        const dynamicReact = import("react");
        window.location.href;
        document.createElement("div");
        history.pushState({}, "", "/");
        globalThis.window.location;
        globalThis.document.createElement("div");
        globalThis.history.pushState({}, "", "/");
        type BrowserWindow = Window;
        type BrowserDocument = Document;
        type BrowserHistory = History;
        type BrowserPopState = PopStateEvent;
        interface PlatformShell {}
        type ApplicationViewFactory<View> = () => View;
        class ApplicationViewRegistry {}
        const interpolated = \`\${window.location.href}\`;
        void React;
        void createRoot;
        void JSDOM;
        void reactModule;
        void dynamicReact;
      `,
    });
    const leakageEvidence = new Set(
      leakageFindings.map(finding => finding.evidence),
    );

    assert.deepEqual(leakageEvidence, new Set<ShellBoundaryEvidence>([
      "react-module-dependency",
      "jsdom-module-dependency",
      "browser-global-usage",
      "browser-type-ownership",
      "shell-presentation-ownership",
    ]));
    assert.equal(evidenceCount(leakageFindings, "react-module-dependency"), 5);
    assert.equal(evidenceCount(leakageFindings, "jsdom-module-dependency"), 1);
    assert.equal(evidenceCount(leakageFindings, "browser-global-usage"), 7);
    assert.equal(evidenceCount(leakageFindings, "browser-type-ownership"), 4);
    assert.equal(evidenceCount(leakageFindings, "shell-presentation-ownership"), 3);

    const crossScopeProbes: ReadonlyArray<{
      readonly name: string;
      readonly source: string;
      readonly expected: readonly ShellBoundaryEvidence[];
    }> = [
      {
        name: "local-and-browser-window",
        source: `
          export {};
          function localScope() {
            const window = { location: "domain" };
            return window.location;
          }
          function browserScope() {
            return window.location.href;
          }
        `,
        expected: ["browser-global-usage"],
      },
      {
        name: "local-and-browser-document",
        source: `
          export {};
          function localDocument(document: { status: string }) {
            return document.status;
          }
          function browserDocument() {
            return document.createElement("div");
          }
        `,
        expected: ["browser-global-usage"],
      },
      {
        name: "local-and-browser-history",
        source: `
          export {};
          declare const records: readonly { entries: readonly string[] }[];
          const locally = records.map(history => history.entries);
          history.pushState({}, "", "/");
          void locally;
        `,
        expected: ["browser-global-usage"],
      },
      {
        name: "nested-block-var-hoisting",
        source: `
          export {};
          declare const ready: boolean;
          declare const domainHistory: { entries: readonly string[] };
          function inspect() {
            if (ready) {
              var history = domainHistory;
            }
            return history.entries;
          }
        `,
        expected: [],
      },
      {
        name: "loop-binding",
        source: `
          export {};
          declare const records: readonly { status: string }[];
          for (const document of records) {
            document.status;
          }
        `,
        expected: [],
      },
      {
        name: "generic-and-browser-history",
        source: `
          export {};
          type DomainSnapshot<History> = { value: History };
          type BrowserSnapshot = History;
        `,
        expected: ["browser-type-ownership"],
      },
      {
        name: "type-name-does-not-shadow-browser-value",
        source: `
          export {};
          type document = { status: string };
          document.createElement("div");
        `,
        expected: ["browser-global-usage"],
      },
      {
        name: "value-name-does-not-shadow-browser-type",
        source: `
          export {};
          const History = { domain: true };
          type BrowserSnapshot = History;
          void History;
        `,
        expected: ["browser-type-ownership"],
      },
      {
        name: "local-window-class",
        source: `
          export {};
          class Window {}
          type Snapshot = Window;
          new Window();
        `,
        expected: [],
      },
    ];

    for (const probe of crossScopeProbes) {
      const findings = analyzeProbe(probe.name, { "probe.ts": probe.source });
      assert.deepEqual(
        findings.map(finding => finding.evidence),
        probe.expected,
        `${probe.name} must use compiler-resolved scope and namespace semantics.`,
      );
    }

    const platformSourceFiles = collectFiles(
      path.join(platformRoot, "src"),
    ).filter(isGovernedPlatformSource).sort();
    assert.ok(platformSourceFiles.length > 0);
    const platformProgram = createAnalysisProgram(platformSourceFiles);
    assertDomLibraryAvailable(platformProgram);
    const governedSourceFiles = analysisSourceFiles(
      platformProgram,
      platformSourceFiles,
    );
    assert.deepEqual(
      governedSourceFiles.map(sourceFile => path.resolve(sourceFile.fileName)),
      platformSourceFiles.map(fileName => path.resolve(fileName)),
    );
    const violations = findShellBoundaryEvidence(
      platformProgram,
      governedSourceFiles,
    );

    assert.deepEqual(
      violations,
      [],
      violations.map(violation =>
        `${path.relative(workspaceRoot, violation.fileName)}:${violation.line}`
        + `:${violation.column}: ${violation.evidence} (${violation.detail})`
      ).join("\n"),
    );
  },
);
