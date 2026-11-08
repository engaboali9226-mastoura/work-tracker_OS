import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};
// Synthetic startup page is public, stateless, and never includes personal data.
const STARTING_DOCUMENT="<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>نور — جارٍ التجهيز</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f8f5ee;color:#21384b;min-height:100dvh;margin:0;display:grid;place-items:center;text-align:center}.panel{padding:24px;max-width:500px}h1{font-size:36px}p{font-size:18px;line-height:1.8}</style></head><body><main class=\"panel\"><h1>نور</h1><p>جارٍ تجهيز منصة نور. ستفتح تلقائيًا فور جاهزيتها.</p><p id=\"status\" role=\"status\" aria-live=\"polite\">جارٍ التحقق من الاتصال…</p><button id=\"retry\" type=\"button\">إعادة المحاولة الآن</button></main><script>(function(){var active=false,attempts=0,next=null;var status=document.getElementById(\"status\");async function probe(){if(active)return;active=true;attempts++;var controller=new AbortController();var timer=setTimeout(function(){controller.abort()},9000);try{var r=await fetch(\"/readyz\",{cache:\"no-store\",credentials:\"omit\",signal:controller.signal});if(r.ok){status.textContent=\"نور جاهزة. جارٍ فتحها…\";location.reload();return}}catch(e){}finally{active=false;clearTimeout(timer)}status.textContent=\"الخادم قيد التجهيز. ستُعاد المحاولة تلقائيًا.\";next=setTimeout(probe,Math.min(30000,5000+attempts*2000))}function retry(){if(active)return;if(next)clearTimeout(next);probe()}document.getElementById(\"retry\").addEventListener(\"click\",retry);window.addEventListener(\"online\",retry);document.addEventListener(\"visibilitychange\",function(){if(!document.hidden)retry()});setTimeout(probe,1200)})();</script></body></html>";
const HOP=new Set(['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade']);
function forwarded(headers){
 const omitted=new Set([...HOP,...String(headers.connection??'').split(',').map(v=>v.trim().toLowerCase())]);
 return Object.fromEntries(Object.entries(headers).filter(([key])=>!omitted.has(key.toLowerCase())));
}
function reply(res,status,text,method='GET'){
 res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(method==='HEAD'?undefined:text);
}
export function validatePublicBuildEnvironment(env){
 const url=new URL(env.VITE_NOOR_SUPABASE_URL??'');
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('PUBLIC_CONFIGURATION_INVALID');
 const key=env.VITE_NOOR_SUPABASE_PUBLISHABLE_KEY;let role;
 try{role=JSON.parse(Buffer.from(String(key).split('.')[1]??'','base64url').toString()).role;}catch{}
 if(typeof key!=='string'||/\s/.test(key)||!(key.startsWith('sb_publishable_')||role==='anon'))throw Error('PUBLIC_CONFIGURATION_INVALID');
 if(env.SUPABASE_URL&&new URL(env.SUPABASE_URL).origin!==url.origin)throw Error('AUTH_PROJECT_MISMATCH');
}

// Authentication, authorization, commands and persistence remain owned by the
// existing runtime. This transport serves build files and streams API traffic.
export async function createHostedWebServer({staticDirectory,apiOrigin,publicOrigin,isReady=()=>true}){
 const api=new URL(apiOrigin),origin=new URL(publicOrigin);
 if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('PUBLIC_ORIGIN_INVALID');
 if(api.protocol!=='http:'||api.hostname!=='127.0.0.1'||api.username||api.password||api.pathname!=='/'||api.search||api.hash)throw Error('INTERNAL_API_ORIGIN_INVALID');
 const root=await realpath(staticDirectory),agent=new http.Agent({keepAlive:true,maxSockets:16});
 const server=http.createServer(async(req,res)=>{
  try{
   if(!req.url?.startsWith('/')||req.url.startsWith('//'))return reply(res,400,'Invalid request.',req.method);
   const url=new URL(req.url,origin);
   if(url.pathname==='/healthz')return reply(res,['GET','HEAD'].includes(req.method)?200:405,'ok',req.method);
   if(url.pathname==='/readyz'){
    if(!['GET','HEAD'].includes(req.method))return reply(res,405,'Method not allowed.',req.method);
    return reply(res,isReady()?200:503,isReady()?'ready':'starting',req.method);
   }
   if(url.pathname==='/api/noor'||url.pathname.startsWith('/api/noor/')){
    // Never forward a protected request until its real runtime has started.
    if(!isReady())return reply(res,503,'Service temporarily unavailable.',req.method);
    const upstream=http.request({hostname:api.hostname,port:api.port,method:req.method,path:req.url,headers:{...forwarded(req.headers),host:origin.host},agent},incoming=>{
     res.writeHead(incoming.statusCode??502,forwarded(incoming.headers));incoming.on('error',()=>res.destroy());incoming.pipe(res);
    });
    upstream.setTimeout(30000,()=>upstream.destroy(Error('UPSTREAM_TIMEOUT')));
    upstream.once('error',()=>{if(res.destroyed)return;if(res.headersSent)res.destroy();else reply(res,503,'Service temporarily unavailable.',req.method);});
    req.once('aborted',()=>upstream.destroy());res.once('close',()=>{if(!res.writableEnded)upstream.destroy();});req.pipe(upstream);return;
   }
   if(!['GET','HEAD'].includes(req.method))return reply(res,405,'Method not allowed.',req.method);
   // Permit the listener to bind promptly while auth/DB bootstraps. A visitor
   // receives an auto-retrying, content-free recovery page until readiness.
   if(!isReady() && (url.pathname==='/' || (!path.extname(url.pathname) && String(req.headers.accept??'').includes('text/html')))){
    res.writeHead(503,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
    res.end(req.method==='HEAD'?undefined:STARTING_DOCUMENT);
    return;
   }
   let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return reply(res,400,'Invalid path.',req.method);}
   if(pathname.includes('\0')||pathname.includes('\\')||pathname.split('/').some(s=>s.startsWith('.')))return reply(res,403,'Forbidden.',req.method);
   let target=path.resolve(root,'.'+pathname);
   if(target!==root&&!target.startsWith(root+path.sep))return reply(res,403,'Forbidden.',req.method);
   if(target===root)target=path.join(root,'index.html');
   let info;try{info=await stat(target);}catch{
    if(path.extname(pathname)||!String(req.headers.accept??'').includes('text/html'))return reply(res,404,'Not found.',req.method);
    target=path.join(root,'index.html');info=await stat(target);
   }
   if(!info.isFile())return reply(res,404,'Not found.',req.method);
   const resolved=await realpath(target);if(!resolved.startsWith(root+path.sep))return reply(res,403,'Forbidden.',req.method);
   const content=await readFile(resolved);
   res.writeHead(200,{'Content-Type':TYPES[path.extname(resolved)]??'application/octet-stream','Content-Length':content.length,'Cache-Control':(path.extname(resolved)==='.html'||pathname==='/noor-service-worker.js'||pathname==='/noor.webmanifest')?'no-store':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'public, max-age=300','X-Content-Type-Options':'nosniff'});
   res.end(req.method==='HEAD'?undefined:content);
  }catch{if(!res.headersSent)reply(res,503,'Service temporarily unavailable.',req.method);else res.destroy();}
 });
 server.requestTimeout=45000;server.headersTimeout=15000;server.once('close',()=>agent.destroy());return server;
}

async function main(){
 validatePublicBuildEnvironment(process.env);
 if(process.argv.includes('--check-build-env')){console.log('Public build configuration verified.');return;}
 process.env.NOOR_PUBLIC_ORIGIN??=process.env.RENDER_EXTERNAL_URL;
 process.env.NOOR_RUNTIME_LISTEN_HOST='127.0.0.1';process.env.NOOR_RUNTIME_LISTEN_PORT='8787';
 const port=Number(process.env.PORT??'10000');if(!Number.isSafeInteger(port)||port<1||port>65535||port===8787)throw Error('PORT_INVALID');
 const [{createPrivilegedPlatformRuntimeHost},{createPrivilegedTransportRuntime},{readNoorProductionRuntimeConfigurationFromEnvironment},{readNoorRuntimeHttpConfigurationFromEnvironment}]=await Promise.all([
  import('../../apps/noor-runtime/dist/privileged-platform-runtime-host.js'),import('../../apps/noor-runtime/dist/privileged-transport-runtime.js'),import('../../apps/noor-runtime/dist/runtime-environment.js'),import('../../apps/noor-runtime/dist/runtime-http-environment.js')
 ]);
 const httpConfiguration=readNoorRuntimeHttpConfigurationFromEnvironment();
 const host=createPrivilegedPlatformRuntimeHost(readNoorProductionRuntimeConfigurationFromEnvironment());
 const runtime=createPrivilegedTransportRuntime({host,httpConfiguration});let server;
 let ready=false;
 try{
  // Bind HTTP before potentially slow, private runtime initialization.
  server=await createHostedWebServer({staticDirectory:path.join(ROOT,'apps/web/dist'),apiOrigin:'http://127.0.0.1:8787',publicOrigin:httpConfiguration.publicOrigin,isReady:()=>ready});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',resolve);});
  await runtime.start();
  ready=true;
 }catch(error){
  ready=false;
  if(server?.listening)await new Promise(resolve=>server.close(resolve));
  await runtime.shutdown().catch(()=>{});
  throw error;
 }
 let stopping;const stop=()=>{stopping??=(async()=>{ready=false;await new Promise(resolve=>server.close(resolve));await runtime.shutdown();})().catch(()=>{process.exitCode=1;});return stopping;};
 process.once('SIGTERM',()=>{void stop();});process.once('SIGINT',()=>{void stop();});
 // Optional server-only reviewer bootstrap. Never interrupt the real site on failure.
 if(process.env.NOOR_REVIEWER_CREATE_ONCE==='YES'){
   try{
     const {provisionReviewerAuthOnce}=await import('./provision-reviewer.mjs');
     const result=await provisionReviewerAuthOnce();
     console.log('NOOR_REVIEWER_AUTH_SETUP='+result);
   }catch(error){
     const known=new Set(['REVIEWER_BOOTSTRAP_CONFIGURATION_INVALID','REVIEWER_ADMIN_LOOKUP_FAILED','REVIEWER_EMAIL_AMBIGUOUS','REVIEWER_EMAIL_ALREADY_OCCUPIED','REVIEWER_AUTH_CREATION_FAILED','REVIEWER_MARKER_MISSING','REVIEWER_AUTH_SIGNIN_VERIFICATION_FAILED']);
     const code=error instanceof Error&&known.has(error.message)?error.message:'REVIEWER_SETUP_UNAVAILABLE';
     console.error('NOOR_REVIEWER_AUTH_SETUP='+code);
   }
 }
 // R261: opt-in creation of dedicated friends accounts; never run during ordinary startup.
 if(process.env.NOOR_INVITE_CREATE_ONCE==='YES'){
   try{
     const {provisionFriendsOnce}=await import('./provision-friends-r261.mjs');
     const result=await provisionFriendsOnce();
     console.log('NOOR_FRIENDS_PROVISION='+result);
   }catch(error){
     const messages=['FRIENDS_CONFIG_INVALID','FRIENDS_PASSWORD_CONFIG_INVALID','FRIENDS_ADMIN_LOOKUP_FAILED','FRIENDS_IDENTITY_AMBIGUOUS','FRIENDS_IDENTITY_ALREADY_OCCUPIED'];
     for(const key of ['abusufyan','abdulghani','noor'])messages.push('FRIENDS_CREATE_FAILED_'+key,'FRIENDS_MARKER_MISMATCH_'+key,'FRIENDS_LOGIN_FAILED_'+key);
     const code=error instanceof Error&&messages.includes(error.message)?error.message:'FRIENDS_PROVISION_UNAVAILABLE';
     console.error('NOOR_FRIENDS_PROVISION='+code);
   }
 }
 // R272: exactly one designated invitation, server only. No role or linkage.
 if(process.env.NOOR_ADMIN_INVITE_CREATE_ONCE==='YES'){
   try{
     const {provisionAdminInvitationR272}=await import('./provision-admin-invitation-r272.mjs');
     const result=await provisionAdminInvitationR272();
     console.log('NOOR_ADMIN_INVITE_SETUP='+result);
   }catch(error){
     const allowed=new Set(['ADMIN_INVITE_CONFIG_DENIED','ADMIN_INVITE_LIST_UNAVAILABLE',
       'ADMIN_INVITE_DUPLICATE_IDENTITY','ADMIN_INVITE_DELIVERY_UNAVAILABLE',
       'ADMIN_INVITE_LIST_PAGINATION_UNAVAILABLE']);
     const code=error instanceof Error&&allowed.has(error.message)
       ?error.message:'ADMIN_INVITE_UNAVAILABLE';
     console.error('NOOR_ADMIN_INVITE_SETUP='+code);
   }
 }
 console.log('NOOR hosted web service ready.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main().catch(()=>{console.error('NOOR hosted startup failed; verify service configuration.');process.exitCode=1;});
