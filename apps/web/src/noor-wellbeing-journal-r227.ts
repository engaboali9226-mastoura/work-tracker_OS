/** Versioned wellbeing documents inside the existing owner-bound AES-GCM journal.
 * No browser persistence, account IDs, key material or developer sharing.
 */
import {createNoorPrivateJournalClientR193,type NoorJournalFetchR193,type NoorPrivateJournalEntryR193} from './noor-private-journal-client-r193.js';
import {isValidLocalDate,validateReflection,type Reflection,type DailySignals} from './noor-wellbeing-data-r165.js';

export interface NoorWellbeingPortR227 {
 read():Promise<{reflections:Reflection[];signals:DailySignals[]}>;
 addReflection(value:Reflection):Promise<Reflection>;
 saveSignals(value:DailySignals):Promise<void>;
 removeReflection(id:string):Promise<void>;
}
const CATEGORY='noor-wellbeing-v1';
type Document = {entry:NoorPrivateJournalEntryR193;type:'reflection';value:Reflection}|{entry:NoorPrivateJournalEntryR193;type:'signals';value:DailySignals;revision:number};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:Record<string,unknown>,names:string[])=>Object.keys(v).sort().join('|')===[...names].sort().join('|');
const amount=(v:unknown,max:number)=>v===null||(typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max);
function reflection(value:unknown,id:string):Reflection {
 if(!object(value)||!keys(value,['date','mood','energy','emotions','text','trigger','helpful'])||typeof value.date!=='string'||typeof value.mood!=='number'||typeof value.energy!=='number'||!Array.isArray(value.emotions)||!value.emotions.every(x=>typeof x==='string')||!['text','trigger','helpful'].every(k=>typeof value[k]==='string'))throw Error('WELLBEING_INVALID_REFLECTION');
 const result={...value,id} as unknown as Reflection;
 if(validateReflection(result)!==null)throw Error('WELLBEING_INVALID_REFLECTION');
 return result;
}
function signals(value:unknown):DailySignals {
 if(!object(value)||!keys(value,['date','steps','sleepMinutes','screenMinutes','pickups','apps','source'])||typeof value.date!=='string'||!isValidLocalDate(value.date)||value.source!=='manual'||!amount(value.steps,100000)||!amount(value.sleepMinutes,1440)||!amount(value.screenMinutes,1440)||!amount(value.pickups,2000)||!Array.isArray(value.apps)||value.apps.length>100)throw Error('WELLBEING_INVALID_SIGNALS');
 const names=new Set<string>();
 for(const app of value.apps){
  if(!object(app)||!keys(app,['name','minutes','opens'])||typeof app.name!=='string'||!app.name.trim()||app.name.length>80||names.has(app.name)||app.minutes===null||!amount(app.minutes,1440)||!amount(app.opens,2000))throw Error('WELLBEING_INVALID_APP');
  names.add(app.name);
 }
 return structuredClone(value) as unknown as DailySignals;
}
function decode(entry:NoorPrivateJournalEntryR193):Document|null {
 if(entry.kind!=='wellbeing'||entry.category!==CATEGORY)return null;
 if(entry.shareApproved!==false)throw Error('WELLBEING_PRIVATE_ONLY');
 const d:unknown=JSON.parse(entry.body);
 if(!object(d)||d.version!==1)throw Error('WELLBEING_INVALID_DOCUMENT');
 if(d.type==='reflection'&&keys(d,['version','type','value']))return {entry,type:'reflection',value:reflection(d.value,entry.id)};
 if(d.type==='signals'&&keys(d,['version','type','value','revision'])&&typeof d.revision==='number'&&Number.isSafeInteger(d.revision)&&d.revision>0)return {entry,type:'signals',value:signals(d.value),revision:d.revision};
 throw Error('WELLBEING_INVALID_DOCUMENT');
}
export function createNoorWellbeingPortR227(transport:NoorJournalFetchR193,writeDay:string):NoorWellbeingPortR227 {
 if(!isValidLocalDate(writeDay))throw Error('WELLBEING_PERSONAL_DAY_REQUIRED');
 const client=createNoorPrivateJournalClientR193(transport);
 const documents=async()=> (await client.list()).map(decode).filter((x):x is Document=>x!==null);
 const create=async(body:object)=>{
  const note={kind:'wellbeing' as const,title:'مساحتي',body:JSON.stringify(body),precedingEvent:'',helpful:'',category:CATEGORY,mood:null,shareApproved:false,localDate:writeDay};
  if(note.body.length>12000||new TextEncoder().encode(JSON.stringify({note})).byteLength>16384)throw Error('WELLBEING_DOCUMENT_TOO_LARGE');
  return client.create(note);
 };
 return Object.freeze({
  async read(){
   const docs=await documents(),latest=new Map<string,Extract<Document,{type:'signals'}>>();
   for(const d of docs)if(d.type==='signals'){
    const old=latest.get(d.value.date);
    if(!old||d.revision>old.revision||(d.revision===old.revision&&(d.entry.createdAt+'|'+d.entry.id)>(old.entry.createdAt+'|'+old.entry.id)))latest.set(d.value.date,d);
   }
   return {reflections:docs.filter((d):d is Extract<Document,{type:'reflection'}>=>d.type==='reflection').sort((a,b)=>b.entry.createdAt.localeCompare(a.entry.createdAt)||b.entry.id.localeCompare(a.entry.id)).map(d=>d.value),signals:[...latest.values()].map(d=>d.value)};
  },
  async addReflection(value){
   const {id:ignored,...raw}=value;const checked=reflection(raw,'draft');
   const {id:unused,...data}=checked;
   const id=await create({version:1,type:'reflection',value:data});return {...checked,id};
  },
  async saveSignals(value){
   const checked=signals(value),old=(await documents()).filter((d):d is Extract<Document,{type:'signals'}>=>d.type==='signals'&&d.value.date===checked.date);
   const revision=Math.max(0,...old.map(d=>d.revision))+1;
   if(!Number.isSafeInteger(revision))throw Error('WELLBEING_REVISION_INVALID');
   // Persist the replacement before removing any old version. A failed cleanup
   // preserves both; reads select the greatest revision deterministically.
   await create({version:1,type:'signals',value:checked,revision});
   await Promise.allSettled(old.map(d=>client.remove(d.entry.id)));
  },
  async removeReflection(id){
   const docs=await documents();
   if(!docs.some(d=>d.type==='reflection'&&d.entry.id===id))throw Error('WELLBEING_REFLECTION_NOT_FOUND');
   await client.remove(id);
  },
 });
}
