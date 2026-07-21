import {
  USER_CONTEXT_PRINCIPAL_KINDS,
  hasSameUserContextIdentity,
  type UserContext,
  type UserContextCandidate,
  type UserContextPrincipalKind,
} from "./user-context.js";

import type {
  UserContextProvider,
  UserContextResolver,
} from "./user-context-provider.js";

import {
  UserContextInvalidError,
  UserContextMismatchError,
  UserContextMissingError,
} from "./user-context.errors.js";

const SECRET_ATTRIBUTE_PATTERN =
  /(password|passwd|token|secret|private[_-]?key|refresh[_-]?token|credential)/i;

function requireNonEmptyString(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== "string"
    || value.trim().length === 0
  ) {
    throw new UserContextInvalidError(
      `${field} must be a non-empty string.`,
      field,
    );
  }

  return value.trim();
}

function optionalNonEmptyString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireNonEmptyString(value, field);
}

function requirePrincipalKind(
  value: unknown,
): UserContextPrincipalKind {
  if (
    typeof value !== "string"
    || !USER_CONTEXT_PRINCIPAL_KINDS.includes(
      value as UserContextPrincipalKind,
    )
  ) {
    throw new UserContextInvalidError(
      "principalKind must be a supported principal kind.",
      "principalKind",
    );
  }

  return value as UserContextPrincipalKind;
}

function cloneSafeValue(
  value: unknown,
  valuePath: string,
  seen: Set<object>,
): unknown {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || value === undefined
  ) {
    return value;
  }

  if (typeof value !== "object") {
    throw new UserContextInvalidError(
      `${valuePath} contains an unsupported value.`,
      valuePath,
    );
  }

  if (seen.has(value)) {
    throw new UserContextInvalidError(
      `${valuePath} contains a circular value.`,
      valuePath,
    );
  }

  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return Object.freeze(
        value.map(
          (item, index) =>
            cloneSafeValue(
              item,
              `${valuePath}[${index}]`,
              seen,
            ),
        ),
      );
    }

    const prototype =
      Object.getPrototypeOf(value);

    if (
      prototype !== Object.prototype
      && prototype !== null
    ) {
      throw new UserContextInvalidError(
        `${valuePath} must contain plain data only.`,
        valuePath,
      );
    }

    const cloned: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      if (SECRET_ATTRIBUTE_PATTERN.test(key)) {
        throw new UserContextInvalidError(
          `${valuePath} contains a prohibited secret field.`,
          `${valuePath}.${key}`,
        );
      }

      cloned[key] = cloneSafeValue(
        item,
        `${valuePath}.${key}`,
        seen,
      );
    }

    return Object.freeze(cloned);
  } finally {
    seen.delete(value);
  }
}

function resolveAttributes(
  value: unknown,
): Readonly<Record<string, unknown>> {
  if (value === undefined) {
    return Object.freeze({});
  }

  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw new UserContextInvalidError(
      "attributes must be a plain object.",
      "attributes",
    );
  }

  return cloneSafeValue(
    value,
    "attributes",
    new Set<object>(),
  ) as Readonly<Record<string, unknown>>;
}

export class DefaultUserContextResolver
implements UserContextResolver {
  public async resolve(
    provider: UserContextProvider,
  ): Promise<UserContext> {
    return this.resolveCandidate(
      await provider.getCurrent(),
    );
  }

  public resolveCandidate(
    candidate: UserContextCandidate | null,
  ): UserContext {
    if (candidate === null) {
      throw new UserContextMissingError();
    }

    if (
      typeof candidate !== "object"
      || Array.isArray(candidate)
    ) {
      throw new UserContextInvalidError(
        "The user context candidate must be an object.",
      );
    }

    const sessionId =
      optionalNonEmptyString(
        candidate.sessionId,
        "sessionId",
      );

    const authorizationScope =
      optionalNonEmptyString(
        candidate.authorizationScope,
        "authorizationScope",
      );

    const context: UserContext = {
      userId:
        requireNonEmptyString(
          candidate.userId,
          "userId",
        ),
      principalKind:
        requirePrincipalKind(
          candidate.principalKind,
        ),
      correlationId:
        requireNonEmptyString(
          candidate.correlationId,
          "correlationId",
        ),
      attributes:
        resolveAttributes(
          candidate.attributes,
        ),
      ...(sessionId === undefined
        ? {}
        : { sessionId }),
      ...(authorizationScope === undefined
        ? {}
        : { authorizationScope }),
    };

    return Object.freeze(context);
  }

  public assertCompatible(
    root: UserContext,
    nested: UserContext,
  ): void {
    if (!hasSameUserContextIdentity(root, nested)) {
      throw new UserContextMismatchError();
    }
  }
}

export function createUserContextResolver(): UserContextResolver {
  return new DefaultUserContextResolver();
}
