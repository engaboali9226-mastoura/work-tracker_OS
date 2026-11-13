import {
  Component,
  useState,
} from "react";
import type {
  FormEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
} from "react";

import type {
  PlatformShellState,
} from "./platform-shell-model.js";
import type { NoorAccountSelfServiceR312 } from "./noor-account-self-service-r312.js";
import { noorRecoveryRedirectR312 } from "./noor-account-self-service-r312.js";

export type PlatformShellProps =
Readonly<{
  state:
    PlatformShellState<ReactElement>;
  navigate:
    (pathname: string) => void;
  signIn?:
    (
      credentials:
        Readonly<{
          email:
            string;
          password:
            string;
        }>,
    ) => void | Promise<void>;
  authenticationState?:
    string;
  accountService?: NoorAccountSelfServiceR312;
}>;

type ViewBoundaryProps =
Readonly<{
  children:
    ReactNode;
}>;

type ViewBoundaryState =
Readonly<{
  failed:
    boolean;
}>;

class ApplicationViewBoundary
extends Component<
  ViewBoundaryProps,
  ViewBoundaryState
> {
  public override state:
  ViewBoundaryState = {
    failed:
      false,
  };

  public static getDerivedStateFromError():
  ViewBoundaryState {
    return {
      failed:
        true,
    };
  }

  public override render() {
    if (this.state.failed) {
      return (
        <section aria-labelledby="view-failure-heading">
          <h1 id="view-failure-heading">
            Application view unavailable
          </h1>
          <p>
            The application view could not be rendered.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}

function HomeLink(
  {
    navigate,
  }: Readonly<{
    navigate:
      (pathname: string) => void;
  }>,
) {
  const navigateHome =
    (
      event: MouseEvent<HTMLAnchorElement>,
    ) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) {
        return;
      }

      event.preventDefault();
      navigate(
        "/",
      );
    };

  return (
    <a
      href="/"
      onClick={navigateHome}
    >
      Return home
    </a>
  );
}


function SmartGateway({
  navigate, signIn, authenticationState, accountService,
}: {
  navigate: (pathname: string) => void;
  signIn?: PlatformShellProps["signIn"];
  authenticationState?: string;
  accountService?: NoorAccountSelfServiceR312;
}) {
  const recoveryCallback = typeof window !== "undefined" && (
    new URLSearchParams(window.location.search).get("auth") === "recovery"
    || new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"
  );
  const [mode,setMode]=useState<"login"|"register"|"reset"|"recovery">(
    recoveryCallback ? "recovery" : "login",
  );
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const isAuth = authenticationState === "authenticated";
  const submitting = authenticationState === "submitting" || busy;
  const changeMode=(next:typeof mode)=>{if(submitting)return;setMode(next);setNotice("");setError("");};
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(submitting)return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")??"").trim();
    const password = String(form.get("password")??"");
    const confirmation = String(form.get("passwordConfirm")??"");
    setError("");setNotice("");
    if(mode==="login"){if(signIn)await signIn({email,password});return;}
    if(!accountService){setError("هذه الخدمة غير متاحة حاليًا.");return;}
    if((mode==="recovery"||mode==="register")&&password!==confirmation){
      setError("كلمتا المرور غير متطابقتين.");return;
    }
    if((mode==="recovery"||mode==="register")&&password.length<8){
      setError("استخدم كلمة مرور من ٨ أحرف على الأقل.");return;
    }
    setBusy(true);
    try{
      const origin=window.location.origin;
      const result=mode==="reset"
        ? await accountService.requestPasswordReset(email,noorRecoveryRedirectR312(origin))
        : mode==="register"
          ? await accountService.registerPendingAccount(email,password,new URL("/",origin).toString())
          : await accountService.completePasswordRecovery(password);
      if(result==="invalid"){setError(mode==="recovery"?"رابط الاستعادة غير صالح أو انتهت صلاحيته. أعد طلب رسالة جديدة.":"تحقق من صحة البيانات المدخلة.");return;}
      if(result==="unavailable"){setError("تعذّر إتمام الطلب. تحقق من الاتصال وإعدادات البريد ثم حاول مرة أخرى.");return;}
      if(mode==="recovery"&&result==="updated"){
        window.history.replaceState(null,"","/");
        setMode("login");
        setNotice("تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.");
      }else if(mode==="reset"){
        setNotice("إذا كان البريد مرتبطًا بحساب، ستصلك رسالة استعادة. افحص البريد والرسائل غير المرغوبة.");
      }else if(mode==="register"){
        setNotice("تم إرسال طلب التسجيل. تحقّق من بريدك؛ يلزم اعتماد وربط الحساب بمساحة نور قبل تمكين الدخول.");
      }
    }catch{setError("تعذّر إتمام الطلب حاليًا.");}
    finally{setBusy(false);}
  };

  return (
    <main id="main-content" className="noor-welcome-gateway-r231">
      <div className="noor-welcome-ambient" aria-hidden="true" />
      <section className="noor-welcome-panel" aria-labelledby="noor-welcome-title">
        <div className="noor-welcome-logo-frame">
          <img className="noor-welcome-logo" src="/noor-platform-logo.jpeg"
            alt="شعار منصة نور" width="104" height="104" fetchPriority="high" decoding="async" />
        </div>
        <p className="noor-welcome-eyebrow" lang="en">NOOR PLATFORM</p>
        <h1 id="noor-welcome-title" className="glass-title">مرحبا بك في منصة نور</h1>
        <p className="noor-welcome-description">مساحة هادئة لتنظيم يومك، ومتابعة ما يهمك.</p>
        {!isAuth ? <>
          <nav className="noor-auth-switch-r312" aria-label="خيارات الحساب">
            {([["login","تسجيل الدخول"],["register","إنشاء حساب"],["reset","نسيت كلمة المرور؟"]] as const).map(([key,title])=>
              <button type="button" key={key} aria-pressed={mode===key} disabled={submitting}
                onClick={()=>changeMode(key)}>{title}</button>)}
          </nav>
          {mode==="recovery"?<h2 className="noor-auth-title-r312">تعيين كلمة مرور جديدة</h2>:null}
          <form className="noor-welcome-form" onSubmit={event=>{void submit(event);}}>
            {mode!=="recovery"?<label className="noor-welcome-field">
              <span>البريد الإلكتروني</span>
              <input name="email" type="email" dir="ltr" inputMode="email"
                autoComplete="username" required disabled={submitting} placeholder="name@example.com" />
            </label>:null}
            {mode==="login"||mode==="register"||mode==="recovery"?<label className="noor-welcome-field">
              <span>{mode==="recovery"?"كلمة المرور الجديدة":"كلمة المرور"}</span>
              <input name="password" type="password" dir="ltr" minLength={mode==="login"?undefined:8}
                autoComplete={mode==="login"?"current-password":"new-password"} required disabled={submitting} placeholder="••••••••" />
            </label>:null}
            {mode==="register"||mode==="recovery"?<label className="noor-welcome-field">
              <span>تأكيد كلمة المرور</span>
              <input name="passwordConfirm" type="password" dir="ltr" autoComplete="new-password"
                minLength={8} required disabled={submitting} placeholder="••••••••" />
            </label>:null}
            {mode==="register"?<p className="noor-auth-hint-r312">إنشاء الهوية لا يمنح صلاحية الدخول تلقائيًا؛ يلزم تأكيد البريد وربط الحساب بمساحة نور من الإدارة.</p>:null}
            <button className="noor-welcome-submit" type="submit" disabled={submitting || (mode==="login"?!signIn:!accountService)}>
              {submitting?(mode==="login"?"جارٍ تسجيل الدخول…":"جارٍ التنفيذ…"):mode==="login"?"الدخول إلى نور":mode==="register"?"إرسال طلب التسجيل":mode==="reset"?"إرسال رابط الاستعادة":"حفظ كلمة المرور الجديدة"}
              {!submitting?<span aria-hidden="true">←</span>:null}
            </button>
            {authenticationState==="invalid-credentials"&&mode==="login"?
              <p className="noor-welcome-error" role="alert">البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير معتمد بعد.</p>:null}
            {authenticationState==="unavailable"&&mode==="login"?
              <p className="noor-welcome-error" role="alert">تعذر الاتصال بخدمة الدخول حاليًا. حاول مرة أخرى.</p>:null}
            {error?<p className="noor-welcome-error" role="alert">{error}</p>:null}
            {notice?<p className="noor-auth-success-r312" role="status">{notice}</p>:null}
          </form>
          {mode==="recovery"?<button type="button" className="noor-auth-return-r312" onClick={()=>changeMode("reset")}>طلب رابط استعادة جديد</button>:null}
        </> : (
          <div className="noor-welcome-apps" aria-label="تطبيقات نور">
            <p className="noor-welcome-apps-title">اختر مساحتك</p>
            <a href="/personal" className="noor-welcome-app-card" onClick={event=>{
              if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
              event.preventDefault();navigate("/personal");}}>
              <span className="noor-welcome-app-mark" aria-hidden="true">✦</span>
              <span className="noor-welcome-app-copy"><strong>نور الشخصي</strong><small>يومك، عاداتك، وتقدمك</small></span>
              <span className="noor-welcome-app-arrow" aria-hidden="true">←</span>
            </a>
            <a href="/work" className="noor-welcome-app-card" onClick={event=>{
              if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
              event.preventDefault();navigate("/work");}}>
              <span className="noor-welcome-app-mark" aria-hidden="true">◈</span>
              <span className="noor-welcome-app-copy"><strong>نور ورك</strong><small>الجدول والتحضير والطلاب والدرجات</small></span>
              <span className="noor-welcome-app-arrow" aria-hidden="true">←</span>
            </a>
          </div>
        )}
        <p className="noor-welcome-privacy"><span aria-hidden="true">✧</span> مساحتك الخاصة، بتجربة بسيطة وآمنة</p>
      </section>
      <p className="noor-welcome-footer" lang="en">NOOR · DESIGNED FOR CLARITY</p>
    </main>
  );
}

export function PlatformShell(

  {
    state,
    navigate,
    signIn,
    authenticationState,
    accountService,
  }: PlatformShellProps,
) {
  switch (state.kind) {
    case "no-application-selected":
      return (
        <SmartGateway
          navigate={navigate}
          signIn={signIn}
          authenticationState={authenticationState}
          accountService={accountService}
        />
      );

    case "not-found":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Route not found
          </h1>
          <p>
            The route <code>{state.pathname}</code> is unavailable.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "planned-application":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Application planned
          </h1>
          <p>
            {state.application.name} is listed in the catalog but is not mountable.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "platform-failed-closed":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Application unavailable
          </h1>
          <p>
            The platform is unavailable for this request.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "authentication-required":
      // R231: deep links and refresh use the exact same protected Noor gateway.
      // Authentication checks remain server-enforced; no /personal view is mounted.
      return (
        <SmartGateway
          navigate={navigate}
          signIn={signIn}
          authenticationState={
            (state.authenticationState ?? authenticationState) === "authenticated"
              ? "idle"
              : state.authenticationState ?? authenticationState
          }
          accountService={accountService}
        />
      );

    case "session-access-unavailable":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Access unavailable
          </h1>
          <p>
            Access status is currently unavailable. Please try again later.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "authorization-denied":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Access denied
          </h1>
          <p>
            You do not have access to this application.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "authorization-unavailable":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Access unavailable
          </h1>
          <p>
            Authorization status is currently unavailable. Please try again later.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "known-view-unavailable":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Known view unavailable
          </h1>
          <p>
            No application view is registered for {state.application.name}.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "platform-lifecycle-unavailable":
      // Route evidence is still in flight. Keep access closed, but do not show
      // an error before the request has actually finished.
      if (
        state.lifecycleState === "idle"
        || state.lifecycleState === "bootstrapping"
      ) {
        return (
          <main
            id="main-content"
            className="noor-entry-screen"
            aria-busy="true"
            dir="rtl"
          >
            <style>{`
              /* Only the waiting route surface is styled: no changes to permissions. */
              body { margin: 0; background-color: #f7f4ee; }
              .noor-entry-screen {
                min-height: 100vh;
                min-height: 100dvh;
                box-sizing: border-box;
                display: grid;
                place-items: center;
                padding: 24px;
                background-color: #f7f4ee;
                color: #102a43;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
                -webkit-font-smoothing: antialiased;
                animation: noor-entry-surface 520ms cubic-bezier(.22, 1, .36, 1) both;
              }
              .noor-entry-content {
                display: grid;
                justify-items: center;
                gap: 0;
                max-width: 320px;
                opacity: 0;
                animation: noor-entry-content 360ms cubic-bezier(.22, 1, .36, 1) 160ms forwards;
              }
              /* R101: identical original logo geometry in both loading phases. */
              .noor-entry-logo {
                display: block;
                width: 66px;
                height: 66px;
                object-fit: cover;
                object-position: center;
                border-radius: 50%;
                margin: 0 0 24px;
                border: 1px solid rgba(184, 134, 43, .22);
                box-shadow: 0 2px 12px rgba(16, 42, 67, .035);
              }
              .noor-entry-ring {
                display: block;
                width: 22px;
                height: 22px;
                margin-top: 24px;
                box-sizing: border-box;
                border: 2px solid rgba(16, 42, 67, .12);
                border-top-color: #6b7f92;
                border-radius: 50%;
                animation: noor-entry-spin 900ms linear infinite;
              }
              .noor-entry-title {
                margin: 0;
                color: #102a43;
                font-size: clamp(19px, 4vw, 22px);
                font-weight: 650;
                line-height: 1.55;
                letter-spacing: 0;
              }
              .noor-entry-status {
                margin: 8px 0 0;
                color: #6b7f92;
                font-size: 14px;
                font-weight: 400;
                line-height: 1.8;
              }
/* NOOR_R102_UNIFIED_LOADING_GEOMETRY_BEGIN */
.noor-entry-screen,
.np-page .np-entry-loading {
  position: fixed;
  inset: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: 24px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f7f4ee;
  color: #102a43;
  text-align: center;
  direction: rtl;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, Tahoma, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  opacity: 1;
  transform: none;
  animation: none;
}
.noor-entry-content,
.np-page .np-entry-loading-content {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  margin: 0;
  padding: 0;
  gap: 0;
  opacity: 1;
  transform: none;
  animation: none;
}
.noor-entry-logo,
.np-page .np-entry-loading-logo {
  display: block;
  box-sizing: border-box;
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  border: 1px solid rgba(184, 134, 43, .22);
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  margin: 0 0 24px;
  box-shadow: 0 2px 12px rgba(16, 42, 67, .035);
}
.noor-entry-title,
.np-page .np-entry-loading-title {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: #102a43;
  font-size: clamp(19px, 4vw, 22px);
  font-weight: 650;
  line-height: 1.55;
  letter-spacing: 0;
}
.noor-entry-status,
.np-page .np-entry-loading-copy {
  box-sizing: border-box;
  margin: 8px 0 0;
  padding: 0;
  color: #6b7f92;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.8;
}
.noor-entry-ring,
.np-page .np-entry-loading-spinner {
  box-sizing: border-box;
  display: block;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  margin: 24px 0 0;
  border: 2px solid rgba(16, 42, 67, .12);
  border-top-color: #6b7f92;
  border-radius: 50%;
}
@media (prefers-reduced-motion: reduce) {
  .noor-entry-ring,
  .np-page .np-entry-loading-spinner { animation: none; }
}
/* NOOR_R102_UNIFIED_LOADING_GEOMETRY_END */
              @keyframes noor-entry-surface {
                from { background-color: #0f172a; }
                to { background-color: #f7f4ee; }
              }
              @keyframes noor-entry-content {
                from { opacity: 0; transform: translateY(7px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes noor-entry-spin {
                to { transform: rotate(360deg); }
              }
              @media (prefers-reduced-motion: reduce) {
                .noor-entry-screen, .noor-entry-content, .noor-entry-ring {
                  animation: none;
                }
                .noor-entry-content { opacity: 1; }
              }
            `}</style>
            <div className="noor-entry-content">
              <img className="noor-entry-logo" src="/noor-platform-logo.jpeg" alt="شعار نور" decoding="sync" loading="eager" />
              <h1 className="noor-entry-title">مرحبا بك في منصة نور</h1>
              <p className="noor-entry-status" role="status" aria-live="polite">
                جارٍ تجهيز مساحتك الشخصية…
              </p>
              <span className="noor-entry-ring" aria-hidden="true" />
            </div>
          </main>
        );
      }

      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Application unavailable
          </h1>
          <p>
            The application cannot be opened while the platform is unavailable.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "application-view-failure":
      return (
        <main id="main-content" className="noor-route-state-r231">
          <h1>
            Application view unavailable
          </h1>
          <p>
            The registered view for {state.application.name} could not be created.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "application-view":
      return (
        <main
          id="main-content"
          aria-label={state.application.name}
        >
          <ApplicationViewBoundary>
            {state.view}
          </ApplicationViewBoundary>
        </main>
      );
  }
}
