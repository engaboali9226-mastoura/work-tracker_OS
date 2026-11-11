import {useEffect,useRef,useState,type ReactElement} from "react";
import type {NoorPersonalCommandInput,NoorTaskSessionDraft} from "./noor-personal-today-client.js";
import {spreadTaskSessionsR288,type SessionCadenceR288} from "./noor-session-calendar-r288.js";

export interface StoredTaskSessionR254 extends NoorTaskSessionDraft {
  order:number; note:string; revision:number; createdAt:string; updatedAt:string; completedAt:string|null;
}
export interface StoredTaskSessionPlanR254 {
  distribution:"equal"|"custom"; sessions:readonly StoredTaskSessionR254[];
}
export interface SessionEntryR254 {id:string;executionId:string;localDate:string;at:string;note:string;amount:number;taskSessionId?:string;sessionDayCredit?:number}
const round=(n:number)=>Math.round(n*1e6)/1e6;
export function isWholePageUnitR254(unit:string):boolean{
  return /^(?:صفحة|صفحه|صفحات|page|pages)$/iu.test(unit.trim());
}
export function equalSessionTargetsR254(total:number,count:number,discrete=false):number[]{
  if(!Number.isFinite(total)||total<=0||total>1e9||!Number.isInteger(count)||count<1||count>200)throw Error("INVALID_SPLIT");
  if(discrete&&!Number.isSafeInteger(total))throw Error("PAGES_MUST_BE_INTEGERS");
  const m=discrete?total:Math.round(total*1e6);if(m<count)throw Error("INVALID_SPLIT");
  const part=Math.floor(m/count),rem=m%count;
  return Array.from({length:count},(_,i)=>(part+(i<rem?1:0))/(discrete?1:1e6));
}
export function sessionProgressR254(log:readonly SessionEntryR254[],id:string):number{
  return round(log.filter(e=>e.taskSessionId===id).reduce((n,e)=>n+e.amount,0));
}
export function sessionFinishedR254(s:StoredTaskSessionR254,log:readonly SessionEntryR254[]):boolean{
  return !!s.completedAt||s.target!==null&&sessionProgressR254(log,s.id)>=s.target;
}
/** Civil account day from the actual persisted completion event, never the UTC date of completedAt. */
export function sessionCompletionDayR293(s:StoredTaskSessionR254,log:readonly SessionEntryR254[]):string|null{
  if(!sessionFinishedR254(s,log))return null;
  const events=log.filter(e=>e.taskSessionId===s.id).sort((a,b)=>a.at.localeCompare(b.at));
  return (s.completedAt?events.find(e=>e.at===s.completedAt)?.localDate:undefined)??events.at(-1)?.localDate??null;
}
/** R285: exact remaining goal is committed by a single checkbox through existing
 * owner-authorized activity commands. This is not an additional achievement. */
export function sessionRemainingR285(s:StoredTaskSessionR254,log:readonly SessionEntryR254[]):number|null{
  if(s.target===null)return null;
  return Math.max(0,round(s.target-sessionProgressR254(log,s.id)));
}
/** Keep optional dates truly optional without ever opening an empty native 1900-era picker. */
function SessionDateFieldR293({value,onChange,suggestedDate,testId,busy}:{value:string|null|undefined;onChange:(value:string|null)=>void;suggestedDate:string;testId:string;busy:boolean}):ReactElement{
  const now=new Date();
  const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const proposed=/^\d{4}-\d{2}-\d{2}$/.test(suggestedDate)&&suggestedDate>today?suggestedDate:today;
  return <label>تاريخ الجلسة المجدول (اختياري)
    {value?<span className="nts-date-picker-r293"><input type="date" data-testid={testId} value={value} disabled={busy} onChange={e=>onChange(e.currentTarget.value||null)}/><button type="button" disabled={busy} onClick={()=>onChange(null)}>بدون موعد</button></span>
      :<button type="button" data-testid={testId+"-choose"} disabled={busy} onClick={()=>onChange(proposed)}>اختيار موعد — يبدأ من {proposed}</button>}
  </label>;
}
function makeSession(i:number,target:number|null=null,start:number|null=null,end:number|null=null):NoorTaskSessionDraft{
  return {id:globalThis.crypto.randomUUID(),title:"الجلسة "+i,objective:"",target,rangeStart:start,rangeEnd:end,scheduledDate:null};
}
export function TaskSessionPlannerR254({enabled,setEnabled,distribution,setDistribution,sessions,setSessions,target,unit,busy,parentStartDate="",parentEndDate=null,parentScheduleKind="Daily",parentWeekdays=[]}:{enabled:boolean;setEnabled:(v:boolean)=>void;distribution:"equal"|"custom";setDistribution:(v:"equal"|"custom")=>void;sessions:readonly NoorTaskSessionDraft[];setSessions:(v:NoorTaskSessionDraft[])=>void;target:number|null;unit:string;busy:boolean;parentStartDate?:string;parentEndDate?:string|null;parentScheduleKind?:"OneTime"|"Daily"|"Weekdays";parentWeekdays?:readonly number[]}):ReactElement{
  const [count,setCount]=useState(5),[error,setError]=useState("");
  const [calendarDays,setCalendarDays]=useState(5),[calendarCadence,setCalendarCadence]=useState<SessionCadenceR288>("daily"),[calendarFirstDate,setCalendarFirstDate]=useState(parentStartDate);
  useEffect(()=>{setCalendarFirstDate(parentStartDate);},[parentStartDate]);
  const applyCalendar=()=>{
    try{
      const updated=spreadTaskSessionsR288(sessions,{firstDate:calendarFirstDate,days:calendarDays,cadence:calendarCadence,parent:{kind:parentScheduleKind,startDate:parentStartDate,endDate:parentEndDate,weekdays:parentWeekdays}});
      setSessions(updated);setError("");
    }catch(err){
      const code=err instanceof Error?err.message:"";
      setError(code==="SESSION_CALENDAR_DAYS_INVALID"?"اختر عدد أيام من 1 إلى عدد الجلسات الموجودة.":code==="SESSION_CALENDAR_INVALID_DATE"?"أدخل تاريخًا ميلاديًا صحيحًا.":code==="SESSION_CALENDAR_OUTSIDE_RANGE"?"تاريخ إحدى الجلسات خارج نطاق بداية المهمة ونهايتها.":"الجدول المقترح لا يتوافق مع أيام تكرار المهمة؛ عدّل التاريخ أو التكرار.");
    }
  };
  const edit=(index:number,change:Partial<NoorTaskSessionDraft>)=>setSessions(sessions.map((s,i)=>i===index?{...s,...change}:s));
  const split=()=>{
    try{
      if(target===null)throw Error("TARGET_REQUIRED");
      const pages=isWholePageUnitR254(unit);
      const amounts=equalSessionTargetsR254(target,count,pages);
      let cursor=1;
      setSessions(amounts.map((amount,i)=>{
        const begin=pages?cursor:null,end=pages?cursor+amount-1:null;
        if(pages)cursor=end!+1;
        return makeSession(i+1,amount,begin,end);
      }));
      setError("");
    }catch{setError("أدخل مستهدفًا صالحًا للمهمة وعدد جلسات مناسبًا.");}
  };
  return <section className="nts-plan" data-testid="session-planner-r254">
    <label className="nts-toggle"><input type="checkbox" disabled={busy} checked={enabled} onChange={e=>setEnabled(e.currentTarget.checked)}/> تقسيم المهمة إلى جلسات (اختياري)</label>
    {enabled?<div className="nts-planner-body">
      <label>التوزيع<select disabled={busy} value={distribution} onChange={e=>setDistribution(e.currentTarget.value as "equal"|"custom")}><option value="equal">متساوٍ</option><option value="custom">مخصص</option></select></label>
      {distribution==="equal"?<div className="nts-split"><label>عدد الجلسات<input type="number" min="1" max="200" value={count} onChange={e=>setCount(Number(e.currentTarget.value))}/></label><button type="button" disabled={busy||sessions.length>0} onClick={split}>إنشاء جلسات متساوية</button><small>لا تُستبدل الجلسات الموجودة تلقائيًا حفاظًا على أي سجل سابق.</small></div>:null}
      <div className="nts-calendar-r288" data-testid="r288-calendar-planner" aria-label="توزيع الجلسات على التواريخ">
        <strong>جدولة الجلسات على أيام محددة</strong>
        <p>اختر أول يوم وعدد الأيام ونوع الفاصل؛ توزّع الجلسات الموجودة على تلك الأيام. يمكنك تعديل تاريخ كل جلسة بعدها، ولن يُحفظ أي تغيير حتى تحفظ المهمة.</p>
        <div className="nts-calendar-fields">
          <label>أول يوم للجلسات<input type="date" value={calendarFirstDate} onChange={e=>setCalendarFirstDate(e.currentTarget.value)} disabled={busy}/></label>
          <label>عدد الأيام<input type="number" min="1" max={sessions.length||1} value={calendarDays} data-testid="r288-calendar-days" onChange={e=>setCalendarDays(Number(e.currentTarget.value))} disabled={busy}/></label>
          <label>التوزيع<select data-testid="r288-calendar-cadence" value={calendarCadence} disabled={busy} onChange={e=>setCalendarCadence(e.currentTarget.value as SessionCadenceR288)}><option value="daily">أيام متتابعة حسب جدول المهمة</option><option value="weekly">أسبوعيًا</option><option value="monthly">شهريًا في اليوم نفسه</option></select></label>
        </div>
        <button type="button" data-testid="r288-calendar-apply" disabled={busy||sessions.length===0} onClick={applyCalendar}>توزيع مواعيد الجلسات</button>
        <small>التواريخ يجب أن توافق تكرار المهمة ونطاقها؛ التقدم السابق للجلسات محمي عند الحفظ.</small>
      </div>
      {sessions.map((s,i)=><fieldset className="nts-editor" key={s.id}><legend>الجلسة {i+1}</legend>
        <label>العنوان<input maxLength={120} value={s.title} onChange={e=>edit(i,{title:e.currentTarget.value})}/></label>
        <label>هدف الجلسة<input maxLength={500} value={s.objective} onChange={e=>edit(i,{objective:e.currentTarget.value})}/></label>
        <SessionDateFieldR293 value={s.scheduledDate} suggestedDate={parentStartDate} testId={"r286-session-date-"+s.id} busy={busy} onChange={date=>edit(i,{scheduledDate:date})}/>
        <div className="nts-three"><label>المستهدف<input type="number" inputMode={isWholePageUnitR254(unit)?"numeric":"decimal"} step={isWholePageUnitR254(unit)?"1":"0.000001"} min={isWholePageUnitR254(unit)?"1":"0.000001"} value={s.target??""} onChange={e=>edit(i,{target:e.currentTarget.value===""?null:Number(e.currentTarget.value)})}/></label><label>من<input type="number" step="1" min="1" value={s.rangeStart??""} onChange={e=>edit(i,{rangeStart:e.currentTarget.value===""?null:Number(e.currentTarget.value)})}/></label><label>إلى<input type="number" step="1" min="1" value={s.rangeEnd??""} onChange={e=>edit(i,{rangeEnd:e.currentTarget.value===""?null:Number(e.currentTarget.value)})}/></label></div>
        <div className="nts-actions"><button type="button" disabled={busy||i===0} onClick={()=>{const v=[...sessions];[v[i-1],v[i]]=[v[i]!,v[i-1]!];setSessions(v);}}>↑</button><button type="button" disabled={busy||i===sessions.length-1} onClick={()=>{const v=[...sessions];[v[i],v[i+1]]=[v[i+1]!,v[i]!];setSessions(v);}}>↓</button><button type="button" disabled={busy} onClick={()=>setSessions(sessions.filter((_,j)=>j!==i))}>إزالة</button></div>
      </fieldset>)}
      <button type="button" disabled={busy||sessions.length>=200} onClick={()=>setSessions([...sessions,makeSession(sessions.length+1)])}>+ إضافة جلسة</button>
      {target!==null?<p className="nts-plan-total" data-testid="r285-session-target-total" role="status">مجموع المستهدفات المحددة: {round(sessions.reduce((sum,session)=>sum+(session.target??0),0))} من {target} {unit||"وحدة"}{sessions.some(s=>s.target===null)?" · توجد جلسات لم تحدد كميتها بعد":""}</p>:null}
      <small>لكل جلسة موعد مستقل، وعند تأكيد «تمت» في يومها يحفظ الخادم إنجازها في تاريخ ذلك اليوم مرة واحدة، ويحسب حصتها من وزن المهمة. لا يمكن تغيير موعد جلسة لها تقدم سابق. نطاقات الصفحات يجب أن تكون صحيحة وغير متداخلة.</small>
      {error?<p role="alert">{error}</p>:null}
    </div>:null}
  </section>;
}
function OneSessionR254({session,log,definitionId,executionId,busy,onCommand,reading,pageUnit,unit,todayDate}:{session:StoredTaskSessionR254;log:readonly SessionEntryR254[];definitionId:string;executionId:string|null;busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>;reading:boolean;pageUnit:boolean;unit:string;todayDate?:string|undefined}):ReactElement{
  const s=session,progress=sessionProgressR254(log,s.id),done=sessionFinishedR254(s,log),remainingTarget=sessionRemainingR285(s,log);
  const scheduledForAnotherDay=!!s.scheduledDate&&s.scheduledDate!==todayDate;
  const completionDay=sessionCompletionDayR293(s,log);
  const [note,setNote]=useState(s.note),[amount,setAmount]=useState(""),[activityNote,setActivityNote]=useState(""),[error,setError]=useState("");
  const [noteBaseRevision,setNoteBaseRevision]=useState(s.revision);
  const savingCommand=useRef(false);
  const [saving,setSaving]=useState(false);
  const [saveStatus,setSaveStatus]=useState("");
  const acquire=()=>{if(busy||savingCommand.current)return false;savingCommand.current=true;setSaving(true);return true;};
  const release=()=>{savingCommand.current=false;setSaving(false);};
  const updateNote=(value:string)=>{if(note===s.note)setNoteBaseRevision(s.revision);setNote(value);};
  const entryId=useRef(globalThis.crypto.randomUUID()),completionEntryId=useRef(globalThis.crypto.randomUUID());
  // Refresh server notes without erasing an unsaved local draft after a background sync.
  const previousServerNote=useRef({text:s.note,revision:s.revision});
  useEffect(()=>{
    const previous=previousServerNote.current;
    previousServerNote.current={text:s.note,revision:s.revision};
    // Rebase local note drafts when only session metadata changed elsewhere.
    // A different remote note is a true conflict and must never be overwritten.
    if(previous.text===s.note&&noteBaseRevision===previous.revision){
      setNoteBaseRevision(s.revision);
    }
    setNote(local=>local===previous.text?s.note:local);
  },[s.note,s.revision]);
  const noteConflict=note!==s.note&&noteBaseRevision!==s.revision;
  const restoreSavedNote=()=>{setNoteBaseRevision(s.revision);setNote(s.note);setError("");};
  const copyDraft=async()=>{
    try{
      if(!globalThis.navigator?.clipboard?.writeText)throw Error("CLIPBOARD_UNAVAILABLE");
      await globalThis.navigator.clipboard.writeText(note);
      setError("تم نسخ مسودتك. يمكنك الآن مراجعة النسخة المحفوظة.");
    }catch{setError("تعذر النسخ تلقائيًا. حدّد النص الموجود في المحرر وانسخه يدويًا قبل استبداله.");}
  };
  const saveNote=async()=>{
    if(busy||savingCommand.current)return;setError("");
    if(noteBaseRevision!==s.revision){
      setError("تغيّرت هذه الجلسة على جهاز آخر أثناء التحرير؛ احتفظ بنصك وراجع النسخة الحديثة قبل الاستبدال.");return;
    }
    if(!acquire())return;
    try{
      if(!await onCommand({type:"edit-task-session-note",definitionId,taskSessionId:s.id,expectedRevision:noteBaseRevision,note}))
        setError("تعذر حفظ الملاحظة؛ النص باقٍ هنا. تحقق من الاتصال أو أعد تحميل أحدث نسخة.");
    }catch{setError("تعذر الاتصال لحفظ الملاحظة؛ النص ما زال هنا.");}
    finally{release();}
  };
  const saveProgress=async()=>{
    const n=Number(amount);
    if(busy||savingCommand.current||done||!executionId||scheduledForAnotherDay)return;
    if(s.target===null||!Number.isFinite(n)||n<=0||(pageUnit&&!Number.isSafeInteger(n))||
       round(progress+n)>s.target){setError(pageUnit?"سجّل عدد صفحات صحيحًا لا يتجاوز المتبقي.":"تحقق من الكمية المتبقية لهذه الجلسة.");return;}
    setError("");
    if(!acquire())return;
    try{
      if(await onCommand({type:"record-task-session-progress",executionId,taskSessionId:s.id,entryId:entryId.current,amount:n,note:activityNote})){
        entryId.current=globalThis.crypto.randomUUID();setAmount("");setActivityNote("");
      }else setError("لم يتأكد حفظ التقدم؛ الكمية والملاحظة محفوظتان داخل النموذج.");
    }catch{setError("تعذر الاتصال؛ لم تُمسح الكمية ولا الملاحظة.");}
    finally{release();}
  };
  const complete=async()=>{
    if(busy||savingCommand.current||done||!executionId||scheduledForAnotherDay)return;setError("");
    // A quantified session is completed by recording only the REMAINING amount.
    // Its existing credit is earned only once via the server's activity log.
    const command:NoorPersonalCommandInput=remainingTarget===null
      ?{type:"complete-task-session",executionId,taskSessionId:s.id,entryId:completionEntryId.current}
      :{type:"record-task-session-progress",executionId,taskSessionId:s.id,
         entryId:completionEntryId.current,amount:remainingTarget,note:activityNote};
    if(remainingTarget!==null&&(!(remainingTarget>0)||pageUnit&&!Number.isSafeInteger(remainingTarget))){
      setError("المقدار المتبقي للجلسة غير صالح؛ حدّث بيانات المهمة.");return;
    }
    if(!acquire())return;
    setSaveStatus("جارٍ الحفظ تلقائيًا…");
    try{
      if(await onCommand(command)){
        setSaveStatus("تم حفظ إنجاز الجلسة في الخلفية.");
        completionEntryId.current=globalThis.crypto.randomUUID();
        if(remainingTarget!==null){setAmount("");setActivityNote("");}
      }else {setSaveStatus("");setError("لم يتأكد حفظ إتمام الجلسة؛ لا نعيد إنشاء النشاط حتى نتحقق من الخادم.");}
    }catch{setSaveStatus("");setError("تعذر الاتصال أثناء إتمام الجلسة؛ حاول مرة أخرى دون فقدان تقدمك.");}
    finally{release();}
  };
  return <details className="nts-session" data-testid={"session-detail-"+s.id}>
    <summary><span><strong>{s.order}. {s.title}</strong>{s.objective?<small>{s.objective}</small>:null}{s.scheduledDate?<small data-testid={"r286-session-scheduled-"+s.id}>مجدولة: {s.scheduledDate}{scheduledForAnotherDay&&!done?" · لا تُسجَّل إلا في موعدها":""}</small>:null}</span><span>{done?"مكتملة":progress>0?"قيد التنفيذ":"لم تبدأ"}{s.target!==null?" · "+progress+" / "+s.target:""}</span>
      <label className="nts-check-session" onClick={event=>event.stopPropagation()}>
        <input type="checkbox" checked={done} disabled={busy||saving||done||!executionId||scheduledForAnotherDay}
          data-testid={"r285-session-complete-"+s.id}
          aria-label={done?"تم إنجاز "+s.title:"تأكيد إنجاز "+s.title+" بالكامل"}
          onKeyDown={event=>event.stopPropagation()}
          onChange={event=>{event.stopPropagation();if(event.currentTarget.checked)void complete();}}/>
        <span>{done?"تمت":remainingTarget===null?"تمت الجلسة":'تمت '+(reading?"جلسة القراءة":"الجلسة")+" ("+remainingTarget+" "+(unit||"وحدة")+")"}</span>
      </label>
    </summary>
    <div className="nts-session-body">
      {saveStatus?<p role="status" data-testid={"r286-session-background-save-"+s.id}>{saveStatus}</p>:null}
      {scheduledForAnotherDay&&!done?<p className="nts-scheduled-info">تاريخ هذه الجلسة {s.scheduledDate}؛ لا يمكن تأكيدها في يوم آخر. يمكن تعديل الموعد من مركز التحكم قبل بدء تسجيل التقدم.</p>:null}
      {s.rangeStart!==null?<p>النطاق: {s.rangeStart}–{s.rangeEnd}</p>:null}
      {s.target!==null?<progress value={progress} max={s.target} aria-label={"تقدم "+s.title}/>:null}
      {completionDay?<time data-testid={"r293-session-completion-date-"+s.id} dateTime={completionDay}>تاريخ الإنجاز المحتسب: {completionDay}</time>:null}
      {!done&&!scheduledForAnotherDay&&s.target!==null&&executionId?<div className="nts-stack"><label>الإنجاز الجديد<input type="number" inputMode={pageUnit?"numeric":"decimal"} step={pageUnit?"1":"0.000001"} min={pageUnit?"1":"0.000001"} max={round(s.target-progress)} value={amount} onInput={e=>setAmount(e.currentTarget.value)} onChange={e=>setAmount(e.currentTarget.value)}/></label><label>ملاحظة النشاط (اختيارية)<textarea dir="rtl" rows={2} maxLength={2000} value={activityNote} onInput={e=>setActivityNote(e.currentTarget.value)} onChange={e=>setActivityNote(e.currentTarget.value)}/></label><button type="button" disabled={busy||saving} onClick={()=>{void saveProgress();}}>حفظ التقدم</button></div>:null}
      {!done&&!scheduledForAnotherDay&&s.target===null&&executionId?<button type="button" disabled={busy||saving} onClick={()=>{void complete();}}>إكمال هذه الجلسة</button>:null}
      <div className="nts-stack"><label>ملاحظات الجلسة<textarea dir="rtl" rows={4} maxLength={10000} value={note} onInput={e=>updateNote(e.currentTarget.value)} onChange={e=>updateNote(e.currentTarget.value)} placeholder="تلخيص المعرفة والملاحظات والأسئلة…"/></label>
      {reading?<button type="button" onClick={()=>updateNote(note+(note?"\n\n":"")+"أهم فكرة فهمتها:\n\nمعلومات جديدة:\n\nفوائد عملية:\n\nأسئلة للبحث:\n")}>قالب تلخيص اختياري</button>:null}
      <button type="button" disabled={busy||saving||note===s.note} onClick={()=>{void saveNote();}}>حفظ الملاحظة</button>
      {noteConflict?<div className="nts-conflict" role="status" aria-label="مراجعة تعارض ملاحظة الجلسة">
        <strong>تغيّرت ملاحظة الجلسة على جهاز آخر</strong>
        <p>مسودتك ما زالت في المحرر. راجع النسخة الأحدث قبل اتخاذ قرار.</p>
        <p className="nts-server-note">{s.note||"النسخة المحفوظة فارغة"}</p>
        <div className="nts-conflict-actions">
          <button type="button" disabled={busy||saving} onClick={()=>{void copyDraft();}}>نسخ مسودتي</button>
          <button type="button" disabled={busy||saving} onClick={restoreSavedNote}>استخدام النسخة المحفوظة</button>
        </div>
      </div>:null}</div>
      {error?<p className="nts-error" role="alert">{error}</p>:null}
      {log.some(e=>e.taskSessionId===s.id)?<details className="nts-history"><summary>سجل الإنجاز</summary>{log.filter(e=>e.taskSessionId===s.id).slice().reverse().map(e=><p key={e.id}><time dateTime={e.at}>{e.localDate}</time> {e.amount>0?"+"+e.amount:"إتمام"} {e.note}</p>)}</details>:null}
    </div>
  </details>;
}
function TaskGeneralNoteR254({definitionId,revisionId,storedNote,busy,onCommand}:{definitionId:string;revisionId:string;storedNote:string;busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>}):ReactElement{
  const [body,setBody]=useState(storedNote),[error,setError]=useState("");
  const savingCommand=useRef(false),[saving,setSaving]=useState(false);
  const [noteBaseRevision,setNoteBaseRevision]=useState(revisionId);
  const updateBody=(value:string)=>{if(body===storedNote)setNoteBaseRevision(revisionId);setBody(value);};
  const previousServerNote=useRef({text:storedNote,revisionId});
  useEffect(()=>{
    const previous=previousServerNote.current;
    previousServerNote.current={text:storedNote,revisionId};
    // Saving another session can change the parent revision without editing this note.
    if(previous.text===storedNote&&noteBaseRevision===previous.revisionId){
      setNoteBaseRevision(revisionId);
    }
    setBody(local=>local===previous.text?storedNote:local);
  },[storedNote,revisionId]);
  const noteConflict=body!==storedNote&&noteBaseRevision!==revisionId;
  const restoreSavedNote=()=>{setNoteBaseRevision(revisionId);setBody(storedNote);setError("");};
  const copyDraft=async()=>{
    try{
      if(!globalThis.navigator?.clipboard?.writeText)throw Error("CLIPBOARD_UNAVAILABLE");
      await globalThis.navigator.clipboard.writeText(body);
      setError("تم نسخ مسودتك. يمكنك الآن مراجعة النسخة المحفوظة.");
    }catch{setError("تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا قبل استبداله.");}
  };
  const save=async()=>{
    if(busy||savingCommand.current||body===storedNote)return;setError("");
    if(noteBaseRevision!==revisionId){
      setError("تغيّرت المهمة على جهاز آخر أثناء تحرير الملاحظة؛ احتفظ بنصك وراجع النسخة الحديثة.");return;
    }
    savingCommand.current=true;setSaving(true);
    try{
      const success=await onCommand({type:"edit-task-general-note",definitionId,expectedRevisionId:noteBaseRevision,note:body});
      if(!success)setError("تعذر تأكيد حفظ الملاحظة العامة. النص باقٍ هنا؛ راجع أحدث بيانات المهمة قبل المحاولة.");
    }catch{setError("تعذر الاتصال؛ الملاحظة العامة لا تزال في المحرر.");}
    finally{savingCommand.current=false;setSaving(false);}
  };
  return <div className="nts-general-note"><label>ملاحظة عامة للمهمة<textarea dir="rtl" maxLength={10000} rows={4} value={body} onInput={e=>updateBody(e.currentTarget.value)} onChange={e=>updateBody(e.currentTarget.value)} placeholder="خلاصة عامة ومراجعات مستقلة عن جلسات التنفيذ…"/></label>
    <button type="button" disabled={busy||saving||body===storedNote} onClick={()=>{void save();}}>حفظ الملاحظة العامة</button>
    {noteConflict?<div className="nts-conflict" role="status" aria-label="مراجعة تعارض الملاحظة العامة">
      <strong>تغيّرت الملاحظة العامة على جهاز آخر</strong>
      <p>احتفظنا بمسودتك في المحرر. هذه أحدث نسخة محفوظة:</p>
      <p className="nts-server-note">{storedNote||"النسخة المحفوظة فارغة"}</p>
      <div className="nts-conflict-actions">
        <button type="button" disabled={busy||saving} onClick={()=>{void copyDraft();}}>نسخ مسودتي</button>
        <button type="button" disabled={busy||saving} onClick={restoreSavedNote}>استخدام النسخة المحفوظة</button>
      </div>
    </div>:null}
    {error?<p className="nts-error" role="alert">{error}</p>:null}
  </div>;
}

export function TaskSessionListR254({plan,log,definitionId,executionId,busy,onCommand,title,revisionId,taskGeneralNote="",unit="",todayDate}:{plan:StoredTaskSessionPlanR254;log:readonly SessionEntryR254[];definitionId:string;executionId:string|null;busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>;title:string;revisionId?:string;taskGeneralNote?:string;unit?:string;todayDate?:string}):ReactElement{
  const count=plan.sessions.filter(s=>sessionFinishedR254(s,log)).length;
  return <details className="nts-list" data-testid="task-sessions-r254">
    <summary>الجلسات: {count} / {plan.sessions.length} مكتملة <small>{plan.sessions.some(s=>s.target!==null)?'حدد تم للجلسة المكتملة أو سجل مقدارًا جزئيًا؛ كل تقدم يدخل في إنجاز تاريخ تسجيله، ويُعرض تاريخ الإتمام المحفوظ.':'اضغط تم بعد تنفيذ كل جلسة؛ تُحتسب مرة واحدة من وزن المهمة.'}</small></summary>
    <div className="nts-list-body">
      {plan.sessions.length?plan.sessions.map(s=><OneSessionR254 key={s.id} session={s} log={log} definitionId={definitionId} executionId={executionId} busy={busy} onCommand={onCommand} reading={/قراء|كتاب|reading|book/i.test(title)} pageUnit={isWholePageUnitR254(unit)} unit={unit} todayDate={todayDate}/>):<p>يمكنك إضافة جلسات لاحقًا من تعديل المهمة.</p>}
      <details className="nts-summary"><summary>الملاحظات والإنجازات</summary>
        {revisionId?<TaskGeneralNoteR254 definitionId={definitionId} revisionId={revisionId} storedNote={taskGeneralNote} busy={busy} onCommand={onCommand}/>:null}
        {plan.sessions.filter(s=>s.note).slice().sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt)).map(s=><div key={s.id}><strong>{s.title}</strong><time dateTime={s.updatedAt}>{s.updatedAt.slice(0,10)}</time><p>{s.note}</p></div>)}
      </details>
    </div>
  </details>;
}

export const TASK_SESSION_STYLES_R254 = "\n.np-page .nts-scheduled-info{margin:0;font-size:12px;line-height:1.7;color:var(--muted)}\n.np-page .nts-plan-total{font-size:12px;color:var(--muted);margin:0;line-height:1.6}\n.np-page .nts-check-session{display:flex;align-items:center;gap:6px;min-height:32px;cursor:pointer;font-size:11px;font-weight:650;white-space:nowrap;flex-basis:100%;justify-content:flex-end}\n.np-page .nts-check-session input{width:20px;height:20px;accent-color:var(--gold);flex:none}\n.np-page .nts-check-session:has(input:disabled){opacity:.7;cursor:default}\n.np-page .np-activity-item:has(.nts-list){flex-wrap:wrap}\n.np-page .nts-list{flex-basis:100%;width:100%;min-width:0;border-top:1px solid var(--border);margin-top:5px;padding:3px}\n.np-page .nts-list>summary{cursor:pointer;display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:9px;font-weight:650;color:var(--text)}\n.np-page .nts-list-body{display:grid;gap:9px;max-height:65dvh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:5px 2px calc(12px + env(safe-area-inset-bottom,0px))}\n.np-page .nts-session{border:1px solid var(--border);border-radius:12px;background:var(--panel-soft);min-width:0}\n.np-page .nts-session>summary{display:flex;align-items:flex-start;flex-wrap:wrap;justify-content:space-between;gap:7px;cursor:pointer;padding:10px;font-size:12px}\n.np-page .nts-session>summary span:first-child{display:grid;gap:3px;min-width:0;flex:1}\n.np-page .nts-session>summary small{color:var(--muted);overflow-wrap:anywhere}\n.np-page .nts-session-body{display:grid;gap:9px;padding:12px;border-top:1px solid var(--border)}\n.np-page .nts-stack,.np-page .nts-planner-body{display:grid;gap:9px;min-width:0}\n.np-page .nts-session-body progress{width:100%;accent-color:var(--gold)}\n.np-page .nts-session-body label,.np-page .nts-plan label{display:grid;gap:5px;font-size:12px;min-width:0}\n.np-page .nts-session-body :is(input,textarea),.np-page .nts-plan :is(input:not([type=checkbox]),select){width:100%;min-width:0;border:1px solid var(--border-strong);background:var(--panel);color:var(--text);border-radius:9px;padding:9px;font:inherit}\n.np-page .nts-calendar-r288{display:grid;gap:9px;padding:12px;border:1px solid var(--border-strong);border-radius:11px;background:var(--panel-soft)}\n.np-page .nts-calendar-r288 p{margin:0;font-size:12px;color:var(--muted);line-height:1.7}\n.np-page .nts-calendar-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:8px}\n.np-page .nts-calendar-r288 small{font-size:11px;color:var(--muted)}\n.np-page .nts-plan{display:grid;grid-column:1/-1;gap:10px;border:1px solid var(--border);border-radius:13px;padding:12px}\n.np-page .nts-plan .nts-toggle{display:flex;align-items:center;gap:8px}\n.np-page .nts-plan .nts-toggle input{width:auto}\n.np-page .nts-editor{min-width:0;display:grid;gap:8px;border:1px solid var(--border);border-radius:10px;padding:12px}\n.np-page .nts-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}\n.np-page .nts-actions,.np-page .nts-split{display:flex;align-items:end;gap:7px;flex-wrap:wrap}\n.np-page .nts-split small{flex-basis:100%}\n.np-page .nts-session-body button,.np-page .nts-plan button{border:1px solid var(--border-strong);background:var(--panel);color:var(--text);border-radius:9px;padding:9px 12px;font:inherit;min-height:44px;cursor:pointer}\n.np-page .nts-session-body button:disabled,.np-page .nts-plan button:disabled{opacity:.55;cursor:default}\n.np-page .nts-error{color:#a43f49}\n.np-page .nts-summary{border-top:1px solid var(--border);padding:10px}\n.np-page .nts-summary p{white-space:pre-wrap;overflow-wrap:anywhere}\n.np-page .nts-summary div{border-bottom:1px solid var(--border);padding:8px}\n.np-page .nts-summary time{display:block;color:var(--muted)}\n.np-page .nts-general-note{display:grid;gap:8px;padding:8px 0}\n.np-page .nts-general-note label{display:grid;gap:6px}\n.np-page .nts-general-note textarea{width:100%;min-width:0;resize:vertical;min-height:104px;padding:9px;border-radius:9px;border:1px solid var(--border-strong);background:var(--panel);color:var(--text);font:inherit}\n.np-page .nts-general-note button{min-height:44px;padding:9px;border-radius:9px;background:var(--panel);border:1px solid var(--border-strong);color:var(--text);cursor:pointer}\n.np-page .nts-conflict{display:grid;gap:7px;min-width:0;padding:10px;border:1px solid var(--border-strong);border-radius:11px;background:var(--panel-soft)}\n.np-page .nts-conflict strong{font-size:12px}\n.np-page .nts-conflict p{margin:0;overflow-wrap:anywhere;white-space:pre-wrap}\n.np-page .nts-server-note{max-height:140px;overflow:auto;padding:9px;border-radius:8px;background:var(--panel)}\n.np-page .nts-conflict-actions{display:flex;gap:8px;flex-wrap:wrap}\n.np-page .nts-conflict-actions button{min-height:44px;flex:1 1 140px}\n@media(max-width:700px){.np-page .nts-list-body{max-height:62dvh}.np-page .nts-three input{padding:8px 4px!important}}\n";
