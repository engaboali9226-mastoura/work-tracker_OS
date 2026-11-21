// R386: offline migration contract; no connection to runtime or network.
const types=Object.freeze({
 PersonalDayCreated:["PersonalDay",{"boundaryKey":"text","localDate":"date"}],
 DailyIslamicContextBuilt:["DailyIslamicContext",{"personalDayId":"text","localDate":"date","approvedHistoryEventCount":"count"}],
 DailyTaskMaterialized:["DailyTaskInstance",{"definitionId":"text","definitionRevisionId":"text","materializationKey":"text"}],
 HabitOccurrenceMaterialized:["HabitOccurrence",{"definitionId":"text","definitionRevisionId":"text","materializationKey":"text"}],
 ExecutionCompleted:["DailyExecutionInstance",{"definitionId":"text","executionStatus":"status"}],
 ExecutionMissed:["DailyExecutionInstance",{"definitionId":"text","executionStatus":"status"}],
 ExecutionCancelled:["DailyExecutionInstance",{"definitionId":"text","executionStatus":"status"}],
 ExecutionReopened:["DailyExecutionInstance",{"definitionId":"text","executionStatus":"status"}],
 LocationProfileChanged:["LocationProfile",{"newLocationRevisionId":"text","previousLocationRevisionId":"text","newTimeZone":"timezone","previousTimeZone":"timezone"}],
 TodayReconciled:["PersonalDay",{"definitionsEvaluated":"count","duplicatesPrevented":"count","instancesCreated":"count","instancesUpdated":"count","restored":"count","suppressed":"count"}]
});
const required=["id","idempotencyKey","eventType","eventVersion","aggregateType","aggregateId","aggregateVersion","userId","occurredAt","correlationId","privacyClassification","payload","deliveryState"];
const optional=["personalDayId","causationId"];
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
// Indexed identity is bounded by UTF-8 bytes, not UTF-16 code units. Reject
// controls and malformed UTF-16 (PostgreSQL JSONB cannot represent these).
export const validIdentifier=x=>typeof x==="string"&&x.trim()!==""&&!/[\u0000-\u001f\u007f]/u.test(x)&&!(/[\ud800-\udfff]/u.test(x))&&Buffer.byteLength(x,"utf8")<=512;
export const validReceiptToken=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
const text=validIdentifier;
const count=x=>Number.isSafeInteger(x)&&x>=0;
const date=x=>typeof x==="string"&& !x.startsWith("0000")&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00.000Z"))&&new Date(x+"T00:00:00.000Z").toISOString().slice(0,10)===x;
const instant=x=>typeof x==="string"&& !x.startsWith("0000")&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x.replace(/:(\d{2})Z$/,":$1.000Z");
const zone=x=>{if(!text(x)||!(/^(?:[A-Za-z0-9_+\-]+\/)+[A-Za-z0-9_+\-]+$|^(?:UTC|GMT)$/i.test(x)))return false;try{new Intl.DateTimeFormat("en",{timeZone:x});return true;}catch{return false;}};
const statuses=["Planned","InProgress","Pending","Completed","Deferred","Cancelled","Skipped","Missed","Suppressed"];
const validators={text,count,date,timezone:zone,status:x=>statuses.includes(x)};
const exact=(value,keys)=>object(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
// Fail closed with fixed error codes, never personal content in diagnostics.
function error(code){throw new Error(code);}
export function validateLegacyEvent(owner,event){
 if(!text(owner)||!object(event))error("R386_EVENT_SHAPE");
 if(required.some(k=>!Object.hasOwn(event,k))||Object.keys(event).some(k=>!required.includes(k)&&!optional.includes(k)))error("R386_EVENT_ENVELOPE");
 if(event.userId!==owner)error("R386_EVENT_OWNER");
 if(event.privacyClassification!=="PersonalOperationalData")error("R386_EVENT_PRIVACY");
 if(!Object.hasOwn(types,event.eventType)||event.eventVersion!==1)error("R386_EVENT_VERSION_OR_TYPE");
 const [aggregate,spec]=types[event.eventType];
 if(event.aggregateType!==aggregate||!count(event.aggregateVersion)||event.aggregateVersion<1||!instant(event.occurredAt)||!["Pending","Delivered","Failed"].includes(event.deliveryState))error("R386_EVENT_METADATA");
 if(["id","idempotencyKey","aggregateId","correlationId"].some(k=>!text(event[k]))||optional.some(k=>Object.hasOwn(event,k)&&!text(event[k]))||(!Object.hasOwn(event,"personalDayId")&&event.eventType!=="LocationProfileChanged"))error("R386_EVENT_IDENTITY");
 if(!exact(event.payload,Object.keys(spec))||Object.entries(spec).some(([k,v])=>!validators[v](event.payload[k])))error("R386_EVENT_PAYLOAD");
 const expected={ExecutionCompleted:"Completed",ExecutionMissed:"Missed",ExecutionCancelled:"Cancelled"};
 if(Object.hasOwn(expected,event.eventType)&&event.payload.executionStatus!==expected[event.eventType])error("R386_EVENT_STATUS");
 if(event.eventType==="ExecutionReopened"&&["Completed","Missed","Cancelled"].includes(event.payload.executionStatus))error("R386_EVENT_STATUS");
 if(event.eventType==="DailyIslamicContextBuilt"&&event.payload.personalDayId!==event.personalDayId)error("R386_EVENT_DAY_LINK");
 return true;
}
export function validateOwnerEvents(owner,events){
 if(!Array.isArray(events))error("R386_EVENT_COLLECTION");
 const ids=new Set(),keys=new Set();
 for(const event of events){validateLegacyEvent(owner,event);if(ids.has(event.id)||keys.has(event.idempotencyKey))error("R386_EVENT_DUPLICATE");ids.add(event.id);keys.add(event.idempotencyKey);}
 return events.length;
}
// Deliberately NOT a productivity score. Only validated counts of record types.
// No timestamps, titles, notes, identifiers, timezone or private text emitted.
export function eventTypeCounts(owner,events){
 validateOwnerEvents(owner,events);
 return Object.fromEntries(Object.keys(types).map(type=>[type,events.filter(e=>e.eventType===type).length]));
}
export const supportedLegacyEventTypes=Object.freeze(Object.keys(types));
