import {useState,type ReactElement,type FormEvent} from "react";
import type {NoorPersonalCommandInput} from "./noor-personal-today-client.js";
import {NOOR_REMINDER_DEFAULT_R314,parseNoorReminderPlanR314,type NoorReminderPlanR314} from "../../noor-personal/src/domain/reminder-plan-r314.js";
import {noorDueRemindersR314,type NoorReminderDefinitionR314} from "./noor-reminders-r314.js";
import type {StatisticRow} from "./progress-statistics.js";

type Definition=NoorReminderDefinitionR314 & Readonly<{kind:"Habit"|"Task";revisionId:string;category:string}>;
type Setter=(command:NoorPersonalCommandInput)=>Promise<boolean>;
function ReminderTile({definition,onCommand,busy}:{definition:Definition;onCommand:Setter;busy:boolean}):ReactElement{
 const [plan,setPlan]=useState<NoorReminderPlanR314>(
   parseNoorReminderPlanR314(definition.reminderPlan)??NOOR_REMINDER_DEFAULT_R314,
 );
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState(false);
 const quiet=plan.quietStart!==null;
 const update=(values:Partial<NoorReminderPlanR314>)=>{
   setPlan(previous=>({...previous,...values}));setError("");setSaved(false);
 };
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
   event.preventDefault();if(busy||saving)return;
   setSaving(true);setError("");setSaved(false);
   try{
     const ok=await onCommand({type:"configure-reminder",definitionId:definition.id,
       expectedRevisionId:definition.revisionId,plan});
     if(ok)setSaved(true);
     else setError("تعذر حفظ التذكير. ربما تغيّر النشاط على جهاز آخر؛ حدّث الصفحة ثم أعد المحاولة.");
   }catch{setError("تعذر حفظ التذكير. أعد المحاولة.");}
   finally{setSaving(false);}
 };
 const selectInt=(value:string)=>Number(value) as NoorReminderPlanR314["leadMinutes"];
 const disabled=busy||saving||definition.state!=="Active";
 return <form onSubmit={event=>{void submit(event);}} className="nr314-tile" aria-label={`تذكير ${definition.title}`} data-testid="reminder-tile-r314">
  <div className="nr314-tile-head"><div><strong>{definition.title}</strong><small>{definition.kind==="Habit"?"عادة":"مهمة"} · {definition.category}</small></div>
   <label className="nr314-enable"><input type="checkbox" checked={plan.enabled}
    onChange={e=>update({enabled:e.target.checked})} disabled={disabled}/><span>{plan.enabled?"مفعّل":"متوقف"}</span></label>
  </div>
  <div className="nr314-fields">
   <label>موعد التنبيه <input type="time" value={plan.time} onChange={e=>update({time:e.target.value})} disabled={disabled} required/></label>
   <label>قبل الموعد <select value={plan.leadMinutes} onChange={e=>update({leadMinutes:selectInt(e.target.value)})} disabled={disabled}>
    {[0,5,15,30,60,120].map(n=><option key={n} value={n}>{n===0?"عند الموعد":`${n} دقيقة`}</option>)}
   </select></label>
   <label>حدّ التأخير <select value={plan.graceMinutes} onChange={e=>update({graceMinutes:Number(e.target.value) as NoorReminderPlanR314["graceMinutes"]})} disabled={disabled}>
    {[0,15,30,60,120].map(n=><option key={n} value={n}>{n===0?"فور الموعد":`${n} دقيقة`}</option>)}
   </select></label>
   <label>حماية الاستريكس بعد <select value={plan.minStreak} onChange={e=>update({minStreak:Number(e.target.value)})} disabled={disabled}>
    {[0,1,2,3,5,7,10,14,21,30,60,90].map(n=><option key={n} value={n}>{n===0?"بلا تنبيه سلسلة":`${n} أيام إنجاز`}</option>)}
   </select></label>
  </div>
  <div className="nr314-quiet">
   <label><input type="checkbox" checked={quiet} disabled={disabled}
    onChange={e=>update(e.target.checked?{quietStart:"22:00",quietEnd:"06:00"}:{quietStart:null,quietEnd:null})}/> ساعات الهدوء</label>
   {quiet?<div><label>من <input type="time" value={plan.quietStart??"22:00"} disabled={disabled} onChange={e=>update({quietStart:e.target.value})}/></label>
    <label>إلى <input type="time" value={plan.quietEnd??"06:00"} disabled={disabled} onChange={e=>update({quietEnd:e.target.value})}/></label></div>:null}
  </div>
  <div className="nr314-tile-foot"><button className="np-cc-button primary" disabled={disabled} type="submit">{saving?"جارٍ الحفظ…":"حفظ إعدادات التذكير"}</button>
   {saved?<span role="status">حُفظ في حساب نور ✓</span>:null}
   {error?<span role="alert" className="nr314-error">{error}</span>:null}
   {definition.state!=="Active"?<small>أعد تفعيل النشاط لتغيير تذكيره</small>:null}
  </div>
 </form>;
}
export function NoorReminderSettingsR314({definitions,onCommand,busy}:{definitions:readonly Definition[];onCommand:Setter;busy:boolean}):ReactElement{
 const [search,setSearch]=useState("");const [kind,setKind]=useState("all");
 const visible=definitions.filter(d=>d.state!=="Archived"&&d.state!=="Stopped"
   &&(kind==="all"||d.kind===kind)&&(!search.trim()||d.title.includes(search.trim())||d.category.includes(search.trim())));
 return <section className="nr314-settings" data-testid="reminder-settings-r314" aria-label="تنبيهات العادات والمهام">
  <header><div><h2>تنبيهات العادات والمهام</h2><p>حدد موعد كل نشاط وساعات الهدوء. تُحفظ الإعدادات بحسابك وتظهر التنبيهات داخل نور وفق المنطقة الزمنية المعتمدة، وليس على جهاز واحد فقط.</p></div><span aria-hidden="true">◷</span></header>
  <div className="nr314-filters"><input type="search" aria-label="ابحث عن نشاط للتذكير" placeholder="ابحث عن عادة أو مهمة…" value={search} onChange={e=>setSearch(e.target.value)}/>
  <select value={kind} onChange={e=>setKind(e.target.value)} aria-label="تصفية أنواع التنبيهات"><option value="all">الكل</option><option value="Habit">العادات</option><option value="Task">المهام</option></select></div>
  {visible.length?<div className="nr314-list">{visible.map(d=><ReminderTile key={`${d.id}:${d.revisionId}`} definition={d} busy={busy} onCommand={onCommand}/>)}</div>
   :<p className="nr314-empty">لا توجد أنشطة مطابقة. أضف عادة أو مهمة من مركز التحكم لتظهر هنا.</p>}
  <p className="nr314-disclaimer">هذه تنبيهات داخل التطبيق فقط، وليست إشعارات Push. لن نرسل بيانات أنشطتك إلى خدمات خارجية.</p>
 </section>;
}
export function NoorReminderRibbonR314({rows,definitions,todayDate,nowMs,timeZone}:{
 rows:readonly StatisticRow[];definitions:readonly NoorReminderDefinitionR314[];
 todayDate:string|null;nowMs:number;timeZone:string;
}):ReactElement|null{
 const alerts=noorDueRemindersR314(rows,definitions,todayDate,nowMs,timeZone);
 if(!alerts.length)return null;
 return <section className="nr314-ribbon" aria-label="تنبيهات الأنشطة المستحقة" data-testid="reminder-ribbon-r314">
  <div className="nr314-ribbon-heading"><span aria-hidden="true">◷</span><strong>{alerts.length} تذكير مستحق</strong><small>وفق توقيت الحساب</small></div>
  <div className="nr314-pills">{alerts.slice(0,4).map(a=><span key={a.definitionId} className="nr314-pill" data-kind={a.kind}><strong>{a.title}</strong>
   <small>{a.kind==="overdue"?"تجاوز الموعد":a.kind==="streak-risk"?`حافظ على سلسلة ${a.streak}`:"موعد النشاط"} · {a.time}</small></span>)}</div>
  {alerts.length>4?<small>وتوجد {alerts.length-4} تنبيهات إضافية في الإحصائيات.</small>:null}
 </section>;
}
