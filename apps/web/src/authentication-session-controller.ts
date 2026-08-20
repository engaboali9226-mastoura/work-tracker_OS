import type {
  PublicAuthenticationClient,
  PublicAuthenticationCredentials,
} from "./public-supabase-authentication-client.js";

import type {
  SessionEstablishmentClient,
  SessionEstablishmentResult,
} from "./session-establishment-client.js";

export type AuthenticationSessionState =
  | Readonly<{
      kind:
        "idle";
    }>
  | Readonly<{
      kind:
        "submitting";
    }>
  | Readonly<{
      kind:
        "authenticated";
    }>
  | Readonly<{
      kind:
        "invalid-credentials";
    }>
  | Readonly<{
      kind:
        "unavailable";
    }>;

export interface AuthenticationSessionController {
  subscribe(
    listener:
      () => void,
  ):
  () => void;

  snapshot():
  AuthenticationSessionState;

  signIn(
    credentials:
      PublicAuthenticationCredentials,
  ):
  Promise<void>;
}

export interface AuthenticationSessionControllerDependencies {
  readonly authenticationClient:
    PublicAuthenticationClient;

  readonly sessionClient:
    SessionEstablishmentClient;

  readonly onAuthenticated:
    () => void;
}

export function createAuthenticationSessionController(
  dependencies:
    AuthenticationSessionControllerDependencies,
): AuthenticationSessionController {
  const listeners =
    new Set<
      () => void
    >();

  let state:
    AuthenticationSessionState =
      Object.freeze({
        kind:
          "idle",
      });

  let generation =
    0;

  let activeSessionRequest:
    Readonly<{
      abortController:
        AbortController;
      completion:
        Promise<SessionEstablishmentResult>;
    }>
    | undefined;

  const publish =
    (
      next:
        AuthenticationSessionState,
    ) => {
      state =
        next;

      for (const listener of listeners) {
        listener();
      }
    };

  return Object.freeze({
    subscribe(
      listener,
    ) {
      listeners.add(
        listener,
      );

      return () => {
        listeners.delete(
          listener,
        );
      };
    },

    snapshot() {
      return state;
    },

    async signIn(
      credentials,
    ) {
      generation +=
        1;

      const current =
        generation;

      const supersededSessionRequest =
        activeSessionRequest;

      supersededSessionRequest
        ?.abortController
        .abort();

      publish(
        Object.freeze({
          kind:
            "submitting",
        }),
      );

      const authentication =
        await dependencies
          .authenticationClient
          .authenticate(
            credentials,
          );

      if (
        current !== generation
      ) {
        return;
      }

      if (
        authentication.kind ===
        "invalid-credentials"
      ) {
        publish(
          Object.freeze({
            kind:
              "invalid-credentials",
          }),
        );

        return;
      }

      if (
        authentication.kind ===
        "unavailable"
      ) {
        publish(
          Object.freeze({
            kind:
              "unavailable",
          }),
        );

        return;
      }

      if (supersededSessionRequest) {
        try {
          await supersededSessionRequest
            .completion;
        } catch {
        }

        if (
          current !== generation
        ) {
          return;
        }
      }

      const abortController =
        new AbortController();

      const completion =
        dependencies
          .sessionClient(
            authentication.proof,
            abortController.signal,
          );

      const sessionRequest =
        Object.freeze({
          abortController,
          completion,
        });

      activeSessionRequest =
        sessionRequest;

      let established:
        SessionEstablishmentResult;

      try {
        established =
          await completion;
      } finally {
        if (
          activeSessionRequest
          === sessionRequest
        ) {
          activeSessionRequest =
            undefined;
        }
      }

      if (
        current !== generation
      ) {
        return;
      }

      if (
        established ===
        "invalid-credentials"
      ) {
        publish(
          Object.freeze({
            kind:
              "invalid-credentials",
          }),
        );

        return;
      }

      if (
        established ===
        "unavailable"
      ) {
        publish(
          Object.freeze({
            kind:
              "unavailable",
          }),
        );

        return;
      }

      dependencies
        .onAuthenticated();

      publish(
        Object.freeze({
          kind:
            "authenticated",
        }),
      );
    },
  });
}
