import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const applicationRoot =
  process.cwd();

const repositoryRoot =
  path.resolve(
    applicationRoot,
    "../..",
  );

function read(
  repositoryPath:
    string,
): string {

  return fs.readFileSync(
    path.join(
      repositoryRoot,
      repositoryPath,
    ),
    "utf8",
  );

}

test(
  "Core Authentication barrel exposes exactly the approved symbols",
  () => {

    const expected =
`export type {
  AuthenticationAccountId,
} from "./authentication-account-id";

export {
  createAuthenticationAccountId,
} from "./authentication-account-id";

export {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
  InvalidCredentialsError,
} from "./authentication-errors";

export type {
  AuthenticationVerifier,
} from "./authentication-verifier";

export {
  VerifiedAuthentication,
} from "./verified-authentication";
`;

    assert.equal(
      read(
        "packages/core/src/authentication/index.ts",
      ),
      expected,
    );

  },
);

test(
  "Application Authentication barrel exposes exactly the approved symbols",
  () => {

    const expected =
`export type {
  AuthenticationRequest,
} from "./authentication-request.js";

export {
  Authenticate,
} from "./authenticate.js";
`;

    assert.equal(
      read(
        "packages/application/src/authentication/index.ts",
      ),
      expected,
    );

  },
);

test(
  "Package roots expose Authentication through one additive barrel each",
  () => {

    const coreRoot =
      read(
        "packages/core/src/index.ts",
      );

    const applicationRootIndex =
      read(
        "packages/application/src/index.ts",
      );

    assert.equal(
      (
        coreRoot.match(
          /export \* from "\.\/authentication";/g,
        ) ?? []
      ).length,
      1,
    );

    assert.equal(
      (
        applicationRootIndex.match(
          /export \* from "\.\/authentication\/index\.js";/g,
        ) ?? []
      ).length,
      1,
    );

  },
);

test(
  "Application declares the exact approved Core workspace dependency",
  () => {

    const application =
      JSON.parse(
        read(
          "packages/application/package.json",
        ),
      );

    const lock =
      JSON.parse(
        read(
          "package-lock.json",
        ),
      );

    assert.equal(
      application.dependencies?.[
        "@worktracker/core"
      ],
      "0.0.1",
    );

    assert.equal(
      lock.packages[
        "packages/application"
      ].dependencies?.[
        "@worktracker/core"
      ],
      "0.0.1",
    );

  },
);
