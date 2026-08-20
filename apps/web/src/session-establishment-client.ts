export type SessionEstablishmentResult =
  | "authenticated"
  | "invalid-credentials"
  | "unavailable";

export type SessionEstablishmentFetch =
  typeof fetch;

export interface SessionEstablishmentClient {
  (
    proof:
      string,
    signal?:
      AbortSignal,
  ):
  Promise<SessionEstablishmentResult>;
}

export function createBrowserSessionEstablishmentClient(
  fetchImplementation:
    SessionEstablishmentFetch =
      fetch,
): SessionEstablishmentClient {
  return async (
    proof,
    signal,
  ) => {
    let response:
      Response;

    try {
      response =
        await fetchImplementation(
          "/api/noor/session",
          {
            method:
              "POST",
            credentials:
              "same-origin",
            cache:
              "no-store",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                proof,
              }),
            ...(signal
              ? {
                  signal,
                }
              : {}),
          },
        );
    } catch {
      return "unavailable";
    }

    if (
      response.status ===
      204
    ) {
      return "authenticated";
    }

    if (
      response.status === 400
      || response.status === 401
    ) {
      return "invalid-credentials";
    }

    return "unavailable";
  };
}
