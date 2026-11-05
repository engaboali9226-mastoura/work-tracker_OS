import type {IsoInstant,LocationProfileRevision} from "./model.js";

/** R236: one source of truth for trusted per-user location revision mutation.
 * This runs only inside an authenticated, optimistic-concurrency Foundation transaction.
 */
export function replaceEffectiveLocationRevision(
 revisions:LocationProfileRevision[],owner:string,expected:string,now:IsoInstant,
 next:Readonly<{id:string;name:string;latitude:number;longitude:number;timeZone:string}>,
):void{
 if(!owner||!expected||!next.id||next.id.length>130||
    !Number.isFinite(Date.parse(now))||!next.name.trim()||next.name.length>80||
    !Number.isFinite(next.latitude)||Math.abs(next.latitude)>90||
    !Number.isFinite(next.longitude)||Math.abs(next.longitude)>180||
    !Number.isFinite(next.latitude*1e6)||!Number.isFinite(next.longitude*1e6)||
    typeof next.timeZone!=="string"||next.timeZone.length>100)
   throw Error("LOCATION_PROFILE_INVALID");
 try{new Intl.DateTimeFormat("en-US",{timeZone:next.timeZone});}
 catch{throw Error("LOCATION_TIMEZONE_INVALID");}
 const matches=revisions.map((r,i)=>({r,i})).filter(({r})=>
    r.userId===owner&&r.effectiveFrom<=now&&
    (r.effectiveUntil===undefined||now<r.effectiveUntil));
 if(matches.length!==1||matches[0]!.r.id!==expected)
   throw Error("LOCATION_REVISION_CONFLICT");
 const active=matches[0]!;
 if(active.r.effectiveFrom>=now||revisions.some(r=>r.id===next.id))
   throw Error("LOCATION_REVISION_CONFLICT");
 // All previous records remain; only the active revision closes.
 revisions[active.i]={...active.r,effectiveUntil:now};
 revisions.push({id:next.id,userId:owner,name:next.name.trim(),
   latitude:next.latitude,longitude:next.longitude,timeZone:next.timeZone,
   effectiveFrom:now});
}
