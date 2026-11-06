/**
 * A tab returning from the background can have stale task/session notes.
 * Keep resumes bounded: no polling while active, no overlapping personal writes,
 * no refresh on an invisible document and no repeated focus/pageshow burst.
 */
export const NOOR_RESUME_SYNC_COOLDOWN_MS = 15_000;
export interface NoorResumeSyncState {
  readonly nowMs:number;
  readonly lastAttemptAt:number;
  readonly visible:boolean;
  readonly writesPending:boolean;
  readonly refreshPending:boolean;
}
export function shouldRefreshNoorOnResume(state:NoorResumeSyncState):boolean{
  return state.visible && !state.writesPending && !state.refreshPending
    && Number.isFinite(state.nowMs) && Number.isFinite(state.lastAttemptAt)
    && state.nowMs-state.lastAttemptAt>=NOOR_RESUME_SYNC_COOLDOWN_MS;
}
