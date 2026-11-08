/* NOOR R275: network-first PWA navigation recovery.
 * No browser-side persistence, background sync, tokens, private journals, or
 * cross-origin requests. A transient host cold start never requires a deploy.
 */
self.addEventListener("install",()=>{void self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim());});

// This document contains only static, nonpersonal content. Retrying /healthz
// bypasses this worker (not a navigation) and never touches user records.
const OFFLINE=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#21384b"><title>نور — إعادة الاتصال</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f8f5ee;color:#21384b;font-family:system-ui,-apple-system,sans-serif;text-align:center}.panel{max-width:540px;padding:32px 24px}h1{font-size:36px;margin:0 0 26px}p{font-size:19px;line-height:1.85}small{color:#64716c;display:block;line-height:1.8}button{margin:20px 0;padding:13px 24px;border:0;border-radius:12px;background:#234840;color:white;font-size:17px;cursor:pointer}</style></head><body><main class="panel"><h1>نور</h1><p>تعذر الاتصال بالخادم حاليًا. ستُعاد المحاولة تلقائيًا، وستفتح المنصة عندما يعود الاتصال.</p><p id="noor-connection-status" role="status" aria-live="polite">جارٍ التحقق من الاتصال…</p><button type="button" id="noor-retry">إعادة المحاولة الآن</button><small>هذه صفحة مؤقتة لا تعرض أو تخزن أي تدوينات أو جلسات خاصة.</small></main><script>(function(){var attempts=0,busy=false,limit=12;var label=document.getElementById('noor-connection-status');var button=document.getElementById('noor-retry');async function check(){if(busy)return;busy=true;attempts++;label.textContent='محاولة إعادة الاتصال ('+attempts+' من '+limit+')…';var controller=new AbortController();var timeout=setTimeout(function(){controller.abort()},9000);try{var response=await fetch('/healthz',{cache:'no-store',credentials:'omit',signal:controller.signal});if(response.ok&&(await response.text()).trim()==='ok'){label.textContent='عاد الاتصال. جارٍ فتح نور…';location.reload();return}}catch(e){}finally{clearTimeout(timeout);busy=false}if(attempts<limit){label.textContent='الخادم لم يستجب بعد؛ ستُعاد المحاولة تلقائيًا.';setTimeout(check,12000)}else{label.textContent='تعذّر الاتصال. تحقق من الشبكة ثم اضغط إعادة المحاولة.'}}button.addEventListener('click',function(){if(busy)return;attempts=0;check()});window.addEventListener('online',function(){if(!busy){attempts=0;check()}});setTimeout(check,3500)})();</script></body></html>`;
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
  // Never intercept health probes, API, Auth, Supabase, or cross-origin calls.
  if(url.origin!==self.location.origin || request.method!=="GET" ||
     url.pathname==="/healthz" ||
     url.pathname==="/api" || url.pathname.startsWith("/api/") ||
     url.pathname.startsWith("/auth/") || url.pathname.startsWith("/functions/"))return;
  if(request.mode!=="navigate")return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request,{cache:"no-store"});
      return [502,503,504].includes(response.status)?offlineResponse():response;
    }catch{return offlineResponse();}
  })());
});
