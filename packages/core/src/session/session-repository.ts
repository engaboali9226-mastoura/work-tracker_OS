import type { SessionId } from "./session-id.js";
import type { SessionSnapshot } from "./session-snapshot.js";

export interface RevokeSessionRecordInput {
  readonly id: SessionId;
  readonly revokedAtEpochMs: number;
}

export interface SessionRepository {
  create(session: SessionSnapshot): Promise<void>;

  findById(
    id: SessionId,
  ): Promise<SessionSnapshot | null>;

  revoke(
    input: RevokeSessionRecordInput,
  ): Promise<void>;
}
