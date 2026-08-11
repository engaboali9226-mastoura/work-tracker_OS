import assert from "node:assert/strict";
import test from "node:test";

import {
  JSDOM,
} from "jsdom";

import {
  createBrowserHistory,
} from "../src/browser-history.js";
import type {
  HistoryListener,
  HistoryPort,
} from "../src/browser-history.js";

class MemoryHistory
implements HistoryPort {
  readonly #listeners =
    new Set<HistoryListener>();

  #stack:
  string[];

  #cursor =
    0;

  public constructor(
    initialPathname: string,
  ) {
    this.#stack = [
      initialPathname,
    ];
  }

  public pathname(): string {
    return this.#stack[this.#cursor] ?? "/";
  }

  public push(
    pathname: string,
  ): void {
    this.#stack =
      this.#stack.slice(
        0,
        this.#cursor + 1,
      );

    this.#stack.push(
      pathname,
    );

    this.#cursor +=
      1;

    this.#notify();
  }

  public replace(
    pathname: string,
  ): void {
    this.#stack[this.#cursor] =
      pathname;

    this.#notify();
  }

  public back(): void {
    if (this.#cursor === 0) {
      return;
    }

    this.#cursor -=
      1;

    this.#notify();
  }

  public forward(): void {
    if (
      this.#cursor
      >= this.#stack.length - 1
    ) {
      return;
    }

    this.#cursor +=
      1;

    this.#notify();
  }

  public subscribe(
    listener: HistoryListener,
  ): () => void {
    this.#listeners.add(
      listener,
    );

    return () => {
      this.#listeners.delete(
        listener,
      );
    };
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}

test(
  "browser history owns pathname, push, replace, subscriptions, and explicit popstate",
  () => {
    const dom =
      new JSDOM(
        "<!doctype html><html><body></body></html>",
        {
          url:
            "https://shell.noor.test/start",
        },
      );

    try {
      const history =
        createBrowserHistory(
          dom.window as unknown as Window,
        );

      const observed:
      string[] = [];

      const unsubscribe =
        history.subscribe(
          () => {
            observed.push(
              history.pathname(),
            );
          },
        );

      assert.equal(
        history.pathname(),
        "/start",
      );

      history.push(
        "/personal",
      );

      history.replace(
        "/work",
      );

      dom.window.history.replaceState(
        null,
        "",
        "/native-observation",
      );

      dom.window.dispatchEvent(
        new dom.window.PopStateEvent(
          "popstate",
        ),
      );

      assert.deepEqual(
        observed,
        [
          "/personal",
          "/work",
          "/native-observation",
        ],
      );

      unsubscribe();
      unsubscribe();

      dom.window.dispatchEvent(
        new dom.window.PopStateEvent(
          "popstate",
        ),
      );

      assert.equal(
        observed.length,
        3,
      );
    } finally {
      dom.window.close();
    }
  },
);

test(
  "memory history owns deterministic stack, cursor boundaries, and subscribers",
  () => {
    const history =
      new MemoryHistory(
        "/",
      );

    const observed:
    string[] = [];

    const unsubscribe =
      history.subscribe(
        () => {
          observed.push(
            history.pathname(),
          );
        },
      );

    history.back();
    history.push(
      "/personal",
    );
    history.push(
      "/work",
    );
    history.back();
    history.replace(
      "/personal/today",
    );
    history.forward();
    history.back();
    history.back();
    history.back();
    history.forward();
    history.push(
      "/replacement-branch",
    );
    history.forward();

    assert.equal(
      history.pathname(),
      "/replacement-branch",
    );

    assert.deepEqual(
      observed,
      [
        "/personal",
        "/work",
        "/personal",
        "/personal/today",
        "/work",
        "/personal/today",
        "/",
        "/personal/today",
        "/replacement-branch",
      ],
    );

    unsubscribe();

    history.replace(
      "/silent",
    );

    assert.equal(
      observed.length,
      9,
    );
  },
);
