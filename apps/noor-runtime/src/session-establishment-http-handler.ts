import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import {
  AuthenticationUnavailableError,
  InvalidAuthenticationRequestError,
  InvalidCredentialsError,
  InvalidSessionRequestError,
  SessionUnavailableError,
} from "@worktracker/core";

import type {
  SessionSnapshot,
} from "@worktracker/core";

import {
  serializeNoorSessionCookie,
} from "./session-cookie.js";

export const SESSION_ESTABLISHMENT_HTTP_PATH =
  "/api/noor/session";

export const MAX_SESSION_ESTABLISHMENT_REQUEST_BODY_BYTES =
  8_192;

export interface SessionEstablishmentExecutor {
  execute(
    input:
      Readonly<{
        proof:
          string;
      }>,
  ):
  Promise<SessionSnapshot>;
}

export interface SessionEstablishmentHttpHandler {
  handle(
    request:
      IncomingMessage,
    response:
      ServerResponse,
  ):
  Promise<void>;
}

export interface SessionEstablishmentHttpHandlerDependencies {
  readonly executor:
    SessionEstablishmentExecutor;

  readonly publicOrigin:
    string;

  readonly secureCookie:
    boolean;
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

function singleOriginHeader(
  request:
    IncomingMessage,
): string | undefined {
  let count =
    0;

  let value:
    string | undefined;

  for (
    let index = 0;
    index < request.rawHeaders.length;
    index += 2
  ) {
    const name =
      request.rawHeaders[
        index
      ];

    if (
      name?.toLowerCase()
      !== "origin"
    ) {
      continue;
    }

    count +=
      1;

    value =
      request.rawHeaders[
        index + 1
      ];
  }

  if (count !== 1) {
    return undefined;
  }

  return value;
}

function originMatches(
  request:
    IncomingMessage,
  publicOrigin:
    string,
): boolean {
  const value =
    singleOriginHeader(
      request,
    );

  if (
    value === undefined
    || value === "null"
  ) {
    return false;
  }

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        value,
      );
  } catch {
    return false;
  }

  if (
    parsed.username.length > 0
    || parsed.password.length > 0
    || parsed.pathname !== "/"
    || parsed.search.length > 0
    || parsed.hash.length > 0
    || parsed.origin !== value
  ) {
    return false;
  }

  return (
    parsed.origin ===
      publicOrigin
  );
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
      > MAX_SESSION_ESTABLISHMENT_REQUEST_BODY_BYTES
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
      > MAX_SESSION_ESTABLISHMENT_REQUEST_BODY_BYTES
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

function parseRequest(
  value:
    unknown,
): Readonly<{
  proof:
    string;
}> | undefined {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(
      value,
    )
  ) {
    return undefined;
  }

  const record =
    value as
      Record<string, unknown>;

  const keys =
    Object.keys(
      record,
    ).sort();

  if (
    keys.length !== 1
    || keys[0] !== "proof"
    || typeof record.proof !== "string"
    || record.proof.length === 0
  ) {
    return undefined;
  }

  return Object.freeze({
    proof:
      record.proof,
  });
}

export function createSessionEstablishmentHttpHandler(
  dependencies:
    SessionEstablishmentHttpHandlerDependencies,
): SessionEstablishmentHttpHandler {
  return Object.freeze({
    async handle(
      request:
        IncomingMessage,
      response:
        ServerResponse,
    ) {
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
        !originMatches(
          request,
          dependencies.publicOrigin,
        )
      ) {
        writeEmpty(
          response,
          403,
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

      const sessionRequest =
        parseRequest(
          parsed,
        );

      if (!sessionRequest) {
        writeEmpty(
          response,
          400,
        );

        return;
      }

      try {
        const session =
          await dependencies
            .executor
            .execute(
              sessionRequest,
            );

        const cookie =
          serializeNoorSessionCookie(
            session,
            {
              secure:
                dependencies
                  .secureCookie,
            },
          );

        writeEmpty(
          response,
          204,
          {
            "Set-Cookie":
              cookie,
          },
        );
      } catch (error: unknown) {
        if (
          error instanceof
            InvalidCredentialsError
          || error instanceof
            InvalidAuthenticationRequestError
        ) {
          writeEmpty(
            response,
            401,
          );

          return;
        }

        if (
          error instanceof
            AuthenticationUnavailableError
          || error instanceof
            SessionUnavailableError
          || error instanceof
            InvalidSessionRequestError
        ) {
          writeEmpty(
            response,
            503,
          );

          return;
        }

        writeEmpty(
          response,
          500,
        );
      }
    },
  });
}
