import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";

const workspaceRoot =
  path.resolve(
    import.meta.dirname,
    "../../..",
  );

const packages = [
  ["@worktracker/shared", "./dist/index.js", "./dist/index.d.ts"],
  ["@worktracker/core", "./dist/core/src/index.js", "./dist/core/src/index.d.ts"],
  ["@worktracker/application", "./dist/index.js", "./dist/index.d.ts"],
  ["@worktracker/runtime", "./dist/index.js", "./dist/index.d.ts"],
] as const;

function packageDirectory(
  packageName: string,
): string {
  const directoryName =
    packageName.split("/").at(-1);

  assert.ok(directoryName);

  return path.join(
    workspaceRoot,
    "packages",
    directoryName,
  );
}

test(
  "internal workspace packages expose their built entrypoint contract",
  async () => {
    for (const [packageName, runtimePath, typesPath] of packages) {
      const packageDirectoryPath =
        packageDirectory(packageName);
      const manifest = JSON.parse(
        fs.readFileSync(
          path.join(
            packageDirectoryPath,
            "package.json",
          ),
          "utf8",
        ),
      ) as {
        readonly main?: string;
        readonly types?: string;
        readonly exports?: {
          readonly ".": {
            readonly import?: string;
            readonly types?: string;
          };
        };
      };

      assert.equal(
        manifest.main,
        runtimePath,
        packageName,
      );
      assert.equal(
        manifest.types,
        typesPath,
        packageName,
      );
      assert.deepEqual(
        manifest.exports?.["."],
        {
          import: runtimePath,
          types: typesPath,
        },
        packageName,
      );

      for (const relativePath of [
        manifest.main,
        manifest.types,
        manifest.exports?.["."]?.import,
        manifest.exports?.["."]?.types,
      ]) {
        assert.equal(
          typeof relativePath,
          "string",
          packageName,
        );
        assert.equal(
          relativePath.startsWith("./dist/"),
          true,
          packageName,
        );
        assert.equal(
          fs.existsSync(
            path.join(
              packageDirectoryPath,
              relativePath.slice(2),
            ),
          ),
          true,
          `${packageName}: ${relativePath}`,
        );
      }

      assert.equal(
        fs.existsSync(
          path.join(
            packageDirectoryPath,
            "index.js",
          ),
        ),
        false,
        `${packageName} must not rely on a package-root index.js`,
      );

      const expectedRuntimeUrl = pathToFileURL(
        path.join(
          packageDirectoryPath,
          runtimePath.slice(2),
        ),
      ).href;
      const child = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          [
            "const packageName = process.argv[1];",
            "const expectedRuntimeUrl = process.argv[2];",
            "const resolvedEntry = await import.meta.resolve(packageName);",
            "if (resolvedEntry !== expectedRuntimeUrl) {",
            "  console.error(JSON.stringify({ resolvedEntry, expectedRuntimeUrl }));",
            "  process.exit(1);",
            "}",
            "await import(packageName);",
          ].join("\n"),
          packageName,
          expectedRuntimeUrl,
        ],
        {
          cwd: workspaceRoot,
          encoding: "utf8",
          env: {
            ...process.env,
            NODE_OPTIONS: "",
          },
        },
      );

      assert.equal(
        child.status,
        0,
        `${packageName}: ${child.stderr}`,
      );
    }
  },
);
