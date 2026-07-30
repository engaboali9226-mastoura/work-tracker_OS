import assert from "node:assert/strict";
import test from "node:test";

import type {
  UserContextProvider,
} from "@worktracker/application";

import type {
  UserOwnedRecord,
  UserScopedRepository,
} from "@worktracker/core";

import {
  createPlatformCompositionRoot,
} from "../src/index.js";

import {
  createTestDependencies,
} from "./test-support.js";

interface TestRecord
extends UserOwnedRecord {
  readonly id:
    string;
}

test(
  "composition mounts the current security, context, catalog, and isolation services",
  async () => {
    const {
      configuration,
    } =
      createTestDependencies();

    const root =
      createPlatformCompositionRoot(
        configuration,
      );

    const platform =
      await root.bootstrap();

    const authentication =
      await platform
        .services
        .authentication
        .authenticate
        .execute({
          proof:
            "valid-proof",
        });

    assert.equal(
      authentication.userId.toString(),
      "user-1",
    );

    const session =
      await platform
        .services
        .session
        .create
        .execute({
          authentication,
        });

    assert.equal(
      (
        await platform
          .services
          .session
          .resolve
          .execute({
            sessionId:
              session.id,
          })
      ).id,
      session.id,
    );

    const grant =
      await platform
        .services
        .authorization
        .grant
        .execute({
          accountId:
            authentication.accountId,
          action:
            "access",
          resourceType:
            "application",
          resourceId:
            "noor-personal",
        });

    assert.equal(
      (
        await platform
          .services
          .authorization
          .authorize
          .execute({
            accountId:
              authentication.accountId,
            action:
              "access",
            resourceType:
              "application",
            resourceId:
              "noor-personal",
          })
      ).id,
      grant.id,
    );

    const firstRequestProvider:
      UserContextProvider = {
        async getCurrent() {
          return {
            userId:
              "user-1",
            principalKind:
              "user",
            sessionId:
              "session-id-00001",
            authorizationScope:
              "personal",
            correlationId:
              "correlation-1",
            attributes: {
              locale:
                "ar-SA",
            },
          };
        },
      };

    const secondRequestProvider:
      UserContextProvider = {
        async getCurrent() {
          return {
            userId:
              "user-2",
            principalKind:
              "user",
            sessionId:
              "session-id-00002",
            authorizationScope:
              "personal",
            correlationId:
              "correlation-2",
            attributes: {},
          };
        },
      };

    const [
      context,
      secondContext,
    ] =
      await Promise.all([
        platform
          .services
          .userContext
          .resolver
          .resolve(
            firstRequestProvider,
          ),
        platform
          .services
          .userContext
          .resolver
          .resolve(
            secondRequestProvider,
          ),
      ]);

    assert.equal(
      context.userId,
      "user-1",
    );

    assert.equal(
      context.correlationId,
      "correlation-1",
    );

    assert.equal(
      secondContext.userId,
      "user-2",
    );

    assert.equal(
      secondContext.correlationId,
      "correlation-2",
    );

    assert.deepEqual(
      Object.keys(
        platform
          .services
          .userContext,
      ),
      [
        "resolver",
      ],
    );

    assert.equal(
      "provider"
        in platform
          .services
          .userContext,
      false,
    );

    assert.equal(
      Object.hasOwn(
        configuration
          .dependencies,
        "userContext",
      ),
      false,
    );

    assert.equal(
      platform
        .services
        .isolation
        .scopeResolver
        .resolve(context)
        .userId,
      "user-1",
    );

    const records =
      new Map<string, TestRecord>();

    const repository:
      UserScopedRepository<
        TestRecord,
        string,
        Readonly<Record<string, never>>
      > = {
        async findById(
          scope,
          id,
        ) {
          const record =
            records.get(id);

          return (
            record?.ownerUserId
              === scope.userId
              ? record
              : null
          );
        },
        async findMany() {
          return [];
        },
        async query() {
          return {
            items:
              [],
            nextCursor:
              null,
          };
        },
        async count() {
          return records.size;
        },
        async insert(
          scope,
          entity,
        ) {
          assert.equal(
            entity.ownerUserId,
            scope.userId,
          );

          records.set(
            entity.id,
            entity,
          );
        },
        async update() {
          return false;
        },
        async updateMany() {
          return false;
        },
        async delete() {
          return false;
        },
        async deleteMany() {
          return false;
        },
      };

    const currentUserData =
      platform
        .services
        .isolation
        .createCurrentUserDataAccess(
          repository,
        );

    const record =
      await currentUserData.create(
        context,
        ownerUserId => ({
          id:
            "record-1",
          ownerUserId,
        }),
      );

    assert.equal(
      (
        await currentUserData.findById(
          context,
          record.id,
        )
      )?.ownerUserId,
      "user-1",
    );

    assert.deepEqual(
      platform
        .services
        .applicationCatalog
        .list()
        .map(
          entry =>
            entry.appKey,
        ),
      [
        "noor-personal",
        "noor-work",
      ],
    );

    assert.equal(
      Object.isFrozen(
        platform,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        platform.services,
      ),
      true,
    );

    await root.shutdown();
  },
);
