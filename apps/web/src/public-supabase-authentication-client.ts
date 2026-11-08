import {
  createClient,
} from "@supabase/supabase-js";

import type {
  PublicAuthenticationConfiguration,
} from "./public-authentication-environment.js";

export type PublicAuthenticationResult =
  | Readonly<{
      kind:
        "authenticated";
      proof:
        string;
    }>
  | Readonly<{
      kind:
        "invalid-credentials";
    }>
  | Readonly<{
      kind:
        "unavailable";
    }>;

export interface PublicAuthenticationCredentials {
  readonly email:
    string;

  readonly password:
    string;
}

export interface PublicAuthenticationClient {
  authenticate(
    credentials:
      PublicAuthenticationCredentials,
  ):
  Promise<PublicAuthenticationResult>;
}

export interface PublicSupabaseClient {
  readonly auth:
    Readonly<{
      signInWithPassword(
        credentials:
          Readonly<{
            email:
              string;
            password:
              string;
          }>,
      ):
      Promise<
        Readonly<{
          data:
            Readonly<{
              session:
                Readonly<{
                  access_token:
                    string;
                }>
                | null;
            }>;
          error:
            Readonly<{
              status?:
                number;
            }>
            | null;
        }>
      >;
    }>;
}

export type PublicSupabaseClientFactory =
  (
    url:
      string,
    publishableKey:
      string,
    options:
      Readonly<{
        auth:
          Readonly<{
            persistSession:
              false;
            autoRefreshToken:
              false;
            detectSessionInUrl:
              false;
          }>;
      }>,
  ) => PublicSupabaseClient;

const defaultFactory:
  PublicSupabaseClientFactory =
  (
    url,
    publishableKey,
    options,
  ) =>
    createClient(
      url,
      publishableKey,
      options,
    ) as unknown as
      PublicSupabaseClient;

function validCredentials(
  credentials:
    PublicAuthenticationCredentials,
): boolean {
  return (
    typeof credentials.email === "string"
    && credentials.email.length > 0
    && typeof credentials.password === "string"
    && credentials.password.length > 0
  );
}

export function createBrowserPublicSupabaseAuthenticationClient(
  configuration:
    PublicAuthenticationConfiguration,
  factory:
    PublicSupabaseClientFactory =
      defaultFactory,
): PublicAuthenticationClient {
  const client =
    factory(
      configuration.supabaseUrl,
      configuration
        .supabasePublishableKey,
      {
        auth: {
          persistSession:
            false,
          autoRefreshToken:
            false,
          detectSessionInUrl:
            false,
        },
      },
    );

  return Object.freeze({
    async authenticate(
      credentials,
    ) {
      if (
        !validCredentials(
          credentials,
        )
      ) {
        return Object.freeze({
          kind:
            "invalid-credentials",
        });
      }

      try {
        const result =
          await client
            .auth
            .signInWithPassword({
              email:
                credentials.email,
              password:
                credentials.password,
            });

        if (result.error) {
          const status =
            result.error.status;

          if (
            typeof status === "number"
            && status >= 400
            && status < 500
          ) {
            return Object.freeze({
              kind:
                "invalid-credentials",
            });
          }

          return Object.freeze({
            kind:
              "unavailable",
          });
        }

        const proof =
          result.data
            .session
            ?.access_token;

        if (
          typeof proof !== "string"
          || proof.length === 0
        ) {
          return Object.freeze({
            kind:
              "invalid-credentials",
          });
        }

        return Object.freeze({
          kind:
            "authenticated",
          proof,
        });
      } catch {
        return Object.freeze({
          kind:
            "unavailable",
        });
      }
    },
  });
}
