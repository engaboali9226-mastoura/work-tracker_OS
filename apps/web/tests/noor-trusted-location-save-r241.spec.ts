import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232ControlLocation} from "../src/noor-time-location-control-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";

test("R241 city selection stays a preview until explicit authenticated account save",()=>{
  const selectedCity={name:"القاهرة",country:"مصر",latitude:30.0444,longitude:31.2357,timeZone:"Africa/Cairo"};
  const html=renderToStaticMarkup(createElement(NoorR232ControlLocation,{
    serverZone:"Asia/Riyadh",
    preferences:{...NOOR_R232_DEFAULT,selectedCity,displayZone:"Africa/Cairo"},
    onChange:()=>{},
    onCommit:async()=>true,
  }));
  assert.match(html,/اعتماد المدينة والتوقيت للحساب/u);
  assert.match(html,/القاهرة/u);
  assert.match(html,/Africa\/Cairo/u);
  assert.match(html,/تُرفض بأمان/u);
  assert.match(html,/يؤكد الخادم الحفظ/u);
  assert.match(html,/value="Asia\/Riyadh"/u);
});
test("R241 without authorized commit route cannot submit the city",()=>{
  const selectedCity={name:"الرياض",country:"السعودية",latitude:24.71,longitude:46.67,timeZone:"Asia/Riyadh"};
  const html=renderToStaticMarkup(createElement(NoorR232ControlLocation,{
    serverZone:"Asia/Riyadh",
    preferences:{...NOOR_R232_DEFAULT,selectedCity},
    onChange:()=>{},
  }));
  assert.match(html,/اعتماد المدينة والتوقيت للحساب/u);
  assert.match(html,/disabled=""/u);
});
