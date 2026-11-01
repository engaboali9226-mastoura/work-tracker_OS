import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { applicationCatalog } from "@worktracker/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlatformShell } from "../src/platform-shell.js";
import { NoorPersonalApplicationView } from "../src/noor-personal-application-view.js";

const entry = applicationCatalog.findByKey("noor-personal");
assert.ok(entry);
const route = renderToStaticMarkup(createElement(PlatformShell, {
  state: { kind: "platform-lifecycle-unavailable", application: entry, lifecycleState: "bootstrapping" },
  navigate: () => {},
}));
const personal = renderToStaticMarkup(createElement(NoorPersonalApplicationView, {
  initialResult: null, initialWorkspace: null,
}));
const marker = /\/\* NOOR_R102_UNIFIED_LOADING_GEOMETRY_BEGIN \*\/([\s\S]*?)\/\* NOOR_R102_UNIFIED_LOADING_GEOMETRY_END \*\//gu;
function sharedCss(html: string) {
  const all = [...html.matchAll(marker)];
  assert.equal(all.length, 1, "exactly one canonical loading geometry stylesheet");
  return all[0]![1]!;
}

test("R102 route and Personal use byte-identical loading-stage geometry", () => {
  const a = sharedCss(route);
  const b = sharedCss(personal);
  assert.equal(a, b);
  assert.match(a, /position: fixed;/u);
  assert.match(a, /inset: 0;/u);
  assert.match(a, /height: 100dvh;/u);
  assert.match(a, /place-items: center;/u);
  assert.match(a, /max-width: 320px;/u);
  assert.match(a, /opacity: 1;/u);
  assert.match(a, /transform: none;/u);
  assert.match(a, /animation: none;/u);
  for (const selector of [".noor-entry-logo", ".np-page .np-entry-loading-logo",
    ".noor-entry-title", ".np-page .np-entry-loading-title",
    ".noor-entry-ring", ".np-page .np-entry-loading-spinner"]) {
    assert.ok(a.includes(selector), `missing ${selector}`);
  }
});

test("R102 same original logo, heading and detail appear in both phases", () => {
  for (const html of [route, personal]) {
    assert.match(html, /src="\/noor-platform-logo\.jpeg"/u);
    assert.match(html, /مرحبا بك في منصة نور/u);
    assert.match(html, /جارٍ تجهيز مساحتك الشخصية/u);
    assert.match(html, /aria-busy="true"/u);
    assert.doesNotMatch(html, /جاري التحميل|Application unavailable/u);
  }
  assert.match(route, /noor-entry-screen/u);
  assert.match(personal, /np-entry-loading/u);
});

test("R102 real error states remain errors (no fake loading)", () => {
  const failure = renderToStaticMarkup(createElement(PlatformShell, {
    state: { kind: "platform-lifecycle-unavailable", application: entry, lifecycleState: "shutting-down" },
    navigate: () => {},
  }));
  const unavailable = renderToStaticMarkup(createElement(NoorPersonalApplicationView, {
    initialResult: { kind: "unavailable" }, initialWorkspace: null,
  }));
  assert.match(failure, /Application unavailable/u);
  assert.match(unavailable, /الخدمة غير متاحة/u);
  assert.doesNotMatch(failure, /NOOR_R102_UNIFIED_LOADING_GEOMETRY_BEGIN/u);
  assert.doesNotMatch(unavailable, /class="np-page np-page-entry-loading"/u);
});

test("R102 same preloaded original image remains the sole shared logo asset", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /rel="preload" as="image" type="image\/jpeg" href="\/noor-platform-logo\.jpeg"/u);
});
