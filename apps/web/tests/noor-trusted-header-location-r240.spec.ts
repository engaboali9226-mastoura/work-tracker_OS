import assert from "node:assert/strict";
import test from "node:test";
import {headerLocationForTimeZone} from "../src/noor-personal-application-view.js";
import {loadCurrentTemperature} from "../src/public-weather-client.js";

test("R240 unknown authenticated location does not silently use Riyadh temperature",async()=>{
 const fallback=headerLocationForTimeZone("Asia/Tokyo");
 assert.match(fallback.city,/Tokyo/u);
 assert.equal(Number.isFinite(fallback.latitude),false);
 let requests=0;
 const original=globalThis.fetch;
 Object.defineProperty(globalThis,"fetch",{configurable:true,writable:true,value:async()=>{
   requests++;throw Error("must not request unknown location");
 }});
 try{
   assert.equal(await loadCurrentTemperature(fallback),null);
   assert.equal(requests,0);
 }finally{
   Object.defineProperty(globalThis,"fetch",{configurable:true,writable:true,value:original});
 }
});
test("R240 canonical Riyadh and Cairo fallback stays explicit and valid",()=>{
 for(const zone of ["Asia/Riyadh","Africa/Cairo"]){
   const place=headerLocationForTimeZone(zone);
   assert.ok(Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
 }
});
