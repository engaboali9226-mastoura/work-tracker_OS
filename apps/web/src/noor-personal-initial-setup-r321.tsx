import {useState,type FormEvent,type ReactElement} from "react";
import {revokeNoorBrowserSessionR269} from "./noor-session-logout-client-r269.js";

type CityKey="riyadh"|"cairo"|"dubai"|"london";
type PrayerMethod="UmmAlQura"|"Egyptian"|"MuslimWorldLeague"|"Karachi"|"NorthAmerica";
const cities:ReadonlyArray<{key:CityKey;name:string;timeZone:string}>=[
 {key:"riyadh",name:"الرياض – السعودية",timeZone:"Asia/Riyadh"},
 {key:"cairo",name:"القاهرة – مصر",timeZone:"Africa/Cairo"},
 {key:"dubai",name:"دبي – الإمارات",timeZone:"Asia/Dubai"},
 {key:"london",name:"لندن – بريطانيا",timeZone:"Europe/London"},
];
const methods:ReadonlyArray<{key:PrayerMethod;label:string}>=[
 {key:"UmmAlQura",label:"أم القرى"},
 {key:"Egyptian",label:"الهيئة المصرية العامة للمساحة"},
 {key:"MuslimWorldLeague",label:"رابطة العالم الإسلامي"},
 {key:"Karachi",label:"كراتشي"},
 {key:"NorthAmerica",label:"أمريكا الشمالية"},
];
export function NoorPersonalInitialSetupR321({onConfigured}:{
 onConfigured:()=>void|Promise<void>
}):ReactElement{
 const [city,setCity]=useState<CityKey|"">("");
 const [method,setMethod]=useState<PrayerMethod|"">("");
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy||!city||!method||!confirmed)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/noor/personal/command",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({type:"initialize-personal-profile-r321",city,calculationMethod:method}),
   });
   if(response.status===204){
    setNotice("تم اعتماد مدينتك وطريقة حساب مواقيت الصلاة. جارٍ تجهيز يوم نور…");
    await onConfigured();return;
   }
   if(response.status===409){
    setError("قد تكون بيانات الحساب أُعدّت بالفعل. حدّث الصفحة لقراءة الإعداد الحالي، أو راجع مسؤول المنصة.");
    return;
   }
   if(response.status===401||response.status===403){
    setError("انتهت جلسة الدخول أو ليس لديك تصريح نور بيرسونال. سجّل الدخول مجددًا.");
    return;
   }
   setError("تعذّر اعتماد الإعداد الآن. لا يزال الحساب محفوظًا ويمكن إعادة المحاولة.");
  }catch{setError("تعذّر الاتصال بخدمة الإعداد. تحقق من الإنترنت ثم أعد المحاولة.");}
  finally{setBusy(false);}
 };
 const logout=async()=>{
  if(busy)return;setBusy(true);
  try{const ok=await revokeNoorBrowserSessionR269();if(!ok)throw Error("LOGOUT_FAILED");
    window.location.replace("/");
  }catch{setBusy(false);setError("تعذر إنهاء الجلسة بأمان؛ أعد المحاولة.");}
 };
 return <section className="np-r321-onboarding" data-testid="noor-first-login-r321" dir="rtl">
  <header className="np-r321-header">
   <img src="/noor-platform-logo.jpeg" alt="شعار منصة نور" width="68" height="68"/>
   <div><small lang="en">WELCOME TO NOOR</small><h1>أهلًا بك في نور</h1>
    <p>الإعداد مطلوب: يلزم استكمال إعداد الموقع وسياسة الصلاة قبل بدء يوم نور. خطوتان بسيطتان فقط.</p></div>
  </header>
  <form onSubmit={e=>{void submit(e);}}>
   <fieldset><legend><span className="np-r321-step">١</span> اختر مدينتك</legend>
    <p>نستخدم مركز المدينة لحساب الأوقات، ولا نحتاج موقع GPS الدقيق.</p>
    <div className="np-r321-city-grid">
     {cities.map(c=><label key={c.key} className={city===c.key?"np-r321-selected":""}>
      <input type="radio" name="city" value={c.key} checked={city===c.key}
        disabled={busy} onChange={()=>{setCity(c.key);setConfirmed(false);}}/>
      <strong>{c.name}</strong><small dir="ltr">{c.timeZone}</small>
     </label>)}
    </div>
   </fieldset>
   <fieldset><legend><span className="np-r321-step">٢</span> طريقة حساب مواقيت الصلاة</legend>
    <p>اختر المرجع المناسب لمنطقتك؛ يمكنك ضبط المدينة لاحقًا من مركز التحكم.</p>
    <select required aria-label="طريقة حساب الصلاة" disabled={busy} value={method}
      onChange={e=>{setMethod(e.target.value as PrayerMethod);setConfirmed(false);}}>
     <option value="">اختر طريقة الحساب…</option>
     {methods.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
    </select>
   </fieldset>
   <label className="np-r321-confirm"><input type="checkbox" checked={confirmed}
     onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/>
     أؤكد اختيار المدينة وطريقة الحساب وأوافق على بدء يومي وفق هذه الإعدادات.</label>
   {error?<p role="alert" className="np-r321-error">{error}</p>:null}
   {notice?<p role="status" className="np-r321-notice">{notice}</p>:null}
   <button className="np-r321-primary" type="submit" disabled={busy||!city||!method||!confirmed}>
    {busy?"جارٍ الإعداد…":"اعتماد الإعداد وبدء نور"}</button>
  </form>
  <button type="button" className="np-r321-secondary" disabled={busy}
   onClick={()=>{void logout();}}>تسجيل الخروج والعودة</button>
 </section>;
}
