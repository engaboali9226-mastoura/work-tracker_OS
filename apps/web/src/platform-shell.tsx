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


function SmartGateway({ navigate, signIn, authenticationState }: { navigate: (pathname: string) => void, signIn?: any, authenticationState?: string }) {
  const isAuth = authenticationState === "authenticated";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;
    void signIn({ email, password });
  };

  return (
    <div className="launcher-bg">
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; background: #0f172a; }
        .launcher-bg { background: radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 50%), radial-gradient(circle at 85% 30%, rgba(15, 118, 110, 0.2), transparent 50%), #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; margin: 0; width: 100%; }
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 48px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: fade-in 0.5s ease-out; text-align: center; }
        .glass-title { font-size: 28px; font-weight: 600; margin-top: 0; margin-bottom: 8px; background: linear-gradient(to right, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass-subtitle { font-size: 15px; color: #94a3b8; margin-bottom: 32px; }
        .glass-input { width: 100%; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px 16px; color: white; margin-top: 8px; margin-bottom: 20px; outline: none; transition: border-color 0.2s; box-sizing: border-box; font-size: 15px; }
        .glass-input:focus { border-color: rgba(255, 255, 255, 0.3); background: rgba(0, 0, 0, 0.3); }
        .glass-btn { width: 100%; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 16px; margin-top: 8px; }
        .glass-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
        .glass-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
        .app-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 24px 16px; text-align: center; cursor: pointer; text-decoration: none; color: white; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .app-card:hover:not(.disabled) { background: rgba(255, 255, 255, 0.1); transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
        .app-card.disabled { opacity: 0.5; cursor: default; filter: grayscale(100%); }
        .app-icon { font-size: 36px; margin-bottom: 12px; display: block; }
        .app-name { font-size: 15px; font-weight: 600; margin: 0; }
        .app-badge { font-size: 11px; background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 12px; margin-top: 8px; display: inline-block; }
        .label-text { display: block; text-align: left; font-size: 13px; color: #cbd5e1; margin-bottom: 4px; font-weight: 500; }
        .status-text { color: #f87171; font-size: 14px; margin-top: 16px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
      <div className="glass-panel">
        {!isAuth ? (
          <>
            <h1 className="glass-title">Noor Platform</h1>
            <p className="glass-subtitle">Sign in to access your applications</p>
            <form onSubmit={submit} style={{ textAlign: "left" }}>
              <label>
                <span className="label-text">Email</span>
                <input name="email" type="email" autoComplete="username" required disabled={authenticationState === "submitting"} className="glass-input" />
              </label>
              <label>
                <span className="label-text">Password</span>
                <input name="password" type="password" autoComplete="current-password" required disabled={authenticationState === "submitting"} className="glass-input" />
              </label>
              <button type="submit" disabled={authenticationState === "submitting"} className="glass-btn">
                {authenticationState === "submitting" ? "Signing in..." : "Sign in"}
              </button>
            </form>
            {authenticationState === "invalid-credentials" && <p className="status-text">Invalid credentials. Please try again.</p>}
            {authenticationState === "unavailable" && <p className="status-text">Service temporarily unavailable.</p>}
          </>
        ) : (
          <>
            <h1 className="glass-title">Welcome</h1>
            <p className="glass-subtitle">Select an application to launch</p>
            <div className="app-grid">
              <a href="/noor-personal" onClick={(e) => { e.preventDefault(); navigate("/noor-personal"); }} className="app-card">
                <span className="app-icon">✨</span>
                <p className="app-name">Noor Personal</p>
              </a>
              <div className="app-card disabled" title="Coming soon">
                <span className="app-icon">💼</span>
                <p className="app-name">Noor Work</p>
                <span className="app-badge">Planned</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
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
        <main id="main-content">
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
