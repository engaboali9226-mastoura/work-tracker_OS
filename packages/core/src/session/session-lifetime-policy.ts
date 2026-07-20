export interface SessionLifetimePolicy {
  calculateExpirationEpochMs(
    createdAtEpochMs: number,
  ): number;
}
