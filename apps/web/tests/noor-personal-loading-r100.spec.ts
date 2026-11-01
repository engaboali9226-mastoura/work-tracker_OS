import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NoorPersonalApplicationView } from "../src/noor-personal-application-view.js";

function renderPersonal(initialResult: null | { kind: "unavailable" } | { kind: "setup-required" }) {
  return renderToStaticMarkup(
    createElement(NoorPersonalApplicationView, { initialResult, initialWorkspace: null }),
  );
}

test("R100 initial Personal load is a full-page quiet welcome, not a top card", () => {
  const html = renderPersonal(null);
  assert.match(html, /noor-personal-initial-loading-r100/u);
  assert.match(html, /np-page-entry-loading/u);
  assert.match(html, /np-entry-loading-content/u);
  assert.match(html, /مرحبا بك في منصة نور/u);
  assert.match(html, /جارٍ تجهيز مساحتك الشخصية/u);
  assert.match(html, /role="status"/u);
  assert.match(html, /aria-live="polite"/u);
  assert.match(html, /aria-busy="true"/u);
  assert.match(html, /src="\/noor-platform-logo.jpeg"/u);
  assert.match(html, /np-entry-loading-spinner/u);
  assert.match(html, /background:#f7f4ee/u);
  assert.match(html, /min-height:100dvh/u);
  assert.match(html, /prefers-reduced-motion:reduce/u);
  assert.doesNotMatch(html, /np-card np-date-card|جاري التحميل|الخدمة غير متاحة/u);
});

test("R100 actual service failure remains visible and is not disguised as loading", () => {
  const html = renderPersonal({ kind: "unavailable" });
  assert.match(html, /الخدمة غير متاحة/u);
  assert.match(html, /تعذر تحميل بيانات نور حاليًا/u);
  assert.doesNotMatch(html, /data-testid="noor-personal-initial-loading-r100"/u);
  assert.doesNotMatch(html, /class="np-page np-page-entry-loading"/u);
});

test("R100 setup-required keeps the existing actionable setup message", () => {
  const html = renderPersonal({ kind: "setup-required" });
  assert.match(html, /الإعداد مطلوب/u);
  assert.match(html, /يلزم استكمال إعداد الموقع/u);
  assert.doesNotMatch(html, /data-testid="noor-personal-initial-loading-r100"/u);
});
