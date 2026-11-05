import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232TimeWindows} from "../src/noor-time-windows-r232.js";
import {NoorR232ControlLocation} from "../src/noor-time-location-control-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

test("R238 unified prayer-width strip is ordered day then Duha then night",()=>{
  const html=renderToStaticMarkup(createElement(NoorR232TimeWindows,{
    prayers:[
      {key:"fajr",at:"2026-11-06T02:45:00Z"},
      {key:"sunrise",at:"2026-11-06T03:55:00Z"},
      {key:"dhuhr",at:"2026-11-06T08:35:00Z"},
      {key:"maghrib",at:"2026-11-06T14:05:00Z"},
    ],
    nowMs:Date.parse("2026-11-05T08:00:00Z"),
    timeZone:"Asia/Riyadh",
    nextFajrAt:"2026-11-07T02:46:00Z",
    preferences:NOOR_R232_DEFAULT,
  }));
  const day=html.indexOf("ساعات النهار"),duha=html.indexOf("وقت صلاة الضحى"),
    night=html.indexOf("ساعات الليل الشرعي");
  assert.ok(day>=0 && day<duha && duha<night);
  assert.match(html,/np-r238-time-order/u);
  assert.equal((html.match(/data-testid="noor-day-night-friday-r232"/gu)||[]).length,1);
  const css=readFileSync(new URL("../src/noor-time-windows-r232.css",import.meta.url),"utf8");
  assert.match(css,/\.np-r232-section:has\(\.np-r238-time-order\)/u);
  assert.match(css,/max-width: 100%/u);
  assert.match(css,/direction: rtl/u);
});
test("R238 timezone previews local date and offers quick presets without changing trusted prayer authority",()=>{
  const html=renderToStaticMarkup(createElement(NoorR232ControlLocation,{
    serverZone:"Asia/Riyadh",preferences:NOOR_R232_DEFAULT,onChange:()=>{},
  }));
  assert.match(html,/اختيار سريع للمنطقة الزمنية/u);
  assert.match(html,/استعادة توقيت الحساب/u);
  assert.match(html,/Africa\/Cairo/u);
  assert.match(html,/Asia\/Dubai/u);
  assert.match(html,/المنطقة الزمنية المعتمدة للحسابات/u);
  assert.match(html,/لا يتغيران/u);
  assert.match(html,/تحديد عبر GPS/u);
  const source=readFileSync(new URL("../src/noor-time-location-control-r232.tsx",import.meta.url),"utf8");
  assert.match(source,/lastSearch\.current\+\+/u);
  assert.match(source,/selectedCity:preparedCity/u);
  assert.match(source,/credentials:"omit"/u);
});
