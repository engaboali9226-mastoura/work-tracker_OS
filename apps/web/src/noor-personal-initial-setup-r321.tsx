import {NoorContextHelp} from "./noor-context-help-r382.js";
import { NoorBrandHeader } from "./noor-brand-r329.js";
import { NoorWordmark } from "./noor-wordmark.js";
import {useRef,useState,type FormEvent,type ReactElement} from "react";
import {createR386CommandIntent,sendR386CommandIntentRaw,type R386CommandIntent} from "./noor-personal-today-client.js";
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
 const pendingIntent=useRef<R386CommandIntent|null>(null);
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy||!city||!method||!confirmed)return;
  setBusy(true);setError("");setNotice("");
  try{
   const command={type:"initialize-personal-profile-r321" as const,city,calculationMethod:method};
   const intent=pendingIntent.current??createR386CommandIntent(command);
   pendingIntent.current=intent;
   const response=await sendR386CommandIntentRaw(intent);
   if(response.status===204||response.status===409||response.status===400||response.status===401||response.status===403)pendingIntent.current=null;
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
  <NoorBrandHeader scope="personal" />
  <header className="np-r321-header">
   <img src="/brand/noor-personal-picker-r369.png" alt="شعار منصة نور" width="68" height="68"/>
   <div><small lang="en">WELCOME TO <NoorWordmark /></small><h1>أهلًا بك في نور</h1>
    <p>الإعداد مطلوب: يلزم استكمال إعداد الموقع وسياسة الصلاة قبل بدء يوم نور. خطوتان بسيطتان فقط.</p></div>
  </header>
  <form onSubmit={e=>{void submit(e);}}>
   <fieldset><legend><span className="np-r321-step">١</span> اختر مدينتك<NoorContextHelp label="مساعدة: نستخدم مركز المدينة">نستخدم مركز المدينة لحساب الأوقات، ولا نحتاج موقع GPS الدقيق.</NoorContextHelp></legend>
    <div className="np-r321-city-grid">
     {cities.map(c=><label key={c.key} className={city===c.key?"np-r321-selected":""}>
      <input type="radio" name="city" value={c.key} checked={city===c.key}
        disabled={busy} onChange={()=>{pendingIntent.current=null;setCity(c.key);setConfirmed(false);}}/>
      <strong>{c.name}</strong><small dir="ltr">{c.timeZone}</small>
     </label>)}
    </div>
   </fieldset>
   <fieldset><legend><span className="np-r321-step">٢</span> طريقة حساب مواقيت الصلاة<NoorContextHelp label="مساعدة: اختر المرجع المناسب لمنطقتك">اختر المرجع المناسب لمنطقتك؛ يمكنك ضبط المدينة لاحقًا من مركز التحكم.</NoorContextHelp></legend>
    <select required aria-label="طريقة حساب الصلاة" disabled={busy} value={method}
      onChange={e=>{pendingIntent.current=null;setMethod(e.target.value as PrayerMethod);setConfirmed(false);}}>
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
