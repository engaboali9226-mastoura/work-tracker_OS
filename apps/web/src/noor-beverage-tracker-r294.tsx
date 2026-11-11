import {useRef,useState,type ReactElement,type FormEvent} from "react";
import type {NoorPersonalCommandInput,NoorBeveragePlanR294} from "./noor-personal-today-client.js";

/** Uses only persisted owner-scoped activity events, never local device storage. */
export type BeverageEntryR294=Readonly<{id:string;executionId:string;at:string;localDate:string;amount:number}>;
export type BeverageRowR294=Readonly<{
 id:string;executionId:string;title:string;category:string;description?:string;
 revisionId:string;startDate:string;endDate:string|null;weight:number;
 importance:"Essential"|"Important"|"Supporting"|"Optional";status:string;
 plan:NoorBeveragePlanR294;log:readonly BeverageEntryR294[];
}>;
export function beverageCountR294(log:readonly BeverageEntryR294[],executionId:string):number{
 const n=log.filter(e=>e.executionId===executionId).reduce((v,e)=>v+e.amount,0);
 return Number.isSafeInteger(n)?n:0;
}
function validCount(value:string,max:number):number|null{
 const n=Number(value);return value.trim()!==""&&Number.isInteger(n)&&n>=1&&n<=max?n:null;
}
export function NoorBeverageTrackerR294({rows,allNames=[],localDate,busy,onCommand,historical=false}:{
 rows:readonly BeverageRowR294[];allNames?:readonly string[];localDate:string;busy:boolean;
 onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>;historical?:boolean;
}):ReactElement{
 const [newName,setNewName]=useState(""),[newTarget,setNewTarget]=useState("1"),[newMl,setNewMl]=useState("");
 const [adding,setAdding]=useState(false);
 const [editing,setEditing]=useState<string|null>(null),[editName,setEditName]=useState("");
 const [editTarget,setEditTarget]=useState("1"),[editMl,setEditMl]=useState("");
 const [confirmArchive,setConfirmArchive]=useState<string|null>(null);
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const running=useRef(false),uncertain=useRef<{id:string;executionId:string;delta:1|-1}|null>(null);
 const run=async(command:NoorPersonalCommandInput,warning:string):Promise<boolean>=>{
  if(busy||running.current||historical)return false;
  running.current=true;setSaving(true);setError("");
  let ok=false;try{ok=await onCommand(command);}catch{ok=false;}
  finally{running.current=false;setSaving(false);}
  if(!ok)setError(warning);
  return ok;
 };
 const add=async(event:FormEvent)=>{
  event.preventDefault();
  const name=newName.trim(),target=validCount(newTarget,30),ml=newMl===""?null:validCount(newMl,2000);
  if(!name||name.length>120||!target||(newMl!==""&&!ml)){setError("راجع اسم المشروب وعدده اليومي وحجم الحصة.");return;}
  if(allNames.some(x=>x.trim()===name)){setError("يوجد مشروب بالاسم نفسه. استخدم العداد الموجود.");return;}
  const ok=await run({type:"create-definition",kind:"Habit",title:name,category:"الصحة والرياضة",startDate:localDate,
   endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Optional",weight:1,
   beveragePlan:{targetServings:target,...(ml?{servingMl:ml}:{})}},
   "تعذر تأكيد الإضافة؛ تحقق من ظهور النوع قبل إعادة الطلب.");
  if(ok){setNewName("");setNewTarget("1");setNewMl("");setAdding(false);}
 };
 const adjust=async(row:BeverageRowR294,delta:1|-1)=>{
  if(busy||historical||saving)return;
  const previous=uncertain.current;
  if(previous&&(previous.executionId!==row.executionId||previous.delta!==delta)){
   setError("لم يتأكد آخر تسجيل. أعد المحاولة نفسها أو حدّث الصفحة قبل تعديل عداد آخر.");return;
  }
  const entryId=previous?.id??globalThis.crypto.randomUUID();
  uncertain.current={id:entryId,executionId:row.executionId,delta};
  const ok=await run({type:"adjust-beverage-serving",executionId:row.executionId,entryId,delta},
    "لم يتأكد تسجيل الحصة؛ أعد المحاولة نفسها دون تكرار العدد.");
  if(ok)uncertain.current=null;
 };
 const beginEdit=(row:BeverageRowR294)=>{
  setEditing(row.id);setEditName(row.title);setEditTarget(String(row.plan.targetServings));
  setEditMl(row.plan.servingMl?String(row.plan.servingMl):"");setError("");
 };
 const saveEdit=async(row:BeverageRowR294)=>{
  const name=editName.trim(),target=validCount(editTarget,30),ml=editMl===""?null:validCount(editMl,2000);
  if(!name||name.length>120||!target||(editMl!==""&&!ml)){setError("راجع الاسم والمستهدف وحجم الكوب.");return;}
  if(allNames.some(x=>x!==row.title&&x.trim()===name)){setError("يوجد نوع آخر بالاسم نفسه.");return;}
  const ok=await run({type:"update-definition",definitionId:row.id,expectedRevisionId:row.revisionId,
   kind:"Habit",title:name,category:row.category,description:row.description??"",startDate:row.startDate,
   endDate:row.endDate,scheduleKind:"Daily",weekdays:[],importance:row.importance,weight:row.weight,
   beveragePlan:{targetServings:target,...(ml?{servingMl:ml}:{})}},
   "تعذر حفظ التغيير؛ حدّث البيانات إذا تغيرت على جهاز آخر.");
  if(ok)setEditing(null);
 };
 return <section className="np-card np-beverages-r294" data-testid="r294-beverage-tracker" aria-label="سجل المشروبات اليومي">
  <header className="np-beverages-head-r294"><div><h2>{historical?"مشروبات اليوم المحدد":"مشروبات اليوم"}</h2>
   <p>سجّل كل كوب خلال اليوم؛ يحفظ في حسابك، ويبدأ عداد جديد في اليوم التالي.</p></div>
   {!historical?<button type="button" disabled={busy||saving} aria-expanded={adding} onClick={()=>{setAdding(x=>!x);setError("");}}>+ إضافة مشروب</button>:null}
  </header>
  {!historical&&adding?<form className="np-beverages-form-r294" data-testid="r294-add-beverage" onSubmit={e=>{void add(e);}}>
    <div className="np-beverages-suggest-r294" aria-label="أمثلة مشروبات">
      <button type="button" onClick={()=>{setNewName("قهوة");setNewTarget("2");}}>قهوة × 2</button>
      <button type="button" onClick={()=>{setNewName("شاي");setNewTarget("1");}}>شاي × 1</button>
      <button type="button" onClick={()=>{setNewName("ماء");setNewTarget("1");}}>ماء</button>
    </div>
    <label>اسم المشروب<input aria-label="اسم المشروب" maxLength={120} required value={newName} onChange={e=>setNewName(e.currentTarget.value)} placeholder="مثال: قهوة"/></label>
    <label>العدد اليومي المرغوب<input type="number" inputMode="numeric" min="1" max="30" required value={newTarget} onChange={e=>setNewTarget(e.currentTarget.value)}/></label>
    <label>حجم الحصة بالملليلتر (اختياري)<input type="number" inputMode="numeric" min="1" max="2000" value={newMl} onChange={e=>setNewMl(e.currentTarget.value)}/></label>
    <button type="submit" disabled={busy||saving}>إضافة العداد</button>
  </form>:null}
  {rows.length===0?<p className="np-beverages-empty-r294">لا توجد مشروبات مسجلة لهذا اليوم. يمكنك إضافة القهوة أو الشاي أو أي نوع آخر.</p>:
   <div className="np-beverages-list-r294">{rows.map(row=>{
    const count=beverageCountR294(row.log,row.executionId),completed=count>=row.plan.targetServings;
    return <div className="np-beverage-row-r294" key={row.id} data-testid={"r294-beverage-row-"+row.id}>
      <div className="np-beverage-title-r294"><strong>{row.title}</strong>
       <small>{count} من {row.plan.targetServings} {row.plan.targetServings===1?"مرة":"مرات"}{row.plan.servingMl?" · "+(count*row.plan.servingMl)+" مل مسجلة":""}</small>
       <progress aria-label={"عدد حصص "+row.title} max={row.plan.targetServings} value={Math.min(row.plan.targetServings,count)}/>
      </div>
      <div className="np-beverage-actions-r294">
       {!historical?<><button type="button" disabled={busy||saving||count===0} aria-label={"إنقاص "+row.title+" بمقدار مرة"} onClick={()=>{void adjust(row,-1);}}>−</button>
        <strong aria-label={"تم تسجيل "+count+" "+row.title}>{count}</strong>
        <button type="button" disabled={busy||saving||count>=60} aria-label={"إضافة مرة "+row.title} onClick={()=>{void adjust(row,1);}}>+</button></>:<strong>{count}</strong>}
       <span className={completed?"np-beverage-goal-r294":""}>{completed?"اكتمل المستهدف":"قيد التسجيل"}</span>
       {!historical?<button type="button" onClick={()=>editing===row.id?setEditing(null):beginEdit(row)} disabled={busy||saving}>تعديل</button>:null}
      </div>
      {editing===row.id&&!historical?<div className="np-beverage-edit-r294" data-testid="r294-edit-beverage">
       <label>الاسم<input maxLength={120} value={editName} onChange={e=>setEditName(e.currentTarget.value)}/></label>
       <label>العدد اليومي<input type="number" min="1" max="30" value={editTarget} onChange={e=>setEditTarget(e.currentTarget.value)}/></label>
       <label>حجم الحصة بالملليلتر<input type="number" min="1" max="2000" value={editMl} onChange={e=>setEditMl(e.currentTarget.value)}/></label>
       <button type="button" disabled={busy||saving} onClick={()=>{void saveEdit(row);}}>حفظ التعديل</button>
       {confirmArchive===row.id?<><span>إيقاف هذا المشروب مع الحفاظ على سجله؟</span>
        <button type="button" disabled={busy||saving} onClick={()=>{void run({type:"archive-definition",definitionId:row.id},"تعذر إيقاف المشروب.").then(ok=>{if(ok){setEditing(null);setConfirmArchive(null);}});}}>تأكيد الإيقاف</button>
        <button type="button" onClick={()=>setConfirmArchive(null)}>إلغاء</button></>:
        <button type="button" disabled={busy||saving} onClick={()=>setConfirmArchive(row.id)}>إيقاف النوع</button>}
      </div>:null}
    </div>;
   })}</div>}
  {error?<p role="alert" className="np-beverage-error-r294">{error}</p>:null}
  <small className="np-beverage-foot-r294">{historical?"عرض سجلات هذا اليوم دون تغييرها.":"يكتمل المستهدف عند بلوغ العدد المحدد، ويمكن تسجيل المزيد أو تصحيح العدد. هذه الأعداد ليست توصية صحية."}</small>
 </section>;
}
