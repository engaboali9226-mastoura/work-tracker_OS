/** R202: production must not touch unscoped local journals.
 * Trusted adapters are accepted only when explicitly supplied by the host application;
 * this module never injects network/auth/storage configuration.
 */
export type NoorJournalModeR202 = 'blocked'|'trusted'|'legacy-lab';
export function resolveNoorJournalReleaseModeR202(input:Readonly<{production:boolean;trustedJournalPresent:boolean}>):NoorJournalModeR202 {
  if(input.production && !input.trustedJournalPresent) return 'blocked';
  return input.trustedJournalPresent ? 'trusted' : 'legacy-lab';
}
