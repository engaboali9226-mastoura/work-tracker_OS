import type {SupabaseClient} from "@supabase/supabase-js";
import {
  AuthorizationDeniedError, InvalidSessionError, InvalidSessionRequestError,
  SessionUnavailableError,
} from "@worktracker/core";
import type {AuthenticationAccountId} from "@worktracker/core";
import type {AuthenticationAccountUserResolver} from "@worktracker/infrastructure";

export const NOOR_WORK_TEACHER_PATH_R264 = "/api/noor/work/teacher";
const TABLE = "noor_work_teacher_states_r264";
type Json = string | number | boolean | null | Json[] | {[key: string]: Json};
export interface NoorWorkTeacherDatabaseR264 {
  readonly public: {
    readonly Tables: {
      readonly noor_work_teacher_states_r264: {
        readonly Row: {readonly user_id: string; readonly revision: number; readonly state: Json;
          readonly created_at: string; readonly updated_at: string};
        readonly Insert: {readonly user_id: string; readonly revision: number; readonly state: Json;
          readonly created_at?: string; readonly updated_at?: string};
        readonly Update: {readonly revision?: number; readonly state?: Json; readonly updated_at?: string};
        readonly Relationships: [];
      };
    };
    readonly Views: Record<string, never>;
    readonly Functions: Record<string, never>;
  };
}
export type NoorWorkStateR264 = {
  version: 1;
  timetable: Array<{id:string;day:number;period:number;subject:string;group:string;room:string;start:string;end:string}>;
  workdays: Array<{id:string;date:string;checkIn:string;checkOut:string}>;
  preparations: Array<{id:string;slotId:string;date:string;title:string;objectives:string;activities:string;homework:string}>;
  students: Array<{id:string;name:string;group:string;code:string}>;
  attendance: Array<{id:string;slotId:string;studentId:string;date:string;status:string}>;
  assessments: Array<{id:string;group:string;title:string;date:string;maxScore:number}>;
  grades: Array<{id:string;assessmentId:string;studentId:string;score:number}>;
};
export function emptyNoorWorkStateR264(): NoorWorkStateR264 {
  return {version:1,timetable:[],workdays:[],preparations:[],students:[],attendance:[],assessments:[],grades:[]};
}
const isObj=(v:unknown):v is Record<string,unknown> => !!v && typeof v==="object" && !Array.isArray(v);
const textOk=(v:unknown,max:number)=>typeof v==="string"&&v.length<=max && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(v);
const idOk=(v:unknown)=>typeof v==="string"&&/^[A-Za-z0-9_-]{3,90}$/u.test(v);
const dayOk=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<=6;
const periodOk=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>=1&&v<=12;
const dateOk=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/u.test(v)&&!Number.isNaN(Date.parse(v+"T12:00:00Z"));
const clockOk=(v:unknown)=>typeof v==="string"&&(v===""||/^([01]\d|2[0-3]):[0-5]\d$/u.test(v));
const instantOk=(v:unknown)=>typeof v==="string"&&(v===""||(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))));
const scoreOk=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1000;
const arrayOk=(v:unknown,max:number,check:(x:Record<string,unknown>)=>boolean)=>Array.isArray(v)&&v.length<=max&&v.every(x=>isObj(x)&&check(x));
const idsUnique=(xs:ReadonlyArray<{id:string}>)=>new Set(xs.map(x=>x.id)).size===xs.length;

export function validNoorWorkStateR264(value:unknown): value is NoorWorkStateR264 {
  if(!isObj(value)||value.version!==1) return false;
  const keys=Object.keys(value).sort().join(",");
  if(keys!=="assessments,attendance,grades,preparations,students,timetable,version,workdays")return false;
  if(!arrayOk(value.timetable,84,x=>idOk(x.id)&&dayOk(x.day)&&periodOk(x.period)&&textOk(x.subject,90)&&textOk(x.group,90)&&textOk(x.room,50)&&clockOk(x.start)&&clockOk(x.end)))return false;
  if(!arrayOk(value.workdays,900,x=>idOk(x.id)&&dateOk(x.date)&&instantOk(x.checkIn)&&instantOk(x.checkOut)))return false;
  if(!arrayOk(value.preparations,1200,x=>idOk(x.id)&&idOk(x.slotId)&&dateOk(x.date)&&textOk(x.title,150)&&textOk(x.objectives,2500)&&textOk(x.activities,2500)&&textOk(x.homework,1200)))return false;
  if(!arrayOk(value.students,600,x=>idOk(x.id)&&textOk(x.name,120)&&textOk(x.group,90)&&textOk(x.code,50)))return false;
  if(!arrayOk(value.attendance,15000,x=>idOk(x.id)&&idOk(x.slotId)&&idOk(x.studentId)&&dateOk(x.date)&&["present","absent","late","excused"].includes(String(x.status))))return false;
  if(!arrayOk(value.assessments,400,x=>idOk(x.id)&&textOk(x.group,90)&&textOk(x.title,150)&&dateOk(x.date)&&scoreOk(x.maxScore)&&Number(x.maxScore)>0))return false;
  if(!arrayOk(value.grades,16000,x=>idOk(x.id)&&idOk(x.assessmentId)&&idOk(x.studentId)&&scoreOk(x.score)))return false;
  const state=value as NoorWorkStateR264;
  const all=[state.timetable,state.workdays,state.preparations,state.students,state.attendance,state.assessments,state.grades];
  if(all.some(xs=>!idsUnique(xs)))return false;
  const slots=new Set(state.timetable.map(x=>x.id));
  if(new Set(state.timetable.map(x=>x.day+":"+x.period)).size!==state.timetable.length)return false;
  if(new Set(state.workdays.map(x=>x.date)).size!==state.workdays.length)return false;
  if(state.workdays.some(x=>x.checkOut && (!x.checkIn||Date.parse(x.checkOut)<Date.parse(x.checkIn))))return false;
  if(state.preparations.some(x=>!slots.has(x.slotId)))return false;
  const students=new Set(state.students.map(x=>x.id));
  if(state.attendance.some(x=>!slots.has(x.slotId)||!students.has(x.studentId)))return false;
  const assessmentMap=new Map(state.assessments.map(x=>[x.id,x.maxScore]));
  if(state.grades.some(x=>!students.has(x.studentId)||!assessmentMap.has(x.assessmentId)||x.score>(assessmentMap.get(x.assessmentId)??0)))return false;
  if(new Set(state.attendance.map(x=>x.date+":"+x.slotId+":"+x.studentId)).size!==state.attendance.length)return false;
  if(new Set(state.grades.map(x=>x.assessmentId+":"+x.studentId)).size!==state.grades.length)return false;
  if(JSON.stringify(value).length>500000)return false;
  return true;
}
export type NoorWorkTeacherResultR264=Readonly<{status:200|400|401|403|409|503;body?:unknown}>;
export interface NoorWorkTeacherDependenciesR264 {
  readonly isRuntimeRunning:()=>boolean;
  readonly resolveSession:{execute(input:Readonly<{sessionId:string}>):Promise<Readonly<{accountId:AuthenticationAccountId}>>};
  readonly authorize:{execute(input:Readonly<{accountId:AuthenticationAccountId;action:"access";resourceType:"application";resourceId:"noor-work"}>):Promise<unknown>};
  readonly accountUserResolver:AuthenticationAccountUserResolver;
  readonly client:SupabaseClient<NoorWorkTeacherDatabaseR264>;
}
export class NoorWorkTeacherOperationR264 {
  constructor(private readonly d:NoorWorkTeacherDependenciesR264){}
  private async owner(sessionId:string|null):Promise<{status:401|403|503}|{userId:string}>{
    if(!this.d.isRuntimeRunning())return {status:503};
    if(!sessionId)return {status:401};
    let accountId:AuthenticationAccountId;
    try{const s=await this.d.resolveSession.execute({sessionId}); accountId=s.accountId;}
    catch(e){return {status:e instanceof InvalidSessionError||e instanceof InvalidSessionRequestError?401:503};}
    try{await this.d.authorize.execute({accountId,action:"access",resourceType:"application",resourceId:"noor-work"});}
    catch(e){return {status:e instanceof AuthorizationDeniedError?403:503};}
    try{
      const u=await this.d.accountUserResolver.resolve(accountId);
      if(!u)return {status:403};
      return {userId:u.toString()};
    }catch{return {status:503};}
  }
  async read(sessionId:string|null):Promise<NoorWorkTeacherResultR264>{
    const scope=await this.owner(sessionId);if("status" in scope)return scope;
    try{
      const result=await this.d.client.from(TABLE).select("revision,state").eq("user_id",scope.userId).limit(2);
      if(result.error||result.data===null||result.data.length>1)return {status:503};
      const row=result.data[0];
      if(!row)return {status:200,body:{revision:0,state:emptyNoorWorkStateR264()}};
      if(!Number.isSafeInteger(row.revision)||row.revision<0||!validNoorWorkStateR264(row.state))return {status:503};
      return {status:200,body:{revision:row.revision,state:row.state}};
    }catch{return {status:503};}
  }
  async write(sessionId:string|null,payload:unknown):Promise<NoorWorkTeacherResultR264>{
    const scope=await this.owner(sessionId);if("status" in scope)return scope;
    if(!isObj(payload)||Object.keys(payload).sort().join(",")!=="expectedRevision,state"||
       typeof payload.expectedRevision!=="number"||!Number.isSafeInteger(payload.expectedRevision)||
       payload.expectedRevision<0||payload.expectedRevision>=Number.MAX_SAFE_INTEGER||
       !validNoorWorkStateR264(payload.state))return {status:400};
    const expected=payload.expectedRevision;
    const next=expected+1;
    const state=payload.state as unknown as Json;
    try{
      if(expected===0){
        // A stale editor must never overwrite an existing row with revision >0.
        const snapshot=await this.d.client.from(TABLE).select("revision").eq("user_id",scope.userId).limit(2);
        if(snapshot.error||snapshot.data===null)return {status:503};
        if(snapshot.data.length)return {status:409};
        const inserted=await this.d.client.from(TABLE).insert({user_id:scope.userId,revision:next,state}).select("revision");
        if(inserted.error){
          return {status:inserted.error.code==="23505"?409:503};
        }
        if(inserted.data?.length!==1)return {status:503};
      }else{
        const updated=await this.d.client.from(TABLE).update({revision:next,state,updated_at:new Date().toISOString()})
          .eq("user_id",scope.userId).eq("revision",expected).select("revision");
        if(updated.error)return {status:503};
        if(updated.data?.length!==1)return {status:409};
      }
      return {status:200,body:{revision:next}};
    }catch{return {status:503};}
  }
}
