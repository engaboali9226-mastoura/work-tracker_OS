import {useEffect,useRef,useState,type ReactElement,type FormEvent} from "react";
import type {NoorPersonalCommandInput,NoorBeveragePlanR294} from "./noor-personal-today-client.js";
import {activeServingsR295,classifyCaffeineR295,kindForDrinkR295,localClockR295,validClockR295,type CaffeineKindR295} from "./noor-caffeine-health-r295.js";

/** Drink events are owned by the same trusted Personal activity ledger as R294. */
export type BeverageEntryR294=Readonly<{id:string;executionId:string;at:string;localDate:string;amount:number;beverageTime?:string}>;
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
const LABELS_R295:{value:string;label:string}[]=[
 {value:"now",label:"الآن · الوقت الحالي"},
 {value:"dawn",label:"فجرًا · 05:00"},
 {value:"duha",label:"ضحى · 09:00"},
 {value:"morning",label:"صباحًا · 08:00"},
 {value:"before-noon",label:"قبل الظهر · 10:30"},
 {value:"noon",label:"ظهرًا · 13:00"},
 {value:"afternoon",label:"عصرًا · 16:00"},
 {value:"evening",label:"مساءً · 19:00"},
 {value:"after-isha",label:"بعد العشاء · 21:00"},
 {value:"night",label:"ليلًا · 22:00"},
 {value:"manual",label:"تحديد الساعة يدويًا"}
];
const PRESET_R295:Readonly<Record<string,string>>={
 dawn:"05:00",duha:"09:00",morning:"08:00","before-noon":"10:30",noon:"13:00",afternoon:"16:00",evening:"19:00","after-isha":"21:00",night:"22:00"
};
function kindLabel(value:CaffeineKindR295){return value==="coffee"?"قهوة":value==="tea"?"شاي":"مشروب آخر";}
export function NoorBeverageTrackerR294({rows,allNames=[],localDate,busy,onCommand,historical=false,timeZone="Asia/Riyadh"}:{
 rows:readonly BeverageRowR294[];allNames?:readonly string[];localDate:string;busy:boolean;
 onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>;historical?:boolean;timeZone?:string;
}):ReactElement{
 const [newName,setNewName]=useState(""),[newTarget,setNewTarget]=useState("1"),[newMl,setNewMl]=useState("");
 const [newKind,setNewKind]=useState<CaffeineKindR295>("other");
 const [adding,setAdding]=useState(false);
 const [editing,setEditing]=useState<string|null>(null),[editName,setEditName]=useState("");
 const [editTarget,setEditTarget]=useState("1"),[editMl,setEditMl]=useState("");
 const [editKind,setEditKind]=useState<CaffeineKindR295>("other");
 const [confirmArchive,setConfirmArchive]=useState<string|null>(null);
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const [quickId,setQuickId]=useState<string|null>(null),[timeChoice,setTimeChoice]=useState("now");
 const [pendingFirstKind,setPendingFirstKind]=useState<"coffee"|"tea"|null>(null);
 const [manualClock,setManualClock]=useState("12:00");
 const ownerBedtime=rows[0]?.plan.sleepTime;
 const [bedtime,setBedtime]=useState(validClockR295(ownerBedtime)?ownerBedtime:"00:00");
 useEffect(()=>{setBedtime(validClockR295(ownerBedtime)?ownerBedtime:"00:00");},[ownerBedtime,rows[0]?.id]);
 const running=useRef(false),uncertain=useRef<{id:string;executionId:string;delta:1|-1;time?:string}|null>(null);
 const run=async(command:NoorPersonalCommandInput,warning:string):Promise<boolean>=>{
  if(busy||running.current||historical)return false;
  running.current=true;setSaving(true);setError("");
  let ok=false;try{ok=await onCommand(command);}catch{ok=false;}
  finally{running.current=false;setSaving(false);}
  if(!ok)setError(warning);
  return ok;
 };
 const ownerSleep=validClockR295(bedtime)?bedtime:"00:00";
 const summary=classifyCaffeineR295(rows,timeZone,ownerSleep);
 const quickRow=rows.find(r=>r.id===quickId)??null;
 const buildDefinition=(row:BeverageRowR294,plan:NoorBeveragePlanR294,name=row.title):Extract<NoorPersonalCommandInput,{type:"update-definition"}>=>({
   type:"update-definition",definitionId:row.id,expectedRevisionId:row.revisionId,
   kind:"Habit",title:name,category:row.category,description:row.description??"",
   startDate:row.startDate,endDate:row.endDate,scheduleKind:"Daily",weekdays:[],
   importance:row.importance,weight:row.weight,beveragePlan:plan
 });
 const add=async(event:FormEvent)=>{
  event.preventDefault();
  const name=newName.trim(),target=validCount(newTarget,30),ml=newMl===""?null:validCount(newMl,2000);
  if(!name||name.length>120||!target||(newMl!==""&&!ml)){setError("راجع اسم المشروب وعدده اليومي وحجم الحصة.");return;}
  if(allNames.some(x=>x.trim()===name)){setError("يوجد مشروب بالاسم نفسه. استخدم العداد الموجود.");return;}
  if(!validClockR295(ownerSleep)){setError("وقت النوم غير صالح.");return;}
  const ok=await run({type:"create-definition",kind:"Habit",title:name,category:"الصحة والرياضة",startDate:localDate,
   endDate:null,scheduleKind:"Daily",weekdays:[],importance:"Optional",weight:1,
   beveragePlan:{targetServings:target,kind:newKind,sleepTime:ownerSleep,...(ml?{servingMl:ml}:{})}},
   "تعذر تأكيد الإضافة؛ تحقق من ظهور النوع قبل إعادة الطلب.");
  if(ok){setNewName("");setNewTarget("1");setNewMl("");setNewKind("other");setAdding(false);}
 };
 const adjust=async(row:BeverageRowR294,delta:1|-1,beverageTime?:string):Promise<boolean>=>{
  if(busy||historical||saving)return false;
  const previous=uncertain.current;
  if(previous&&(previous.executionId!==row.executionId||previous.delta!==delta)){
   setError("لم يتأكد آخر تسجيل. أعد المحاولة نفسها أو حدّث الصفحة قبل تعديل عداد آخر.");return false;
  }
  // Reuse the exact submitted wall-clock on retry; a minute rollover cannot
  // forge a second event or break idempotent replay after an unknown response.
  const recordedTime=previous?.time??beverageTime;
  const entryId=previous?.id??globalThis.crypto.randomUUID();
  uncertain.current={id:entryId,executionId:row.executionId,delta,...(recordedTime?{time:recordedTime}:{})};
  const ok=await run({type:"adjust-beverage-serving",executionId:row.executionId,entryId,delta,
    ...(delta===1&&recordedTime?{beverageTime:recordedTime}:{})},
    "لم يتأكد تسجيل الحصة؛ أعد المحاولة نفسها دون تكرار العدد.");
  if(ok)uncertain.current=null;
  return ok;
 };
 useEffect(()=>{
  if(!pendingFirstKind)return;
  const matching=rows.find(r=>kindForDrinkR295(r)===pendingFirstKind);
  if(matching){setQuickId(matching.id);setTimeChoice("now");setPendingFirstKind(null);}
 },[rows,pendingFirstKind]);
 const chooseQuick=(row:BeverageRowR294)=>{
  setQuickId(row.id);setTimeChoice("now");setManualClock(localClockR295(new Date().toISOString(),timeZone)??"12:00");setError("");
 };
 const register=async()=>{
  if(!quickRow)return;
  const time=timeChoice==="now"?localClockR295(new Date().toISOString(),timeZone):
   timeChoice==="manual"?manualClock:PRESET_R295[timeChoice];
  if(!validClockR295(time)){setError("اختر وقتًا صالحًا للشرب.");return;}
  const ok=await adjust(quickRow,1,time);
  if(ok)setQuickId(null);
 };
 const quickCoffeeOrTea=async(kind:"coffee"|"tea")=>{
  const row=rows.find(r=>kindForDrinkR295(r)===kind);
  if(row){chooseQuick(row);return;}
  // The first tap creates the same protected daily habit definition; as soon
  // as its row arrives, show the clock options rather than a setup form.
  if(busy||saving||pendingFirstKind)return;
  const name=kind==="coffee"?"قهوة":"شاي";
  if(allNames.some(x=>x.trim()===name)){
   setNewKind(kind);setNewName(name);setNewTarget("2");setAdding(true);
   setError("يوجد نوع بهذا الاسم؛ افتح عداده أو عدّل نوعه قبل التسجيل.");return;
  }
  setPendingFirstKind(kind);
  const ok=await run({type:"create-definition",kind:"Habit",title:name,category:"الصحة والرياضة",
   startDate:localDate,endDate:null,scheduleKind:"Daily",weekdays:[],
   importance:"Optional",weight:1,beveragePlan:{targetServings:2,kind,sleepTime:ownerSleep}},
   "تعذر إنشاء عداد المشروب؛ تحقق من القائمة قبل إعادة الطلب.");
  if(!ok)setPendingFirstKind(null);
 };
 const beginEdit=(row:BeverageRowR294)=>{
  setEditing(row.id);setEditName(row.title);setEditTarget(String(row.plan.targetServings));
  setEditMl(row.plan.servingMl?String(row.plan.servingMl):"");
  setEditKind(kindForDrinkR295(row));setError("");
 };
 const saveEdit=async(row:BeverageRowR294)=>{
  const name=editName.trim(),target=validCount(editTarget,30),ml=editMl===""?null:validCount(editMl,2000);
  if(!name||name.length>120||!target||(editMl!==""&&!ml)){setError("راجع الاسم والمستهدف وحجم الكوب.");return;}
  if(allNames.some(x=>x!==row.title&&x.trim()===name)){setError("يوجد نوع آخر بالاسم نفسه.");return;}
  const plan:NoorBeveragePlanR294={targetServings:target,kind:editKind,
    ...(row.plan.sleepTime?{sleepTime:row.plan.sleepTime}:{}),
    ...(ml?{servingMl:ml}:{})};
  const ok=await run(buildDefinition(row,plan,name),"تعذر حفظ التغيير؛ حدّث البيانات إذا تغيرت على جهاز آخر.");
  if(ok)setEditing(null);
 };
 const saveBedtime=async()=>{
  if(!validClockR295(bedtime)){setError("اختر وقت نوم صالحًا.");return;}
  const first=rows[0];
  if(!first){setError("أضف مشروبًا أولًا لحفظ موعد النوم في حسابك.");return;}
  if(first.plan.sleepTime===bedtime)return;
  const ok=await run({type:"set-beverage-bedtime",sleepTime:bedtime},
    "تعذر حفظ وقت النوم. حاول مجددًا، وستظل القيمة السابقة معتمدة حتى نجاح الحفظ.");
  if(!ok)setBedtime(validClockR295(ownerBedtime)?ownerBedtime:"00:00");
 };
 return <section className={"np-card np-beverages-r294 np-caffeine-card-r299 np-caffeine-card-"+summary.level+"-r299"}
  data-testid="r294-beverage-tracker" data-status={summary.level} aria-label="سجل المشروبات اليومي">
  <header className="np-beverages-head-r294">
   <div className="np-caffeine-card-heading-r299">
    <span className="np-caffeine-card-dot-r299" aria-hidden="true"/>
    <h2>{historical?"مشروبات اليوم المحدد":"القهوة والشاي"}</h2>
   </div>
   {!historical?<button type="button" disabled={busy||saving} aria-label="إضافة مشروب" title="إضافة نوع مشروب" aria-expanded={adding} onClick={()=>{setAdding(x=>!x);setError("");}}>+ نوع</button>:null}
  </header>
  <div className="np-caffeine-card-content-r299">
   <div className="np-caffeine-summary-r295" data-testid="r295-health-indicator" data-level={summary.level}>
    <div className="np-caffeine-tally-r295">
     <div><span>القهوة</span><strong>{summary.coffee}</strong></div>
     <div><span>الشاي</span><strong>{summary.tea}</strong></div>
     <div><span aria-label="إجمالي المنبّهات">الإجمالي</span><strong>{summary.total}</strong></div>
    </div>
    <div className={"np-caffeine-signal-r295 np-caffeine-"+summary.level} role="status"
      aria-label={"حالة المنبهات: "+(summary.level==="green"?"أخضر":summary.level==="yellow"?"أصفر":"أحمر")+" — "+summary.reason}>
     <strong>{summary.level==="green"?"ضمن الحدود المختارة":summary.level==="yellow"?"انتبه للتوقيت والكمية":"تنبيه مرتفع"}</strong>
     <span className="np-caffeine-reason-r296">{summary.reason}</span>
    </div>
   </div>
   <div className="np-caffeine-cup-r299" aria-hidden="true">
    <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
     <path d="M17 9c-5 5 4 7 0 12M28 9c-5 5 4 7 0 12M39 9c-5 5 4 7 0 12"/>
     <path d="M12 27h30v7c0 10-5 15-15 15s-15-5-15-15v-7z"/>
     <path d="M42 29h5c6 0 7 11-6 13M10 50h34"/>
    </svg>
   </div>
  </div>
  {!historical?<div className="np-caffeine-quick-r295" aria-label="تسجيل كوب">
    <button type="button" onClick={()=>{void quickCoffeeOrTea("coffee");}} disabled={busy||saving}>+ قهوة</button>
    <button type="button" onClick={()=>{void quickCoffeeOrTea("tea");}} disabled={busy||saving}>+ شاي</button>
   </div>:null}
  {quickRow&&!historical?<div className="np-caffeine-time-picker-r295" data-testid="r295-time-picker">
   <strong>تسجيل {quickRow.title} — اختر الوقت أولًا</strong>
   <small className="np-caffeine-time-hint-r297">الفترات أوقات تقريبية ثابتة للتسجيل السريع، وليست مواقيت الصلاة. لتسجيل الساعة الدقيقة اختر «تحديد الساعة يدويًا».</small>
   <div className="np-caffeine-time-options-r295">{LABELS_R295.map(option=><button type="button"
     key={option.value} aria-pressed={timeChoice===option.value} onClick={()=>setTimeChoice(option.value)}>{option.label}</button>)}</div>
   {timeChoice==="manual"?<label>وقت الشرب <input type="time" aria-label="الوقت اليدوي للشرب"
     value={manualClock} onChange={e=>setManualClock(e.currentTarget.value)}/></label>:null}
   <div className="np-caffeine-picker-actions-r295">
    <button type="button" disabled={busy||saving} onClick={()=>{void register();}}>{saving?"جارٍ تأكيد الحفظ…":"تأكيد تسجيل الكوب"}</button>
    <button type="button" disabled={saving} onClick={()=>setQuickId(null)}>إلغاء</button>
   </div>
  </div>:null}
  {!historical&&adding?<form className="np-beverages-form-r294" data-testid="r294-add-beverage" onSubmit={e=>{void add(e);}}>
   <div className="np-beverages-suggest-r294" aria-label="أمثلة مشروبات">
    <button type="button" onClick={()=>{setNewName("قهوة");setNewTarget("2");setNewKind("coffee");}}>قهوة × 2</button>
    <button type="button" onClick={()=>{setNewName("شاي");setNewTarget("2");setNewKind("tea");}}>شاي × 2</button>
    <button type="button" onClick={()=>{setNewName("ماء");setNewTarget("1");setNewKind("other");}}>ماء</button>
   </div>
   <label>اسم المشروب<input aria-label="اسم المشروب" maxLength={120} required value={newName} onChange={e=>setNewName(e.currentTarget.value)} placeholder="مثال: قهوة"/></label>
   <label>النوع<select aria-label="نوع المشروب" value={newKind} onChange={e=>setNewKind(e.currentTarget.value as CaffeineKindR295)}>
    <option value="coffee">قهوة</option><option value="tea">شاي</option><option value="other">غير منبّه / غير محسوب</option>
   </select></label>
   <label>العدد اليومي المرجعي<input type="number" inputMode="numeric" min="1" max="30" required value={newTarget} onChange={e=>setNewTarget(e.currentTarget.value)}/></label>
   <label>حجم الحصة بالملليلتر (اختياري)<input type="number" inputMode="numeric" min="1" max="2000" value={newMl} onChange={e=>setNewMl(e.currentTarget.value)}/></label>
   <button type="submit" disabled={busy||saving}>إضافة العداد</button>
  </form>:null}
  <details className="np-caffeine-details-r296" open={historical}>
   <summary>التفاصيل والإعدادات</summary>
   {!historical?<div className="np-caffeine-bedtime-settings-r296">
    <label className="np-caffeine-bedtime-r295">وقت النوم المعتاد
     <input aria-label="وقت النوم المعتاد" type="time" value={bedtime} onChange={e=>setBedtime(e.currentTarget.value)}
      onBlur={()=>{if(rows.length>0&&validClockR295(bedtime)&&bedtime!==rows[0]?.plan.sleepTime)void saveBedtime();}}/>
    </label>
    <button type="button" className="np-caffeine-bedtime-save-r295" onClick={()=>{void saveBedtime();}}
     disabled={busy||saving||!rows.length||rows[0]?.plan.sleepTime===bedtime}>حفظ وقت النوم</button>
   </div>:<small>وقت النوم المستخدم: {summary.bedtime}</small>}
  {rows.length===0?<p className="np-beverages-empty-r294">لم تُضف مشروبات بعد. ابدأ بـ «+ قهوة» أو «+ شاي»، ثم سجّل وقت كل كوب.</p>:
   <div className="np-beverages-list-r294">{rows.map(row=>{
    const count=beverageCountR294(row.log,row.executionId),completed=count>=row.plan.targetServings;
    return <div className="np-beverage-row-r294" key={row.id} data-testid={"r294-beverage-row-"+row.id}>
     <div className="np-beverage-title-r294"><strong>{row.title}</strong>
      <small>{count} من {row.plan.targetServings} {row.plan.targetServings===1?"مرة":"مرات"}{row.plan.servingMl?" · "+(count*row.plan.servingMl)+" مل مسجلة":""}</small>
      <progress aria-label={"عدد حصص "+row.title} max={row.plan.targetServings} value={Math.min(row.plan.targetServings,count)}/>
     </div>
     <div className="np-beverage-actions-r294">
      {!historical?<><button type="button" disabled={busy||saving||count===0} aria-label={"إنقاص "+row.title+" بمقدار مرة"}
       onClick={()=>{void adjust(row,-1);}}>−</button>
       <strong aria-label={"تم تسجيل "+count+" "+row.title}>{count}</strong>
       <button type="button" disabled={busy||saving||count>=60} aria-label={"إضافة مرة "+row.title}
        onClick={()=>chooseQuick(row)}>+</button></>:<strong>{count}</strong>}
      <span className={completed?"np-beverage-goal-r294":""}>{completed?"اكتمل المستهدف":"قيد التسجيل"}</span>
      {!historical?<button type="button" onClick={()=>editing===row.id?setEditing(null):beginEdit(row)} disabled={busy||saving}>تعديل</button>:null}
     </div>
     {editing===row.id&&!historical?<div className="np-beverage-edit-r294" data-testid="r294-edit-beverage">
      <label>الاسم<input maxLength={120} value={editName} onChange={e=>setEditName(e.currentTarget.value)}/></label>
      <label>نوع المشروب<select value={editKind} onChange={e=>setEditKind(e.currentTarget.value as CaffeineKindR295)}>
       <option value="coffee">قهوة</option><option value="tea">شاي</option><option value="other">غير محسوب</option>
      </select></label>
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
  {summary.recent.length>0?<div className="np-caffeine-history-r295">
   <strong>آخر الأكواب المسجلة</strong>
   <ol>{summary.recent.map((e,index)=><li key={e.id+"-"+index}><span>{e.title} · {kindLabel(e.kind)}</span>
    <time dir="ltr">{e.time??"وقت غير متاح"}</time></li>)}</ol>
  </div>:null}
  <small className="np-beverage-foot-r294">{historical?"عرض سجلات هذا اليوم دون تغييرها.":"يُحفظ التسجيل في حسابك؛ صحّح العدد بزر الناقص."}</small>
  </details>
  {pendingFirstKind?<p role="status" className="np-caffeine-pending-r297">جارٍ تجهيز عداد {pendingFirstKind==="coffee"?"القهوة":"الشاي"} لأول مرة…</p>:null}
  {error?<p role="alert" className="np-beverage-error-r294">{error}</p>:null}
 </section>;
}
