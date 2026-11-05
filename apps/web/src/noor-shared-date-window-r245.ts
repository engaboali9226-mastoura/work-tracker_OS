/**
 * R245: browser-only estimate for when two IANA zones next share the same
 * civil YYYY-MM-DD. It does NOT authorize or schedule a location change.
 * Server-side R241 day/revision checks remain the sole source of authority.
 */
export function noorSharedCivilDateWindow(
  accountZone:string,targetZone:string,nowMs:number,
):Readonly<{datesDiffer:boolean;nextAtMs:number|null}> {
  if(!Number.isFinite(nowMs))return {datesDiffer:false,nextAtMs:null};
  let account:Intl.DateTimeFormat,target:Intl.DateTimeFormat;
  try{
    const options:Intl.DateTimeFormatOptions={
      year:"numeric",month:"2-digit",day:"2-digit",
    };
    account=new Intl.DateTimeFormat("en-CA",{...options,timeZone:accountZone});
    target=new Intl.DateTimeFormat("en-CA",{...options,timeZone:targetZone});
  }catch{return {datesDiffer:false,nextAtMs:null};}
  const sameDate=(ms:number):boolean=>
    account.format(new Date(ms))===target.format(new Date(ms));
  if(sameDate(nowMs))return {datesDiffer:false,nextAtMs:nowMs};
  // The 72-hour horizon accommodates DST and the largest ordinary zone
  // differences. A persistent date mismatch (e.g. UTC+14 / UTC-12) returns
  // null; the UI must never claim that a server switch has been scheduled.
  const minute=60_000,step=10*minute;
  const start=Math.ceil(nowMs/minute)*minute;
  const horizon=nowMs+72*60*minute;
  for(let coarse=start;coarse<=horizon;coarse+=step){
    if(sameDate(coarse)){
      const searchFrom=Math.max(start,coarse-step);
      for(let fine=searchFrom;fine<=coarse;fine+=minute){
        if(sameDate(fine))return {datesDiffer:true,nextAtMs:fine};
      }
      return {datesDiffer:true,nextAtMs:coarse};
    }
  }
  return {datesDiffer:true,nextAtMs:null};
}
