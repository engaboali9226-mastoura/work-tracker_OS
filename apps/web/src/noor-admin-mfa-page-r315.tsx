import {createNoorAdminRecoveryR317} from "./noor-admin-recovery-r317.js";
import {NoorAdminAccountsPanelR316} from "./noor-admin-accounts-panel-r316.js";
import {useRef,useState,type FormEvent,type ReactElement} from "react";
import {readBrowserPublicAuthenticationConfiguration} from "./public-authentication-environment.js";
import {createNoorAdminMfaSetupR315} from "./noor-admin-mfa-r315.js";

/**
 * Public identity security setup, NOT an admin dashboard.
 * No account data, role provisioning, account deletion or privileged calls.
 */
export function NoorAdminMfaPageR315():ReactElement{
 const service=useRef<ReturnType<typeof createNoorAdminMfaSetupR315>|null>(null);
 if(!service.current)service.current=createNoorAdminMfaSetupR315(readBrowserPublicAuthenticationConfiguration());
 const recovery=useRef<ReturnType<typeof createNoorAdminRecoveryR317>|null>(null);
 if(!recovery.current)recovery.current=createNoorAdminRecoveryR317(readBrowserPublicAuthenticationConfiguration());
 const [step,setStep]=useState<"login"|"enroll"|"verify"|"complete"|"recover-request"|"recover-finish">(
  ()=>typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("auth")==="recovery"
   ?"recover-finish":"login"
 );
 const [qr,setQr]=useState("");
 const [code,setCode]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const login=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(loading)return;
  const form=new FormData(e.currentTarget);
  setLoading(true);setError("");setNotice("");
  try{
   const result=await service.current!.signIn(String(form.get("email")??""),String(form.get("password")??""));
   if(result==="challenge-needed")setStep("verify");
   else if(result==="enroll-needed")setStep("enroll");
   else setError(result==="invalid"?"تعذر تسجيل الدخول بهذه البيانات.":"خدمة التحقق غير متاحة حاليًا.");
  }finally{setLoading(false);}
 };
 const enroll=async()=>{
  if(loading)return;setLoading(true);setError("");
  try{
   const result=await service.current!.enroll();
   if(!result){setError("تعذر بدء المصادقة الثنائية. جرّب تسجيل الدخول مجددًا.");return;}
   // SVG is treated only as an inert image, never inserted into HTML.
   setQr("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(result.qrSvg));
   setStep("verify");
   setNotice("امسح رمز QR بتطبيق المصادقة ثم أدخل رمز التحقق المكوّن من ستة أرقام.");
  }finally{setLoading(false);}
 };
 const verify=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(loading)return;setLoading(true);setError("");
  try{
   const result=await service.current!.verify(code.trim());
   if(result==="aal2"){setStep("complete");setQr("");setCode("");setNotice("تم التحقق من العامل الثاني. ستظهر الحسابات إذا كانت الصلاحية معتمدة على الخادم.");}
   else setError(result==="invalid"?"رمز التحقق غير صحيح أو منتهي الصلاحية.":"تعذر تأكيد مستوى الحماية. أعد المحاولة.");
  }finally{setLoading(false);}
 };
 const requestRecovery=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(loading)return;
  const email=String(new FormData(e.currentTarget).get("email")??"").trim();
  setError("");setNotice("");setLoading(true);
  try{
   const result=await recovery.current!.send(email,window.location.origin);
   if(result==="sent")setNotice("إن كان البريد مرتبطًا بالحساب، ستصلك رسالة استعادة كلمة المرور. افتح الرابط على هذا الجهاز لإعداد كلمة مرور جديدة.");
   else setError("لم نتمكن من إرسال رابط الاستعادة. تحقق من البريد أو إعدادات إرسال الرسائل ثم حاول مجددًا.");
  }finally{setLoading(false);}
 };
 const finishRecovery=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(loading)return;
  const values=new FormData(e.currentTarget);
  const password=String(values.get("password")??"");
  const confirm=String(values.get("confirm")??"");
  if(password!==confirm){setError("كلمتا المرور غير متطابقتين.");return;}
  setError("");setNotice("");setLoading(true);
  try{
   const result=await recovery.current!.complete(password);
   if(result==="updated"){
    window.history.replaceState(null,"","/admin/security");
    setStep("login");
    setNotice("تم تعيين كلمة المرور بنجاح. سجّل الدخول بها الآن، ثم أكمل المصادقة الثنائية.");
   }else setError(result==="invalid"?"الرابط منتهي الصلاحية أو كلمة المرور غير مستوفية للشروط. أعد طلب الرابط.":"تعذر تغيير كلمة المرور. أعد فتح رابط الاستعادة أو اطلب رابطًا جديدًا.");
  }finally{setLoading(false);}
 };
 const logout=async()=>{await service.current?.signOut();setStep("login");setQr("");setCode("");setError("");setNotice("");};
 return <main className="na315-page" dir="rtl" id="main-content"><section className="na315-panel">
  <header><img src="/noor-platform-logo.jpeg" alt="شعار نور" width="64" height="64"/><div><p lang="en">NOOR SECURITY</p><h1>تأمين حساب الإدارة</h1><span>إعداد المصادقة الثنائية TOTP</span></div></header>
  <p className="na315-caution">هذه الصفحة مخصصة لحساب المدير المستقل. لا تظهر إدارة الحسابات إلا بعد المصادقة الثنائية واعتماد دور المدير على الخادم.</p>
  {step==="login"?<form onSubmit={e=>{void login(e);}}>
   <label>البريد الإلكتروني لحساب الإدارة<input name="email" type="email" autoComplete="username" required dir="ltr" disabled={loading}/></label>
   <label>كلمة المرور<input name="password" type="password" autoComplete="current-password" required dir="ltr" disabled={loading}/></label>
   <button type="submit" disabled={loading}>{loading?"جارٍ التحقق…":"الانتقال للتحقق الثنائي"}</button>
  </form>:null}
  {step==="login"?<button type="button" className="na315-secondary" disabled={loading}
   onClick={()=>{setStep("recover-request");setError("");setNotice("");}}>إعداد أو استعادة كلمة مرور حساب الإدارة</button>:null}
  {step==="recover-request"?<div className="na315-stage"><h2>إرسال رابط استعادة كلمة المرور</h2>
   <p>سنرسل رابطًا إلى البريد الإلكتروني الذي تملكه. لن تُنشأ هوية جديدة ولن تُمنح صلاحية إدارة تلقائيًا.</p>
   <form onSubmit={e=>{void requestRecovery(e);}}>
    <label>البريد الإلكتروني<input name="email" type="email" autoComplete="username" required dir="ltr" disabled={loading}/></label>
    <button type="submit" disabled={loading}>{loading?"جارٍ الإرسال…":"إرسال رابط الاستعادة"}</button>
   </form>
   <button type="button" className="na315-secondary" disabled={loading} onClick={()=>{setStep("login");setError("");}}>العودة لتسجيل الدخول</button>
  </div>:null}
  {step==="recover-finish"?<div className="na315-stage"><h2>تعيين كلمة مرور جديدة</h2>
   <p>لن تُقبل كلمة مرور جديدة إلا إذا تحقق Supabase من رابط الاستعادة في متصفحك.</p>
   <form onSubmit={e=>{void finishRecovery(e);}}>
    <label>كلمة مرور جديدة (12 حرفًا على الأقل)<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" dir="ltr" disabled={loading}/></label>
    <label>تأكيد كلمة المرور<input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" dir="ltr" disabled={loading}/></label>
    <button type="submit" disabled={loading}>{loading?"جارٍ الحفظ…":"تعيين كلمة المرور"}</button>
   </form>
   <button type="button" className="na315-secondary" onClick={()=>{window.history.replaceState(null,"","/admin/security");setStep("recover-request");setError("");}}>طلب رابط جديد</button>
  </div>:null}
  {step==="enroll"?<div className="na315-stage"><h2>إضافة تطبيق المصادقة</h2><p>استخدم تطبيقًا مثل Microsoft Authenticator أو Google Authenticator لإنشاء رمز دوري مرتبط بهذا الحساب.</p><button type="button" disabled={loading} onClick={()=>{void enroll();}}>إنشاء رمز QR</button></div>:null}
  {step==="verify"?<div className="na315-stage">
   {qr?<><h2>امسح رمز QR</h2><img className="na315-qr" src={qr} alt="رمز QR سري لإعداد المصادقة الثنائية على جهازك" /><p>لا تشارك هذا الرمز مع أحد. لن يُحفظ في نور.</p></>:<h2>التحقق من تطبيق المصادقة</h2>}
   <form onSubmit={e=>{void verify(e);}}><label>رمز التحقق<input type="text" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
     inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required dir="ltr" disabled={loading}/></label>
    <button type="submit" disabled={loading||code.length!==6}>{loading?"جارٍ التحقق…":"تحقق من الرمز"}</button></form>
  </div>:null}
  {step==="complete"?<div className="na315-stage na315-complete" role="status"><h2>اكتملت المصادقة الثنائية ✓</h2><p>تم تأكيد المصادقة الثنائية. لا يسمح الخادم بالإدارة إلا لحساب المدير المعتمد.</p><NoorAdminAccountsPanelR316 token={()=>service.current?.accessToken()??Promise.resolve(null)}/></div>:null}
  {notice?<p role="status" className="na315-notice">{notice}</p>:null}
  {error?<p role="alert" className="na315-error">{error}</p>:null}
  {step!=="login"&&step!=="recover-request"&&step!=="recover-finish"?<button className="na315-secondary" type="button" onClick={()=>{void logout();}}>إنهاء جلسة الإعداد</button>:null}
  <a href="/">العودة إلى منصة نور</a>
 </section></main>;
}
