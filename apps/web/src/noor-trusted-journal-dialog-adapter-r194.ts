/** R194 opt-in trusted-journal dialog adapter, isolated lab only.
 * It NEVER reads, writes, imports or deletes legacy browser IndexedDB notes.
 * Migration needs separate user authorization and a verified date-preserving backend.
 */
import { createNoorPrivateJournalClientR193, type NoorJournalFetchR193, type NoorPrivateJournalEntryR193 } from './noor-private-journal-client-r193.js';
import { validateNoteR171, type NoteR171, type SpaceKindR171 } from './noor-three-spaces-r171.js';

export interface NoorTrustedJournalPortR194 {
  read():Promise<NoteR171[]>;
  create(note:NoteR171):Promise<void>;
  remove(id:string):Promise<void>;
}
const THREE_KINDS=new Set<SpaceKindR171>(['feelings','ideas','developer']);
function checkedDate(value:unknown):value is string {
 return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
 Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
function asPersonalNote(entry:NoorPrivateJournalEntryR193):NoteR171 {
 if(!THREE_KINDS.has(entry.kind as SpaceKindR171) || !checkedDate(entry.localDate)) throw Error('NOOR_TRUSTED_JOURNAL_PERSONAL_DATE_REQUIRED');
 const note:NoteR171={
  id:entry.id, kind:entry.kind as SpaceKindR171, createdAt:entry.createdAt,localDate:entry.localDate,
  title:entry.title,body:entry.body,precedingEvent:entry.precedingEvent,helpful:entry.helpful,
  mood:entry.mood,category:entry.category,shareApproved:entry.shareApproved,
 };
 if(validateNoteR171(note)!==null) throw Error('NOOR_TRUSTED_JOURNAL_INVALID_ENTRY');
 return note;
}
export function createNoorTrustedJournalDialogAdapterR194(transport:NoorJournalFetchR193):NoorTrustedJournalPortR194 {
 const client=createNoorPrivateJournalClientR193(transport);
 return Object.freeze({
  async read():Promise<NoteR171[]>{
   const result=await client.list();
   return result.filter(entry=>THREE_KINDS.has(entry.kind as SpaceKindR171)).map(asPersonalNote);
  },
  async create(note:NoteR171):Promise<void>{
   if(!checkedDate(note.localDate) || validateNoteR171(note)!==null) throw Error('NOOR_TRUSTED_JOURNAL_INVALID_DRAFT');
   await client.create({
    kind:note.kind,title:note.title,body:note.body,precedingEvent:note.precedingEvent,
    helpful:note.helpful,category:note.category,mood:note.mood,
    shareApproved:note.shareApproved,localDate:note.localDate,
   });
  },
  async remove(id:string):Promise<void>{await client.remove(id);},
 });
}
