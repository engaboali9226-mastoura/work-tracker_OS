/** R221 production three-spaces journal gate.
 * Do not touch legacy IndexedDB, and do not claim the trusted backend is
 * available until the authenticated HTTPS endpoint proves readiness.
 */
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { NoorThreeSpacesR171 } from "./noor-three-spaces-r171.js";
import { createNoorTrustedJournalDialogAdapterR194 } from "./noor-trusted-journal-dialog-adapter-r194.js";

const STATUS = "/api/noor/personal/journal/status";

export function NoorVerifiedPrivateJournalSpaceR221({
  personalDate,
}: Readonly<{personalDate?:string}>):ReactElement {
  const [verified,setVerified] = useState(false);
  const trusted = useMemo(
    ()=>createNoorTrustedJournalDialogAdapterR194((path,init)=>window.fetch(path,init)),
    [],
  );
  useEffect(()=>{
    let active=true;
    const cancel = new AbortController();
    setVerified(false);
    void window.fetch(STATUS,{
      method:"POST",
      mode:"same-origin",
      credentials:"same-origin",
      cache:"no-store",
      redirect:"error",
      headers:{"Content-Type":"application/json"},
      body:"{}",
      signal:cancel.signal,
    }).then(response=>{
      if(active) setVerified(response.status===204 &&
        response.headers.get("cache-control")==="no-store");
    }).catch(()=>{if(active)setVerified(false);});
    return ()=>{active=false;cancel.abort();};
  },[personalDate]);
  // Production is fail-closed until the real trusted server responds 204.
  // The child has its own R202 fail-closed and never falls back to IndexedDB.
  return <NoorThreeSpacesR171 personalDate={personalDate}
    trustedJournal={verified?trusted:undefined}/>;
}
