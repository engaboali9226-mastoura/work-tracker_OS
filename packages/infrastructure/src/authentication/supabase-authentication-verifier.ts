import {
  AuthenticationUnavailableError,
  InvalidCredentialsError,
  VerifiedAuthentication,
  type AuthenticationVerifier,
} from "@worktracker/core";

import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  errors,
  jwtVerify,
  type JWTPayload,
} from "jose";

import {
  AuthenticationAccountLinkage,
} from "./authentication-account-linkage.js";

import type {
  AuthenticationAccountLinkageResolver,
} from "./authentication-account-linkage-resolver.js";

import {
  VerifiedExternalIdentity,
} from "./verified-external-identity.js";

const INVALID_CONFIGURATION_MESSAGE =
  "Supabase authentication verifier configuration is invalid.";

const JWKS_TIMEOUT_MS =
  5_000;

const JWKS_COOLDOWN_MS =
  30_000;

const JWKS_CACHE_MAX_AGE_MS =
  600_000;

const INTRINSIC_REFLECT_APPLY =
  Reflect.apply;

const LINKAGE_ACCOUNT_ID_GETTER =
  Object.getOwnPropertyDescriptor(
    AuthenticationAccountLinkage.prototype,
    "accountId",
  )?.get;

const LINKAGE_USER_ID_GETTER =
  Object.getOwnPropertyDescriptor(
    AuthenticationAccountLinkage.prototype,
    "userId",
  )?.get;

export type SupabaseAuthenticationAlgorithm =
  "ES256"
  | "RS256";

export interface SupabaseAuthenticationVerifierConfiguration {
  readonly expectedIssuer: string;
  readonly expectedAudience: string;
  readonly expectedAlgorithm:
    SupabaseAuthenticationAlgorithm;
}

function requireExactString(
  value: unknown,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim().length === 0
    || value.trim() !== value
  ) {
    throw new TypeError(
      INVALID_CONFIGURATION_MESSAGE,
    );
  }

  return value;
}

function requireAlgorithm(
  value: unknown,
): SupabaseAuthenticationAlgorithm {
  if (
    value !== "ES256"
    && value !== "RS256"
  ) {
    throw new TypeError(
      INVALID_CONFIGURATION_MESSAGE,
    );
  }

  return value;
}

function createJwksUrl(
  issuer: string,
): URL {
  let url: URL;

  try {
    url =
      new URL(
        issuer,
      );
  } catch {
    throw new TypeError(
      INVALID_CONFIGURATION_MESSAGE,
    );
  }

  if (
    url.protocol !== "https:"
    || url.username.length !== 0
    || url.password.length !== 0
    || url.search.length !== 0
    || url.hash.length !== 0
  ) {
    throw new TypeError(
      INVALID_CONFIGURATION_MESSAGE,
    );
  }

  const issuerPath =
    url.pathname.endsWith("/")
      ? url.pathname
      : `${url.pathname}/`;

  url.pathname =
    `${issuerPath}.well-known/jwks.json`;

  return url;
}

function isExactIdentityPart(
  value: unknown,
): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && value.trim().length > 0
    && value.trim() === value
  );
}

function canonicalInvalidCredentials():
  InvalidCredentialsError {
  return new InvalidCredentialsError();
}

function canonicalUnavailable():
  AuthenticationUnavailableError {
  return new AuthenticationUnavailableError();
}

function createVerifiedAuthenticationFromLinkage(
  linkage:
    AuthenticationAccountLinkage,
): VerifiedAuthentication {
  try {
    if (
      typeof LINKAGE_ACCOUNT_ID_GETTER
        !== "function"
      || typeof LINKAGE_USER_ID_GETTER
        !== "function"
    ) {
      throw new TypeError(
        "Canonical authentication account linkage accessors are unavailable.",
      );
    }

    const accountId =
      INTRINSIC_REFLECT_APPLY(
        LINKAGE_ACCOUNT_ID_GETTER,
        linkage,
        [],
      ) as AuthenticationAccountLinkage[
        "accountId"
      ];

    const userId =
      INTRINSIC_REFLECT_APPLY(
        LINKAGE_USER_ID_GETTER,
        linkage,
        [],
      ) as AuthenticationAccountLinkage[
        "userId"
      ];

    return new VerifiedAuthentication(
      accountId,
      userId,
    );
  } catch {
    throw canonicalUnavailable();
  }
}

function mapVerificationFailure(
  error: unknown,
):
  InvalidCredentialsError
  | AuthenticationUnavailableError {
  if (
    !(error instanceof errors.JOSEError)
  ) {
    return canonicalUnavailable();
  }

  switch (error.code) {
    case "ERR_JOSE_ALG_NOT_ALLOWED":
    case "ERR_JWS_INVALID":
    case "ERR_JWS_SIGNATURE_VERIFICATION_FAILED":
    case "ERR_JWT_CLAIM_VALIDATION_FAILED":
    case "ERR_JWT_EXPIRED":
    case "ERR_JWT_INVALID":
      return canonicalInvalidCredentials();

    case "ERR_JWK_INVALID":
    case "ERR_JWKS_INVALID":
    case "ERR_JWKS_MULTIPLE_MATCHING_KEYS":
    case "ERR_JWKS_NO_MATCHING_KEY":
    case "ERR_JWKS_TIMEOUT":
    case "ERR_JOSE_GENERIC":
    case "ERR_JOSE_NOT_SUPPORTED":
    default:
      return canonicalUnavailable();
  }
}

function isAuthenticatedUserPayload(
  payload: JWTPayload,
  expectedIssuer: string,
): payload is JWTPayload & {
  readonly iss: string;
  readonly sub: string;
  readonly role: "authenticated";
  readonly session_id: string;
  readonly is_anonymous: false;
} {
  return (
    payload.iss === expectedIssuer
    && isExactIdentityPart(
      payload.sub,
    )
    && payload.role === "authenticated"
    && isExactIdentityPart(
      payload.session_id,
    )
    && payload.is_anonymous === false
  );
}

export class SupabaseAuthenticationVerifier
implements AuthenticationVerifier<string> {
  readonly #issuer: string;
  readonly #audience: string;
  readonly #algorithm:
    SupabaseAuthenticationAlgorithm;

  readonly #linkageResolver:
    AuthenticationAccountLinkageResolver;

  readonly #jwks:
    ReturnType<typeof createRemoteJWKSet>;

  public constructor(
    configuration:
      SupabaseAuthenticationVerifierConfiguration,
    linkageResolver:
      AuthenticationAccountLinkageResolver,
  ) {
    if (
      typeof configuration !== "object"
      || configuration === null
      || typeof linkageResolver !== "object"
      || linkageResolver === null
      || typeof linkageResolver.resolve
        !== "function"
    ) {
      throw new TypeError(
        INVALID_CONFIGURATION_MESSAGE,
      );
    }

    this.#issuer =
      requireExactString(
        configuration.expectedIssuer,
      );

    this.#audience =
      requireExactString(
        configuration.expectedAudience,
      );

    this.#algorithm =
      requireAlgorithm(
        configuration.expectedAlgorithm,
      );

    this.#linkageResolver =
      linkageResolver;

    this.#jwks =
      createRemoteJWKSet(
        createJwksUrl(
          this.#issuer,
        ),
        {
          timeoutDuration:
            JWKS_TIMEOUT_MS,
          cooldownDuration:
            JWKS_COOLDOWN_MS,
          cacheMaxAge:
            JWKS_CACHE_MAX_AGE_MS,
        },
      );

    Object.freeze(
      this,
    );
  }

  public async verify(
    proof: string,
  ): Promise<VerifiedAuthentication> {
    if (
      typeof proof !== "string"
      || proof.length === 0
      || proof.trim().length === 0
      || proof.trim() !== proof
      || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
        proof,
      )
    ) {
      throw canonicalInvalidCredentials();
    }

    try {
      const header =
        decodeProtectedHeader(
          proof,
        );

      if (
        header.alg !==
        this.#algorithm
      ) {
        throw canonicalInvalidCredentials();
      }
    } catch (error: unknown) {
      if (
        error instanceof
        InvalidCredentialsError
      ) {
        throw error;
      }

      throw canonicalInvalidCredentials();
    }

    let payload: JWTPayload;

    try {
      const result =
        await jwtVerify(
          proof,
          this.#jwks,
          {
            algorithms: [
              this.#algorithm,
            ],
            issuer:
              this.#issuer,
            audience:
              this.#audience,
            requiredClaims: [
              "exp",
              "sub",
              "role",
              "session_id",
              "is_anonymous",
            ],
          },
        );

      payload =
        result.payload;
    } catch (error: unknown) {
      throw mapVerificationFailure(
        error,
      );
    }

    if (
      !isAuthenticatedUserPayload(
        payload,
        this.#issuer,
      )
    ) {
      throw canonicalInvalidCredentials();
    }

    let identity:
      VerifiedExternalIdentity;

    try {
      identity =
        VerifiedExternalIdentity.create(
          payload.iss,
          payload.sub,
        );
    } catch {
      throw canonicalInvalidCredentials();
    }

    let linkage:
      AuthenticationAccountLinkage
      | null;

    try {
      linkage =
        await this.#linkageResolver.resolve(
          identity,
        );
    } catch {
      throw canonicalUnavailable();
    }

    if (linkage === null) {
      throw canonicalInvalidCredentials();
    }

    return createVerifiedAuthenticationFromLinkage(
      linkage,
    );
  }
}
