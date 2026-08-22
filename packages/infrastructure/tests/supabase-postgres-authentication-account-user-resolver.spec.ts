import assert from "node:assert/strict";
import test from "node:test";

import {
  UserId,
} from "@worktracker/core";

import {
  SupabasePostgresAuthenticationAccountUserResolver,
} from "../src/authentication/supabase-postgres-authentication-account-user-resolver.js";

function clientFor(
  rows:
    readonly Readonly<{
      account_id:
        string;
      user_id:
        string;
    }>[],
) {
  return {
    from() {
      return {
        select() {
          return this;
        },

        async eq(
          _column:
            string,
          requested:
            string,
        ) {
          return {
            error:
              null,
            data:
              rows.filter(
                row =>
                  row.account_id
                    === requested,
              ),
          };
        },
      };
    },
  };
}

test(
  "resolver allows repeated linkage rows only when they converge on one canonical user",
  async () => {
    const resolver =
      new SupabasePostgresAuthenticationAccountUserResolver(
        clientFor([
          {
            account_id:
              "account-1",
            user_id:
              "user-1",
          },
          {
            account_id:
              "account-1",
            user_id:
              "user-1",
          },
        ]),
      );

    const result =
      await resolver.resolve(
        "account-1",
      );

    assert.ok(
      result
      instanceof UserId,
    );

    assert.equal(
      result.toString(),
      "user-1",
    );
  },
);

test(
  "resolver fails closed for zero or ambiguous canonical-user mappings",
  async () => {
    assert.equal(
      await new SupabasePostgresAuthenticationAccountUserResolver(
        clientFor([]),
      ).resolve(
        "account-1",
      ),
      null,
    );

    assert.equal(
      await new SupabasePostgresAuthenticationAccountUserResolver(
        clientFor([
          {
            account_id:
              "account-1",
            user_id:
              "user-1",
          },
          {
            account_id:
              "account-1",
            user_id:
              "user-2",
          },
        ]),
      ).resolve(
        "account-1",
      ),
      null,
    );
  },
);
