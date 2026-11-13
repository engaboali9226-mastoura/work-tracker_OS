import { useState, type FormEvent, type ReactElement } from "react";
import { createNoorAccountSelfServiceR312 } from "./noor-account-self-service-r312.js";
import { readBrowserPublicAuthenticationConfiguration } from "./public-authentication-environment.js";

/** Current-password reauthentication is necessary: the Noor app cookie is
 * not a Supabase browser session. Neither the password nor provider session
 * is stored locally. Identity subject stays unchanged after an email edit. */
export function NoorAccountSettingsR312():ReactElement {
  const [currentEmail,setCurrentEmail]=useState("");
  const [currentPassword,setCurrentPassword]=useState("");
  const [nextEmail,setNextEmail]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError("");setMessage("");
    try{
      const service=createNoorAccountSelfServiceR312(readBrowserPublicAuthenticationConfiguration());
      const result=await service.requestEmailChange(currentEmail,currentPassword,nextEmail);
      if(result==="sent"){
        setMessage("تم إرسال طلب تغيير البريد. أكّد الروابط التي تصلك إلى البريد الحالي والجديد وفق إعدادات الأمان. حتى انتهاء التأكيد قد يبقى البريد القديم هو بريد الدخول.");
        setCurrentPassword("");
        setNextEmail("");
      }else setError(result==="invalid"?"تحقق من البريد الحالي وكلمة المرور والبريد الجديد.":"تعذّر إرسال طلب التغيير. تحقق من الاتصال وإعدادات التأكيد.");
    }catch{setError("خدمة تغيير البريد غير متاحة حاليًا.");}
    finally{setBusy(false);}
  };
  return <section className="np-r312-account" data-testid="noor-account-settings-r312" aria-label="إعدادات الحساب">
    <h2>أمان الحساب والبريد الإلكتروني</h2>
    <p>يمكنك طلب تغيير بريد الدخول دون نقل بيانات نور أو إنشاء حساب جديد. يلزم تأكيد ملكية البريد، وقد تصلك رسالة إلى البريد الحالي والجديد. مدير المنصة حساب مستقل عن حسابك الشخصي.</p>
    <form onSubmit={event=>{void submit(event);}}>
      <label>البريد الحالي<input type="email" autoComplete="username" value={currentEmail} onChange={e=>setCurrentEmail(e.currentTarget.value)} disabled={busy} required placeholder="current@example.com"/></label>
      <label>كلمة المرور الحالية<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.currentTarget.value)} disabled={busy} required/></label>
      <label>البريد الجديد<input type="email" autoComplete="email" value={nextEmail} onChange={e=>setNextEmail(e.currentTarget.value)} disabled={busy} required placeholder="new@example.com"/></label>
      <button type="submit" disabled={busy}>{busy?"جارٍ الإرسال…":"طلب تغيير البريد الإلكتروني"}</button>
      {message?<p className="np-r312-account-notice" role="status">{message}</p>:null}
      {error?<p className="np-r312-account-error" role="alert">{error}</p>:null}
    </form>
  </section>;
}
