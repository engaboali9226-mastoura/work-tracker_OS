import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

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
