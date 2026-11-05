import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {applicationCatalog} from "@worktracker/core";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {PlatformShell} from "../src/platform-shell.js";

const personal=applicationCatalog.findByKey("noor-personal");
assert.ok(personal);
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const gatewayStyles=readFileSync(new URL("../src/noor-welcome-gateway-r231.css",import.meta.url),"utf8");
const source=readFileSync(new URL("../src/platform-shell.tsx",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.tsx",import.meta.url),"utf8");

function markup(state:Parameters<typeof PlatformShell>[0]["state"],authenticationState="idle"){
 return renderToStaticMarkup(createElement(PlatformShell,{
  state,authenticationState,
  navigate:()=>{},
  signIn:async()=>{},
 }));
}

test("R231 root and /personal auth-required share identical premium Noor login surface",()=>{
 const root=markup({kind:"no-application-selected"});
 const personalEntry=markup({kind:"authentication-required",application:personal,authenticationState:"idle"});
 for(const view of [root,personalEntry]){
  assert.match(view,/class="noor-welcome-gateway-r231"/u);
  assert.match(view,/class="noor-welcome-panel"/u);
  assert.match(view,/src="\/noor-platform-logo\.jpeg"/u);
  assert.match(view,/مرحبا بك في منصة نور/u);
  assert.match(view,/name="email"/u);
  assert.match(view,/name="password"/u);
  assert.match(view,/type="submit"/u);
  assert.doesNotMatch(view,/Sign-in required|class="noor-auth-route-r230"/u);
  assert.doesNotMatch(view,/Noor Personal<\/h1>|<main[^>]+class="np-page"/u);
 }
});

test("R231 sign-in invalid/retry and success gateway retain brand without revealing errors as success",()=>{
 const invalid=markup({kind:"authentication-required",application:personal,authenticationState:"invalid-credentials"});
 assert.match(invalid,/role="alert"/u);
 assert.match(invalid,/غير صحيحة/u);
 assert.match(invalid,/src="\/noor-platform-logo\.jpeg"/u);
 const unavailable=markup({kind:"authentication-required",application:personal,authenticationState:"unavailable"});
 assert.match(unavailable,/تعذر الاتصال بخدمة الدخول/u);
 const waiting=markup({kind:"authentication-required",application:personal,authenticationState:"submitting"});
 assert.match(waiting,/جارٍ تسجيل الدخول/u);
 assert.match(waiting,/disabled=""/u);
 const authorizedHome=markup({kind:"no-application-selected"},"authenticated");
 assert.match(authorizedHome,/href="\/personal"/u);
 assert.match(authorizedHome,/نور الشخصي/u);
 assert.doesNotMatch(authorizedHome,/name="password"/u);
 // A stale client "authenticated" flag MUST NOT bypass the direct-route gate.
 const stale=markup({kind:"authentication-required",application:personal,authenticationState:"authenticated"},"authenticated");
 assert.match(stale,/name="password"/u);
});

test("R231 protected access errors remain truthful but use branded styling",()=>{
 for(const state of [
  {kind:"session-access-unavailable",application:personal} as const,
  {kind:"authorization-denied",application:personal} as const,
  {kind:"platform-failed-closed",application:personal} as const,
 ]){
  const view=markup(state);
  assert.match(view,/class="noor-route-state-r231"/u);
  assert.doesNotMatch(view,/class="noor-welcome-form"/u);
  assert.doesNotMatch(view,/class="np-page"/u);
 }
});

test("R231 first-paint refresh is branded before React even on a deep link",()=>{
 assert.match(html,/#root:empty::before/u);
 assert.match(html,/#root:empty::after/u);
 assert.match(html,/\/noor-platform-logo\.jpeg/u);
 assert.match(html,/مرحبا بك في منصة نور/u);
 assert.match(html,/background: #f7f5ef/u);
 assert.match(main,/import "\.\/noor-welcome-gateway-r231\.css";/u);
 assert.match(source,/case "authentication-required":/u);
 assert.doesNotMatch(source,/Sign-in required|Sign in is required before this application/u);
 assert.match(gatewayStyles,/backdrop-filter: blur/u);
 assert.match(gatewayStyles,/color: #263b45/u);
 assert.match(gatewayStyles,/\.noor-welcome-field input:focus-visible/u);
 assert.match(gatewayStyles,/font-size: 16px/u);
 assert.match(gatewayStyles,/prefers-reduced-motion: reduce/u);
 assert.doesNotMatch(gatewayStyles,/user-scalable\s*:\s*no|maximum-scale\s*=\s*1/iu);
});
