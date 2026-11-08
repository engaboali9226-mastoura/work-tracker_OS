/* NOOR R278: bounded network-first navigation and automatic recovery.
 * Never cache private data, access tokens, sessions, documents, or API responses.
 * Serverless/PWA navigation failure must not become an indefinite blank page.
 */
self.addEventListener("install",()=>{void self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim());});

const NAVIGATION_TIMEOUT_MS=12000;
const OFFLINE="<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#21384b\"><title>نور — إعادة الاتصال</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f8f5ee;color:#21384b;font-family:system-ui,-apple-system,sans-serif;text-align:center}.panel{max-width:540px;padding:32px 24px}h1{font-size:36px;margin:0 0 26px}p{font-size:18px;line-height:1.8}small{color:#64716c;display:block;line-height:1.8}button{margin:18px 0;padding:13px 24px;border:0;border-radius:12px;background:#234840;color:#fff;font-size:17px;cursor:pointer}</style></head><body><main class=\"panel\"><h1>نور</h1><p>جارٍ استعادة الاتصال بمنصة نور. ستفتح تلقائيًا بمجرد جاهزية الخادم.</p><p id=\"noor-connection-status\" role=\"status\" aria-live=\"polite\">جارٍ المحاولة…</p><button type=\"button\" id=\"noor-retry\">إعادة المحاولة الآن</button><small>لم تُخزّن هذه الصفحة بيانات شخصية أو جلسات مستخدمين.</small></main><script>(function(){var attempts=0,busy=false,pending=null;var status=document.getElementById(\"noor-connection-status\");var button=document.getElementById(\"noor-retry\");function schedule(){if(pending!==null)clearTimeout(pending);var delay=Math.min(30000,6000+attempts*2500);pending=setTimeout(probe,delay)}async function probe(){if(busy)return;busy=true;pending=null;attempts++;status.textContent=\"جارٍ التحقق من جاهزية نور — المحاولة \"+attempts+\"…\";var controller=new AbortController();var timer=setTimeout(function(){controller.abort()},12000);try{var response=await fetch(\"/\",{cache:\"no-store\",credentials:\"omit\",headers:{\"Accept\":\"text/html\"},signal:controller.signal});var type=response.headers.get(\"content-type\")||\"\";if(response.status===200&&type.indexOf(\"text/html\")!==-1){status.textContent=\"عاد الاتصال. جارٍ فتح نور…\";window.location.reload();return}}catch(error){}finally{clearTimeout(timer);busy=false}status.textContent=\"الخادم لم يستجب بعد؛ ستُعاد المحاولة تلقائيًا.\";schedule()}function retry(){if(busy)return;if(pending!==null)clearTimeout(pending);pending=null;probe()}button.addEventListener(\"click\",retry);window.addEventListener(\"online\",retry);document.addEventListener(\"visibilitychange\",function(){if(!document.hidden)retry()});setTimeout(probe,1500)})();</script></body></html>";
function offlineResponse(){
  return new Response(OFFLINE,{status:503,headers:{
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer",
  }});
}
self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);
  // All sensitive APIs and cross-origin resources are never intercepted.
  if(url.origin!==self.location.origin || request.method!=="GET" ||
     url.pathname==="/healthz" || url.pathname==="/readyz" ||
     url.pathname==="/api" || url.pathname.startsWith("/api/") ||
     url.pathname.startsWith("/auth/") || url.pathname.startsWith("/functions/"))return;
  if(request.mode!=="navigate")return;
  event.respondWith((async()=>{
    const controller=new AbortController();
    const abort=()=>controller.abort();
    const timer=setTimeout(abort,NAVIGATION_TIMEOUT_MS);
    request.signal?.addEventListener("abort",abort,{once:true});
    try{
      const response=await fetch(request,{cache:"no-store",signal:controller.signal});
      return [502,503,504].includes(response.status)?offlineResponse():response;
    }catch{return offlineResponse();}
    finally{
      clearTimeout(timer);
      request.signal?.removeEventListener("abort",abort);
    }
  })());
});
