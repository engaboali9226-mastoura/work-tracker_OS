import {createNoorAccountSelfServiceR312,noorRecoveryRedirectR312} from "./noor-account-self-service-r312.js";
import {readBrowserPublicAuthenticationConfiguration} from "./public-authentication-environment.js";
import {requestNoorAdminAccountR316} from "./noor-admin-account-client-r316.js";
import {useCallback,useEffect,useRef,useState,type FormEvent,type ReactElement} from "react";
type Account={id:string;accountId:string;email:string;name:string;createdAt:string;applications:string[]};
type Reply={page:number;accounts:Account[];hasMore:boolean};
export function NoorAdminAccountsPanelR316({token}:{token:()=>Promise<string|null>}):ReactElement{
 const [rows,setRows]=useState<Account[]>([]),[page,setPage]=useState(1),[more,setMore]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const passwordRecovery=useRef<ReturnType<typeof createNoorAccountSelfServiceR312>|null>(null);
 if(!passwordRecovery.current)passwordRecovery.current=createNoorAccountSelfServiceR312(readBrowserPublicAuthenticationConfiguration());
 const [editing,setEditing]=useState<Account|null>(null);
 const [editName,setEditName]=useState("");
 const [editPersonal,setEditPersonal]=useState(false);
 const [editWork,setEditWork]=useState(false);
 const [suspendConfirmed,setSuspendConfirmed]=useState(false);
 const [target,setTarget]=useState<Account|null>(null),[confirm,setConfirm]=useState("");
 const [personal,setPersonal]=useState(true),[work,setWork]=useState(false);
 const api=useCallback((kind:"list"|"create"|"delete"|"rename"|"access",data:unknown)=>
  requestNoorAdminAccountR316(token,kind,data),[token]);
 const load=useCallback(async(current=1)=>{
  try{const data=await api("list",{page:current}) as Reply;
   setRows(data.accounts);setPage(current);setMore(data.hasMore);setReady(true);setError("");
  }catch(e){setError(e instanceof Error?e.message:"تعذّر عرض الحسابات.");setReady(false);}
 },[api]);
 useEffect(()=>{void load(1);},[load]);
 async function add(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  const f=e.currentTarget;const input=new FormData(f);
  const applications=[...(personal?["noor-personal"]:[]),...(work?["noor-work"]:[])];
  if(!applications.length){setError("اختر تطبيقًا واحدًا على الأقل.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   await api("create",{requestId:crypto.randomUUID(),name:String(input.get("name")??"").trim(),
    email:String(input.get("email")??"").trim(),password:String(input.get("password")??""),applications});
   f.reset();setPersonal(true);setWork(false);
   setNotice("تم إنشاء الحساب وربطه بصلاحياته. سلّم كلمة المرور للمستخدم عبر قناة آمنة.");
   await load(1);
  }catch(err){setError(err instanceof Error?err.message:"تعذّرت الإضافة.");}
  finally{setBusy(false);}
 }
 function startEdit(row:Account){
  setEditing(row);setTarget(null);setConfirm("");
  setEditName(row.name);setEditPersonal(row.applications.includes("noor-personal"));
  setEditWork(row.applications.includes("noor-work"));setSuspendConfirmed(false);
  setError("");setNotice("");
 }
 async function saveName(){
  if(!editing||busy||editName.trim().length<2)return;
  setBusy(true);setError("");setNotice("");
  try{
   await api("rename",{
    requestId:crypto.randomUUID(),userId:editing.id,accountId:editing.accountId,
    confirmEmail:editing.email,name:editName.trim(),
   });
   setEditing(null);await load(page);
   setNotice("تم تحديث الاسم دون المساس ببيانات المستخدم أو حساب دخوله.");
  }catch(e){setError(e instanceof Error?e.message:"تعذّر تعديل الاسم؛ راجع القائمة قبل إعادة المحاولة.");}
  finally{setBusy(false);}
 }
 async function saveAccess(){
  if(!editing||busy)return;
  const applications=[...(editPersonal?["noor-personal"]:[]),...(editWork?["noor-work"]:[])];
  if(!applications.length&&!suspendConfirmed){setError("أكد إيقاف وصول المستخدم إلى التطبيقين قبل الحفظ.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   await api("access",{
    requestId:crypto.randomUUID(),userId:editing.id,accountId:editing.accountId,
    confirmEmail:editing.email,applications,
   });
   setEditing(null);setSuspendConfirmed(false);await load(page);
   setNotice(applications.length
    ?"تم تحديث صلاحيات التطبيقات وإبطال جلسات نور القديمة للمستخدم."
    :"تم تعليق وصول المستخدم إلى نور بيرسونال ونور ورك دون حذف حسابه أو بياناته.");
  }catch(e){setError(e instanceof Error?e.message:"تعذّر تحديث الصلاحيات؛ راجع القائمة قبل إعادة المحاولة.");}
  finally{setBusy(false);}
 }
 async function sendRecovery(row:Account){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await passwordRecovery.current!.requestPasswordReset(
    row.email,noorRecoveryRedirectR312(window.location.origin));
   if(result==="sent")setNotice("تم طلب إرسال رابط استعادة كلمة المرور إلى "+row.email+". إكمال التغيير يتم من بريد المستخدم، ولا تظهر كلمة مروره للمدير.");
   else setError("تعذر إرسال طلب الاستعادة. تحقق من إعدادات البريد أو حاول مجددًا.");
  }catch{setError("تعذّر إرسال طلب استعادة كلمة المرور.");}
  finally{setBusy(false);}
 }
 async function remove(){
  if(!target||confirm.toLowerCase()!==target.email.toLowerCase()||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   await api("delete",{requestId:crypto.randomUUID(),userId:target.id,confirmEmail:confirm,confirmation:"DELETE"});
   setTarget(null);setConfirm("");setNotice("تم إغلاق الحساب وإلغاء الوصول. حُفظت بياناته الشخصية دون إتلاف.");
   await load(page);
  }catch(err){setError(err instanceof Error?err.message:"تعذّر الحذف.");}
  finally{setBusy(false);}
 }
 return <section className="na316-area" aria-label="إدارة حسابات نور">
  <h2>إدارة حسابات نور</h2>
  <p>يمكن إضافة الحسابات، تعديل الأسماء وصلاحيات التطبيقات، إرسال رابط استعادة كلمة المرور، أو إغلاق حساب. بيانات كل مستخدم مستقلة؛ حذف الحساب لا يمحو تدويناته نهائيًا.</p>
  {error?<p className="na315-error" role="alert">{error}</p>:null}
  {notice?<p className="na315-notice" role="status">{notice}</p>:null}
  {ready?<><h3>الحسابات</h3>
   <div className="na316-list">
    {rows.length===0?<p>لا توجد حسابات في هذه الصفحة.</p>:rows.map(row=>
     <article className="na316-user" key={row.id}>
      <div><strong>{row.name||row.email}</strong><small dir="ltr">{row.email}</small>
       <span>{row.applications.map(x=>x==="noor-work"?"نور ورك":"نور بيرسونال").join(" • ")||"بلا صلاحية"}</span></div>
      <div className="na316-actions na316-user-actions">
       <button type="button" disabled={busy} onClick={()=>startEdit(row)}>تعديل الحساب</button>
       <button type="button" disabled={busy} onClick={()=>void sendRecovery(row)}>إعادة تعيين كلمة المرور</button>
       <button type="button" className="na316-danger" disabled={busy} onClick={()=>{setEditing(null);setTarget(row);setConfirm("");}}>حذف الحساب</button>
      </div>
     </article>)}
   </div>
   <div className="na316-pagination">
    <button type="button" disabled={busy||page<=1} onClick={()=>void load(page-1)}>السابق</button>
    <span>الصفحة {page}</span>
    <button type="button" disabled={busy||!more} onClick={()=>void load(page+1)}>التالي</button>
   </div>
   {editing?<div className="na316-edit" role="group" aria-label="تعديل حساب مستخدم">
    <div className="na316-edit-title"><h3>تعديل حساب {editing.name||editing.email}</h3>
     <button type="button" className="na315-secondary" disabled={busy} onClick={()=>setEditing(null)}>إغلاق</button>
    </div>
    <p>يمكن تغيير الاسم وصلاحيات التطبيقات دون حذف الحساب أو تدويناته. البريد الإلكتروني الحالي: <strong dir="ltr">{editing.email}</strong></p>
    <label>اسم المستخدم<input value={editName} onChange={e=>setEditName(e.target.value)} minLength={2} maxLength={120} required disabled={busy}/></label>
    <button type="button" disabled={busy||editName.trim().length<2||editName.trim()===editing.name} onClick={()=>void saveName()}>حفظ الاسم</button>
    <fieldset><legend>الوصول إلى التطبيقات</legend>
     <label><input type="checkbox" checked={editPersonal} onChange={e=>{setEditPersonal(e.target.checked);setSuspendConfirmed(false);}} disabled={busy}/> نور بيرسونال</label>
     <label><input type="checkbox" checked={editWork} onChange={e=>{setEditWork(e.target.checked);setSuspendConfirmed(false);}} disabled={busy}/> نور ورك</label>
    </fieldset>
    {!editPersonal&&!editWork?<label className="na316-suspend"><input type="checkbox" checked={suspendConfirmed} onChange={e=>setSuspendConfirmed(e.target.checked)} disabled={busy}/> أؤكد تعليق الوصول إلى التطبيقين دون حذف الحساب أو البيانات</label>:null}
    <p>عند تعديل الوصول، تنتهي جلسات نور الحالية لهذا المستخدم ويحتاج إلى تسجيل الدخول مجددًا.</p>
    <button type="button" disabled={busy||(!editPersonal&&!editWork&&!suspendConfirmed)||
      (editPersonal===editing.applications.includes("noor-personal")&&editWork===editing.applications.includes("noor-work"))}
      onClick={()=>void saveAccess()}>حفظ صلاحيات التطبيقات</button>
   </div>:null}
   <h3>إضافة حساب جديد</h3>
   <form className="na316-add" onSubmit={e=>void add(e)}>
    <label>اسم المستخدم<input name="name" required minLength={2} maxLength={120} disabled={busy}/></label>
    <label>البريد الإلكتروني<input name="email" type="email" required dir="ltr" disabled={busy}/></label>
    <label>كلمة المرور الأولية (12 حرفًا على الأقل)<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" dir="ltr" disabled={busy}/></label>
    <fieldset><legend>التطبيقات المسموح بها</legend>
     <label><input type="checkbox" checked={personal} onChange={e=>setPersonal(e.target.checked)} disabled={busy}/> نور بيرسونال</label>
     <label><input type="checkbox" checked={work} onChange={e=>setWork(e.target.checked)} disabled={busy}/> نور ورك</label>
    </fieldset>
    <button disabled={busy||(!personal&&!work)} type="submit">{busy?"جارٍ التنفيذ…":"إنشاء الحساب"}</button>
   </form>
  </>:null}
  {target?<div className="na316-confirm" role="group" aria-label="تأكيد حذف الحساب">
   <h3>تأكيد حذف حساب {target.name||target.email}</h3>
   <p>سيُلغى دخول هذا المستخدم وجلساته وصلاحياته. ستبقى بياناته الشخصية محفوظة ولا يمكن إعادة تفعيل هويته المحذوفة مباشرة.</p>
   <label>اكتب بريد الحساب كاملًا للتأكيد<input dir="ltr" value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>
   <div className="na316-actions">
    <button type="button" className="na316-danger" disabled={busy||confirm.toLowerCase()!==target.email.toLowerCase()} onClick={()=>void remove()}>تأكيد حذف الحساب</button>
    <button type="button" disabled={busy} onClick={()=>{setTarget(null);setConfirm("");}}>إلغاء</button>
   </div>
  </div>:null}
 </section>;
}
