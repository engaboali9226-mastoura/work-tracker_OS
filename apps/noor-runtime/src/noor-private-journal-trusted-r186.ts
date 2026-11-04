/** NOOR R186: binds the journal R185 adapter to the SAME trusted NOOR session,
 * authorization, and internal user resolver used by PersonalControlOperation.
 * This is server-side only, not wired into production HTTP or deployment.
 */
import type { PersonalControlOperation } from "./personal-control-operation.js";
import { NoorPrivateJournalOperationR185, type JournalEncryptedStoreR185 } from "./noor-private-journal-r185.js";

export function createTrustedPrivateJournalR186(
  personalControl: Pick<PersonalControlOperation, "resolveAuthorizedJournalUser">,
  store: JournalEncryptedStoreR185,
  encryptionKey: Buffer,
): NoorPrivateJournalOperationR185 {
  return new NoorPrivateJournalOperationR185({
    trust: {
      resolveAuthorizedUser: async sessionId => {
        const result = await personalControl.resolveAuthorizedJournalUser(sessionId);
        return result.kind === "ok"
          ? {status: 200 as const, userId: result.userId}
          : {status: result.status};
      },
    },
    store,
    encryptionKey,
  });
}
