import type { EntitlementId } from "./entitlement-id.js";

export interface EntitlementIdGenerator {
  generate(): Promise<EntitlementId>;
}
