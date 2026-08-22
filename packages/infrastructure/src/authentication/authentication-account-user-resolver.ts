import type { AuthenticationAccountId, UserId } from "@worktracker/core";
export interface AuthenticationAccountUserResolver { resolve(accountId: AuthenticationAccountId): Promise<UserId | null>; }
