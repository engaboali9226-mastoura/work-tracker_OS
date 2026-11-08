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
 for (const size of [192,512]) assert.ok(manifest.icons.some((x:any)=>x.src===`/noor-icon-transparent-r224-${size}.png`&&x.type==="image/png"&&x.sizes===`${size}x${size}`));
 assert.match(html,/rel="apple-touch-icon" sizes="180x180" href="\/noor-apple-touch-expanded-r230\.png"/u);
 assert.match(html,/rel="manifest" href="\/noor\.webmanifest"/u);
 assert.match(html,/rel="apple-touch-icon"/u);
 assert.match(html,/lang="ar" dir="rtl"/u);
});
test("R222 service worker never caches journals, sessions or API responses",()=>{
 assert.doesNotMatch(worker,/\bcaches\.(?:open|match|delete)\b|indexedDB\.open|localStorage|sessionStorage|backgroundSync|pushManager/iu);
 assert.match(worker,/url\.pathname\.startsWith\("\/api\/"\)/u);
 assert.match(worker,/request\.method!=="GET"/u);
 assert.match(worker,/NAVIGATION_TIMEOUT_MS=12000/u);
 assert.match(worker,/status:503/u);
 assert.match(worker,/استعادة الاتصال بمنصة نور/u);
});
test("R222 registers service worker on production browser only and refreshes code safely",()=>{
 assert.match(entry,/\.env\?\.PROD/u);
 assert.match(entry,/navigator\.serviceWorker\.register\("\/noor-service-worker\.js"/u);
 assert.match(entry,/updateViaCache:"none"/u);
 assert.match(host,/\.webmanifest':'application\/manifest\+json'/u);
 assert.match(host,/pathname==='\/noor-service-worker\.js'/u);
 assert.match(host,/pathname==='\/noor\.webmanifest'/u);
});

test("R275 offline PWA retries only a public health probe and never caches private data",()=>{
 assert.match(worker,/url\.pathname==="\/healthz"/u);
 assert.match(worker,/credentials:/u);
 assert.match(worker,/window\.location\.reload/u);
 assert.match(worker,/\[502,503,504\]\.includes\(response\.status\)/u);
 assert.match(worker,/noor-retry/u);
 assert.match(worker,/window\.location\.reload/u);
 assert.doesNotMatch(worker,/caches\.open|caches\.put|indexedDB|localStorage|sessionStorage/u);
});
