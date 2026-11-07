import {useEffect, useState} from "react";

type Account = Readonly<{id: string; email: string; enabled: boolean}>;
type Status = "loading" | "ready" | "denied" | "unavailable";

export function NoorAdminViewR271() {
  const [status, setStatus] = useState<Status>("loading");
  const [accounts, setAccounts] = useState<readonly Account[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    void fetch("/api/noor/admin/accounts", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        setStatus("denied"); return;
      }
      if (!response.ok) {setStatus("unavailable"); return;}
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null ||
          !("accounts" in data) || !Array.isArray(data.accounts) ||
          !data.accounts.every((item: unknown) =>
            typeof item === "object" && item !== null &&
            "id" in item && typeof item.id === "string" &&
            "email" in item && typeof item.email === "string" &&
            "enabled" in item && typeof item.enabled === "boolean")) {
        setStatus("unavailable"); return;
      }
      setAccounts(data.accounts as Account[]);
      setStatus("ready");
    }).catch(error => {
      if (!controller.signal.aborted) setStatus("unavailable");
    });
    return () => controller.abort();
  }, [revision]);

  return <main dir="rtl" style={{
    minHeight:"100dvh",background:"#f7f4ee",color:"#172b3a",
    fontFamily:"system-ui,-apple-system,sans-serif",padding:"clamp(20px,5vw,56px)",
  }}>
    <div style={{maxWidth:960,margin:"0 auto"}}>
      <a href="/" style={{color:"inherit",textDecoration:"none"}}>← العودة إلى نور</a>
      <header style={{margin:"36px 0 24px"}}>
        <p lang="en" style={{letterSpacing:3,fontSize:12}}>NOOR ADMIN</p>
        <h1>مركز إدارة منصة نور</h1>
        <p>إدارة الحسابات والصلاحيات، مع حماية بيانات المستخدمين الخاصة.</p>
      </header>
      {status === "loading" && <p role="status">جارٍ التحقق من الصلاحيات…</p>}
      {status === "denied" && <p role="alert">هذه الصفحة مخصصة للمدير المصرّح له فقط.</p>}
      {status === "unavailable" && <div role="alert">
        <p>خدمة الإدارة غير متاحة حاليًا. لم يتم إجراء أي تغيير.</p>
        <button type="button" onClick={() => setRevision(value => value + 1)}>إعادة المحاولة</button>
      </div>}
      {status === "ready" && <section aria-label="الحسابات">
        <h2>الحسابات ({accounts.length})</h2>
        <div style={{overflowX:"auto",background:"#fff",borderRadius:18,padding:16}}>
          <table style={{width:"100%",borderCollapse:"collapse",textAlign:"right"}}>
            <thead><tr><th scope="col">البريد الإلكتروني</th><th scope="col">الحالة</th></tr></thead>
            <tbody>{accounts.map(account => <tr key={account.id}>
              <td style={{padding:"12px 4px",borderTop:"1px solid #eee",direction:"ltr",textAlign:"right"}}>{account.email}</td>
              <td style={{padding:"12px 4px",borderTop:"1px solid #eee"}}>{account.enabled?"نشط":"معطل"}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p>عمليات إنشاء الحسابات وتغيير الصلاحيات غير مفعّلة حتى اكتمال التحقق الأمني وسجل التدقيق.</p>
      </section>}
    </div>
  </main>;
}
