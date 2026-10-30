import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};
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
export async function createHostedWebServer({staticDirectory,apiOrigin,publicOrigin}){
 const api=new URL(apiOrigin),origin=new URL(publicOrigin);
 if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('PUBLIC_ORIGIN_INVALID');
 if(api.protocol!=='http:'||api.hostname!=='127.0.0.1'||api.username||api.password||api.pathname!=='/'||api.search||api.hash)throw Error('INTERNAL_API_ORIGIN_INVALID');
 const root=await realpath(staticDirectory),agent=new http.Agent({keepAlive:true,maxSockets:16});
 const server=http.createServer(async(req,res)=>{
  try{
   if(!req.url?.startsWith('/')||req.url.startsWith('//'))return reply(res,400,'Invalid request.',req.method);
   const url=new URL(req.url,origin);
   if(url.pathname==='/healthz')return reply(res,['GET','HEAD'].includes(req.method)?200:405,'ok',req.method);
   if(url.pathname==='/api/noor'||url.pathname.startsWith('/api/noor/')){
    const upstream=http.request({hostname:api.hostname,port:api.port,method:req.method,path:req.url,headers:{...forwarded(req.headers),host:origin.host},agent},incoming=>{
     res.writeHead(incoming.statusCode??502,forwarded(incoming.headers));incoming.on('error',()=>res.destroy());incoming.pipe(res);
    });
    upstream.setTimeout(30000,()=>upstream.destroy(Error('UPSTREAM_TIMEOUT')));
    upstream.once('error',()=>{if(res.destroyed)return;if(res.headersSent)res.destroy();else reply(res,503,'Service temporarily unavailable.',req.method);});
    req.once('aborted',()=>upstream.destroy());res.once('close',()=>{if(!res.writableEnded)upstream.destroy();});req.pipe(upstream);return;
   }
   if(!['GET','HEAD'].includes(req.method))return reply(res,405,'Method not allowed.',req.method);
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
   res.writeHead(200,{'Content-Type':TYPES[path.extname(resolved)]??'application/octet-stream','Content-Length':content.length,'Cache-Control':path.extname(resolved)==='.html'?'no-store':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'public, max-age=300','X-Content-Type-Options':'nosniff'});
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
 try{
  await runtime.start();
  server=await createHostedWebServer({staticDirectory:path.join(ROOT,'apps/web/dist'),apiOrigin:'http://127.0.0.1:8787',publicOrigin:httpConfiguration.publicOrigin});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',resolve);});
 }catch(error){await runtime.shutdown().catch(()=>{});throw error;}
 let stopping;const stop=()=>{stopping??=(async()=>{await new Promise(resolve=>server.close(resolve));await runtime.shutdown();})().catch(()=>{process.exitCode=1;});return stopping;};
 process.once('SIGTERM',()=>{void stop();});process.once('SIGINT',()=>{void stop();});console.log('NOOR hosted web service ready.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main().catch(()=>{console.error('NOOR hosted startup failed; verify service configuration.');process.exitCode=1;});
