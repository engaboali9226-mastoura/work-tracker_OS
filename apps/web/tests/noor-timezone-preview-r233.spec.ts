import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NoorR232ControlLocation} from "../src/noor-time-location-control-r232.js";
import {NOOR_R232_DEFAULT} from "../src/noor-time-display-preferences-r232.js";
import {r232DailyWindows} from "../src/noor-islamic-daylight-r232.js";

test("R233 manual IANA zone previews the chosen local clock without changing Noor server zone",()=>{
 const make=(displayZone:string|null)=>renderToStaticMarkup(createElement(NoorR232ControlLocation,{
  serverZone:"Asia/Riyadh",
  preferences:{...NOOR_R232_DEFAULT,displayZone},
  onChange:()=>{},
 }));
 const riyadh=make(null),cairo=make("Africa/Cairo");
 assert.match(riyadh,/المنطقة الزمنية المعتمدة للحسابات/u);
 assert.match(riyadh,/value="Asia\/Riyadh"/u);
 assert.match(cairo,/aria-label="منطقة زمنية للعرض"/u);
 assert.match(cairo,/value="Africa\/Cairo"/u);
 assert.match(cairo,/معاينة الساعة في المنطقة الزمنية المختارة/u);
 assert.match(cairo,/مواقيت الصلاة واليوم الشخصي لا يتغيران/u);
 assert.match(cairo,/GPS/u);
 assert.match(cairo,/البحث عن المدينة والمنطقة الزمنية/u);
 assert.doesNotMatch(cairo,/SUPABASE_SERVICE_ROLE_KEY|sessionStorage|localStorage/u);
});
test("R233 preference remains session-only and cannot override trusted prayer schedule",()=>{
 const source=readFileSync(new URL("../src/noor-time-display-preferences-r232.ts",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/noor-time-location-control-r232.tsx",import.meta.url),"utf8");
 assert.deepEqual(NOOR_R232_DEFAULT.selectedCity,null);
 assert.deepEqual(NOOR_R232_DEFAULT.displayZone,null);
 assert.match(source,/saveNoorR232Preferences/u);
 assert.match(source,/Intentionally no-op until an audited authenticated preference endpoint/u);
 assert.match(ui,/selectedCity:city,displayZone:city\.timeZone/u);
 assert.match(ui,/navigator\.geolocation\.getCurrentPosition/u);
 assert.match(ui,/credentials:"omit"/u);
 assert.match(ui,/onBlur=\{\(\)=>commitZone\(zoneInput\)\}/u);
});
test("R233 incoherent prayer instants are rejected, unavailable tomorrow Fajr is not synthesized",()=>{
 const p=[
  {key:"fajr",at:"2026-11-06T02:30:00Z"},
  {key:"sunrise",at:"2026-11-06T04:00:00Z"},
  {key:"dhuhr",at:"2026-11-06T08:30:00Z"},
  {key:"maghrib",at:"2026-11-06T14:00:00Z"},
 ];
 const good=r232DailyWindows(p);
 assert.ok(good.fastingDay);
 assert.ok(good.duha);
 assert.equal(good.islamicNight,null);
 const invalid=r232DailyWindows(p.map(item=>item.key==="sunrise"
   ?{...item,at:"2026-11-06T01:30:00Z"}:item));
 assert.equal(invalid.fastingDay,null);
 assert.equal(invalid.duha,null);
 assert.ok(r232DailyWindows(p,"2026-11-07T02:31:00Z").islamicNight);
});
