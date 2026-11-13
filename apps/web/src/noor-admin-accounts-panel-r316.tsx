import {useCallback,useEffect,useState,type FormEvent,type ReactElement} from "react";
type Account={id:string;accountId:string;email:string;name:string;createdAt:string;applications:string[]};
type Reply={page:number;accounts:Account[];hasMore:boolean};
export function NoorAdminAccountsPanelR316({token}:{token:()=>Promise<string|null>}):ReactElement{
 const [rows,setRows]=useState<Account[]>([]),[page,setPage]=useState(1),[more,setMore]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const [target,setTarget]=useState<Account|null>(null),[confirm,setConfirm]=useState("");
 const [personal,setPersonal]=useState(true),[work,setWork]=useState(false);
 const api=useCallback(async(kind:"list"|"create"|"delete",data:unknown)=>{
  const proof=await token();if(!proof)throw Error("انتهت جلسة المصادقة الثنائية. سجّل الدخول مجددًا.");
  const response=await fetch("/api/noor/admin/accounts/"+kind,{
   method:"POST",credentials:"omit",cache:"no-store",headers:{
    "Content-Type":"application/json","Authorization":"Bearer "+proof,
   },body:JSON.stringify(data),
  });
  if(!response.ok){
   if(response.status===403||response.status===404)throw Error("لا توجد صلاحية إدارة مفعّلة لهذا الحساب، أو الخدمة غير مفعّلة على الخادم.");
   if(response.status===401)throw Error("انتهت صلاحية الدخول؛ أعد المصادقة الثنائية.");
   if(response.status===409)throw Error("تعارض في بيانات الحساب أو الطلب. راجع القائمة قبل إعادة المحاولة.");
   if(response.status===429)throw Error("تجاوزت الحد المسموح من العمليات. حاول لاحقًا.");
   throw Error("تعذّر إكمال العملية، وقد تكون هناك خطوة لم تكتمل. راجع حالة الحساب قبل إعادة المحاولة.");
  }
  return await response.json() as unknown;
 },[token]);
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
  <p>تُضاف الحسابات للمستخدمين فقط؛ بيانات كل مستخدم مستقلة. حذف الحساب يغلق دخوله ويحتفظ ببياناته، ولا يمحو تدويناته نهائيًا.</p>
  {error?<p className="na315-error" role="alert">{error}</p>:null}
  {notice?<p className="na315-notice" role="status">{notice}</p>:null}
  {ready?<><h3>الحسابات</h3>
   <div className="na316-list">
    {rows.length===0?<p>لا توجد حسابات في هذه الصفحة.</p>:rows.map(row=>
     <article className="na316-user" key={row.id}>
      <div><strong>{row.name||row.email}</strong><small dir="ltr">{row.email}</small>
       <span>{row.applications.map(x=>x==="noor-work"?"نور ورك":"نور بيرسونال").join(" • ")||"بلا صلاحية"}</span></div>
      <button type="button" className="na316-danger" disabled={busy} onClick={()=>{setTarget(row);setConfirm("");}}>حذف الحساب</button>
     </article>)}
   </div>
   <div className="na316-pagination">
    <button type="button" disabled={busy||page<=1} onClick={()=>void load(page-1)}>السابق</button>
    <span>الصفحة {page}</span>
    <button type="button" disabled={busy||!more} onClick={()=>void load(page+1)}>التالي</button>
   </div>
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
