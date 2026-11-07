import {useEffect,useState} from "react";
import {createNoorAdminBrowserAuthR271,type NoorAdminBrowserFactorR271} from "./noor-admin-browser-auth-r271.js";

type Account=Readonly<{id:string;email:string;enabled:boolean}>;
const recoveryLandingAtLoad=typeof window!=="undefined" &&
  (new URLSearchParams(window.location.hash.slice(1)).get("type")==="recovery" ||
   new URLSearchParams(window.location.search).get("type")==="recovery");

type Phase="loading"|"needs-auth"|"signing-in"|"mfa"|"enroll"|"verifying"|"ready"|"unavailable"|"invitation"|"invitation-ready";
const panel:React.CSSProperties={background:"#fff",border:"1px solid #e7e5df",borderRadius:22,
  boxShadow:"0 8px 26px rgba(18,38,45,.04)",padding:"clamp(18px,3vw,30px)",marginTop:20};
const field:React.CSSProperties={display:"block",width:"100%",maxWidth:420,boxSizing:"border-box",
  padding:"13px 14px",margin:"7px 0 15px",border:"1px solid #ccd3d1",borderRadius:12,fontSize:16};
const button:React.CSSProperties={border:0,borderRadius:12,padding:"12px 19px",fontSize:15,
  background:"#234840",color:"#fff",cursor:"pointer"};

export function NoorAdminViewR271(){
  const [client]=useState(()=>createNoorAdminBrowserAuthR271());
  const [phase,setPhase]=useState<Phase>("loading");
  const [accounts,setAccounts]=useState<readonly Account[]>([]);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [factor,setFactor]=useState("");
  const [factors,setFactors]=useState<readonly NoorAdminBrowserFactorR271[]>([]);
  const [code,setCode]=useState("");
  const [qr,setQr]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [invitationMode,setInvitationMode]=useState(false);

  async function refreshAccounts(signal?:AbortSignal):Promise<void>{
    try{
      const response=await fetch("/api/noor/admin/accounts",{
        method:"POST",credentials:"same-origin",cache:"no-store",signal,redirect:"error",
      });
      if(signal?.aborted)return;
      if(response.status===401 || response.status===403){setPhase("needs-auth");return;}
      if(response.status===404){setError("خدمة الإدارة لم تُفعّل على الخادم بعد.");setPhase("unavailable");return;}
      if(!response.ok){setError("تعذر التحقق من الحسابات.");setPhase("unavailable");return;}
      const value:unknown=await response.json();
      if(!value || typeof value!=="object" || !("accounts" in value) ||
         !Array.isArray(value.accounts) || !value.accounts.every((entry:unknown)=>
           typeof entry==="object" && entry!==null &&
           "id" in entry && typeof entry.id==="string" &&
           "email" in entry && typeof entry.email==="string" &&
           "enabled" in entry && typeof entry.enabled==="boolean")){
        setError("الاستجابة الإدارية غير صالحة.");setPhase("unavailable");return;
      }
      setAccounts(value.accounts as readonly Account[]);
      setError("");
      setPhase("ready");
    }catch{
      if(!signal?.aborted){setError("خدمة الإدارة غير متاحة حاليًا.");setPhase("unavailable");}
    }
  }
  useEffect(()=>{
    const abort=new AbortController();
    if(recoveryLandingAtLoad){
      void client.hasVerifiedRecoverySession().then(verified=>{
        if(abort.signal.aborted)return;
        if(verified){
          setError("");
          setPhase("invitation");
        }else{
          setError("رابط استرداد كلمة المرور غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");
          setPhase("needs-auth");
        }
      }).catch(()=>{
        if(abort.signal.aborted)return;
        setError("تعذر التحقق من رابط الاسترداد. اطلب رابطًا جديدًا.");
        setPhase("needs-auth");
      });
    }else{
      void refreshAccounts(abort.signal);
    }
    return ()=>abort.abort();
  },[]);

  async function signIn(event:React.FormEvent<HTMLFormElement>):Promise<void>{
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError("");setPhase("signing-in");
    try{
      setInvitationMode(false);
      const list=await client.signIn(email,password);
      setPassword("");
      setFactors(list);
      if(list.length){setFactor(list[0]!.id);setPhase("mfa");}
      else{setPhase("enroll");}
    }catch{
      setPassword("");setError("تعذر تسجيل دخول الإدارة. تحقق من بياناتك.");setPhase("needs-auth");
    }finally{setBusy(false);}
  }
  async function enroll():Promise<void>{
    if(busy)return;
    setBusy(true);setError("");
    try{
      const result=await client.enroll();
      setFactor(result.id);setQr(result.qrCode);setPhase("enroll");
    }catch{setError("تعذر إعداد تطبيق المصادقة.");}
    finally{setBusy(false);}
  }
  async function verify(event:React.FormEvent<HTMLFormElement>):Promise<void>{
    event.preventDefault();
    if(busy || !factor)return;
    setBusy(true);setError("");setPhase("verifying");
    try{
      if(invitationMode){
        await client.verifyEnrollment(factor,code);
        setCode("");setQr("");
        setPhase("invitation-ready");
      }else{
        await client.authenticate(factor,code);
        setCode("");setQr("");
        await refreshAccounts();
      }
    }catch{
      setCode("");setError("لم ينجح التحقق. تأكد من الرمز وصلاحية الحساب.");
      setPhase(qr?"enroll":"mfa");
    }finally{setBusy(false);}
  }
  async function acceptInvitation(event:React.FormEvent<HTMLFormElement>):Promise<void>{
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError("");
    try{
      const list=await client.acceptInvitation(password);
      setPassword("");setInvitationMode(true);
      setFactors(list);
      if(list.length){setFactor(list[0]!.id);setPhase("mfa");}
      else{setPhase("enroll");}
    }catch{
      setPassword("");
      setError("لم يتم تأكيد الدعوة بعد. افتح رابط الدعوة من البريد ثم أعد المحاولة.");
      setPhase("invitation");
    }finally{setBusy(false);}
  }
  async function revoke():Promise<void>{
    if(busy)return;
    setBusy(true);setError("");
    try{
      await client.revoke();
      setAccounts([]);setCode("");setQr("");setPhase("needs-auth");
    }catch{setError("تعذر إبطال جلسة الإدارة عبر الخادم. أعد المحاولة.");}
    finally{setBusy(false);}
  }
  return <main dir="rtl" style={{minHeight:"100dvh",background:"#f7f5f0",color:"#243731",
    fontFamily:"-apple-system,BlinkMacSystemFont,system-ui,sans-serif",padding:"clamp(20px,5vw,50px)"}}>
    <div style={{maxWidth:920,margin:"0 auto"}}>
      <a href="/" style={{color:"#35594c",textDecoration:"none",fontSize:14}}>العودة إلى منصة نور</a>
      <header style={{padding:"32px 0 10px"}}>
        <p lang="en" dir="ltr" style={{fontSize:12,letterSpacing:3,textAlign:"right",color:"#73877c"}}>NOOR ADMIN</p>
        <h1 style={{fontSize:"clamp(26px,4vw,36px)",margin:"5px 0 12px",fontWeight:650}}>مركز إدارة منصة نور</h1>
        <p style={{color:"#65766e",lineHeight:1.8}}>حماية متعددة العوامل، وصلاحيات تتحقق منها المنصة مباشرة، دون الاطلاع على البيانات الشخصية.</p>
      </header>
      {error && <p role="alert" style={{color:"#aa3325",lineHeight:1.7}}>{error}</p>}
      {phase==="loading" && <p role="status">جارٍ التحقق من الصلاحيات…</p>}
      {phase==="unavailable" && <section style={panel}>
        <p>لم يُجرَ أي تغيير على الحسابات.</p>
        <button type="button" style={button} onClick={()=>{setPhase("loading");void refreshAccounts();}}>إعادة المحاولة</button>
        <button type="button" style={{...button,background:"#e7efea",color:"#285449",marginInlineStart:10}}
          onClick={()=>{setPassword("");setError("");setPhase("invitation");}}>إكمال دعوة المدير</button>
      </section>}
      {(phase==="needs-auth" || phase==="signing-in") && <section style={panel}>
        <h2 style={{marginTop:0,fontSize:20}}>التحقق من هوية المدير</h2>
        <p style={{color:"#65766e"}}>سجّل دخولك بحساب نور نفسه، ثم أكّد هويتك من تطبيق المصادقة.</p>
        <form onSubmit={event=>{void signIn(event);}}>
          <label htmlFor="noor-admin-email">البريد الإلكتروني</label>
          <input style={field} id="noor-admin-email" type="email" autoComplete="username"
            value={email} onChange={event=>setEmail(event.currentTarget.value)} required/>
          <label htmlFor="noor-admin-password">كلمة المرور</label>
          <input style={field} id="noor-admin-password" type="password" autoComplete="current-password"
            value={password} onChange={event=>setPassword(event.currentTarget.value)} required/>
          <button type="submit" style={button} disabled={busy}>{busy?"جارٍ التحقق…":"متابعة"}</button>
        </form>
        <button type="button" style={{...button,background:"transparent",color:"#285449",paddingInlineStart:0,marginTop:14}}
          onClick={()=>{setPassword("");setError("");setPhase("invitation");}}>لديك دعوة بريدية جديدة؟</button>
      </section>}
      {phase==="invitation" && <section style={panel}>
        <h2 style={{marginTop:0,fontSize:20}}>تفعيل هوية المدير المستقلة</h2>
        <p style={{color:"#65766e",lineHeight:1.8}}>
          افتح رابط الدعوة من بريدك الإلكتروني باستخدام هذا المتصفح، ثم أدخل كلمة مرور جديدة.
          لن تُمنح صلاحيات الإدارة تلقائيًا حتى يتم اعتماد الحساب والتحقق من MFA.
        </p>
        <form onSubmit={event=>{void acceptInvitation(event);}}>
          <label htmlFor="noor-admin-invite-password">كلمة مرور جديدة (12 حرفًا على الأقل)</label>
          <input id="noor-admin-invite-password" type="password" autoComplete="new-password"
            style={field} minLength={12} maxLength={128} value={password}
            onChange={event=>setPassword(event.currentTarget.value)} required/>
          <button style={button} type="submit" disabled={busy}>
            {busy?"جارٍ تأكيد الدعوة…":"تأكيد البريد وتعيين كلمة المرور"}
          </button>
        </form>
      </section>}
      {phase==="invitation-ready" && <section style={panel} role="status">
        <h2 style={{marginTop:0,fontSize:20}}>تم التحقق من المصادقة الثنائية</h2>
        <p style={{lineHeight:1.9}}>
          اكتمل إعداد حساب Auth المستقل دون الوصول إلى بيانات مستخدمي نور.
          تفعيل صلاحية المدير يتطلب التحقق من ربط الهوية بحساب نور ومنح اعتماد خادمي منفصل.
        </p>
        <a href="/" style={{color:"#285449"}}>العودة إلى منصة نور</a>
      </section>}
      {(phase==="mfa" || phase==="enroll" || phase==="verifying") && <section style={panel}>
        <h2 style={{marginTop:0,fontSize:20}}>المصادقة الثنائية</h2>
        {factors.length>0 && !qr && <label htmlFor="noor-admin-factor">تطبيق المصادقة
          <select id="noor-admin-factor" style={field} value={factor}
            onChange={event=>setFactor(event.currentTarget.value)}>
            {factors.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>}
        {qr && <div>
          <p>امسح رمز QR باستخدام تطبيق المصادقة على هاتفك، ثم أدخل الرمز الناتج.</p>
          <img alt="رمز إعداد تطبيق المصادقة" width="200" height="200"
            style={{maxWidth:"100%",background:"#fff"}}
            src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(qr)}/>
        </div>}
        {phase==="enroll" && !qr && <div>
          <p>لم يتم العثور على عامل TOTP مُفعَّل لهذا الحساب.</p>
          <button type="button" style={button} disabled={busy} onClick={()=>{void enroll();}}>إعداد تطبيق المصادقة</button>
        </div>}
        {(factor && (phase!=="enroll" || qr)) && <form onSubmit={event=>{void verify(event);}}>
          <label htmlFor="noor-admin-code">رمز المصادقة المكوّن من 6 أرقام</label>
          <input id="noor-admin-code" type="text" inputMode="numeric" pattern="[0-9]{6}"
            maxLength={6} autoComplete="one-time-code" style={{...field,direction:"ltr",textAlign:"center",letterSpacing:6}}
            value={code} onChange={event=>setCode(event.currentTarget.value.replace(/[^0-9]/g,""))} required/>
          <button style={button} type="submit" disabled={busy}>{busy?"جارٍ التحقق…":invitationMode?"تحقق من الرمز وأنهِ الإعداد":"تحقق وافتح الإدارة"}</button>
        </form>}
      </section>}
      {phase==="ready" && <section style={panel} aria-label="الحسابات">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <h2 style={{margin:0,fontSize:21}}>الحسابات ({accounts.length})</h2>
          <button type="button" style={{...button,background:"#e7efea",color:"#285449"}} disabled={busy}
            onClick={()=>{void revoke();}}>إنهاء جلسة الإدارة</button>
        </div>
        <div style={{overflowX:"auto",marginTop:20}}>
          <table style={{width:"100%",borderCollapse:"collapse",textAlign:"right"}}>
            <thead><tr><th scope="col" style={{padding:"12px 6px"}}>البريد الإلكتروني</th>
              <th scope="col" style={{padding:"12px 6px"}}>الحالة</th></tr></thead>
            <tbody>{accounts.map(item=><tr key={item.id}>
              <td style={{padding:"13px 6px",borderTop:"1px solid #edf0ed",direction:"ltr",textAlign:"right"}}>{item.email||"—"}</td>
              <td style={{padding:"13px 6px",borderTop:"1px solid #edf0ed"}}>{item.enabled?"نشط":"معطّل"}</td>
            </tr>)}</tbody>
          </table>
          {accounts.length===0 && <p>لا توجد حسابات للعرض.</p>}
        </div>
        <p style={{fontSize:13,color:"#65766e",lineHeight:1.8}}>التعديل على حسابات المستخدمين وإدارة الأذونات غير مفعّلين في هذا الإصدار. لا تُعرض أي بيانات شخصية خاصة.</p>
      </section>}
    </div>
  </main>;
}
