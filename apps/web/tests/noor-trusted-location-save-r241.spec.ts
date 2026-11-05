import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232ControlLocation,noorCityWithManualZone} from "../src/noor-time-location-control-r232.js";
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

test("R244 prepares an explicit manual IANA timezone with the selected city centroid",()=>{
  const selectedCity={name:"القاهرة",country:"مصر",latitude:30.0444,longitude:31.2357,timeZone:"Africa/Cairo"};
  const prepared=noorCityWithManualZone(selectedCity,"Asia/Riyadh");
  assert.deepEqual(prepared,{...selectedCity,timeZone:"Asia/Riyadh"});
  assert.equal(noorCityWithManualZone(null,"Asia/Riyadh"),null);
  assert.equal(noorCityWithManualZone(selectedCity,"Mars/Olympus_Mons"),null);
  assert.equal(selectedCity.timeZone,"Africa/Cairo"); // never mutates selection
});
test("R244 still requires explicit authenticated city commit; manual zone is not persisted on preview",()=>{
  const city={name:"القاهرة",country:"مصر",latitude:30.0444,longitude:31.2357,timeZone:"Africa/Cairo"};
  const prepared=noorCityWithManualZone(city,"Asia/Dubai");
  const html=renderToStaticMarkup(createElement(NoorR232ControlLocation,{
    serverZone:"Africa/Cairo",
    preferences:{...NOOR_R232_DEFAULT,selectedCity:prepared,displayZone:"Asia/Dubai"},
    onChange:()=>{},onCommit:async()=>true,
  }));
  assert.match(html,/المنطقة الزمنية \(معاينة، ثم اعتماد مع المدينة\)/u);
  assert.match(html,/اعتماد المدينة والتوقيت للحساب/u);
  assert.match(html,/يمكنك تعديل منطقة IANA الزمنية يدويًا/u);
  assert.match(html,/value="Africa\/Cairo"/u);
  assert.match(html,/Asia\/Dubai/u);
});
