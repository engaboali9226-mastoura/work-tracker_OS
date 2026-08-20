export const NOOR_SESSION_COOKIE_NAME =
  "noor_session";

const COOKIE_OCTET_PATTERN =
  /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/u;

export interface NoorSessionCookieSnapshot {
  readonly id:
    string;
  readonly expiresAtEpochMs:
    number;
}

export interface NoorSessionCookieConfiguration {
  readonly secure:
    boolean;
}

function requireCookieSessionId(
  value:
    string,
): string {
  if (
    value.length === 0
    || !COOKIE_OCTET_PATTERN.test(
      value,
    )
  ) {
    throw new Error(
      "Noor session cookie value is invalid.",
    );
  }

  return value;
}

function expirationDate(
  expiresAtEpochMs:
    number,
): Date {
  if (
    !Number.isSafeInteger(
      expiresAtEpochMs,
    )
    || expiresAtEpochMs < 0
  ) {
    throw new Error(
      "Noor session cookie expiration is invalid.",
    );
  }

  const flooredEpochMs =
    Math.floor(
      expiresAtEpochMs / 1_000,
    ) * 1_000;

  return new Date(
    flooredEpochMs,
  );
}

export function serializeNoorSessionCookie(
  session:
    NoorSessionCookieSnapshot,
  configuration:
    NoorSessionCookieConfiguration,
): string {
  const parts =
    [
      `${NOOR_SESSION_COOKIE_NAME}=${requireCookieSessionId(
        session.id,
      )}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      `Expires=${expirationDate(
        session.expiresAtEpochMs,
      ).toUTCString()}`,
    ];

  if (configuration.secure) {
    parts.push(
      "Secure",
    );
  }

  return parts.join(
    "; ",
  );
}

export function serializeNoorSessionClearingCookie(
  configuration:
    NoorSessionCookieConfiguration,
): string {
  const parts =
    [
      `${NOOR_SESSION_COOKIE_NAME}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      "Max-Age=0",
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ];

  if (configuration.secure) {
    parts.push(
      "Secure",
    );
  }

  return parts.join(
    "; ",
  );
}
