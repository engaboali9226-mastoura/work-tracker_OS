import {useEffect,useMemo,useRef,useState} from "react";
import type {FormEvent,ReactNode} from "react";

type Slot={id:string;day:number;period:number;subject:string;group:string;room:string;start:string;end:string};
type Workday={id:string;date:string;checkIn:string;checkOut:string};
type Prep={id:string;slotId:string;date:string;title:string;objectives:string;activities:string;homework:string};
type Student={id:string;name:string;group:string;code:string};
type Attendance={id:string;slotId:string;studentId:string;date:string;status:string};
type Assessment={id:string;group:string;title:string;date:string;maxScore:number};
type Grade={id:string;assessmentId:string;studentId:string;score:number};
type Work={version:1;timetable:Slot[];workdays:Workday[];preparations:Prep[];
 students:Student[];attendance:Attendance[];assessments:Assessment[];grades:Grade[]};
type Tab="overview"|"schedule"|"clock"|"prep"|"students"|"attendance"|"exams";
const PATH="/api/noor/work/teacher";
const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const tabs:ReadonlyArray<{id:Tab;name:string}>= [
 {id:"overview",name:"الرئيسية"},{id:"schedule",name:"الجدول"},
 {id:"clock",name:"دوامي"},{id:"prep",name:"التحضير"},
 {id:"students",name:"الطلاب"},{id:"attendance",name:"حضور الطلاب"},
 {id:"exams",name:"الاختبارات والرصد"},
];
const blank=():Work=>({version:1,timetable:[],workdays:[],preparations:[],students:[],attendance:[],assessments:[],grades:[]});
function isWorkResponse(value:unknown):value is {revision:number;state:Work}{
 if(!value||typeof value!=="object")return false;
 const candidate=value as {revision?:unknown;state?:unknown};
 if(typeof candidate.revision!=="number"||!Number.isSafeInteger(candidate.revision)||candidate.revision<0||
   !candidate.state||typeof candidate.state!=="object")return false;
 const state=candidate.state as Partial<Work>;
 return state.version===1&&
   ["timetable","workdays","preparations","students","attendance","assessments","grades"]
    .every(key=>Array.isArray(state[key as keyof Work]));
}
const uid=()=>crypto.randomUUID();
function todayRiyadh():string{
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
const field=(form:FormData,name:string)=>String(form.get(name)??"").trim();
const time=(iso:string)=>iso?new Date(iso).toLocaleTimeString("ar-SA",{timeZone:"Asia/Riyadh",hour:"2-digit",minute:"2-digit"}):"—";
function Panel({title,description,children}:{title:string;description?:string;children:ReactNode}){
 return <section className="nw-panel"><div className="nw-panel-head"><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{children}</section>;
}
function Empty({children}:{children:ReactNode}){return <p className="nw-empty">{children}</p>;}
function Input({name,label,placeholder="",required=true,type="text",min,max,step}:{name:string;label:string;placeholder?:string;required?:boolean;type?:string;min?:string;max?:string;step?:string}){
 return <label className="nw-field"><span>{label}</span><input name={name} type={type} placeholder={placeholder} required={required} min={min} max={max} step={step}/></label>;
}
function Select({name,label,children}:{name:string;label:string;children:ReactNode}){
 return <label className="nw-field"><span>{label}</span><select name={name} required>{children}</select></label>;
}
function SaveHint(){return <small className="nw-help">التغييرات لا تُحفظ إلا عند الضغط على «حفظ التغييرات».</small>;}
export function NoorWorkTeacherViewR264(){
 const [work,setWork]=useState<Work>(blank);
 const [revision,setRevision]=useState(0);
 const [tab,setTab]=useState<Tab>("overview");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [message,setMessage]=useState("");
 const [status,setStatus]=useState(503);
 const revisionOfDraft=useRef(0);
 const requestEpoch=useRef(0);
 const savingLock=useRef(false);
 const [attendanceSlot,setAttendanceSlot]=useState("");
 const [attendanceDate,setAttendanceDate]=useState(todayRiyadh());
 const [selectedExam,setSelectedExam]=useState("");
 const today=todayRiyadh();
 const fetchWork=async()=>{
   const epoch=++requestEpoch.current;
   setLoading(true);setMessage("");
   try{
     const response=await fetch(PATH,{credentials:"same-origin",cache:"no-store"});
     if(epoch!==requestEpoch.current)return;
     if(!response.ok){
       setStatus(response.status);
       setMessage(response.status===403?"ليس لهذا الحساب صلاحية نور ورك.":response.status===401?"انتهت جلسة الدخول. ارجع للبوابة وسجل دخولك مجددًا.":"تعذر الاتصال ببيانات نور ورك. لم نعرض بيانات افتراضية بدل بياناتك الحقيقية.");
       return;
     }
     const data:unknown=await response.json();
     if(!isWorkResponse(data))throw Error("TEACHER_STATE_INVALID");
     if(epoch!==requestEpoch.current)return;
     setStatus(200);setRevision(data.revision);setWork(data.state);setDirty(false);
   }catch{
     if(epoch===requestEpoch.current){
       setStatus(503);setMessage("تعذر تحميل بيانات المعلم بأمان. تحقق من الاتصال ثم حاول مجددًا.");
     }
   }finally{if(epoch===requestEpoch.current)setLoading(false);}
 };
 useEffect(()=>{void fetchWork();return()=>{requestEpoch.current+=1;};},[]);
 useEffect(()=>{
   if(!dirty)return;
   const preventExit=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
   window.addEventListener("beforeunload",preventExit);
   return()=>window.removeEventListener("beforeunload",preventExit);
 },[dirty]);
 const edit=(next:(prev:Work)=>Work)=>{
   revisionOfDraft.current+=1;
   setWork(p=>next(p));setDirty(true);setMessage("");
 };
 const save=async()=>{
   if(savingLock.current||!dirty)return;
   savingLock.current=true;
   const savedCounter=revisionOfDraft.current;
   setSaving(true);setMessage("");
   try{
     const r=await fetch(PATH,{method:"PUT",credentials:"same-origin",
       headers:{"Content-Type":"application/json"},
       body:JSON.stringify({expectedRevision:revision,state:work})});
     if(r.status===409){setMessage("هناك تعديل أحدث على الخادم. احتفظ بالتعديلات الموجودة أمامك قبل إعادة التحميل.");return;}
     if(!r.ok){setMessage(r.status===400?"البيانات غير مكتملة أو تجاوزت الحد المسموح.":"تعذر الحفظ. ما زالت تعديلاتك على الشاشة.");return;}
     const data:unknown=await r.json();
     if(!data||typeof data!=="object"||!("revision" in data)||typeof data.revision!=="number"||!Number.isSafeInteger(data.revision))throw Error("REVISION_INVALID");
     setRevision(data.revision);
     if(revisionOfDraft.current===savedCounter){
       setDirty(false);setMessage("تم حفظ بياناتك في مساحة نور ورك بنجاح.");
     }else{
       setMessage("تم حفظ النسخة السابقة. توجد تعديلات جديدة لم تحفظ بعد؛ اضغط حفظ مجددًا.");
     }
   }catch{setMessage("تعذر التأكد من الحفظ. التعديلات ما زالت ظاهرة؛ تحقق من الاتصال قبل المحاولة مجددًا.");}
   finally{savingLock.current=false;setSaving(false);}
 };
 const submit=(fn:(f:FormData)=>void)=>(e:FormEvent<HTMLFormElement>)=>{
   e.preventDefault();const form=e.currentTarget;fn(new FormData(form));form.reset();
 };
 const sorted=[...work.timetable].sort((a,b)=>a.day-b.day||a.period-b.period);
 const groups=useMemo(()=>[...new Set(work.students.map(x=>x.group).filter(Boolean))].sort(),[work.students]);
 const daylog=work.workdays.find(x=>x.date===today);
 const times=daylog?.checkIn&&daylog?.checkOut
   ?Math.max(0,Math.round((Date.parse(daylog.checkOut)-Date.parse(daylog.checkIn))/60000)):null;
 const updateAttendance=(slotId:string,studentId:string,statusValue:string)=>{
   edit(p=>{const existing=p.attendance.find(x=>x.slotId===slotId&&x.studentId===studentId&&x.date===attendanceDate);
     return {...p,attendance:existing?p.attendance.map(x=>x.id===existing.id?{...x,status:statusValue}:x)
     :[...p.attendance,{id:uid(),slotId,studentId,date:attendanceDate,status:statusValue}]};
   });
 };
 const updateGrade=(assessmentId:string,studentId:string,value:string)=>{
   edit(p=>{const a=p.assessments.find(x=>x.id===assessmentId);const val=Math.min(a?.maxScore??0,Math.max(0,Number(value)||0));
     const old=p.grades.find(x=>x.assessmentId===assessmentId&&x.studentId===studentId);
     return {...p,grades:old?p.grades.map(x=>x.id===old.id?{...x,score:val}:x)
       :[...p.grades,{id:uid(),assessmentId,studentId,score:val}]};
   });
 };
 if(loading)return <main className="nw-root" dir="rtl"><Panel title="نور ورك"><p>جارٍ تحميل مساحة العمل الآمنة…</p></Panel></main>;
 if(status!==200)return <main className="nw-root" dir="rtl">
   <header className="nw-header"><div><span className="nw-kicker">NOOR WORK · التعليم</span>
    <h1>مساحة المعلم</h1><p>الجدول، الحضور، التحضير، الطلاب، والدرجات.</p></div>
    <a className="nw-light-button" href="/">العودة لاختيار التطبيقات</a></header>
   <Panel title={status===403?"صلاحية نور ورك غير مفعّلة":status===401?"تسجيل الدخول مطلوب":"تعذر تحميل مساحة المعلم"}>
     <p role="alert">{message}</p><div className="nw-actions"><button className="nw-primary" onClick={()=>void fetchWork()}>إعادة المحاولة</button>
     <a href="/" className="nw-light-button">العودة للبوابة</a></div>
   </Panel></main>;
 return <main className="nw-root" dir="rtl">
  <header className="nw-header"><div><span className="nw-kicker">NOOR WORK · التعليم</span>
   <h1>مساحة المعلم</h1><p>جدولك، دوامك، تحضيرك، طلابك، ودرجاتك في مكان واحد.</p></div>
   <div className="nw-actions"><a href="/" className="nw-light-button">منصة نور</a>
    <button type="button" disabled={!dirty||saving} className="nw-primary" onClick={()=>void save()}>{saving?"جارٍ الحفظ…":dirty?"حفظ التغييرات •":"جميع التغييرات محفوظة"}</button>
   </div></header>
  {message?<div className="nw-notice" role="status">{message}</div>:null}
  <nav className="nw-tabs" aria-label="أقسام نور ورك">{tabs.map(t=><button type="button" key={t.id} className={t.id===tab?"selected":""} onClick={()=>setTab(t.id)}>{t.name}</button>)}</nav>
  {tab==="overview"?<div className="nw-grid">
    {!work.timetable.length?<Panel title="ابدأ تجهيز مساحة المعلم" description="٣ خطوات عملية لإعداد أول أسبوع دون إدخال بيانات طلاب حقيقية.">
      <ol className="nw-onboarding">
       <li><strong>أدخل جدول حصصك</strong><span>اختر اليوم والحصة والشعبة من الجدول، حتى تكمل ٢١ حصة أسبوعيًا.</span></li>
       <li><strong>حضّر أول درس</strong><span>أضف أهداف الدرس والأنشطة والواجب المرتبط بالحصة.</span></li>
       <li><strong>جرّب الحضور والرصد</strong><span>ابدأ بطلاب تجريبيين؛ البيانات المدرسية الحقيقية تتطلب إذن المدرسة.</span></li>
      </ol>
      <button type="button" className="nw-primary" onClick={()=>setTab("schedule")}>إعداد جدول الحصص</button>
    </Panel>:null}
    <Panel title="ملخص الأسبوع" description="هدفك التدريسي: ٢١ حصة في الأسبوع."><div className="nw-metrics">
      <div><b>{work.timetable.length} / 21</b><span>حصة مُدرجة بالجدول</span></div>
      <div><b>{work.preparations.length}</b><span>تحضير محفوظ</span></div>
      <div><b>{work.students.length}</b><span>طالب مسجل</span></div>
      <div><b>{work.assessments.length}</b><span>اختبار أو تقييم</span></div>
    </div><p className="nw-help">الحصص الـ٢١ هدف أسبوعي؛ أضف مواعيدك وصفوفك الحقيقية من «الجدول».</p>
    <div className="nw-progress"><span style={{width:`${Math.min(100,work.timetable.length/21*100)}%`}}/></div></Panel>
    <Panel title="دوام اليوم" description={today}><div className="nw-stamp"><span>الحضور {time(daylog?.checkIn??"")}</span><span>الانصراف {time(daylog?.checkOut??"")}</span></div>
     <p className="nw-help">تسجيل الدوام يدويًا؛ لا نحدد موقعك ولا نرسل حضورًا رسميًا إلى المدرسة.</p></Panel>
    <Panel title="حصص اليوم"><ul className="nw-list">{sorted.filter(x=>x.day===new Date(today+"T12:00:00").getDay()).map(x=><li key={x.id}><b>الحصة {x.period} · {x.subject||"مادة غير محددة"}</b><span>{x.group||"لم تحدد الصف"} · {x.room}</span></li>)}</ul>
      {!sorted.some(x=>x.day===new Date(today+"T12:00:00").getDay())?<Empty>لا توجد حصص محددة لليوم.</Empty>:null}</Panel>
  </div>:null}
  {tab==="schedule"?<div className="nw-grid">
    <Panel title="إضافة حصة للجدول" description="أدخل معلومات كل حصة من حصصك الـ٢١."><form className="nw-form" onSubmit={submit(f=>{
      const day=Number(field(f,"day")),period=Number(field(f,"period"));
      if(work.timetable.some(x=>x.day===day&&x.period===period)){setMessage("هناك حصة مسجلة في نفس اليوم والفترة.");return;}
      edit(p=>({...p,timetable:[...p.timetable,{id:uid(),day,period,subject:field(f,"subject"),group:field(f,"group"),room:field(f,"room"),start:field(f,"start"),end:field(f,"end") }]}));
    })}><Select name="day" label="اليوم">{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</Select>
      <Input name="period" label="رقم الحصة" type="number" min="1" max="12"/>
      <Input name="subject" label="المادة" placeholder="علوم"/>
      <Input name="group" label="الصف / الشعبة" placeholder="الخامس أ"/>
      <Input name="room" label="الفصل / الغرفة" required={false}/>
      <Input name="start" label="البداية" type="time" required={false}/>
      <Input name="end" label="النهاية" type="time" required={false}/>
      <button className="nw-primary" type="submit">إضافة الحصة</button><SaveHint/></form></Panel>
    <Panel title="الجدول الأسبوعي"><ul className="nw-list">{sorted.map(x=><li key={x.id}><div><b>{days[x.day]} · الحصة {x.period} · {x.subject}</b><span>{x.group} {x.start? `· ${x.start}`:""}</span></div><button type="button" className="nw-delete" onClick={()=>{
      if(work.preparations.some(z=>z.slotId===x.id)||work.attendance.some(z=>z.slotId===x.id)){setMessage("احذف تحضيرات الحصة وسجلات الحضور المرتبطة بها أولًا.");return;}
      edit(p=>({...p,timetable:p.timetable.filter(z=>z.id!==x.id)}));
    }}>حذف</button></li>)}</ul>{!sorted.length?<Empty>الجدول فارغ. أضف أول حصة.</Empty>:null}</Panel>
  </div>:null}
  {tab==="clock"?<div className="nw-grid">
    <Panel title="الحضور والانصراف" description="سجل دوامك اليومي لنفسك فقط."><p className="nw-tag">{today}</p>
      <div className="nw-stamp"><span>الحضور {time(daylog?.checkIn??"")}</span><span>الانصراف {time(daylog?.checkOut??"")}</span></div>
      <div className="nw-actions"><button type="button" className="nw-primary" disabled={!!daylog?.checkIn} onClick={()=>{
        edit(p=>({...p,workdays:[...p.workdays,{id:uid(),date:today,checkIn:new Date().toISOString(),checkOut:""}]}));
      }}>تسجيل الحضور</button><button type="button" disabled={!daylog?.checkIn||!!daylog.checkOut} className="nw-light-button" onClick={()=>{
        edit(p=>({...p,workdays:p.workdays.map(x=>x.date===today?{...x,checkOut:new Date().toISOString()}:x)}));
      }}>تسجيل الانصراف</button></div>
      {times!==null?<p>مدة الدوام: {Math.floor(times/60)} ساعة و{times%60} دقيقة</p>:null}<SaveHint/></Panel>
    <Panel title="سجل الدوام"><ul className="nw-list">{[...work.workdays].reverse().map(x=><li key={x.id}><b>{x.date}</b><span>{time(x.checkIn)} — {time(x.checkOut)}</span></li>)}</ul>
      {!work.workdays.length?<Empty>لم يُسجل دوام بعد.</Empty>:null}</Panel>
  </div>:null}
  {tab==="prep"?<div className="nw-grid">
    <Panel title="تحضير حصة جديدة"><form className="nw-form" onSubmit={submit(f=>{
      edit(p=>({...p,preparations:[...p.preparations,{id:uid(),slotId:field(f,"slot"),date:field(f,"date"),title:field(f,"title"),objectives:field(f,"objectives"),activities:field(f,"activities"),homework:field(f,"homework") }]}));
    })}><Select name="slot" label="الحصة">{sorted.map(x=><option value={x.id} key={x.id}>{days[x.day]} · {x.period} · {x.subject} · {x.group}</option>)}</Select>
    <Input name="date" label="التاريخ" type="date"/>
    <Input name="title" label="عنوان الدرس"/>
    <label className="nw-field"><span>الأهداف التعليمية</span><textarea name="objectives" maxLength={2500}/></label>
    <label className="nw-field"><span>استراتيجيات التعلم والأنشطة</span><textarea name="activities" maxLength={2500}/></label>
    <label className="nw-field"><span>الواجب أو التقويم</span><textarea name="homework" maxLength={1200}/></label>
    <button className="nw-primary" type="submit" disabled={!sorted.length}>إضافة التحضير</button><SaveHint/></form></Panel>
    <Panel title="دفتر التحضير"><ul className="nw-list">{[...work.preparations].reverse().map(p=><li key={p.id}><div><b>{p.title} · {p.date}</b><span>{p.objectives||"لا توجد أهداف"}</span></div>
      <button type="button" className="nw-delete" onClick={()=>edit(w=>({...w,preparations:w.preparations.filter(x=>x.id!==p.id)}))}>حذف</button></li>)}</ul>
      {!work.preparations.length?<Empty>أضف حصص الجدول ثم ابدأ التحضير.</Empty>:null}</Panel>
  </div>:null}
  {tab==="students"?<div className="nw-grid">
    <Panel title="إضافة طالب"><form className="nw-form" onSubmit={submit(f=>{
      edit(p=>({...p,students:[...p.students,{id:uid(),name:field(f,"name"),group:field(f,"group"),code:field(f,"code") }]}));
    })}><Input name="name" label="اسم الطالب"/>
    <Input name="group" label="الصف / الشعبة" placeholder="الخامس أ"/>
    <Input name="code" label="رقم اختياري" required={false}/>
    <button className="nw-primary" type="submit">إضافة الطالب</button><SaveHint/></form></Panel>
    <Panel title="قائمة الطلاب" description="مرئية لحسابك المصرح فقط، ولا تُشارك مع الحسابات التجريبية.">
      <ul className="nw-list">{work.students.map(x=><li key={x.id}><div><b>{x.name}</b><span>{x.group} {x.code&&`· ${x.code}`}</span></div><button type="button" className="nw-delete" onClick={()=>{
         if(work.attendance.some(a=>a.studentId===x.id)||work.grades.some(a=>a.studentId===x.id)){setMessage("يوجد حضور أو درجات مرتبطة بالطالب، لا يمكن حذفه من القائمة مباشرة.");return;}
         edit(p=>({...p,students:p.students.filter(s=>s.id!==x.id)}));
       }}>حذف</button></li>)}</ul>{!work.students.length?<Empty>ابدأ بأسماء تجريبية قبل إدخال أسماء حقيقية.</Empty>:null}</Panel>
  </div>:null}
  {tab==="attendance"?<div className="nw-grid">
    <Panel title="حضور الطلاب"><div className="nw-form">
      <label className="nw-field"><span>الحصة</span><select value={attendanceSlot} onChange={e=>setAttendanceSlot(e.target.value)}>
       <option value="">اختر الحصة</option>{sorted.map(x=><option value={x.id} key={x.id}>{days[x.day]} · {x.subject} · {x.group}</option>)}</select></label>
      <label className="nw-field"><span>التاريخ</span><input type="date" value={attendanceDate} onChange={e=>setAttendanceDate(e.target.value)}/></label>
      </div>
      {(()=>{
       const slot=work.timetable.find(x=>x.id===attendanceSlot);
       const roster=work.students.filter(x=>x.group===slot?.group);
       return <><ul className="nw-list">{roster.map(s=>{
         const existing=work.attendance.find(x=>x.slotId===attendanceSlot&&x.studentId===s.id&&x.date===attendanceDate);
         return <li key={s.id}><b>{s.name}</b><select aria-label={`حضور ${s.name}`} value={existing?.status??""} onChange={e=>updateAttendance(attendanceSlot,s.id,e.target.value)}>
          <option value="" disabled>لم يُرصد</option><option value="present">حاضر</option>
          <option value="absent">غائب</option><option value="late">متأخر</option>
          <option value="excused">بعذر</option></select></li>;
       })}</ul>{!slot?<Empty>اختر الحصة أولًا.</Empty>:!roster.length?<Empty>لم تُضف طلابًا لهذه الشعبة.</Empty>:<SaveHint/>}</>;
      })()}
    </Panel>
    <Panel title="ملخص الرصد">{(()=>{
      const entries=work.attendance.filter(x=>x.slotId===attendanceSlot&&x.date===attendanceDate);
      return <div className="nw-metrics"><div><b>{entries.filter(x=>x.status==="present").length}</b><span>حاضر</span></div><div><b>{entries.filter(x=>x.status==="absent").length}</b><span>غائب</span></div><div><b>{entries.filter(x=>x.status==="late").length}</b><span>متأخر</span></div><div><b>{entries.filter(x=>x.status==="excused").length}</b><span>بعذر</span></div></div>;
    })()}</Panel>
  </div>:null}
  {tab==="exams"?<div className="nw-grid">
    <Panel title="إضافة اختبار أو تقييم"><form className="nw-form" onSubmit={submit(f=>{
      edit(p=>({...p,assessments:[...p.assessments,{id:uid(),group:field(f,"group"),title:field(f,"title"),date:field(f,"date"),maxScore:Number(field(f,"maxScore")) }]}));
    })}><Input name="title" label="اسم الاختبار" placeholder="اختبار الوحدة الأولى"/>
    <label className="nw-field"><span>الشعبة</span><input list="nw-groups" required name="group"/><datalist id="nw-groups">{groups.map(g=><option key={g} value={g}/>)}</datalist></label>
    <Input name="date" label="التاريخ" type="date"/>
    <Input name="maxScore" label="الدرجة الكلية" type="number" min="1" max="1000" step="0.5"/>
    <button className="nw-primary" type="submit">إضافة الاختبار</button><SaveHint/></form></Panel>
    <Panel title="رصد الدرجات"><label className="nw-field"><span>اختر الاختبار</span><select value={selectedExam} onChange={e=>setSelectedExam(e.target.value)}>
      <option value="">اختر اختبارًا</option>{work.assessments.map(a=><option key={a.id} value={a.id}>{a.title} · {a.group} · {a.date}</option>)}</select></label>
      {(()=>{
        const exam=work.assessments.find(a=>a.id===selectedExam);
        if(!exam)return <Empty>أضف اختبارًا، ثم اختره لرصد الدرجات.</Empty>;
        const roster=work.students.filter(s=>s.group===exam.group);
        return <><ul className="nw-list">{roster.map(s=>{
          const row=work.grades.find(g=>g.assessmentId===exam.id&&g.studentId===s.id);
          return <li key={s.id}><b>{s.name}</b><label className="nw-score"><input key={row?.id??s.id} type="number" min="0" max={exam.maxScore} step="0.5" defaultValue={row?.score??""} onBlur={e=>{if(e.target.value!=="")updateGrade(exam.id,s.id,e.target.value);}} aria-label={`درجة ${s.name}`}/> / {exam.maxScore}</label></li>;
        })}</ul>{!roster.length?<Empty>لا يوجد طلاب مسجلون لهذه الشعبة.</Empty>:<SaveHint/>}</>;
      })()}</Panel>
  </div>:null}
  {dirty?<div className="nw-save-dock" role="status"><span>لديك تغييرات لم تُحفظ بعد</span>
    <button type="button" disabled={saving} onClick={()=>void save()} className="nw-primary">{saving?"جارٍ الحفظ…":"حفظ التغييرات"}</button>
  </div>:null}
 </main>;
}
