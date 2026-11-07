import {useEffect,useRef,useState} from "react";
import type {FormEvent,ReactNode} from "react";
import {
 addCivilDaysR267,dayLabelR267,riyadhDayR267,schoolClockR267,
 schoolWeekNumberR267,schoolWeekTitleR267,sundayOfR267,
} from "./noor-work-school-calendar-r267.js";
import {workdayCountdownR268,WORKDAY_START_R268,WORKDAY_END_R268} from "./noor-work-day-countdown-r268.js";

type Slot={id:string;day:number;period:number;subject:string;group:string;room:string;start:string;end:string};
type Workday={id:string;date:string;checkIn:string;checkOut:string};
type Assessment={id:string;group:string;title:string;date:string;maxScore:number};
type LessonCheck={id:string;slotId:string;date:string;prepared:boolean;attendanceRecorded:boolean};
type AssessmentCheck={id:string;assessmentId:string;prepared:boolean;corrected:boolean;recorded:boolean};
type Work={version:1;timetable:Slot[];workdays:Workday[];preparations:unknown[];students:unknown[];
 attendance:unknown[];assessments:Assessment[];grades:unknown[];
 termStartDate?:string;lessonChecks?:LessonCheck[];assessmentChecks?:AssessmentCheck[]};
type Tab="overview"|"lessons"|"schedule"|"clock"|"exams";
const PATH="/api/noor/work/teacher";
const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const tabs:ReadonlyArray<{id:Tab;name:string;symbol:string}>= [
 {id:"overview",name:"الرئيسية",symbol:"⌂"},
 {id:"lessons",name:"متابعة الحصص",symbol:"✓"},
 {id:"schedule",name:"الجدول الأسبوعي",symbol:"▦"},
 {id:"clock",name:"دوامي",symbol:"◷"},
 {id:"exams",name:"الاختبارات والرصد",symbol:"◇"},
];
const empty=():Work=>({version:1,timetable:[],workdays:[],preparations:[],students:[],attendance:[],
 assessments:[],grades:[],lessonChecks:[],assessmentChecks:[]});
function validResponse(value:unknown):value is {revision:number;state:Work}{
 if(!value||typeof value!=="object")return false;
 const o=value as {revision?:unknown;state?:unknown};
 if(typeof o.revision!=="number"||!Number.isSafeInteger(o.revision)||o.revision<0||
   !o.state||typeof o.state!=="object")return false;
 const s=o.state as Partial<Work>;
 return s.version===1&&["timetable","workdays","preparations","students","attendance","assessments","grades"]
  .every(k=>Array.isArray(s[k as keyof Work]))&&
  (s.lessonChecks===undefined||Array.isArray(s.lessonChecks))&&
  (s.assessmentChecks===undefined||Array.isArray(s.assessmentChecks));
}
const uid=()=>crypto.randomUUID();
const formText=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const teacherClock=(utc:string):string=>new Intl.DateTimeFormat("en-GB",{
 timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit",hour12:false,hourCycle:"h23",
}).format(new Date(utc));
const teacherInstant=(day:string,clock:string):string=>
 new Date(day+"T"+clock+":00+03:00").toISOString();
function Clock({now}:{now:Date}){
 const c=schoolClockR267(now);
 return <div className="nw-clock" aria-label="الساعة والتاريخ بتوقيت الرياض">
  <span className="nw-clock-caption"><span className="nw-live-dot"/> توقيت الرياض</span>
  <time className="nw-clock-time">{c.time}</time>
  <span className="nw-clock-date">{c.gregorian}</span>
  {c.hijri?<span className="nw-clock-hijri">{c.hijri} هـ</span>:null}
 </div>;
}
function Panel({title,children,description,className=""}:{title:string;children:ReactNode;description?:string;className?:string}){
 return <section className={"nw-panel nw-panel-r267 "+className}>
  <div className="nw-panel-head"><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{children}
 </section>;
}
function Empty({children}:{children:ReactNode}){return <p className="nw-empty">{children}</p>;}
function RequiredText({name,label,placeholder=""}:{name:string;label:string;placeholder?:string}){
 return <label className="nw-field"><span>{label}</span><input name={name} required maxLength={90} placeholder={placeholder}/></label>;
}
function DraftHint(){return <p className="nw-help">علامات المتابعة تخص نور فقط؛ سجل الحضور والتحضير الرسمي يظل على منصة المدرسة.</p>;}
const completed=(check:LessonCheck|undefined)=>Number(Boolean(check?.prepared))+Number(Boolean(check?.attendanceRecorded));
function LessonCard({slot,date,check,onChange}:{slot:Slot;date:string;check:LessonCheck|undefined;
 onChange:(key:"prepared"|"attendanceRecorded",value:boolean)=>void}){
 const total=completed(check);
 return <article className={"nw-lesson-card"+(total===2?" nw-lesson-complete":"")}>
  <div className="nw-lesson-heading">
   <div className="nw-period-badge">{slot.period.toLocaleString("ar-SA")}</div>
   <div className="nw-lesson-summary"><strong>{slot.subject||"المادة غير محددة"}</strong>
    <span>{slot.group||"الشعبة غير محددة"}{slot.room?" · "+slot.room:""}{slot.start?" · "+slot.start:""}</span>
   </div>
   <span className={"nw-lesson-status"+(total===2?" nw-status-done":"")}>{total===2?"مكتمل":total===1?"جارٍ":"لم يبدأ"}</span>
  </div>
  <div className="nw-check-row">
   <label className="nw-check-item"><input type="checkbox" checked={check?.prepared??false}
    onChange={e=>onChange("prepared",e.target.checked)} aria-label={"تم تحضير درس "+slot.subject+" بتاريخ "+date}/>
    <span>تم تحضير الدرس <small>على منصة المدرسة</small></span></label>
   <label className="nw-check-item"><input type="checkbox" checked={check?.attendanceRecorded??false}
    onChange={e=>onChange("attendanceRecorded",e.target.checked)} aria-label={"تم رصد حضور طلاب حصة "+slot.subject+" بتاريخ "+date}/>
    <span>تم رصد حضور الطلاب <small>على منصة المدرسة</small></span></label>
  </div>
 </article>;
}
function WeekLessons({slots,start,checks,update}:{slots:Slot[];start:string;checks:LessonCheck[];
 update:(slotId:string,date:string,key:"prepared"|"attendanceRecorded",value:boolean)=>void}){
 if(!slots.length)return <Empty>لا توجد حصص في الجدول. أضف حصصك أولًا من «الجدول الأسبوعي».</Empty>;
 return <div className="nw-day-groups">{days.map((name,day)=>{
   const list=slots.filter(s=>s.day===day).sort((a,b)=>a.period-b.period);
   if(!list.length)return null;
   const date=addCivilDaysR267(start,day);
   const marks=list.reduce((sum,s)=>sum+completed(checks.find(c=>c.slotId===s.id&&c.date===date)),0);
   return <section className="nw-day-group" key={day}>
    <div className="nw-day-heading"><div><strong>{name}</strong><span>{dayLabelR267(date)}</span></div>
     <small>{marks.toLocaleString("ar-SA")} / {(list.length*2).toLocaleString("ar-SA")} متابعة</small></div>
    <div className="nw-lesson-stack">{list.map(slot=><LessonCard key={slot.id} slot={slot} date={date}
       check={checks.find(x=>x.slotId===slot.id&&x.date===date)}
       onChange={(key,value)=>update(slot.id,date,key,value)}/>)}</div>
   </section>;
 })}</div>;
}
export function NoorWorkTeacherViewR264(){
 const [work,setWork]=useState<Work>(empty);
 const [revision,setRevision]=useState(0);
 const [tab,setTab]=useState<Tab>("overview");
 const [now,setNow]=useState(()=>new Date());
 const [weekOffset,setWeekOffset]=useState(0);
 const [arrivalTime,setArrivalTime]=useState("06:30");
 const [departureTime,setDepartureTime]=useState("12:30");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [saveError,setSaveError]=useState(false);
 const [savedOnce,setSavedOnce]=useState(false);
 const [message,setMessage]=useState("");
 const [status,setStatus]=useState(503);
 const requestEpoch=useRef(0);
 const draftCounter=useRef(0);
 const savingLock=useRef(false);
 const today=riyadhDayR267(now);
 const currentSunday=sundayOfR267(today);
 const selectedSunday=addCivilDaysR267(currentSunday,weekOffset*7);
 const weekNumber=schoolWeekNumberR267(work.termStartDate,selectedSunday);
 const title=schoolWeekTitleR267(weekNumber);
 const sorted=[...work.timetable].sort((a,b)=>a.day-b.day||a.period-b.period);
 const countdown=workdayCountdownR268(now,work.timetable);
 const checks=work.lessonChecks??[];
 const examChecks=work.assessmentChecks??[];
 const selectedLessons=sorted.map(slot=>({slot,date:addCivilDaysR267(selectedSunday,slot.day)}));
 const doneCount=selectedLessons.reduce((sum,row)=>sum+completed(checks.find(x=>x.slotId===row.slot.id&&x.date===row.date)),0);
 const totalCount=selectedLessons.length*2;
 const percent=totalCount?Math.round(doneCount/totalCount*100):0;
 const todaySlots=sorted.filter(x=>x.day===new Date(today+"T12:00:00.000Z").getUTCDay());
 const daylog=work.workdays.find(x=>x.date===today);
 const actualArrival=daylog?.checkIn?teacherClock(daylog.checkIn):"";
 const actualDeparture=daylog?.checkOut?teacherClock(daylog.checkOut):"";
 const checked=(slotId:string,date:string)=>checks.find(x=>x.slotId===slotId&&x.date===date);


 const reload=async()=>{
  const epoch=++requestEpoch.current;
  setLoading(true);setMessage("");
  try{
   const response=await fetch(PATH,{credentials:"same-origin",cache:"no-store"});
   if(epoch!==requestEpoch.current)return;
   if(!response.ok){
    setStatus(response.status);
    setMessage(response.status===403?"لا يملك هذا الحساب صلاحية فتح نور ورك.":response.status===401?
      "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.":"تعذر الوصول إلى بيانات المعلم. لم نعرض بيانات بديلة أو نغيّر محفوظاتك.");
    return;
   }
   const data:unknown=await response.json();
   if(!validResponse(data))throw Error("INVALID_WORK_RESPONSE");
   if(epoch!==requestEpoch.current)return;
   setStatus(200);setRevision(data.revision);setWork(data.state);setDirty(false);setSaveError(false);
  }catch{if(epoch===requestEpoch.current){setStatus(503);setMessage("تعذر تحميل بيانات نور ورك. تحقق من الاتصال ثم أعد المحاولة.");}}
  finally{if(epoch===requestEpoch.current)setLoading(false);}
 };
 useEffect(()=>{void reload();return()=>{requestEpoch.current+=1;};},[]);
 useEffect(()=>{
  const id=window.setInterval(()=>setNow(new Date()),1000);
  return()=>window.clearInterval(id);
 },[]);
 useEffect(()=>{
  setArrivalTime(actualArrival||"06:30");
  setDepartureTime(actualDeparture||"12:30");
 },[today,actualArrival,actualDeparture]);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 const edit=(fn:(prev:Work)=>Work)=>{
  draftCounter.current+=1;
  setWork(fn);setDirty(true);setSaveError(false);setMessage("");
 };
 const save=async()=>{
  if(savingLock.current||!dirty)return;
  savingLock.current=true;setSaving(true);setMessage("");
  const snapshot=draftCounter.current;
  try{
   const response=await fetch(PATH,{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({expectedRevision:revision,state:work})});
   if(response.status===409){setSaveError(true);setMessage("تم تعديل بياناتك من جهاز آخر. احتفظ بتغييراتك قبل تحديث الصفحة؛ لن نستبدلها تلقائيًا.");return;}
   if(!response.ok){setSaveError(true);setMessage(response.status===400?"يوجد حقل أو سجل غير صالح؛ لم يتم الحفظ.":"تعذر الحفظ التلقائي. التغييرات ما زالت ظاهرة ويمكن إعادة المحاولة.");return;}
   const result:unknown=await response.json();
   if(!result||typeof result!=="object"||!("revision" in result)||
     !Number.isSafeInteger(result.revision))throw Error("INVALID_SAVE_RESPONSE");
   setRevision(result.revision as number);
   setSavedOnce(true);setSaveError(false);
   if(draftCounter.current===snapshot){setDirty(false);setMessage("");}
   else setMessage(""); // Edits made during the request get a follow-up automatic save.
  }catch{setSaveError(true);setMessage("تعذر التأكد من الحفظ التلقائي. لم نفقد التغييرات الظاهرة؛ أعد المحاولة عند استقرار الاتصال.");}
  finally{savingLock.current=false;setSaving(false);}
 };
 // Debounce bursts of edits and never overlap writes. If an edit arrives while
 // a write is pending, commit the next revision after the first completes.
 useEffect(()=>{
  if(status!==200||!dirty||saving||saveError)return;
  const timer=window.setTimeout(()=>{void save();},600);
  return()=>window.clearTimeout(timer);
 },[work,revision,dirty,saving,saveError,status]);
 const submit=(fn:(f:FormData)=>void)=>(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();const form=e.currentTarget;fn(new FormData(form));form.reset();
 };
 const updateDayStamp=(key:"checkIn"|"checkOut",clock:string,done:boolean):boolean=>{
  if(done&&!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(clock)){
   setMessage("اختر وقتًا صحيحًا للحضور أو الانصراف.");return false;
  }
  const arrival=key==="checkIn"?(done?teacherInstant(today,clock):""):(daylog?.checkIn??"");
  const departure=key==="checkOut"?(done?teacherInstant(today,clock):""):(done?(daylog?.checkOut??""):"");
  if(departure&&(!arrival||Date.parse(departure)<Date.parse(arrival))){
   setMessage("وقت الانصراف يجب أن يساوي وقت الحضور أو يأتي بعده.");return false;
  }
  edit(prev=>{
   const row=prev.workdays.find(w=>w.date===today);
   const next={id:row?.id??uid(),date:today,checkIn:arrival,checkOut:departure};
   return {...prev,workdays:row?
    prev.workdays.map(w=>w.id===row.id?next:w):[...prev.workdays,next]};
  });
  return true;
 };
 const updateLesson=(slotId:string,date:string,key:"prepared"|"attendanceRecorded",value:boolean)=>{
  edit(prev=>{
   const arr=prev.lessonChecks??[];
   const existing=arr.find(c=>c.slotId===slotId&&c.date===date);
   const next=existing?arr.map(x=>x.id===existing.id?{...x,[key]:value}:x):
    [...arr,{id:uid(),slotId,date,prepared:key==="prepared"?value:false,
      attendanceRecorded:key==="attendanceRecorded"?value:false}];
   return {...prev,lessonChecks:next};
  });
 };
 const updateExam=(id:string,key:"prepared"|"corrected"|"recorded",value:boolean)=>{
  edit(prev=>{
   const arr=prev.assessmentChecks??[];
   const existing=arr.find(c=>c.assessmentId===id);
   const next=existing?arr.map(x=>x.id===existing.id?{...x,[key]:value}:x):
    [...arr,{id:uid(),assessmentId:id,prepared:key==="prepared"?value:false,
      corrected:key==="corrected"?value:false,recorded:key==="recorded"?value:false}];
   return {...prev,assessmentChecks:next};
  });
 };
 if(loading)return <main dir="rtl" className="nw-root nw-r267"><Panel title="نور ورك">جارٍ تحميل مساحة المعلم الآمنة…</Panel></main>;
 if(status!==200)return <main dir="rtl" className="nw-root nw-r267">
  <header className="nw-hero nw-hero-error"><div><span className="nw-kicker">NOOR WORK / EDUCATION</span><h1>مساحة المعلم</h1><p>تنظيم التزاماتك الدراسية ومتابعتها.</p></div>
   <a href="/" className="nw-light-button">العودة لاختيار التطبيقات</a></header>
  <Panel title={status===403?"صلاحية نور ورك غير مفعّلة":status===401?"تسجيل الدخول مطلوب":"تعذر تحميل مساحة المعلم"}>
   <p role="alert">{message}</p><div className="nw-actions"><button className="nw-primary" onClick={()=>void reload()}>إعادة المحاولة</button><a href="/" className="nw-light-button">العودة للبوابة</a></div>
  </Panel></main>;
 return <main dir="rtl" className="nw-root nw-r267">
  <header className="nw-hero">
   <div className="nw-hero-main">
    <span className="nw-kicker"><span className="nw-kicker-mark">✦</span> NOOR WORK / EDUCATION</span>
    <h1>مساحة المعلم</h1>
    <p>لوحة هادئة لمتابعة إنجازك على منصة المدرسة، دون تكرار تسجيل بيانات الطلاب.</p>
    <div className="nw-hero-links"><a href="/" className="nw-return">← العودة لمنصة نور</a><span className="nw-privacy">متابعتك خاصة بحسابك</span></div>
   </div>
   <Clock now={now}/>
  </header>
  <section className={"nw-day-countdown nw-countdown-"+countdown.stage} aria-label="مؤقت دوام اليوم والحصة القادمة">
   <div className="nw-countdown-info">
    <span className="nw-kicker">إيقاع الدوام · {WORKDAY_START_R268} — {WORKDAY_END_R268}</span>
    <h2>{countdown.heading}</h2>
    <p>{countdown.description}</p>
   </div>
   <div className="nw-countdown-timer" role="timer" aria-label={"الوقت المتبقي: "+countdown.target}>
    <strong dir="ltr">{countdown.target}</strong>
    <span>{countdown.stage==="in_lesson"?"حتى نهاية الحصة":countdown.stage==="next_lesson"?"حتى بداية الحصة":countdown.stage==="before_work"?"حتى بداية الدوام":countdown.stage==="after_lessons"?"حتى نهاية الدوام":countdown.stage==="day_off"?"يوم راحة":"انتهى دوام اليوم"}</span>
   </div>
   <div className="nw-countdown-progress" aria-hidden="true"><span style={{width:countdown.progress+"%"}}/></div>
  </section>
  <section className="nw-week-toolbar" aria-label="إعداد الأسبوع الدراسي">
   <div className="nw-week-main">
    <span className="nw-kicker">الخطة الأسبوعية</span>
    <h2>{title}</h2>
    <p>{dayLabelR267(selectedSunday)} — {dayLabelR267(addCivilDaysR267(selectedSunday,6))}</p>
   </div>
   <div className="nw-week-controls">
    <button type="button" onClick={()=>setWeekOffset(p=>Math.max(-100,p-1))} disabled={weekOffset<=-100} aria-label="الأسبوع السابق">→</button>
    <button type="button" className="nw-current-week" onClick={()=>setWeekOffset(0)} disabled={weekOffset===0}>الأسبوع الحالي</button>
    <button type="button" onClick={()=>setWeekOffset(p=>Math.min(100,p+1))} disabled={weekOffset>=100} aria-label="الأسبوع التالي">←</button>
   </div>
   <label className="nw-week-anchor"><span>بداية الأسبوع الدراسي الأول (الأحد)</span>
    <input type="date" value={work.termStartDate??""} onChange={e=>{
      const value=e.target.value;
      edit(prev=>({...prev,termStartDate:value?sundayOfR267(value):undefined}));
    }}/><small>حدد بداية الفصل وفق تقويم مدرستك؛ لا نفترض موعدًا رسميًا.</small>
   </label>
  </section>
  {message?<div role="status" className="nw-notice">{message}</div>:null}
  <div className={"nw-auto-save-indicator"+(saveError?" nw-save-error":"")} role="status" aria-live="polite">
   <span className="nw-live-dot" aria-hidden="true"/>
   {saveError?"الحفظ التلقائي متوقف مؤقتًا":saving?"جارٍ الحفظ تلقائيًا…":dirty?"سيتم حفظ التغيير تلقائيًا…":savedOnce?"تم الحفظ تلقائيًا":"الحفظ التلقائي مفعّل"}
  </div>
  <nav className="nw-tabs nw-tabs-r267" aria-label="أقسام نور ورك">{tabs.map(t=>
   <button type="button" key={t.id} className={t.id===tab?"selected":""} aria-current={t.id===tab?"page":undefined}
    onClick={()=>setTab(t.id)}><span aria-hidden="true">{t.symbol}</span>{t.name}</button>)}</nav>
  {tab==="overview"?<div className="nw-dashboard">
   <section className="nw-kpi-grid" aria-label="مؤشرات المتابعة">
    <div className="nw-kpi"><span>حصص الأسبوع</span><strong>{sorted.length.toLocaleString("ar-SA")} <small>/ ٢١</small></strong><small>الهدف: ٢١ حصة أسبوعيًا</small></div>
    <div className="nw-kpi"><span>تحضير الدروس</span><strong>{selectedLessons.filter(r=>checked(r.slot.id,r.date)?.prepared).length.toLocaleString("ar-SA")} <small>/ {sorted.length.toLocaleString("ar-SA")}</small></strong><small>تم التأشير عليها في نور</small></div>
    <div className="nw-kpi"><span>رصد حضور الطلاب</span><strong>{selectedLessons.filter(r=>checked(r.slot.id,r.date)?.attendanceRecorded).length.toLocaleString("ar-SA")} <small>/ {sorted.length.toLocaleString("ar-SA")}</small></strong><small>على منصة المدرسة</small></div>
    <div className="nw-kpi nw-kpi-featured"><span>إنجاز المتابعة</span><strong>{percent.toLocaleString("ar-SA")}٪</strong>
     <div className="nw-meter"><span style={{width:percent+"%"}}/></div></div>
   </section>
   <div className="nw-duo">
    <Panel title="حصص اليوم" description={schoolClockR267(now).gregorian}>
     {todaySlots.length?<div className="nw-lesson-stack">{todaySlots.map(slot=><LessonCard key={slot.id} slot={slot} date={today}
      check={checked(slot.id,today)} onChange={(k,value)=>updateLesson(slot.id,today,k,value)}/>)}</div>
     :<Empty>لا توجد حصص لهذا اليوم في جدولك.</Empty>}
     <button className="nw-soft-link" onClick={()=>setTab("lessons")}>عرض متابعة الأسبوع ←</button>
    </Panel>
    <Panel title="متابعة الأسبوع" description="كل حصة لها خطوتان فقط، دون إدخال تفاصيل التحضير أو أسماء الطلاب.">
     <div className="nw-completion-ring"><strong>{doneCount.toLocaleString("ar-SA")} <small>/ {totalCount.toLocaleString("ar-SA")}</small></strong><span>إجراء تمّ إنجازه</span></div>
     {!work.termStartDate?<div className="nw-start-alert">حدد بداية الأسبوع الأول بالأعلى حتى تظهر تسمية «الأسبوع الأول» و«الثاني» وفق تقويم مدرستك.</div>:null}
     <div className="nw-metric-foot"><span>إعداد الحصص الأسبوعية</span><b>{sorted.length.toLocaleString("ar-SA")} من ٢١</b></div>
     {!sorted.length?<div className="nw-start-alert">ابدأ تجهيز مساحة المعلم بإضافة حصص جدولك الأسبوعي.</div>:null}
     <button type="button" className="nw-primary" onClick={()=>setTab("schedule")}>إعداد جدول الحصص</button>
    </Panel>
   </div>
   <DraftHint/>
  </div>:null}
  {tab==="lessons"?<div className="nw-section">
   <Panel title={"متابعة الحصص — "+title} description="ضع علامة لكل حصة بعد إتمام التحضير ورصد الحضور فعليًا على منصة المدرسة.">
    <div className="nw-inline-summary"><span>تم إنجاز {doneCount.toLocaleString("ar-SA")} من {totalCount.toLocaleString("ar-SA")} إجراء</span>
     <div className="nw-meter"><span style={{width:percent+"%"}}/></div></div>
    <WeekLessons slots={sorted} start={selectedSunday} checks={checks} update={updateLesson}/>
   </Panel>
  </div>:null}
  {tab==="schedule"?<div className="nw-duo">
   <Panel title="إضافة حصة للجدول" description="حدّد مواعيدك الفعلية. الجدول يتكرر أسبوعيًا.">
    <form className="nw-form" onSubmit={submit(f=>{
     const day=Number(formText(f,"day")),period=Number(formText(f,"period"));
     if(work.timetable.some(x=>x.day===day&&x.period===period)){setMessage("هذه الفترة مسجلة بالفعل في نفس اليوم.");return;}
     edit(prev=>({...prev,timetable:[...prev.timetable,{id:uid(),day,period,
      subject:formText(f,"subject"),group:formText(f,"group"),room:formText(f,"room"),
      start:formText(f,"start"),end:formText(f,"end") }]}));
    })}>
     <label className="nw-field"><span>اليوم</span><select name="day" required>{days.map((day,index)=><option key={index} value={index}>{day}</option>)}</select></label>
     <label className="nw-field"><span>الحصة</span><input name="period" type="number" min="1" max="12" required/></label>
     <RequiredText name="subject" label="المادة" placeholder="العلوم"/>
     <RequiredText name="group" label="الصف أو الشعبة" placeholder="الخامس أ"/>
     <label className="nw-field"><span>الفصل (اختياري)</span><input name="room" maxLength={50}/></label>
     <label className="nw-field"><span>بداية الحصة (اختياري)</span><input type="time" name="start"/></label>
     <label className="nw-field"><span>نهاية الحصة (اختياري)</span><input type="time" name="end"/></label>
     <button className="nw-primary" type="submit">إضافة الحصة</button>
    </form>
   </Panel>
   <Panel title="الجدول الأسبوعي" description="الحذف متاح فقط للحصص التي ليس لها أي سجل متابعة أو بيانات قديمة مرتبطة.">
    {sorted.length?<div className="nw-schedule-list">{days.map((day,dayIndex)=>{
     const slots=sorted.filter(s=>s.day===dayIndex);
     return slots.length?<section className="nw-schedule-day" key={dayIndex}>
      <h3>{day} <small>{slots.length.toLocaleString("ar-SA")} حصص</small></h3>
      {slots.map(slot=><div className="nw-schedule-entry" key={slot.id}>
       <span className="nw-period-badge">{slot.period.toLocaleString("ar-SA")}</span>
       <div><strong>{slot.subject}</strong><small>{slot.group}{slot.start?" · "+slot.start:""}</small></div>
       <button className="nw-delete" type="button" onClick={()=>{
        if((work.lessonChecks??[]).some(x=>x.slotId===slot.id)||work.preparations.some(x=>
          !!x&&typeof x==="object"&&"slotId" in x&&x.slotId===slot.id)||
          work.attendance.some(x=>!!x&&typeof x==="object"&&"slotId" in x&&x.slotId===slot.id)){
         setMessage("للحفاظ على السجلات السابقة، لا يمكن حذف حصة مرتبطة بمتابعة أو حضور سابق.");return;
        }
        edit(prev=>({...prev,timetable:prev.timetable.filter(x=>x.id!==slot.id)}));
       }}>حذف</button>
      </div>)}
     </section>:null;
    })}</div>:<Empty>جدولك فارغ. أضف أول حصة من النموذج.</Empty>}
   </Panel>
  </div>:null}
  {tab==="clock"?<div className="nw-duo">
   <Panel title="متابعة الحضور والانصراف" description={"دوامك الشخصي · "+dayLabelR267(today)}>
    <p className="nw-shift-hint">الدوام المعتاد: ٦:٣٠ صباحًا — ١٢:٣٠ ظهرًا</p>
    <div className="nw-staff-attendance">
     <div className="nw-staff-attendance-line">
      <label className="nw-check-item"><input type="checkbox" aria-label="تم تسجيل الحضور"
       checked={Boolean(daylog?.checkIn)}
       onChange={e=>{void updateDayStamp("checkIn",arrivalTime,e.target.checked);}}/>
       <span>تم تسجيل الحضور <small>على نظام المدرسة</small></span></label>
      <label className="nw-field"><span>اختر وقت الحضور</span>
       <input type="time" aria-label="اختيار وقت الحضور" value={arrivalTime}
        onChange={e=>{
         const value=e.target.value;
         if(daylog?.checkIn){if(value)void updateDayStamp("checkIn",value,true);}
         else setArrivalTime(value);
        }}/></label>
     </div>
     <div className="nw-staff-attendance-line">
      <label className="nw-check-item"><input type="checkbox" aria-label="تم تسجيل الانصراف"
       checked={Boolean(daylog?.checkOut)} disabled={!daylog?.checkIn}
       onChange={e=>{void updateDayStamp("checkOut",departureTime,e.target.checked);}}/>
       <span>تم تسجيل الانصراف <small>على نظام المدرسة</small></span></label>
      <label className="nw-field"><span>اختر وقت الانصراف</span>
       <input type="time" aria-label="اختيار وقت الانصراف" value={departureTime}
        onChange={e=>{
         const value=e.target.value;
         if(daylog?.checkOut){if(value)void updateDayStamp("checkOut",value,true);}
         else setDepartureTime(value);
        }}/></label>
     </div>
    </div>
    <p className="nw-help">حدد وقت الحضور أو الانصراف بنفسك، ثم اختر «تم». لا نستخدم وقت الضغط، ولا نرسل بياناتك إلى نظام المدرسة. يحفظ نور التغيير تلقائيًا.</p>
   </Panel>
   <Panel title="سجل الأيام السابقة">{work.workdays.length?<ul className="nw-list">{[...work.workdays].reverse().filter(x=>x.checkIn||x.checkOut).slice(0,90).map(x=><li key={x.id}>
    <b>{x.date}</b><span>{x.checkIn?new Date(x.checkIn).toLocaleTimeString("ar-SA",{timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit"}):"—"} — {x.checkOut?new Date(x.checkOut).toLocaleTimeString("ar-SA",{timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit"}):"—"}</span>
   </li>)}</ul>:<Empty>لم تُسجل حضورًا أو انصرافًا بعد.</Empty>}</Panel>
  </div>:null}
  {tab==="exams"?<div className="nw-duo">
   <Panel title="إضافة اختبار للمتابعة" description="سجل اسم التقييم وموعده فقط، ثم تابع الإجراءات بعلامات الإنجاز.">
    <form className="nw-form" onSubmit={submit(f=>{
     edit(prev=>({...prev,assessments:[...prev.assessments,{id:uid(),group:formText(f,"group"),
      title:formText(f,"title"),date:formText(f,"date"),maxScore:Number(formText(f,"maxScore"))}]}));
    })}>
     <RequiredText name="title" label="اسم الاختبار" placeholder="اختبار الوحدة الأولى"/>
     <RequiredText name="group" label="الشعبة" placeholder="الخامس أ"/>
     <label className="nw-field"><span>التاريخ</span><input name="date" type="date" required/></label>
     <label className="nw-field"><span>الدرجة النهائية للتعريف بالاختبار</span><input name="maxScore" type="number" step="0.5" min="1" max="1000" required/></label>
     <button className="nw-primary" type="submit">إضافة الاختبار</button>
    </form>
   </Panel>
   <Panel title="متابعة التقييم والرصد" description="الدرجات الفردية وتفاصيل التصحيح تظل داخل منصة المدرسة.">
    {work.assessments.length?<div className="nw-exam-stack">{work.assessments.map(a=>{
     const ck=examChecks.find(x=>x.assessmentId===a.id);
     return <article className="nw-exam-card" key={a.id}><div className="nw-exam-head"><strong>{a.title}</strong>
       <small>{a.group} · {a.date}</small></div>
       <div className="nw-exam-checks">{([["prepared","تم تجهيز الاختبار"],["corrected","تم التصحيح"],["recorded","تم رصد الدرجات على منصة المدرسة"]] as const).map(([key,label])=>
        <label key={key} className="nw-check-item"><input type="checkbox" checked={ck?.[key]??false} onChange={e=>updateExam(a.id,key,e.target.checked)}/><span>{label}</span></label>
       )}</div></article>;
    })}</div>:<Empty>لا توجد اختبارات للمتابعة بعد.</Empty>}
    <p className="nw-help">احتفظنا بالسجلات التفصيلية السابقة في قاعدة البيانات، لكن لوحة المتابعة الجديدة لا تطلب أسماء الطلاب أو درجاتهم.</p>
   </Panel>
  </div>:null}
  {saveError&&dirty?<div className="nw-save-dock" role="alert">
   <span>تعذر الحفظ التلقائي؛ ما زالت التغييرات موجودة هنا.</span>
   <button className="nw-primary" type="button" disabled={saving} onClick={()=>{setSaveError(false);setMessage("");}}>إعادة محاولة الحفظ</button>
  </div>:null
 </main>;
}
