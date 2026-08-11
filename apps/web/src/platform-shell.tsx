import {
  Component,
} from "react";
import type {
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

export function PlatformShell(
  {
    state,
    navigate,
  }: PlatformShellProps,
) {
  switch (state.kind) {
    case "no-application-selected":
      return (
        <main id="main-content">
          <h1>
            No application selected
          </h1>
          <p>
            No application is active at this route.
          </p>
        </main>
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
            {state.application.name} cannot be mounted without running Platform lifecycle evidence.
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
