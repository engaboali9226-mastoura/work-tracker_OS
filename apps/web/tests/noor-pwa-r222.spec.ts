import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read=(file:string)=>readFileSync(new URL(file,import.meta.url),"utf8");
const manifest=JSON.parse(read("../public/noor.webmanifest"));
const html=read("../index.html");
const worker=read("../public/noor-service-worker.js");
const entry=read("../src/main.tsx");
const host=read("../../../tools/hosting/serve-noor.mjs");

test("R222 PWA has Arabic standalone manifest, root scope and Noor icon",()=>{
 assert.equal(manifest.lang,"ar");
 assert.equal(manifest.dir,"rtl");
 assert.equal(manifest.scope,"/");
 assert.equal(manifest.start_url,"/");
 assert.equal(manifest.display,"standalone");
 assert.ok(manifest.icons.some((x:any)=>x.src==="/noor-app-icon.svg"&&x.type==="image/svg+xml"&&x.sizes==="any"));
 assert.match(html,/rel="manifest" href="\/noor\.webmanifest"/u);
 assert.match(html,/rel="apple-touch-icon"/u);
 assert.match(html,/lang="ar" dir="rtl"/u);
});
test("R222 service worker never caches journals, sessions or API responses",()=>{
 assert.doesNotMatch(worker,/\bcaches\.(?:open|match|delete)\b|indexedDB\.open|localStorage|sessionStorage|backgroundSync|pushManager/iu);
 assert.match(worker,/url\.pathname\.startsWith\("\/api\/"\)/u);
 assert.match(worker,/request\.method!=="GET"/u);
 assert.match(worker,/fetch\(request,\{cache:"no-store"\}\)/u);
 assert.match(worker,/status:503/u);
 assert.match(worker,/يلزم الاتصال بالإنترنت/u);
});
test("R222 registers service worker on production browser only and refreshes code safely",()=>{
 assert.match(entry,/\.env\?\.PROD/u);
 assert.match(entry,/navigator\.serviceWorker\.register\("\/noor-service-worker\.js"/u);
 assert.match(entry,/updateViaCache:"none"/u);
 assert.match(host,/\.webmanifest':'application\/manifest\+json'/u);
 assert.match(host,/pathname==='\/noor-service-worker\.js'/u);
 assert.match(host,/pathname==='\/noor\.webmanifest'/u);
});
