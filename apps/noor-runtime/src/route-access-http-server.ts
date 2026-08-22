import {
  createServer,
} from "node:http";

import type {
  IncomingMessage,
  Server,
  ServerResponse,
} from "node:http";

import type {
  RouteAccessEvidenceRequest,
  RouteAccessEvidenceResponse,
} from "@worktracker/contracts";

import {
  InvalidRouteAccessEvidenceRequestError,
} from "./privileged-route-access-evidence-operation.js";

import {
  createSessionEstablishmentHttpHandler,
  SESSION_ESTABLISHMENT_HTTP_PATH,
} from "./session-establishment-http-handler.js";

import type {
  SessionEstablishmentExecutor,
  SessionEstablishmentHttpHandler,
} from "./session-establishment-http-handler.js";

export const ROUTE_ACCESS_EVIDENCE_HTTP_PATH =
  "/api/noor/route-access-evidence";

export const NOOR_SESSION_COOKIE_NAME =
  "noor_session";
export const PERSONAL_TODAY_HTTP_PATH = "/api/noor/personal/today";

export const MAX_ROUTE_ACCESS_REQUEST_BODY_BYTES =
  8_192;

const ROUTE_ACCESS_EVIDENCE_KINDS =
  new Set<RouteAccessEvidenceResponse["kind"]>([
    "authenticated-authorized",
    "authentication-required",
    "session-access-unavailable",
    "authorization-denied",
    "authorization-unavailable",
  ]);

const COOKIE_NAME_PATTERN =
  /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u;

const COOKIE_OCTET_PATTERN =
  /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/u;

export interface RouteAccessEvidenceExecutor {
  execute(
    input:
      Readonly<{
        request:
          RouteAccessEvidenceRequest;
        context:
          Readonly<{
            sessionId:
              string | null;
          }>;
      }>,
  ):
  Promise<RouteAccessEvidenceResponse>;
}

export interface RouteAccessHttpListenConfiguration {
  readonly host:
    string;
  readonly port:
    number;
}

export interface RouteAccessHttpServer {
  listen(
    configuration:
      RouteAccessHttpListenConfiguration,
  ):
  Promise<void>;

  close():
  Promise<void>;

  address():
  ReturnType<Server["address"]>;
}

export interface RouteAccessHttpServerOptions {
  readonly sessionEstablishment?:
    Readonly<{
      executor:
        SessionEstablishmentExecutor;
      publicOrigin:
        string;
      secureCookie:
        boolean;
    }>;
  readonly personalToday?: import("./personal-today-operation.js").PersonalTodayExecutor;
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(
      value,
    )
  );
}

function writeEmpty(
  response:
    ServerResponse,
  statusCode:
    number,
  headers:
    Readonly<Record<string, string>> = {},
): void {
  response.writeHead(
    statusCode,
    {
      "Cache-Control":
        "no-store",
      "Content-Length":
        "0",
      ...headers,
    },
  );

  response.end();
}

function writeEvidence(
  response:
    ServerResponse,
  evidence:
    RouteAccessEvidenceResponse,
): void {
  const body =
    JSON.stringify(
      evidence,
    );

  response.writeHead(
    200,
    {
      "Cache-Control":
        "no-store",
      "Content-Type":
        "application/json; charset=utf-8",
      "Content-Length":
        String(
          Buffer.byteLength(
            body,
          ),
        ),
    },
  );

  response.end(
    body,
  );
}

function writeJson(
  response:
    ServerResponse,
  statusCode:
    number,
  value:
    unknown,
): void {
  const body =
    JSON.stringify(
      value,
    );

  response.writeHead(
    statusCode,
    {
      "Cache-Control":
        "no-store",
      "Content-Type":
        "application/json; charset=utf-8",
      "Content-Length":
        String(
          Buffer.byteLength(
            body,
          ),
        ),
    },
  );

  response.end(
    body,
  );
}


function isSupportedContentType(
  value:
    string | undefined,
): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const parts =
    value
      .split(
        ";",
      )
      .map(
        part =>
          part.trim(),
      );

  const mediaType =
    parts.shift();

  if (
    mediaType?.toLowerCase()
    !== "application/json"
  ) {
    return false;
  }

  for (const parameter of parts) {
    if (
      !/^charset\s*=\s*(?:utf-8|"utf-8")$/iu.test(
        parameter,
      )
    ) {
      return false;
    }
  }

  return true;
}

function parseRouteAccessRequest(
  value:
    unknown,
): RouteAccessEvidenceRequest | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  if (
    keys.length !== 2
    || keys[0] !== "appKey"
    || keys[1] !== "pathname"
    || typeof value.appKey !== "string"
    || typeof value.pathname !== "string"
  ) {
    return undefined;
  }

  return Object.freeze({
    appKey:
      value.appKey,
    pathname:
      value.pathname,
  });
}

function sanitizeEvidence(
  value:
    unknown,
  request:
    RouteAccessEvidenceRequest,
): RouteAccessEvidenceResponse | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    typeof value.kind !== "string"
    || !ROUTE_ACCESS_EVIDENCE_KINDS.has(
      value.kind as RouteAccessEvidenceResponse["kind"],
    )
    || value.appKey !== request.appKey
    || value.pathname !== request.pathname
  ) {
    return undefined;
  }

  return Object.freeze({
    kind:
      value.kind as RouteAccessEvidenceResponse["kind"],
    appKey:
      request.appKey,
    pathname:
      request.pathname,
  });
}

export function sessionIdFromCookieHeader(
  cookieHeader:
    string | undefined,
): string | null {
  if (
    typeof cookieHeader !== "string"
    || cookieHeader.length === 0
  ) {
    return null;
  }

  let occurrences =
    0;

  let candidate:
    string | undefined;

  let malformed =
    false;

  for (
    const rawSegment
    of cookieHeader.split(
      ";",
    )
  ) {
    const segment =
      rawSegment.trim();

    if (segment.length === 0) {
      continue;
    }

    const equalsIndex =
      segment.indexOf(
        "=",
      );

    if (equalsIndex < 0) {
      if (
        segment ===
          NOOR_SESSION_COOKIE_NAME
        || segment.startsWith(
          `${NOOR_SESSION_COOKIE_NAME} `,
        )
      ) {
        occurrences +=
          1;

        malformed =
          true;
      }

      continue;
    }

    const rawName =
      segment.slice(
        0,
        equalsIndex,
      );

    const name =
      rawName.trim();

    if (
      !COOKIE_NAME_PATTERN.test(
        name,
      )
    ) {
      if (
        name ===
        NOOR_SESSION_COOKIE_NAME
      ) {
        occurrences +=
          1;

        malformed =
          true;
      }

      continue;
    }

    if (
      name !==
      NOOR_SESSION_COOKIE_NAME
    ) {
      continue;
    }

    occurrences +=
      1;

    const value =
      segment.slice(
        equalsIndex + 1,
      );

    if (
      rawName !== name
      || value.length === 0
      || !COOKIE_OCTET_PATTERN.test(
        value,
      )
    ) {
      malformed =
        true;

      continue;
    }

    candidate =
      value;
  }

  if (
    occurrences !== 1
    || malformed
    || candidate === undefined
  ) {
    return null;
  }

  return candidate;
}

async function readRequestBody(
  request:
    IncomingMessage,
): Promise<
  Readonly<
    | {
        kind:
          "body";
        body:
          string;
      }
    | {
        kind:
          "too-large";
      }
  >
> {
  const declaredLength =
    request.headers[
      "content-length"
    ];

  if (
    typeof declaredLength === "string"
    && /^[0-9]+$/u.test(
      declaredLength,
    )
    && Number(
      declaredLength,
    )
      > MAX_ROUTE_ACCESS_REQUEST_BODY_BYTES
  ) {
    request.resume();

    return Object.freeze({
      kind:
        "too-large",
    });
  }

  const chunks:
    Buffer[] =
      [];

  let bytes =
    0;

  for await (
    const chunk
    of request
  ) {
    const buffer =
      Buffer.isBuffer(
        chunk,
      )
        ? chunk
        : Buffer.from(
            chunk,
          );

    bytes +=
      buffer.length;

    if (
      bytes
      > MAX_ROUTE_ACCESS_REQUEST_BODY_BYTES
    ) {
      request.resume();

      return Object.freeze({
        kind:
          "too-large",
      });
    }

    chunks.push(
      buffer,
    );
  }

  return Object.freeze({
    kind:
      "body",
    body:
      Buffer.concat(
        chunks,
      ).toString(
        "utf8",
      ),
  });
}

function isEmptyJsonObject(
  value:
    unknown,
): boolean {
  return (
    isRecord(value)
    && Object.keys(
      value,
    ).length === 0
  );
}

async function handlePersonalToday(
  executor:
    import("./personal-today-operation.js").PersonalTodayExecutor,
  request:
    IncomingMessage,
  response:
    ServerResponse,
): Promise<void> {
  if (
    request.method !==
    "POST"
  ) {
    writeEmpty(
      response,
      405,
      {
        Allow:
          "POST",
      },
    );

    return;
  }

  if (
    !isSupportedContentType(
      request.headers[
        "content-type"
      ],
    )
  ) {
    writeEmpty(
      response,
      415,
    );

    return;
  }

  const bodyResult =
    await readRequestBody(
      request,
    );

  if (
    bodyResult.kind
    === "too-large"
  ) {
    writeEmpty(
      response,
      413,
    );

    return;
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        bodyResult.body,
      );
  } catch {
    writeEmpty(
      response,
      400,
    );

    return;
  }

  if (
    !isEmptyJsonObject(
      parsed,
    )
  ) {
    writeEmpty(
      response,
      400,
    );

    return;
  }

  const result =
    await executor.execute({
      sessionId:
        sessionIdFromCookieHeader(
          request.headers.cookie,
        ),
    });

  if (
    result.status
    === 200
  ) {
    if (
      result.body
      === undefined
    ) {
      writeEmpty(
        response,
        500,
      );

      return;
    }

    writeJson(
      response,
      200,
      result.body,
    );

    return;
  }

  if (
    result.status === 401
    || result.status === 403
    || result.status === 409
    || result.status === 503
  ) {
    writeEmpty(
      response,
      result.status,
    );

    return;
  }

  writeEmpty(
    response,
    500,
  );
}


async function handleRequest(
  executor:
    RouteAccessEvidenceExecutor,
  sessionHandler:
    SessionEstablishmentHttpHandler | undefined,
  personalToday:
    import("./personal-today-operation.js").PersonalTodayExecutor | undefined,
  request:
    IncomingMessage,
  response:
    ServerResponse,
): Promise<void> {
  if (
    request.url ===
      PERSONAL_TODAY_HTTP_PATH
  ) {
    if (!personalToday) {
      writeEmpty(
        response,
        404,
      );

      return;
    }

    await handlePersonalToday(
      personalToday,
      request,
      response,
    );

    return;
  }

  if (
    request.url ===
      SESSION_ESTABLISHMENT_HTTP_PATH
  ) {
    if (!sessionHandler) {
      writeEmpty(
        response,
        404,
      );

      return;
    }

    await sessionHandler
      .handle(
        request,
        response,
      );

    return;
  }

  if (
    request.url !==
    ROUTE_ACCESS_EVIDENCE_HTTP_PATH
  ) {
    writeEmpty(
      response,
      404,
    );

    return;
  }

  if (
    request.method !==
    "POST"
  ) {
    writeEmpty(
      response,
      405,
      {
        Allow:
          "POST",
      },
    );

    return;
  }

  if (
    !isSupportedContentType(
      request.headers[
        "content-type"
      ],
    )
  ) {
    writeEmpty(
      response,
      415,
    );

    return;
  }

  const bodyResult =
    await readRequestBody(
      request,
    );

  if (
    bodyResult.kind ===
    "too-large"
  ) {
    writeEmpty(
      response,
      413,
    );

    return;
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        bodyResult.body,
      );
  } catch {
    writeEmpty(
      response,
      400,
    );

    return;
  }

  const routeRequest =
    parseRouteAccessRequest(
      parsed,
    );

  if (!routeRequest) {
    writeEmpty(
      response,
      400,
    );

    return;
  }

  const sessionId =
    sessionIdFromCookieHeader(
      request.headers.cookie,
    );

  try {
    const evidence =
      await executor
        .execute({
          request:
            routeRequest,
          context: {
            sessionId,
          },
        });

    const sanitized =
      sanitizeEvidence(
        evidence,
        routeRequest,
      );

    if (!sanitized) {
      writeEmpty(
        response,
        500,
      );

      return;
    }

    writeEvidence(
      response,
      sanitized,
    );
  } catch (error: unknown) {
    if (
      error instanceof
        InvalidRouteAccessEvidenceRequestError
    ) {
      writeEmpty(
        response,
        400,
      );

      return;
    }

    writeEmpty(
      response,
      500,
    );
  }
}

export function createRouteAccessHttpServer(
  executor:
    RouteAccessEvidenceExecutor,
  options:
    RouteAccessHttpServerOptions = {},
): RouteAccessHttpServer {
  const sessionHandler =
    options.sessionEstablishment
      ? createSessionEstablishmentHttpHandler(
          options.sessionEstablishment,
        )
      : undefined;

  const server =
    createServer(
      (
        request,
        response,
      ) => {
        void handleRequest(
          executor,
          sessionHandler,
          options.personalToday,
          request,
          response,
        ).catch(
          () => {
            if (
              response.headersSent
            ) {
              response.destroy();

              return;
            }

            writeEmpty(
              response,
              500,
            );
          },
        );
      },
    );

  return Object.freeze({
    listen:
      (
        configuration:
          RouteAccessHttpListenConfiguration,
      ) =>
        new Promise<void>(
          (
            resolve,
            reject,
          ) => {
            const onError =
              (
                error:
                  Error,
              ) => {
                server.off(
                  "listening",
                  onListening,
                );

                reject(
                  error,
                );
              };

            const onListening =
              () => {
                server.off(
                  "error",
                  onError,
                );

                resolve();
              };

            server.once(
              "error",
              onError,
            );

            server.once(
              "listening",
              onListening,
            );

            server.listen(
              configuration.port,
              configuration.host,
            );
          },
        ),

    close:
      () => {
        if (!server.listening) {
          return Promise.resolve();
        }

        return new Promise<void>(
          (
            resolve,
            reject,
          ) => {
            server.close(
              error => {
                if (error) {
                  reject(
                    error,
                  );

                  return;
                }

                resolve();
              },
            );
          },
        );
      },

    address:
      () =>
        server.address(),
  });
}
