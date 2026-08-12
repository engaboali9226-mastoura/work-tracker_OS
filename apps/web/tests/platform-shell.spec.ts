import assert from "node:assert/strict";
import test from "node:test";

import axe from "axe-core";
import {
  applicationCatalog,
} from "@worktracker/core";
import {
  JSDOM,
} from "jsdom";
import {
  act,
  createElement,
} from "react";
import type {
  ReactElement,
} from "react";
import {
  createRoot,
} from "react-dom/client";

import {
  createApplicationViewRegistry,
} from "../src/application-view-registry.js";
import {
  PlatformShell,
} from "../src/platform-shell.js";
import {
  projectPlatformShell,
} from "../src/platform-shell-model.js";
import type {
  PlatformShellState,
} from "../src/platform-shell-model.js";
import type {
  RouteAccessEvidence,
} from "../src/route-access-evidence.js";

type TestDom =
Readonly<{
  dom:
    JSDOM;
  container:
    HTMLElement;
  restoreGlobals:
    () => void;
}>;

function installDom(): TestDom {
  const dom =
    new JSDOM(
      "<!doctype html><html lang=\"en\" dir=\"ltr\"><head><title>Shell test</title></head><body><div id=\"root\"></div></body></html>",
      {
        url:
          "https://shell.noor.test/",
        runScripts:
          "outside-only",
      },
    );

  const globals = {
    window:
      dom.window,
    document:
      dom.window.document,
    navigator:
      dom.window.navigator,
    Node:
      dom.window.Node,
    Element:
      dom.window.Element,
    HTMLElement:
      dom.window.HTMLElement,
    MutationObserver:
      dom.window.MutationObserver,
    getComputedStyle:
      dom.window.getComputedStyle.bind(
        dom.window,
      ),
    IS_REACT_ACT_ENVIRONMENT:
      true,
  } as const;

  const previousDescriptors =
    new Map<
      keyof typeof globals,
      PropertyDescriptor | undefined
    >();

  for (
    const [key, value]
    of Object.entries(
      globals,
    ) as [
      keyof typeof globals,
      (typeof globals)[keyof typeof globals],
    ][]
  ) {
    previousDescriptors.set(
      key,
      Object.getOwnPropertyDescriptor(
        globalThis,
        key,
      ),
    );

    Object.defineProperty(
      globalThis,
      key,
      {
        configurable:
          true,
        writable:
          true,
        value,
      },
    );
  }

  const container =
    dom.window.document.getElementById(
      "root",
    );

  assert.ok(container);

  return {
    dom,
    container,
    restoreGlobals:
      () => {
        for (
          const [key, descriptor]
          of previousDescriptors
        ) {
          if (descriptor) {
            Object.defineProperty(
              globalThis,
              key,
              descriptor,
            );
          } else {
            Reflect.deleteProperty(
              globalThis,
              key,
            );
          }
        }
      },
  };
}

async function renderState(
  state: PlatformShellState<ReactElement>,
  navigate: (pathname: string) => void = () => {},
) {
  const testDom =
    installDom();

  const root =
    createRoot(
      testDom.container,
    );

  await act(
    async () => {
      root.render(
        createElement(
          PlatformShell,
          {
            state,
            navigate,
          },
        ),
      );
    },
  );

  return {
    ...testDom,
    cleanup:
      async () => {
        await act(
          async () => {
            root.unmount();
          },
        );

        testDom.restoreGlobals();
        testDom.dom.window.close();
      },
  };
}

test(
  "root presents neutral accessible content without a launcher or fabricated application",
  async () => {
    const rendered =
      await renderState({
        kind:
          "no-application-selected",
      });

    try {
      assert.equal(
        rendered.container.querySelector(
          "main h1",
        )?.textContent?.trim(),
        "No application selected",
      );

      const text =
        rendered.container.textContent
          ?? "";

      assert.doesNotMatch(
        text,
        /launcher|Noor Personal|Noor Work/iu,
      );
    } finally {
      await rendered.cleanup();
    }
  },
);

test(
  "Not Found is distinct from access denial and recovers deterministically to root",
  async () => {
    const navigations:
    string[] = [];

    const rendered =
      await renderState(
        {
          kind:
            "not-found",
          pathname:
            "/unknown",
        },
        pathname => {
          navigations.push(
            pathname,
          );
        },
      );

    try {
      assert.match(
        rendered.container.textContent
          ?? "",
        /route not found/iu,
      );

      assert.doesNotMatch(
        rendered.container.textContent
          ?? "",
        /access denied|authentication|authorization/iu,
      );

      const homeLink =
        rendered.container.querySelector(
          "a[href='/']",
        );

      assert.ok(homeLink);

      homeLink.dispatchEvent(
        new rendered.dom.window.MouseEvent(
          "click",
          {
            bubbles:
              true,
            cancelable:
              true,
            button:
              0,
          },
        ),
      );

      assert.deepEqual(
        navigations,
        [
          "/",
        ],
      );
    } finally {
      await rendered.cleanup();
    }
  },
);

test(
  "known missing view presentation names catalog truth without mounting application content",
  async () => {
    const personal =
      applicationCatalog.findByKey(
        "noor-personal",
      );

    assert.ok(personal);

    const rendered =
      await renderState({
        kind:
          "known-view-unavailable",
        application:
          personal,
      });

    try {
      assert.equal(
        rendered.container.querySelector(
          "h1",
        )?.textContent?.trim(),
        "Known view unavailable",
      );

      assert.match(
        rendered.container.textContent
          ?? "",
        /No application view is registered/iu,
      );
    } finally {
      await rendered.cleanup();
    }
  },
);

test(
  "protected-routing states present meaningful generic accessible content",
  async () => {
    const personal =
      applicationCatalog.findByKey(
        "noor-personal",
      );

    assert.ok(personal);

    const states: readonly [
      PlatformShellState<ReactElement>,
      string,
      RegExp,
    ][] = [
      [
        {
          kind:
            "platform-failed-closed",
          application:
            personal,
        },
        "Application unavailable",
        /platform is unavailable/iu,
      ],
      [
        {
          kind:
            "platform-lifecycle-unavailable",
          application:
            personal,
          lifecycleState:
            "idle",
        },
        "Application unavailable",
        /cannot be opened while the platform is unavailable/iu,
      ],
      [
        {
          kind:
            "authentication-required",
          application:
            personal,
        },
        "Sign-in required",
        /sign in is required/iu,
      ],
      [
        {
          kind:
            "session-access-unavailable",
          application:
            personal,
        },
        "Access unavailable",
        /access status is currently unavailable/iu,
      ],
      [
        {
          kind:
            "authorization-denied",
          application:
            personal,
        },
        "Access denied",
        /do not have access/iu,
      ],
      [
        {
          kind:
            "authorization-unavailable",
          application:
            personal,
        },
        "Access unavailable",
        /authorization status is currently unavailable/iu,
      ],
    ];

    for (const [state, heading, message] of states) {
      const rendered =
        await renderState(
          state,
        );

      try {
        const text =
          rendered.container.textContent
            ?? "";

        assert.equal(
          rendered.container.querySelector(
            "main h1",
          )?.textContent?.trim(),
          heading,
        );

        assert.match(
          text,
          message,
        );

        assert.doesNotMatch(
          text,
          /Noor Personal|registered view/iu,
        );
      } finally {
        await rendered.cleanup();
      }
    }
  },
);

test(
  "render-time Application View failure presents a Shell-owned page-level heading",
  async () => {
    const personal =
      applicationCatalog.findByKey(
        "noor-personal",
      );

    assert.ok(personal);

    let factoryInvocations =
      0;

    let renderInvocations =
      0;

    function ThrowingApplicationView() {
      renderInvocations +=
        1;

      throw new Error(
        "render-time application failure",
      );
    }

    const registry =
      createApplicationViewRegistry<ReactElement>(
        applicationCatalog,
        [
          {
            appKey:
              personal.appKey,
            factory:
              () => {
                factoryInvocations +=
                  1;

                return createElement(
                  "section",
                  null,
                  createElement(
                    "p",
                    null,
                    "Mounted application content",
                  ),
                  createElement(
                    ThrowingApplicationView,
                  ),
                );
              },
          },
        ],
      );

    const state =
      projectPlatformShell({
        pathname:
          personal.route,
        catalog:
          applicationCatalog,
        applicationViews:
          registry,
        lifecycleState:
          "running",
        accessEvidence:
          Object.freeze({
            kind:
              "authenticated-authorized",
            appKey:
              personal.appKey,
            pathname:
              personal.route,
          }) as RouteAccessEvidence,
      });

    assert.equal(
      state.kind,
      "application-view",
    );

    assert.equal(
      factoryInvocations,
      1,
    );

    assert.equal(
      renderInvocations,
      0,
    );

    const rendered =
      await renderState(
        state,
      );

    try {
      assert.ok(
        renderInvocations > 0,
      );

      assert.equal(
        rendered.container.querySelector(
          "main h1",
        )?.textContent?.trim(),
        "Application view unavailable",
      );

      const text =
        rendered.container.textContent
          ?? "";

      assert.match(
        text,
        /application view could not be rendered/iu,
      );

      assert.doesNotMatch(
        text,
        /mounted application content|access denied|authentication|authorization|production/iu,
      );
    } finally {
      await rendered.cleanup();
    }
  },
);

test(
  "axe reports no deterministic Shell violations while incomplete JSDOM evidence remains explicit",
  async () => {
    const rendered =
      await renderState({
        kind:
          "not-found",
        pathname:
          "/unknown",
      });

    try {
      rendered.dom.window.eval(
        axe.source,
      );

      const windowAxe = (rendered.dom.window as unknown as { axe: typeof axe }).axe;

      const result =
        await windowAxe.run(
          rendered.dom.window.document,
          {
            rules: {
              "color-contrast": {
                enabled:
                  false,
              },
            },
          },
        );

      assert.equal(
        result.violations.length,
        0,
      );

      assert.equal(
        Array.isArray(
          result.incomplete,
        ),
        true,
      );
    } finally {
      await rendered.cleanup();
    }
  },
);
