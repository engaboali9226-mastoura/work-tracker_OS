import type { SessionId } from "./session-id.js";

export interface SessionIdGenerator {
  generate(): Promise<SessionId>;
}
