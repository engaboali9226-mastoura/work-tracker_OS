/** R193: same-origin client contract for Noor's trusted private-journal API.
 * No bearer token, direct Supabase calls, browser persistence, or local fallback.
 * Not wired into live dialogs until the production privacy gate is complete.
 */
export const NOOR_PRIVATE_JOURNAL_API_R193 = '/api/noor/personal/journal/' as const;
export type NoorPrivateJournalKindR193 = 'feelings'|'ideas'|'developer'|'wellbeing';
export type NoorPrivateJournalDraftR193 = Readonly<{
  kind: NoorPrivateJournalKindR193;
  title: string;
  body: string;
  precedingEvent: string;
  helpful: string;
  category: string;
  mood: number|null;
  shareApproved: boolean;
  localDate?: string;
}>;
export type NoorPrivateJournalEntryR193 = NoorPrivateJournalDraftR193 & Readonly<{id:string;createdAt:string}>;
export type NoorPrivateJournalSharedR193 = Readonly<{title:string;body:string;category:string;createdAt:string}>;
export type NoorJournalFetchR193 = (path:string, init:RequestInit)=>Promise<Response>;

export class NoorJournalHttpErrorR193 extends Error {
  public constructor(public readonly status:number) {
    super('NOOR_PRIVATE_JOURNAL_REQUEST_REJECTED');
    this.name='NoorJournalHttpErrorR193';
  }
}

function objectValue(value:unknown): value is Record<string,unknown> {
  return typeof value==='object' && value!==null && !Array.isArray(value);
}
const IDENTIFIER=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const KINDS=new Set<NoorPrivateJournalKindR193>(['feelings','ideas','developer','wellbeing']);
function isEntry(value:unknown):value is NoorPrivateJournalEntryR193 {
  if(!objectValue(value) || typeof value.id!=='string' || !IDENTIFIER.test(value.id) ||
    typeof value.createdAt!=='string' || !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.kind!=='string' || !KINDS.has(value.kind as NoorPrivateJournalKindR193)) return false;
  for(const key of ['title','body','precedingEvent','helpful','category'] as const){
    if(typeof value[key]!=='string') return false;
  }
  if (value.localDate!==undefined && (typeof value.localDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(value.localDate)||
    !Number.isFinite(Date.parse(value.localDate+'T00:00:00Z'))||
    new Date(value.localDate+'T00:00:00Z').toISOString().slice(0,10)!==value.localDate)) return false;
  return typeof value.shareApproved==='boolean' &&
    (value.mood===null || (typeof value.mood==='number' && Number.isInteger(value.mood) && value.mood>=1 && value.mood<=5));
}
function isShared(value:unknown):value is NoorPrivateJournalSharedR193 {
  return objectValue(value) && ['title','body','category','createdAt'].every(key=>typeof value[key]==='string') &&
    Number.isFinite(Date.parse(value.createdAt as string));
}
async function jsonBody(response:Response):Promise<unknown> {
  if(!/^application\/json\b/iu.test(response.headers.get('content-type')??'')) throw Error('NOOR_JOURNAL_UNEXPECTED_MEDIA_TYPE');
  const length=Number(response.headers.get('content-length')??'0');
  if(!Number.isSafeInteger(length)||length>300000||length<0) throw Error('NOOR_JOURNAL_RESPONSE_TOO_LARGE');
  const value=await response.text();
  if(value.length>300000) throw Error('NOOR_JOURNAL_RESPONSE_TOO_LARGE');
  try{return JSON.parse(value) as unknown;}catch{throw Error('NOOR_JOURNAL_INVALID_RESPONSE');}
}
/** POST only; browser supplies Origin + HttpOnly cookie, never application JS. */
export function createNoorPrivateJournalClientR193(transport:NoorJournalFetchR193) {
  const execute=async(action:'create'|'list'|'remove'|'developer-export',body:object,expectedStatus:number):Promise<unknown>=>{
    const response=await transport(NOOR_PRIVATE_JOURNAL_API_R193+action,{
      method:'POST',
      credentials:'same-origin',
      mode:'same-origin',
      cache:'no-store',
      redirect:'error',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body),
    });
    if(response.status!==expectedStatus) throw new NoorJournalHttpErrorR193(response.status);
    if(expectedStatus===204)return null;
    return jsonBody(response);
  };
  return Object.freeze({
    async list():Promise<readonly NoorPrivateJournalEntryR193[]> {
      const data=await execute('list',{},200);
      if(!objectValue(data)||!Array.isArray(data.entries)||data.entries.length>250||!data.entries.every(isEntry)) throw Error('NOOR_JOURNAL_INVALID_RESPONSE');
      return data.entries as NoorPrivateJournalEntryR193[];
    },
    async create(note:NoorPrivateJournalDraftR193):Promise<string> {
      const data=await execute('create',{note},201);
      if(!objectValue(data)||typeof data.id!=='string'||!IDENTIFIER.test(data.id)) throw Error('NOOR_JOURNAL_INVALID_RESPONSE');
      return data.id;
    },
    async remove(id:string):Promise<void> {
      if(!IDENTIFIER.test(id)) throw Error('NOOR_JOURNAL_INVALID_ID');
      await execute('remove',{id},204);
    },
    async exportApproved():Promise<readonly NoorPrivateJournalSharedR193[]> {
      const data=await execute('developer-export',{},200);
      if(!objectValue(data)||!Array.isArray(data.entries)||data.entries.length>250||!data.entries.every(isShared)) throw Error('NOOR_JOURNAL_INVALID_RESPONSE');
      return data.entries as NoorPrivateJournalSharedR193[];
    },
  });
}
