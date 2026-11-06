import {useEffect,useRef,useState,type ReactElement} from "react";
import type {NoorPersonalCommandInput,NoorTaskSessionDraft} from "./noor-personal-today-client.js";

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
function makeSession(i:number,target:number|null=null,start:number|null=null,end:number|null=null):NoorTaskSessionDraft{
  return {id:globalThis.crypto.randomUUID(),title:"الجلسة "+i,objective:"",target,rangeStart:start,rangeEnd:end};
}
export function TaskSessionPlannerR254({enabled,setEnabled,distribution,setDistribution,sessions,setSessions,target,unit,busy}:{enabled:boolean;setEnabled:(v:boolean)=>void;distribution:"equal"|"custom";setDistribution:(v:"equal"|"custom")=>void;sessions:readonly NoorTaskSessionDraft[];setSessions:(v:NoorTaskSessionDraft[])=>void;target:number|null;unit:string;busy:boolean}):ReactElement{
  const [count,setCount]=useState(5),[error,setError]=useState("");
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
      {sessions.map((s,i)=><fieldset className="nts-editor" key={s.id}><legend>الجلسة {i+1}</legend>
        <label>العنوان<input maxLength={120} value={s.title} onChange={e=>edit(i,{title:e.currentTarget.value})}/></label>
        <label>هدف الجلسة<input maxLength={500} value={s.objective} onChange={e=>edit(i,{objective:e.currentTarget.value})}/></label>
        <div className="nts-three"><label>المستهدف<input type="number" step="0.000001" min="0.000001" value={s.target??""} onChange={e=>edit(i,{target:e.currentTarget.value===""?null:Number(e.currentTarget.value)})}/></label><label>من<input type="number" step="1" min="1" value={s.rangeStart??""} onChange={e=>edit(i,{rangeStart:e.currentTarget.value===""?null:Number(e.currentTarget.value)})}/></label><label>إلى<input type="number" step="1" min="1" value={s.rangeEnd??""} onChange={e=>edit(i,{rangeEnd:e.currentTarget.value===""?null:Number(e.currentTarget.value)})}/></label></div>
        <div className="nts-actions"><button type="button" disabled={busy||i===0} onClick={()=>{const v=[...sessions];[v[i-1],v[i]]=[v[i]!,v[i-1]!];setSessions(v);}}>↑</button><button type="button" disabled={busy||i===sessions.length-1} onClick={()=>{const v=[...sessions];[v[i],v[i+1]]=[v[i+1]!,v[i]!];setSessions(v);}}>↓</button><button type="button" disabled={busy} onClick={()=>setSessions(sessions.filter((_,j)=>j!==i))}>إزالة</button></div>
      </fieldset>)}
      <button type="button" disabled={busy||sessions.length>=200} onClick={()=>setSessions([...sessions,makeSession(sessions.length+1)])}>+ إضافة جلسة</button>
      <small>يمكنك تعديل الجلسات القادمة وإعادة ترتيبها. نطاقات الصفحات يجب أن تكون صحيحة وغير متداخلة وأن يساوي عدد صفحات كل نطاق مستهدفه.</small>
      {error?<p role="alert">{error}</p>:null}
    </div>:null}
  </section>;
}
function OneSessionR254({session,log,definitionId,executionId,busy,onCommand,reading}:{session:StoredTaskSessionR254;log:readonly SessionEntryR254[];definitionId:string;executionId:string;busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>;reading:boolean}):ReactElement{
  const s=session,progress=sessionProgressR254(log,s.id),done=sessionFinishedR254(s,log);
  const [note,setNote]=useState(s.note),[amount,setAmount]=useState(""),[activityNote,setActivityNote]=useState(""),[error,setError]=useState("");
  const entryId=useRef(globalThis.crypto.randomUUID());
  useEffect(()=>{setNote(s.note);},[s.note]);
  const saveNote=async()=>{
    if(busy)return;setError("");
    if(!await onCommand({type:"edit-task-session-note",definitionId,taskSessionId:s.id,expectedRevision:s.revision,note}))
      setError("تعذر حفظ الملاحظة؛ النص باقٍ هنا. تحقق من الاتصال أو أعد تحميل أحدث نسخة.");
  };
  const saveProgress=async()=>{
    const n=Number(amount);
    if(busy||done)return;
    if(s.target===null||!Number.isFinite(n)||n<=0||round(progress+n)>s.target){setError("تحقق من الكمية المتبقية لهذه الجلسة.");return;}
    setError("");
    if(await onCommand({type:"record-task-session-progress",executionId,taskSessionId:s.id,entryId:entryId.current,amount:n,note:activityNote})){
      entryId.current=globalThis.crypto.randomUUID();setAmount("");setActivityNote("");
    }else setError("لم يتأكد حفظ التقدم؛ الكمية والملاحظة محفوظتان داخل النموذج.");
  };
  const complete=async()=>{
    if(busy||done)return;setError("");
    if(await onCommand({type:"complete-task-session",executionId,taskSessionId:s.id,entryId:entryId.current}))
      entryId.current=globalThis.crypto.randomUUID();
    else setError("تعذر تسجيل الإتمام؛ حاول مرة أخرى.");
  };
  return <details className="nts-session" data-testid={"session-detail-"+s.id}>
    <summary><span><strong>{s.order}. {s.title}</strong>{s.objective?<small>{s.objective}</small>:null}</span><span>{done?"مكتملة":progress>0?"قيد التنفيذ":"لم تبدأ"}{s.target!==null?" · "+progress+" / "+s.target:""}</span></summary>
    <div className="nts-session-body">
      {s.rangeStart!==null?<p>النطاق: {s.rangeStart}–{s.rangeEnd}</p>:null}
      {s.target!==null?<progress value={progress} max={s.target} aria-label={"تقدم "+s.title}/>:null}
      {s.completedAt?<time dateTime={s.completedAt}>الإتمام: {s.completedAt.slice(0,10)}</time>:null}
      {!done&&s.target!==null?<div className="nts-stack"><label>الإنجاز الجديد<input type="number" step="0.000001" min="0.000001" max={round(s.target-progress)} value={amount} onChange={e=>setAmount(e.currentTarget.value)}/></label><label>ملاحظة النشاط (اختيارية)<textarea rows={2} maxLength={2000} value={activityNote} onChange={e=>setActivityNote(e.currentTarget.value)}/></label><button type="button" disabled={busy} onClick={()=>{void saveProgress();}}>حفظ التقدم</button></div>:null}
      {!done&&s.target===null?<button type="button" disabled={busy} onClick={()=>{void complete();}}>إكمال هذه الجلسة</button>:null}
      <div className="nts-stack"><label>ملاحظات الجلسة<textarea rows={4} maxLength={10000} value={note} onChange={e=>setNote(e.currentTarget.value)} placeholder="تلخيص المعرفة والملاحظات والأسئلة…"/></label>
      {reading?<button type="button" onClick={()=>setNote(v=>v+(v?"\n\n":"")+"أهم فكرة فهمتها:\n\nمعلومات جديدة:\n\nفوائد عملية:\n\nأسئلة للبحث:\n")}>قالب تلخيص اختياري</button>:null}
      <button type="button" disabled={busy||note===s.note} onClick={()=>{void saveNote();}}>حفظ الملاحظة</button></div>
      {error?<p className="nts-error" role="alert">{error}</p>:null}
      {log.some(e=>e.taskSessionId===s.id)?<details className="nts-history"><summary>سجل الإنجاز</summary>{log.filter(e=>e.taskSessionId===s.id).slice().reverse().map(e=><p key={e.id}><time dateTime={e.at}>{e.localDate}</time> {e.amount>0?"+"+e.amount:"إتمام"} {e.note}</p>)}</details>:null}
    </div>
  </details>;
}
export function TaskSessionListR254({plan,log,definitionId,executionId,busy,onCommand,title}:{plan:StoredTaskSessionPlanR254;log:readonly SessionEntryR254[];definitionId:string;executionId:string;busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>;title:string}):ReactElement{
  const count=plan.sessions.filter(s=>sessionFinishedR254(s,log)).length;
  return <details className="nts-list" data-testid="task-sessions-r254">
    <summary>الجلسات: {count} / {plan.sessions.length} مكتملة <small>التفاصيل والملاحظات</small></summary>
    <div className="nts-list-body">
      {plan.sessions.length?plan.sessions.map(s=><OneSessionR254 key={s.id} session={s} log={log} definitionId={definitionId} executionId={executionId} busy={busy} onCommand={onCommand} reading={/قراء|كتاب|reading|book/i.test(title)}/>):<p>يمكنك إضافة جلسات لاحقًا من تعديل المهمة.</p>}
      <details className="nts-summary"><summary>الملاحظات والإنجازات</summary>{plan.sessions.filter(s=>s.note).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt)).map(s=><div key={s.id}><strong>{s.title}</strong><time dateTime={s.updatedAt}>{s.updatedAt.slice(0,10)}</time><p>{s.note}</p></div>)}</details>
    </div>
  </details>;
}

export const TASK_SESSION_STYLES_R254 = "\n.np-page .np-activity-item:has(.nts-list){flex-wrap:wrap}\n.np-page .nts-list{flex-basis:100%;width:100%;min-width:0;border-top:1px solid var(--border);margin-top:5px;padding:3px}\n.np-page .nts-list>summary{cursor:pointer;display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:9px;font-weight:650;color:var(--text)}\n.np-page .nts-list-body{display:grid;gap:9px;max-height:65dvh;overflow-y:auto;overscroll-behavior:contain;padding:5px 2px 12px}\n.np-page .nts-session{border:1px solid var(--border);border-radius:12px;background:var(--panel-soft);min-width:0}\n.np-page .nts-session>summary{display:flex;align-items:flex-start;flex-wrap:wrap;justify-content:space-between;gap:7px;cursor:pointer;padding:10px;font-size:12px}\n.np-page .nts-session>summary span:first-child{display:grid;gap:3px;min-width:0;flex:1}\n.np-page .nts-session>summary small{color:var(--muted);overflow-wrap:anywhere}\n.np-page .nts-session-body{display:grid;gap:9px;padding:12px;border-top:1px solid var(--border)}\n.np-page .nts-stack,.np-page .nts-planner-body{display:grid;gap:9px;min-width:0}\n.np-page .nts-session-body progress{width:100%;accent-color:var(--gold)}\n.np-page .nts-session-body label,.np-page .nts-plan label{display:grid;gap:5px;font-size:12px;min-width:0}\n.np-page .nts-session-body :is(input,textarea),.np-page .nts-plan :is(input:not([type=checkbox]),select){width:100%;min-width:0;border:1px solid var(--border-strong);background:var(--panel);color:var(--text);border-radius:9px;padding:9px;font:inherit}\n.np-page .nts-plan{display:grid;grid-column:1/-1;gap:10px;border:1px solid var(--border);border-radius:13px;padding:12px}\n.np-page .nts-plan .nts-toggle{display:flex;align-items:center;gap:8px}\n.np-page .nts-plan .nts-toggle input{width:auto}\n.np-page .nts-editor{min-width:0;display:grid;gap:8px;border:1px solid var(--border);border-radius:10px;padding:12px}\n.np-page .nts-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}\n.np-page .nts-actions,.np-page .nts-split{display:flex;align-items:end;gap:7px;flex-wrap:wrap}\n.np-page .nts-split small{flex-basis:100%}\n.np-page .nts-session-body button,.np-page .nts-plan button{border:1px solid var(--border-strong);background:var(--panel);color:var(--text);border-radius:9px;padding:9px 12px;font:inherit;min-height:40px;cursor:pointer}\n.np-page .nts-session-body button:disabled,.np-page .nts-plan button:disabled{opacity:.55;cursor:default}\n.np-page .nts-error{color:#a43f49}\n.np-page .nts-summary{border-top:1px solid var(--border);padding:10px}\n.np-page .nts-summary p{white-space:pre-wrap;overflow-wrap:anywhere}\n.np-page .nts-summary div{border-bottom:1px solid var(--border);padding:8px}\n.np-page .nts-summary time{display:block;color:var(--muted)}\n@media(max-width:700px){.np-page .nts-list-body{max-height:62dvh}.np-page .nts-three input{padding:8px 4px!important}}\n";
