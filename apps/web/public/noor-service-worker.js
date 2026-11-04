/* NOOR R222 installability worker. Network-first; NEVER cache personal data.
 * There is intentionally no Cache Storage, IndexedDB, background sync, or
 * push workflow. Authentication and journal APIs are always handled by the
 * live backend only. An offline visit receives a generic, nonpersonal page.
 */
self.addEventListener("install",()=>{void self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim());});
const OFFLINE='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#21384b"><title>نور — غير متصل</title><body style="font-family:system-ui;background:#f8f5ee;color:#21384b;margin:0;padding:2.5rem;text-align:center"><h1>نور</h1><p>يلزم الاتصال بالإنترنت للوصول إلى بياناتك بأمان.</p><p>لم تُخزَّن أي تدوينات أو جلسات خاصة على الجهاز.</p></body></html>';
self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);
  // Strict bypass for API, authentication, Supabase and cross-origin traffic.
  if(url.origin!==self.location.origin || request.method!=="GET" ||
      url.pathname==="/api" || url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/auth/") || url.pathname.startsWith("/functions/"))return;
  if(request.mode!=="navigate")return;
  event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>
    new Response(OFFLINE,{status:503,headers:{
      "Content-Type":"text/html; charset=utf-8",
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff"
    }})
  ));
});
