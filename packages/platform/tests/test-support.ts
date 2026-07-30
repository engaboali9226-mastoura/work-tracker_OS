import {
  EntitlementGrant,
  UserId,
  VerifiedAuthentication,
  createAuthenticationAccountId,
  createEntitlementId,
  createSessionId,
  createSessionSnapshot,
} from "@worktracker/core";

import type {
  Clock,
  EntitlementRepository,
  SessionRepository,
  SessionSnapshot,
} from "@worktracker/core";

import type {
  PlatformApplicationBinding,
  PlatformCompositionConfiguration,
  PlatformRuntimeComponentDefinition,
} from "../src/index.js";

export interface TestDependencies {
  readonly configuration:
    PlatformCompositionConfiguration<string>;
  readonly sessions:
    Map<string, SessionSnapshot>;
  readonly entitlements:
    Map<string, EntitlementGrant>;
}

function createClock(
  epochMs: number,
): Clock {
  return {
    now: () =>
      ({
        toDate: () =>
          new Date(
            epochMs,
          ),
      }) as ReturnType<Clock["now"]>,
  };
}

export function createTestDependencies(
  platformComponents:
    readonly PlatformRuntimeComponentDefinition[] =
      [],
  applicationBindings:
    readonly PlatformApplicationBinding[] =
      [],
): TestDependencies {
  const sessions =
    new Map<string, SessionSnapshot>();

  const sessionRepository:
    SessionRepository = {
      async create(
        session,
      ) {
        sessions.set(
          session.id,
          session,
        );
      },

      async findById(
        id,
      ) {
        return sessions.get(id)
          ?? null;
      },

      async revoke(
        input,
      ) {
        const session =
          sessions.get(input.id);

        if (!session) {
          throw new Error(
            "Missing session.",
          );
        }

        sessions.set(
          input.id,
          createSessionSnapshot({
            ...session,
            revokedAtEpochMs:
              input.revokedAtEpochMs,
          }),
        );
      },
    };

  const entitlements =
    new Map<string, EntitlementGrant>();

  const entitlementRepository:
    EntitlementRepository = {
      async create(
        grant,
      ) {
        entitlements.set(
          grant.id,
          grant,
        );
      },

      async findByExactScope(
        scope,
      ) {
        return (
          [
            ...entitlements.values(),
          ].find(
            grant =>
              (
                grant.accountId
                  === scope.accountId
                && grant.action
                  === scope.action
                && grant.resourceType
                  === scope.resourceType
                && grant.resourceId
                  === scope.resourceId
              ),
          )
          ?? null
        );
      },

      async revoke(
        id,
        revokedAtEpochMs,
      ) {
        const grant =
          entitlements.get(id);

        if (!grant) {
          throw new Error(
            "Missing entitlement.",
          );
        }

        entitlements.set(
          id,
          EntitlementGrant.create({
            id:
              grant.id,
            accountId:
              grant.accountId,
            action:
              grant.action,
            resourceType:
              grant.resourceType,
            resourceId:
              grant.resourceId,
            grantedAtEpochMs:
              grant.grantedAtEpochMs,
            revokedAtEpochMs,
          }),
        );
      },
    };

  const accountId =
    createAuthenticationAccountId(
      "account-1",
    );

  return {
    sessions,
    entitlements,
    configuration: {
      dependencies: {
        clock:
          createClock(
            1_000,
          ),
        authentication: {
          verifier: {
            async verify(
              proof,
            ) {
              if (proof !== "valid-proof") {
                throw new Error(
                  "Invalid proof.",
                );
              }

              return new VerifiedAuthentication(
                accountId,
                new UserId(
                  "user-1",
                ),
              );
            },
          },
        },
        session: {
          idGenerator: {
            async generate() {
              return createSessionId(
                "session-id-00001",
              );
            },
          },
          lifetimePolicy: {
            calculateExpirationEpochMs(
              createdAtEpochMs,
            ) {
              return createdAtEpochMs
                + 60_000;
            },
          },
          repository:
            sessionRepository,
        },
        authorization: {
          entitlementIdGenerator: {
            async generate() {
              return createEntitlementId(
                "entitlement-00001",
              );
            },
          },
          repository:
            entitlementRepository,
        },
      },
      runtime: {
        platformComponents,
        applicationBindings,
      },
    },
  };
}
