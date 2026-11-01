import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { applicationCatalog } from "@worktracker/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlatformShell } from "../src/platform-shell.js";
import { NoorPersonalApplicationView } from "../src/noor-personal-application-view.js";

const personal = applicationCatalog.findByKey("noor-personal");
assert.ok(personal);
const entry = renderToStaticMarkup(createElement(PlatformShell, {
  state: { kind: "platform-lifecycle-unavailable", application: personal, lifecycleState: "bootstrapping" },
  navigate: () => {},
}));
const waiting = renderToStaticMarkup(createElement(NoorPersonalApplicationView, {
  initialResult: null,
  initialWorkspace: null,
}));
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

for (const [label, markup] of [["route", entry], ["Personal", waiting]] as const) {
  test(`R101 ${label} waits with the ORIGINAL Noor logo before welcome and status`, () => {
    assert.match(markup, /src="\/noor-platform-logo\.jpeg"/u);
    assert.match(markup, /alt="شعار نور"/u);
    assert.match(markup, /decoding="sync"/u);
    assert.match(markup, /loading="eager"/u);
    assert.match(markup, /مرحبا بك في منصة نور/u);
    assert.match(markup, /جارٍ تجهيز مساحتك الشخصية/u);
    assert.ok(markup.indexOf("/noor-platform-logo.jpeg") < markup.indexOf("مرحبا بك في منصة نور"));
    assert.match(markup, /aria-busy="true"/u);
  });
}
test("R101 logo is preloaded by the application HTML before module startup", () => {
  assert.match(html, /rel="preload" as="image" type="image\/jpeg" href="\/noor-platform-logo\.jpeg"/u);
  assert.ok(html.indexOf('rel="preload"') < html.indexOf('src="/src/main.tsx"'));
});
test("R101 subsequent Personal loading does not replay entrance animation", () => {
  assert.match(waiting, /R101: do not restart the entrance animation/u);
  assert.match(waiting, /np-entry-loading-content/u);
  assert.match(waiting, /animation:none/u);
  assert.match(entry, /noor-entry-logo/u);
  assert.ok(entry.indexOf("/noor-platform-logo.jpeg") < entry.indexOf('class="noor-entry-title"'));
});
test("R101 retains real failed states instead of masking them as loading", () => {
  const failed = renderToStaticMarkup(createElement(PlatformShell, {
    state: { kind: "platform-lifecycle-unavailable", application: personal, lifecycleState: "shutting-down" },
    navigate: () => {},
  }));
  const unavailable = renderToStaticMarkup(createElement(NoorPersonalApplicationView, {
    initialResult: { kind: "unavailable" },
    initialWorkspace: null,
  }));
  assert.match(failed, /Application unavailable/u);
  assert.match(unavailable, /الخدمة غير متاحة/u);
  assert.doesNotMatch(failed, /noor-entry-logo/u);
  assert.doesNotMatch(unavailable, /noor-personal-initial-loading-r100/u);
});
