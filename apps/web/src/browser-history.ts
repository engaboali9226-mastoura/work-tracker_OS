export type HistoryListener =
  () => void;

export interface HistoryPort {
  pathname(): string;

  push(
    pathname: string,
  ): void;

  replace(
    pathname: string,
  ): void;

  subscribe(
    listener: HistoryListener,
  ): () => void;
}

export function createBrowserHistory(
  browserWindow: Window,
): HistoryPort {
  const listeners =
    new Set<HistoryListener>();

  const notify =
    () => {
      for (const listener of listeners) {
        listener();
      }
    };

  const observePopState =
    () => {
      notify();
    };

  const pathname =
    () =>
      browserWindow.location.pathname;

  const push =
    (
      nextPathname: string,
    ) => {
      browserWindow.history.pushState(
        null,
        "",
        nextPathname,
      );

      notify();
    };

  const replace =
    (
      nextPathname: string,
    ) => {
      browserWindow.history.replaceState(
        null,
        "",
        nextPathname,
      );

      notify();
    };

  const subscribe =
    (
      listener: HistoryListener,
    ) => {
      const subscription =
        () => {
          listener();
        };

      if (listeners.size === 0) {
        browserWindow.addEventListener(
          "popstate",
          observePopState,
        );
      }

      listeners.add(
        subscription,
      );

      let subscribed =
        true;

      return () => {
        if (!subscribed) {
          return;
        }

        subscribed =
          false;

        listeners.delete(
          subscription,
        );

        if (listeners.size === 0) {
          browserWindow.removeEventListener(
            "popstate",
            observePopState,
          );
        }
      };
    };

  return Object.freeze({
    pathname,
    push,
    replace,
    subscribe,
  });
}
