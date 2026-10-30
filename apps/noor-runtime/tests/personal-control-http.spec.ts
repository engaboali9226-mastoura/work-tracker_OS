import assert from "node:assert/strict";
import test from "node:test";

import {
  PERSONAL_COMMAND_HTTP_PATH,
  PERSONAL_WORKSPACE_HTTP_PATH,
  createRouteAccessHttpServer,
} from "../src/route-access-http-server.js";

import type {
  RouteAccessEvidenceExecutor,
} from "../src/route-access-http-server.js";

const routeExecutor:
  RouteAccessEvidenceExecutor =
  {
    async execute() {
      return {
        kind: "authentication-required",
        appKey: "noor-personal",
        pathname: "/personal",
      };
    },
  };

async function withServer(
  body: (
    origin: string,
  ) => Promise<void>,
): Promise<void> {
  const seen: any[] = [];

  const server =
    createRouteAccessHttpServer(
      routeExecutor,
      {
        personalControl: {
          async readWorkspace(input) {
            seen.push([
              "workspace",
              input,
            ]);

            return {
              status: 200,
              body: {
                definitions: [],
                insights: {
                  currentLocalDate:
                    "2026-10-24",
                },
              },
            };
          },

          async executeCommand(input) {
            seen.push([
              "command",
              input,
            ]);

            return {
              status: 204,
            };
          },
        },
      },
    );

  await server.listen({
    host: "127.0.0.1",
    port: 0,
  });

  const address =
    server.address();

  assert.ok(
    address,
  );
  assert.notEqual(
    typeof address,
    "string",
  );

  if (
    !address
    || typeof address === "string"
  ) {
    throw new Error(
      "listener unavailable",
    );
  }

  try {
    await body(
      `http://127.0.0.1:${address.port}`,
    );

    assert.deepEqual(
      seen,
      [
        [
          "workspace",
          {
            sessionId:
              "session-1",
          },
        ],
        [
          "command",
          {
            sessionId:
              "session-1",
            command: {
              type:
                "create-definition",
              kind:
                "Habit",
              title:
                "المشي",
              category:
                "الصحة والرياضة",
              startDate:
                "2026-10-24",
              endDate:
                null,
              scheduleKind:
                "Daily",
              weekdays:
                [],
              importance:
                "Supporting",
            },
          },
        ],
      ],
    );
  } finally {
    await server.close();
  }
}

test(
  "Personal control HTTP endpoints preserve only the opaque session cookie as trusted context",
  async () => {
    await withServer(
      async origin => {
        const workspace =
          await fetch(
            `${origin}${PERSONAL_WORKSPACE_HTTP_PATH}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Cookie:
                  "noor_session=session-1",
              },
              body: "{}",
            },
          );

        assert.equal(
          workspace.status,
          200,
        );

        assert.equal(
          workspace.headers
            .get("cache-control"),
          "no-store",
        );

        const command =
          await fetch(
            `${origin}${PERSONAL_COMMAND_HTTP_PATH}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Cookie:
                  "noor_session=session-1",
              },
              body:
                JSON.stringify({
                  type:
                    "create-definition",
                  kind:
                    "Habit",
                  title:
                    "المشي",
                  category:
                    "الصحة والرياضة",
                  startDate:
                    "2026-10-24",
                  endDate:
                    null,
                  scheduleKind:
                    "Daily",
                  weekdays:
                    [],
                  importance:
                    "Supporting",
                }),
            },
          );

        assert.equal(
          command.status,
          204,
        );
        assert.equal(
          await command.text(),
          "",
        );
      },
    );
  },
);
