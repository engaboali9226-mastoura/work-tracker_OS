import {
  Component,
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
  navigate,
  signIn,
  authenticationState,
}: {
  navigate: (pathname: string) => void;
  signIn?: PlatformShellProps["signIn"];
  authenticationState?: string;
}) {
  const isAuth = authenticationState === "authenticated";
  const submitting = authenticationState === "submitting";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn || submitting) return;
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;
    void signIn({ email, password });
  };

  return (
    <main id="main-content" className="noor-welcome-gateway-r231">
      <div className="noor-welcome-ambient" aria-hidden="true" />
      <section className="noor-welcome-panel" aria-labelledby="noor-welcome-title">
        <div className="noor-welcome-logo-frame">
          <img
            className="noor-welcome-logo"
            src="/noor-platform-logo.jpeg"
            alt="شعار منصة نور"
            width="104"
            height="104"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <p className="noor-welcome-eyebrow" lang="en">NOOR PLATFORM</p>
        <h1 id="noor-welcome-title" className="glass-title">مرحبا بك في منصة نور</h1>
        <p className="noor-welcome-description">
          مساحة هادئة لتنظيم يومك، ومتابعة ما يهمك.
        </p>
        {!isAuth ? (
          <form className="noor-welcome-form" onSubmit={submit}>
            <label className="noor-welcome-field">
              <span>البريد الإلكتروني</span>
              <input
                name="email"
                type="email"
                dir="ltr"
                inputMode="email"
                autoComplete="username"
                required
                disabled={submitting}
                placeholder="name@example.com"
              />
            </label>
            <label className="noor-welcome-field">
              <span>كلمة المرور</span>
              <input
                name="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                disabled={submitting}
                placeholder="••••••••"
              />
            </label>
            <button
              className="noor-welcome-submit"
              type="submit"
              disabled={submitting || !signIn}
            >
              {submitting ? "جارٍ تسجيل الدخول…" : "الدخول إلى نور"}
              {!submitting ? <span aria-hidden="true">←</span> : null}
            </button>
            {authenticationState === "invalid-credentials" ? (
              <p className="noor-welcome-error" role="alert">البريد الإلكتروني أو كلمة المرور غير صحيحة.</p>
            ) : null}
            {authenticationState === "unavailable" ? (
              <p className="noor-welcome-error" role="alert">تعذر الاتصال بخدمة الدخول حاليًا. حاول مرة أخرى.</p>
            ) : null}
          </form>
        ) : (
          <div className="noor-welcome-apps" aria-label="تطبيقات نور">
            <p className="noor-welcome-apps-title">اختر مساحتك</p>
            <a
              href="/personal"
              className="noor-welcome-app-card"
              onClick={event => {
                if (event.defaultPrevented || event.button !== 0 ||
                    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                navigate("/personal");
              }}
            >
              <span className="noor-welcome-app-mark" aria-hidden="true">✦</span>
              <span className="noor-welcome-app-copy"><strong>نور الشخصي</strong><small>يومك، عاداتك، وتقدمك</small></span>
              <span className="noor-welcome-app-arrow" aria-hidden="true">←</span>
            </a>
            <div className="noor-welcome-app-card noor-welcome-app-disabled" aria-disabled="true">
              <span className="noor-welcome-app-mark" aria-hidden="true">◈</span>
              <span className="noor-welcome-app-copy"><strong>نور للأعمال</strong><small>قريبًا</small></span>
            </div>
          </div>
        )}
        <p className="noor-welcome-privacy">
          <span aria-hidden="true">✧</span> مساحتك الخاصة، بتجربة بسيطة وآمنة
        </p>
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
  }: PlatformShellProps,
) {
  switch (state.kind) {
    case "no-application-selected":
      return (
        <SmartGateway
          navigate={navigate}
          signIn={signIn}
          authenticationState={authenticationState}
        />
      );

    case "not-found":
      return (
        <main id="main-content">
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
        <main id="main-content">
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
        <main id="main-content">
          <h1>
            Application unavailable
          </h1>
          <p>
            The platform is unavailable for this request.
          </p>
          <HomeLink navigate={navigate} />
        </main>
      );

    case "authentication-required": {
      const authenticationState =
        state.authenticationState
        ?? "idle";

      const submit =
        (
          event:
            FormEvent<HTMLFormElement>,
        ) => {
          event.preventDefault();

          if (!signIn) {
            return;
          }

          const form =
            new FormData(
              event.currentTarget,
            );

          const email =
            form.get(
              "email",
            );

          const password =
            form.get(
              "password",
            );

          if (
            typeof email !== "string"
            || typeof password !== "string"
          ) {
            return;
          }

          void signIn({
            email,
            password,
          });
        };

      return (
        <main id="main-content" className="noor-auth-route-r230">
          <h1>
            Sign-in required
          </h1>
          <p>
            Sign in is required before this application can be opened.
          </p>

          {signIn
            ? (
                <form onSubmit={submit}>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      autoComplete="username"
                      required
                      disabled={authenticationState === "submitting"}
                    />
                  </label>

                  <label>
                    Password
                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      disabled={authenticationState === "submitting"}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={authenticationState === "submitting"}
                  >
                    {authenticationState === "submitting"
                      ? "Signing in…"
                      : "Sign in"}
                  </button>
                </form>
              )
            : null}

          {authenticationState === "invalid-credentials"
            ? (
                <p role="alert">
                  Sign-in could not be completed with those credentials.
                </p>
              )
            : null}

          {authenticationState === "unavailable"
            ? (
                <p role="alert">
                  Sign-in is temporarily unavailable.
                </p>
              )
            : null}

          {authenticationState === "authenticated"
            ? (
                <p>
                  Session established. Checking access…
                </p>
              )
            : null}

          <HomeLink navigate={navigate} />
        </main>
      );
    }

    case "session-access-unavailable":
      return (
        <main id="main-content">
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
        <main id="main-content">
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
        <main id="main-content">
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
        <main id="main-content">
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
        <main id="main-content">
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
        <main id="main-content">
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
