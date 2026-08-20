import assert from "node:assert/strict";
import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import {
  dirname,
  join,
  resolve,
} from "node:path";
import test from "node:test";
import {
  fileURLToPath,
} from "node:url";

const repositoryRoot =
  resolve(
    dirname(
      fileURLToPath(
        import.meta.url,
      ),
    ),
    "../../..",
  );

function readRepositoryFile(
  path: string,
): string {
  return readFileSync(
    join(
      repositoryRoot,
      path,
    ),
    "utf8",
  );
}

function sourceFilesUnder(
  directory: string,
): readonly string[] {
  const absolute =
    join(
      repositoryRoot,
      directory,
    );

  const result:
    string[] = [];

  for (
    const entry
    of readdirSync(
      absolute,
    )
  ) {
    const child =
      join(
        absolute,
        entry,
      );

    if (
      statSync(
        child,
      ).isDirectory()
    ) {
      const relativeChild =
        join(
          directory,
          entry,
        );

      result.push(
        ...sourceFilesUnder(
          relativeChild,
        ),
      );

      continue;
    }

    if (
      child.endsWith(
        ".ts",
      )
      || child.endsWith(
        ".tsx",
      )
    ) {
      result.push(
        child,
      );
    }
  }

  return result;
}

test(
  "production web composition registers exactly one truthful Noor Personal view without crossing privileged or fake-data boundaries",
  () => {
    const main =
      readRepositoryFile(
        "apps/web/src/main.tsx",
      );

    const view =
      readRepositoryFile(
        "apps/web/src/noor-personal-application-view.tsx",
      );

    assert.match(
      main,
      /from "\.\/noor-personal-application-view\.js"/u,
    );

    assert.equal(
      [
        ...main.matchAll(
          /appKey:\s*"noor-personal"/gu,
        ),
      ].length,
      1,
    );

    assert.match(
      main,
      /factory:\s*\(\)\s*=>\s*\(\s*<NoorPersonalApplicationView\s*\/>\s*\)/u,
    );

    assert.doesNotMatch(
      main,
      /appKey:\s*"noor-work"/u,
    );

    const productionPresentation =
      `${main}\n${view}`;

    for (
      const forbidden
      of [
        /@noor\/personal/u,
        /InMemoryFoundationStore/u,
        /production-adapter-test-doubles/u,
        /apps\/noor-runtime/u,
        /privileged-platform-runtime-host/u,
        /noor-privileged-supabase-client/u,
        /SUPABASE_SERVICE_ROLE_KEY/u,
      ]
    ) {
      assert.doesNotMatch(
        productionPresentation,
        forbidden,
      );
    }

    assert.doesNotMatch(
      view,
      /\bfetch\s*\(|\/api\/|nextPrayer|hijriDate|personalDay\b|\btasks\b|\bhabits\b/u,
    );
  },
);

test(
  "platform package remains free of React application-view ownership",
  () => {
    const platformSources =
      sourceFilesUnder(
        "packages/platform/src",
      )
        .map(
          path =>
            readFileSync(
              path,
              "utf8",
            ),
        )
        .join(
          "\n",
        );

    assert.doesNotMatch(
      platformSources,
      /from\s+["']react["']/u,
    );

    assert.doesNotMatch(
      platformSources,
      /\bApplicationView(?:Factory|Registry|Registration)?\b/u,
    );
  },
);
