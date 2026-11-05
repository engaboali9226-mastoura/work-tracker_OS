/** NOOR R232: ephemeral presentation choices in React state only.
 * Architecture explicitly prohibits adding browser storage outside
 * the already-sanctioned appearance-preference module. User location and
 * Friday mosque settings must NOT be silently persisted or sent to a
 * privileged server; a future trusted preference endpoint is required.
 */
export type NoorR232City = Readonly<{
  name:string; country:string; latitude:number; longitude:number; timeZone:string;
}>;
export type NoorR232Preferences=Readonly<{
  afterSunrise:number; beforeDhuhr:number; fridayAdhan:string; selectedCity:NoorR232City|null;
  /** Display-clock timezone only. Never changes server prayer or account date. */
  displayZone:string|null;
  fastingTimerOutsideRamadan:boolean;
}>;
export const NOOR_R232_DEFAULT:NoorR232Preferences=Object.freeze({
  afterSunrise:20,beforeDhuhr:10,fridayAdhan:"",selectedCity:null,displayZone:null,
  fastingTimerOutsideRamadan:false,
});
export function readNoorR232Preferences():NoorR232Preferences{
  return NOOR_R232_DEFAULT;
}
/** Presentation state is managed by useState in the view; no persistence. */
export function saveNoorR232Preferences(_value:NoorR232Preferences):void{
  // Intentionally no-op until an audited authenticated preference endpoint.
}
