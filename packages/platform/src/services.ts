import {
  Authenticate,
  Authorize,
  CreateSession,
  CurrentUserDataAccess,
  DefaultUserContextResolver,
  GrantEntitlement,
  ResolveSession,
  RevokeEntitlement,
  RevokeSession,
  UserDataScopeResolver,
} from "@worktracker/application";

import type {
  UserContextResolver,
} from "@worktracker/application";

import {
  applicationCatalog,
} from "@worktracker/core";

import type {
  ApplicationCatalog,
  UserOwnedRecord,
  UserScopedRepository,
} from "@worktracker/core";

import type {
  PlatformServiceDependencies,
} from "./contracts.js";

export interface PlatformIsolationServices {
  readonly scopeResolver:
    UserDataScopeResolver;

  createCurrentUserDataAccess<
    TEntity extends UserOwnedRecord,
    TId,
    TQuery
  >(
    repository:
      UserScopedRepository<
        TEntity,
        TId,
        TQuery
      >,
  ): CurrentUserDataAccess<
    TEntity,
    TId,
    TQuery
  >;
}

export interface PlatformServices<
  Proof
> {
  readonly applicationCatalog:
    ApplicationCatalog;

  readonly authentication: Readonly<{
    authenticate:
      Authenticate<Proof>;
  }>;

  readonly session: Readonly<{
    create:
      CreateSession;
    resolve:
      ResolveSession;
    revoke:
      RevokeSession;
  }>;

  readonly authorization: Readonly<{
    authorize:
      Authorize;
    grant:
      GrantEntitlement;
    revoke:
      RevokeEntitlement;
  }>;

  readonly userContext: Readonly<{
    resolver:
      UserContextResolver;
  }>;

  readonly isolation:
    PlatformIsolationServices;
}

export function createPlatformServices<
  Proof
>(
  dependencies:
    PlatformServiceDependencies<Proof>,
): PlatformServices<Proof> {
  const userDataScopeResolver =
    new UserDataScopeResolver();

  const isolation:
    PlatformIsolationServices =
    Object.freeze({
      scopeResolver:
        userDataScopeResolver,

      createCurrentUserDataAccess: <
        TEntity extends UserOwnedRecord,
        TId,
        TQuery
      >(
        repository:
          UserScopedRepository<
            TEntity,
            TId,
            TQuery
          >,
      ) =>
        new CurrentUserDataAccess<
          TEntity,
          TId,
          TQuery
        >(
          repository,
          userDataScopeResolver,
        ),
    });

  return Object.freeze({
    applicationCatalog,

    authentication:
      Object.freeze({
        authenticate:
          new Authenticate(
            dependencies
              .authentication
              .verifier,
          ),
      }),

    session:
      Object.freeze({
        create:
          new CreateSession(
            dependencies
              .session
              .idGenerator,
            dependencies.clock,
            dependencies
              .session
              .lifetimePolicy,
            dependencies
              .session
              .repository,
          ),
        resolve:
          new ResolveSession(
            dependencies
              .session
              .repository,
            dependencies.clock,
          ),
        revoke:
          new RevokeSession(
            dependencies.clock,
            dependencies
              .session
              .repository,
          ),
      }),

    authorization:
      Object.freeze({
        authorize:
          new Authorize(
            dependencies
              .authorization
              .repository,
          ),
        grant:
          new GrantEntitlement(
            dependencies
              .authorization
              .entitlementIdGenerator,
            dependencies.clock,
            dependencies
              .authorization
              .repository,
          ),
        revoke:
          new RevokeEntitlement(
            dependencies.clock,
            dependencies
              .authorization
              .repository,
          ),
      }),

    userContext:
      Object.freeze({
        resolver:
          new DefaultUserContextResolver(),
      }),

    isolation,
  });
}
