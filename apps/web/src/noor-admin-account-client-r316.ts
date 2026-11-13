/**
 * R316 is one explicitly sanctioned, bearer-only browser adapter.
 * It carries the transient AAL2 Supabase JWT to the same-origin NOOR server.
 * It NEVER owns a NOOR session, provider service role, user database or cookies.
 * All administration authorization and database writes stay on the server.
 */
export async function requestNoorAdminAccountR316(
  token:()=>Promise<string|null>,
  operation:"list"|"create"|"delete",
  data:unknown,
):Promise<unknown>{
 const proof=await token();
 if(!proof)throw Error("انتهت جلسة المصادقة الثنائية. سجّل الدخول مجددًا.");
 const response=await fetch("/api/noor/admin/accounts/"+operation,{
  method:"POST",credentials:"omit",cache:"no-store",
  headers:{"Content-Type":"application/json","Authorization":"Bearer "+proof},
  body:JSON.stringify(data),
 });
 if(!response.ok){
  if(response.status===403||response.status===404)
   throw Error("لا توجد صلاحية إدارة مفعّلة لهذا الحساب، أو الخدمة غير مفعّلة على الخادم.");
  if(response.status===401)throw Error("انتهت صلاحية الدخول؛ أعد المصادقة الثنائية.");
  if(response.status===409)throw Error("تعارض في بيانات الحساب أو الطلب. راجع القائمة قبل إعادة المحاولة.");
  if(response.status===429)throw Error("تجاوزت الحد المسموح من العمليات. حاول لاحقًا.");
  throw Error("تعذّر إكمال العملية، وقد تكون هناك خطوة لم تكتمل. راجع الحالة قبل إعادة المحاولة.");
 }
 return await response.json() as unknown;
}
