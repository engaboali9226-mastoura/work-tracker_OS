import assert from "node:assert/strict";
import test from "node:test";
import { applicationCatalog } from "@worktracker/core";
import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createApplicationViewRegistry } from "../src/application-view-registry.js";
import { projectPlatformShell } from "../src/platform-shell-model.js";
import type { PlatformShellState } from "../src/platform-shell-model.js";
import { PlatformShell } from "../src/platform-shell.js";

const personal = applicationCatalog.findByKey("noor-personal");
assert.ok(personal);

const evidence = Object.freeze({
  kind: "authenticated-authorized",
  appKey: personal.appKey,
  pathname: personal.route,
});

function htmlFor(state: PlatformShellState<ReactElement>) {
  return renderToStaticMarkup(
    createElement(PlatformShell, { state, navigate: () => {} }),
  );
}

test("R99 pending route evidence shows a neutral loading state, never unavailable", () => {
  let factoryLookups = 0;
  const registry = {
    find() {
      factoryLookups += 1;
      throw new Error("No view lookup before authorization");
    },
  };

  for (const lifecycleState of ["idle", "bootstrapping"] as const) {
    const state = projectPlatformShell({
      pathname: personal.route,
      catalog: applicationCatalog,
      applicationViews: registry,
      lifecycleState,
      accessEvidence: evidence,
    });
    assert.equal(state.kind, "platform-lifecycle-unavailable");
    const html = htmlFor(state);
    assert.match(html, /مرحبا بك في منصة نور/u);
    assert.match(html, /جارٍ تجهيز مساحتك الشخصية/);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /noor-entry-screen/);
    assert.match(html, /noor-entry-content/);
    assert.match(html, /noor-entry-ring/);
    assert.match(html, /#f7f4ee/);
    assert.match(html, /noor-entry-surface/);
    assert.match(html, /prefers-reduced-motion/);
    assert.doesNotMatch(html, /Application unavailable|Access denied|Mounted app/);
  }
  assert.equal(factoryLookups, 0);
});

test("R99 only successful positive access opens the app and failures remain errors", () => {
  let mounted = 0;
  const registry = createApplicationViewRegistry(applicationCatalog, [
    {
      appKey: personal.appKey,
      factory() {
        mounted += 1;
        return createElement("p", null, "Mounted app");
      },
    },
  ]);

  const waiting = projectPlatformShell({
    pathname: personal.route,
    catalog: applicationCatalog,
    applicationViews: registry,
    lifecycleState: "bootstrapping",
  });
  assert.doesNotMatch(htmlFor(waiting), /Mounted app|Application unavailable/);
  assert.equal(mounted, 0);

  const failedTransport = projectPlatformShell({
    pathname: personal.route,
    catalog: applicationCatalog,
    applicationViews: registry,
    lifecycleState: "running",
  });
  assert.equal(failedTransport.kind, "session-access-unavailable");
  assert.match(htmlFor(failedTransport), /Access unavailable/);
  assert.equal(mounted, 0);

  const denied = projectPlatformShell({
    pathname: personal.route,
    catalog: applicationCatalog,
    applicationViews: registry,
    lifecycleState: "running",
    accessEvidence: { ...evidence, kind: "authorization-denied" },
  });
  assert.equal(denied.kind, "authorization-denied");
  assert.match(htmlFor(denied), /Access denied/);
  assert.equal(mounted, 0);

  const accepted = projectPlatformShell({
    pathname: personal.route,
    catalog: applicationCatalog,
    applicationViews: registry,
    lifecycleState: "running",
    accessEvidence: evidence,
  });
  assert.equal(accepted.kind, "application-view");
  assert.match(htmlFor(accepted), /Mounted app/);
  assert.equal(mounted, 1);
});

test("R99 transition matches the Personal surface and preserves real failure states", () => {
  const loading = htmlFor({
    kind: "platform-lifecycle-unavailable",
    application: personal,
    lifecycleState: "bootstrapping",
  });
  assert.match(loading, /@keyframes noor-entry-surface/);
  assert.match(loading, /background-color: #0f172a/);
  assert.match(loading, /background-color: #f7f4ee/);
  assert.match(loading, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(loading, /Application unavailable|Access denied/);

  const unavailable = htmlFor({
    kind: "platform-lifecycle-unavailable",
    application: personal,
    lifecycleState: "shutting-down",
  });
  assert.match(unavailable, /Application unavailable/);
  assert.doesNotMatch(unavailable, /noor-entry-screen/);
});

test("R99 welcome headline is consistent across the gateway and loading transition", () => {
  const signIn = renderToStaticMarkup(
    createElement(PlatformShell, {
      state: { kind: "no-application-selected" },
      navigate: () => {},
    }),
  );
  assert.match(signIn, /مرحبا بك في منصة نور/u);
  assert.doesNotMatch(signIn, /<h1 class="glass-title">Noor Platform<\/h1>/u);

  const gateway = renderToStaticMarkup(
    createElement(PlatformShell, {
      state: { kind: "no-application-selected" },
      navigate: () => {},
      authenticationState: "authenticated",
    }),
  );
  assert.match(gateway, /مرحبا بك في منصة نور/u);
  assert.doesNotMatch(gateway, /<h1 class="glass-title">Welcome<\/h1>/u);

  for (const lifecycleState of ["idle", "bootstrapping"] as const) {
    const loading = htmlFor({
      kind: "platform-lifecycle-unavailable",
      application: personal,
      lifecycleState,
    });
    assert.match(loading, /مرحبا بك في منصة نور/u);
    assert.match(loading, /جارٍ تجهيز مساحتك الشخصية/u);
    assert.match(loading, /aria-busy="true"/u);
    assert.doesNotMatch(loading, /Application unavailable|Access denied/u);
  }
});
