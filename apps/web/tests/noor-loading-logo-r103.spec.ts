import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { applicationCatalog } from "@worktracker/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlatformShell } from "../src/platform-shell.js";
import { NoorPersonalApplicationView } from "../src/noor-personal-application-view.js";

const app = applicationCatalog.findByKey("noor-personal");
assert.ok(app);
const route = renderToStaticMarkup(createElement(PlatformShell, {
  state: { kind: "platform-lifecycle-unavailable", application: app, lifecycleState: "bootstrapping" },
  navigate: () => {},
}));
const personal = renderToStaticMarkup(createElement(NoorPersonalApplicationView, {
  initialResult: null, initialWorkspace: null,
}));
const block = /\/\* NOOR_R102_UNIFIED_LOADING_GEOMETRY_BEGIN \*\/([\s\S]*?)\/\* NOOR_R102_UNIFIED_LOADING_GEOMETRY_END \*\//gu;
const logoRule = /\.noor-entry-logo,\s*\.np-page \.np-entry-loading-logo\s*\{([^}]+)\}/u;

function css(html: string) {
  const matches = [...html.matchAll(block)];
  assert.equal(matches.length, 1);
  return matches[0]![1]!;
}

test("R103 logo is visibly larger and exactly aligned in both loading states", () => {
  const routeCss = css(route);
  const personalCss = css(personal);
  assert.equal(routeCss, personalCss, "shared CSS must be byte-identical");
  const match = logoRule.exec(routeCss);
  assert.ok(match, "shared original logo selector required");
  const rule = match[1]!;
  assert.match(rule, /width: 88px;/u);
  assert.match(rule, /height: 88px;/u);
  assert.match(rule, /flex: 0 0 88px;/u);
  assert.doesNotMatch(rule, /\b66px\b/u);
  assert.match(rule, /object-fit: cover;/u);
  assert.match(routeCss, /place-items: center;/u);
  assert.match(routeCss, /animation: none;/u);
});

test("R103 original Noor image, accessibility and welcome copy are intact", () => {
  for (const html of [route, personal]) {
    assert.match(html, /src="\/noor-platform-logo\.jpeg"/u);
    assert.match(html, /alt="شعار نور"/u);
    assert.match(html, /مرحبا بك في منصة نور/u);
    assert.match(html, /جارٍ تجهيز مساحتك الشخصية/u);
    assert.match(html, /aria-busy="true"/u);
  }
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(index, /rel="preload" as="image" type="image\/jpeg" href="\/noor-platform-logo\.jpeg"/u);
});
