import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const buildDir =
  process.env.NOOR_PERSONAL_BUILD_DIR ?? "dist";

const moduleUrl =
  pathToFileURL(
    path.resolve(
      buildDir,
      "infrastructure/supabase-postgres-personal-foundation-persistence.js",
    ),
  ).href;

function createClient() {
  let row =
    null;

  function selectResult(
    filter,
  ) {
    if (
      row
      && (
        filter.user_id === undefined
        || row.user_id === filter.user_id
      )
    ) {
      return [
        structuredClone(
          row,
        ),
      ];
    }

    return [];
  }

  function builder() {
    const filter = {};

    return {
      select() {
        return this;
      },

      eq(
        key,
        value,
      ) {
        filter[key] =
          value;

        return this;
      },

      async limit() {
        return {
          error:
            null,
          data:
            selectResult(
              filter,
            ),
        };
      },

      insert(
        value,
      ) {
        return {
          async select() {
            if (row) {
              return {
                error: {
                  code:
                    "23505",
                },
                data:
                  null,
              };
            }

            row = {
              ...structuredClone(
                value,
              ),
              created_at:
                "2026-08-22T00:00:00.000Z",
              updated_at:
                value.updated_at
                ?? "2026-08-22T00:00:00.000Z",
            };

            return {
              error:
                null,
              data: [
                {
                  revision:
                    row.revision,
                },
              ],
            };
          },
        };
      },

      update(
        value,
      ) {
        const updateFilter = {};

        return {
          eq(
            key,
            expected,
          ) {
            updateFilter[key] =
              expected;

            return this;
          },

          async select() {
            if (
              !row
              || row.user_id
                !== updateFilter.user_id
              || row.revision
                !== updateFilter.revision
            ) {
              return {
                error:
                  null,
                data:
                  [],
              };
            }

            row = {
              ...row,
              ...structuredClone(
                value,
              ),
            };

            return {
              error:
                null,
              data: [
                {
                  revision:
                    row.revision,
                },
              ],
            };
          },
        };
      },
    };
  }

  return {
    client: {
      from() {
        return builder();
      },
    },

    snapshot() {
      return structuredClone(
        row,
      );
    },
  };
}

test(
  "operation scope loads once and commits exactly one new revision",
  async () => {
    const {
      SupabasePostgresPersonalFoundationPersistence,
    } =
      await import(moduleUrl);

    const fake =
      createClient();

    const persistence =
      new SupabasePostgresPersonalFoundationPersistence(
        fake.client,
      );

    await persistence.initialize();

    const scope =
      await persistence.openOperation(
        "user-1",
      );

    assert.equal(
      await scope.locations.getEffective(
        "user-1",
        "2026-08-22T09:00:00.000Z",
      ),
      null,
    );

    assert.equal(
      await scope.prayerPolicies.getEffective(
        "user-1",
        "2026-08-22T09:00:00.000Z",
      ),
      null,
    );

    const result =
      await scope.transaction
        .runInTransaction(
          () =>
            "committed",
        );

    assert.equal(
      result,
      "committed",
    );

    assert.equal(
      fake.snapshot()
        .revision,
      1,
    );

    await assert.rejects(
      () =>
        scope.transaction
          .runInTransaction(
            () =>
              "retry",
          ),
      error =>
        error?.code
          === "AdapterLifecycleViolation",
    );
  },
);

test(
  "stale operation scope fails with PersistenceConflict and does not retry",
  async () => {
    const {
      SupabasePostgresPersonalFoundationPersistence,
    } =
      await import(moduleUrl);

    const fake =
      createClient();

    const persistence =
      new SupabasePostgresPersonalFoundationPersistence(
        fake.client,
      );

    await persistence.initialize();

    await (
      await persistence.openOperation(
        "user-1",
      )
    ).transaction.runInTransaction(
      () =>
        undefined,
    );

    const first =
      await persistence.openOperation(
        "user-1",
      );

    const stale =
      await persistence.openOperation(
        "user-1",
      );

    await first.transaction
      .runInTransaction(
        () =>
          undefined,
      );

    assert.equal(
      fake.snapshot()
        .revision,
      2,
    );

    await assert.rejects(
      () =>
        stale.transaction
          .runInTransaction(
            () =>
              undefined,
          ),
      error =>
        error?.code
          === "PersistenceConflict",
    );

    assert.equal(
      fake.snapshot()
        .revision,
      2,
    );
  },
);
