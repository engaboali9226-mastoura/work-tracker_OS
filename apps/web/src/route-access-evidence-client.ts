import type {
  ApplicationKey,
} from "@worktracker/core";

export interface RouteAccessEvidenceClientRequest {
  readonly appKey:
    ApplicationKey;
  readonly pathname:
    string;
}

export type RouteAccessEvidenceClient =
  (
    request:
      RouteAccessEvidenceClientRequest,
    signal?:
      AbortSignal,
  ) => Promise<unknown>;

export type RouteAccessEvidenceFetch =
  (
    input:
      RequestInfo | URL,
    init?:
      RequestInit,
  ) => Promise<Response>;

const ROUTE_ACCESS_ENDPOINT =
  "/api/noor/route-access-evidence";

function hasJsonContentType(
  response:
    Response,
): boolean {
  const contentType =
    response.headers.get(
      "content-type",
    );

  if (!contentType) {
    return false;
  }

  return (
    contentType
      .split(
        ";",
        1,
      )[0]
      ?.trim()
      .toLowerCase()
    === "application/json"
  );
}

export function createBrowserRouteAccessEvidenceClient(
  fetchImplementation:
    RouteAccessEvidenceFetch =
      (
        input,
        init,
      ) =>
        globalThis.fetch(
          input,
          init,
        ),
): RouteAccessEvidenceClient {
  return async (
    request,
    signal,
  ) => {
    const response =
      await fetchImplementation(
        ROUTE_ACCESS_ENDPOINT,
        {
          method:
            "POST",

          credentials:
            "same-origin",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              appKey:
                request.appKey,
              pathname:
                request.pathname,
            }),

          ...(signal
            ? {
                signal,
              }
            : {}),
        },
      );

    if (
      !response.ok
      || !hasJsonContentType(
        response,
      )
    ) {
      throw new Error(
        "Route access evidence transport is unavailable.",
      );
    }

    try {
      return await response.json();
    } catch {
      throw new Error(
        "Route access evidence transport is unavailable.",
      );
    }
  };
}
